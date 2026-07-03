require("dotenv").config();

const fs   = require("fs");
const path = require("path");
const http = require("http");
const {
    Client, Collection,
    GatewayIntentBits,
    REST, Routes
} = require("discord.js");

const { connect }   = require("./db/connect");
const GameManager   = require("./games/GameManager");
const nextTurn      = require("./utils/nextTurn");
const handleVote    = require("./utils/handleVote");
const lastChance    = require("./utils/lastChance");
const InviteManager = require("./utils/InviteManager");
const VoteTracker   = require("./utils/VoteTracker");
const ShardManager  = require("./utils/ShardManager");
const { clueSent, duplicateClue } = require("./utils/embeds");
const { scheduleTurnTimer }        = require("./utils/startRound");

const PREFIX = "=";

const TOPGG_AUTH   = process.env.TOPGG_AUTH ?? "";
const WEBHOOK_PORT = parseInt(process.env.WEBHOOK_PORT ?? "3000", 10);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildMembers
    ]
});

client.commands = new Collection();

// ─── Load commands ─────────────────────────────────────────────────────────────
const commandsPath = path.join(__dirname, "commands");
for (const file of fs.readdirSync(commandsPath).filter(f => f.endsWith(".js"))) {
    const cmd = require(path.join(commandsPath, file));
    if (cmd.name && cmd.execute) {
        client.commands.set(cmd.name, cmd);
        console.log(`Loaded: ${cmd.name}`);
    }
}

// ─── Ready ────────────────────────────────────────────────────────────────────
client.once("clientReady", async () => {
    console.log(`✅ Logged in as ${client.user.tag}`);

    const supportGuildId = process.env.SUPPORT_SERVER_ID;
    if (supportGuildId) {
        const supportGuild = client.guilds.cache.get(supportGuildId);
        if (supportGuild) {
            await InviteManager.cacheGuildInvites(supportGuild);
            console.log("Cached support server invites");
        }
    }

    const slashCommands = [...client.commands.values()]
        .filter(c => c.data)
        .map(c => c.data.toJSON());

    if (slashCommands.length) {
        try {
            const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
            await rest.put(Routes.applicationCommands(client.user.id), { body: slashCommands });
            console.log(`Registered ${slashCommands.length} slash command(s)`);
        } catch (err) {
            console.error("Slash registration error:", err);
        }
    }
});

// ─── top.gg Webhook server ────────────────────────────────────────────────────
http.createServer(async (req, res) => {
    console.log(`[webhook] ${req.method} ${req.url} from ${req.socket.remoteAddress}`);

    if (req.method !== "POST" || req.url !== "/topgg") {
        console.log(`[webhook] 404 — expected POST /topgg, got ${req.method} ${req.url}`);
        res.writeHead(404); res.end(); return;
    }

    const auth = req.headers["authorization"] ?? "";
    if (TOPGG_AUTH && auth !== TOPGG_AUTH) {
        console.log(`[webhook] 401 — auth mismatch (got len=${auth.length}, expected len=${TOPGG_AUTH.length})`);
        res.writeHead(401); res.end(); return;
    }

    let body = "";
    req.on("data", chunk => { body += chunk; });
    req.on("end", async () => {
    try {
        const data = JSON.parse(body);

        // Ignore top.gg test pings entirely
        if (data.type === "test") {
            console.log(`[webhook] test event ignored`);
            res.writeHead(200); res.end("OK"); return;
        }

        const userId = data.user ?? data.data?.user?.id ?? null;

        if (!userId) {
            console.log(`[webhook] 400 — could not extract user. body=${body}`);
            res.writeHead(400); res.end(); return;
        }

        // Guard against duplicate webhook deliveries
        const alreadyVoted = await VoteTracker.hasVotedRecently(userId);
        if (alreadyVoted) {
            console.log(`[webhook] duplicate — user ${userId} already voted recently, skipping`);
            res.writeHead(200); res.end("OK"); return;
        }

        console.log(`[webhook] vote received from user ${userId} (type=${data.type ?? "?"})`);

        const { shardsEarned, newStreak, newBadges } = await VoteTracker.recordVote(userId);
        
            console.log(`[webhook] recorded — +${shardsEarned} shards, streak ${newStreak}`);
            const newBalance = await ShardManager.addShards(userId, shardsEarned);

            try {
                const discordUser = await client.users.fetch(userId);
                const badgeLine   = newBadges.length
                    ? `\n\n🏅 **New badge${newBadges.length > 1 ? "s" : ""} unlocked:** ${newBadges.join("  ")}`
                    : "";

                await discordUser.send(
                    `🗳️ **Thanks for voting for Suspect!**\n\n` +
                    `You earned **${shardsEarned} Shards** 💎\n` +
                    `🔥 Vote streak: **${newStreak}** day${newStreak !== 1 ? "s" : ""}` +
                    (newStreak % 7 === 0 && newStreak > 0
                        ? ` — streak milestone! Your multiplier increased!` : "") +
                    `\nTotal balance: **${newBalance} Shards**` +
                    badgeLine +
                    `\n\nSpend your Shards in \`/shop\` or check your balance with \`/balance\`.`
                );
            } catch {
                // DMs closed — vote still recorded
            }

            res.writeHead(200); res.end("OK");
        } catch (err) {
            console.error("Webhook error:", err);
            res.writeHead(500); res.end();
        }
    });
}).listen(WEBHOOK_PORT, () => {
    console.log(`top.gg webhook server listening on port ${WEBHOOK_PORT}`);
});

// ─── Invite tracking ──────────────────────────────────────────────────────────
client.on("inviteCreate", async invite => {
    if (invite.guild.id !== process.env.SUPPORT_SERVER_ID) return;
    await InviteManager.cacheGuildInvites(invite.guild);
});

client.on("guildMemberAdd", async member => {
    if (member.guild.id !== process.env.SUPPORT_SERVER_ID) return;
    await InviteManager.handleMemberJoin(member);
});

// ─── messageCreate — prefix commands + clue capture ──────────────────────────
client.on("messageCreate", async message => {
    if (message.author.bot) return;

    if (message.content.startsWith(PREFIX)) {
        const args    = message.content.slice(PREFIX.length).trim().split(/\s+/);
        const cmdName = args.shift().toLowerCase();

        let command = client.commands.get(cmdName);
        if (!command && args.length > 0) {
            command = client.commands.get(`${cmdName}-${args[0]}`);
            if (command) args.shift();
        }

        if (!command) return;

        try {
            await command.execute(message, args);
        } catch (err) {
            console.error(err);
            message.reply("❌ An error occurred.").catch(() => {});
        }
        return;
    }

    // ── Plain-text clue capture ───────────────────────────────────────────────
    const game = GameManager.get(message.channelId);
    if (!game || game.state !== "ROUND") return;

    const currentPlayer = game.order[game.currentTurn];
    if (message.author.id !== currentPlayer) return;

    const clue            = message.content.trim();
    const MAX_CLUE_LENGTH = 20;

    if (clue.length < 2) {
        const r = await message.reply("❌ Clue must be at least 2 characters.");
        setTimeout(() => r.delete().catch(() => {}), 5000);
        return;
    }

    if (clue.length > MAX_CLUE_LENGTH) {
        const r = await message.reply(`❌ Clue must be ${MAX_CLUE_LENGTH} characters or fewer.`);
        setTimeout(() => r.delete().catch(() => {}), 5000);
        return;
    }

    if (clue.includes(" ")) {
        const r = await message.reply("❌ Only one-word clues are allowed.");
        setTimeout(() => r.delete().catch(() => {}), 5000);
        return;
    }

    const clueLower = clue.toLowerCase();
    if (game.usedClues.has(clueLower)) {
        await message.channel.send({ embeds: [duplicateClue(clue)] });
        return;
    }

    game.usedClues.add(clueLower);
    if (!game.clues[game.round]) game.clues[game.round] = {};
    game.clues[game.round][message.author.id] = clue;

    if (game.turnTimer)  { clearTimeout(game.turnTimer);  game.turnTimer  = null; }
    if (game._warnTimer) { clearTimeout(game._warnTimer); game._warnTimer = null; }

    await message.channel.send({ embeds: [clueSent(message.author.username, clue)] });

    game.currentTurn++;
    client.emit("nextTurn", message, game);
});

// ─── interactionCreate — slash commands + all buttons ────────────────────────
client.on("interactionCreate", async interaction => {
    try {
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;
            await command.execute(interaction, []);
            return;
        }

        if (interaction.isButton()) {
            if (interaction.customId.startsWith("shop_page_")) {
                const page    = parseInt(interaction.customId.replace("shop_page_", ""), 10);
                const uid     = interaction.user.id;
                const balance = await ShardManager.getBalance(uid);
                const { sendShopPage } = require("./commands/shop");
                await interaction.deferUpdate();
                await sendShopPage(interaction, uid, balance, page);
                return;
            }

            const game = GameManager.get(interaction.channelId);
            if (!game || game.state !== "VOTING") return;
            await handleVote(interaction, game);
        }

    } catch (err) {
        console.error(err);
        try {
            const payload = { content: "❌ An error occurred.", ephemeral: true };
            if (interaction.replied || interaction.deferred) await interaction.followUp(payload);
            else await interaction.reply(payload);
        } catch {}
    }
});

// ─── nextTurn event ───────────────────────────────────────────────────────────
client.on("nextTurn", async (ctx, game) => {
    try { await nextTurn(ctx, game); }
    catch (err) { console.error("nextTurn error:", err); }
});

// ─── Connect to MongoDB then login ────────────────────────────────────────────
(async () => {
    try {
        await connect();
        await client.login(process.env.TOKEN);
    } catch (err) {
        console.error("❌ Fatal startup error:", err);
        process.exit(1);
    }
})();

module.exports = client;