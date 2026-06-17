require("dotenv").config();

const fs   = require("fs");
const path = require("path");
const {
    Client, Collection,
    GatewayIntentBits,
    REST, Routes
} = require("discord.js");

const GameManager   = require("./games/GameManager");
const nextTurn      = require("./utils/nextTurn");
const handleVote    = require("./utils/handleVote");
const lastChance    = require("./utils/lastChance");
const InviteManager = require("./utils/InviteManager");
const { clueSent, duplicateClue } = require("./utils/embeds");
const { scheduleTurnTimer }        = require("./utils/startRound");

const PREFIX = "=";

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

const commandsPath = path.join(__dirname, "commands");
for (const file of fs.readdirSync(commandsPath).filter(f => f.endsWith(".js"))) {
    const cmd = require(path.join(commandsPath, file));
    if (cmd.name && cmd.execute) {
        client.commands.set(cmd.name, cmd);
        console.log(`Loaded: ${cmd.name}`);
    }
}

client.once("ready", async () => {
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

    if (!slashCommands.length) return;

    try {
        const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
        await rest.put(Routes.applicationCommands(client.user.id), { body: slashCommands });
        console.log(`Registered ${slashCommands.length} slash command(s)`);
    } catch (err) {
        console.error("Slash registration error:", err);
    }
});

client.on("inviteCreate", async invite => {
    if (invite.guild.id !== process.env.SUPPORT_SERVER_ID) return;
    await InviteManager.cacheGuildInvites(invite.guild);
});

client.on("guildMemberAdd", async member => {
    if (member.guild.id !== process.env.SUPPORT_SERVER_ID) return;
    await InviteManager.handleMemberJoin(member);
});

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

    const game = GameManager.get(message.channelId);
    if (!game || game.state !== "ROUND") return;

    const currentPlayer = game.order[game.currentTurn];
    if (message.author.id !== currentPlayer) return;

    const clue = message.content.trim();

    if (clue.length < 2) {
        const r = await message.reply("❌ Clue must be at least 2 characters.");
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
client.on("interactionCreate", async interaction => {
    try {
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;
            await command.execute(interaction, []);
            return;
        }

        if (interaction.isButton()) {
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
client.on("nextTurn", async (ctx, game) => {
    try { await nextTurn(ctx, game); }
    catch (err) { console.error("nextTurn error:", err); }
});

client.login(process.env.TOKEN);
module.exports = client;