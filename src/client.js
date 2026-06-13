require("dotenv").config();

const fs   = require("fs");
const path = require("path");

const {
    Client,
    Collection,
    GatewayIntentBits,
    REST,
    Routes
} = require("discord.js");

const GameManager  = require("./games/GameManager");
const nextTurn     = require("./utils/nextTurn");
const handleVote   = require("./utils/handleVote");
const { clueSent } = require("./utils/embeds");

const PREFIX = "=";

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.commands = new Collection();

// ─── Load commands ────────────────────────────────────────────────────────────

const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
    .readdirSync(commandsPath)
    .filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    if (command.name && command.execute) {
        client.commands.set(command.name, command);
        console.log(`Loaded command: ${command.name}`);
    } else {
        console.warn(`[WARNING] ${file} is missing name or execute.`);
    }
}

// ─── Ready — auto-register slash commands that have a `data` property ────────

client.once("ready", async () => {
    console.log(`Logged in as ${client.user.tag}`);

    const slashCommands = [];

    for (const command of client.commands.values()) {
        if (command.data) {
            slashCommands.push(command.data.toJSON());
        }
    }

    if (slashCommands.length === 0) return;

    try {
        const rest = new REST({ version: "10" })
            .setToken(process.env.TOKEN);

        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: slashCommands }
        );

        console.log(`Registered ${slashCommands.length} slash command(s): ${slashCommands.map(c => `/${c.name}`).join(", ")}`);

    } catch (err) {
        console.error("Failed to register slash commands:", err);
    }
});

// ─── Message handler (prefix commands + plain-text clue capture) ──────────────

client.on("messageCreate", async message => {
    if (message.author.bot) return;

    // ── Prefix commands ──────────────────────────────────────────────────────
    if (message.content.startsWith(PREFIX)) {

        const args    = message.content.slice(PREFIX.length).trim().split(/\s+/);
        const cmdName = args.shift().toLowerCase();

        const command = client.commands.get(cmdName);
        if (!command) return;

        try {
            await command.execute(message, args);
        } catch (error) {
            console.error(error);
            await message.reply("An error occurred while running that command.").catch(() => {});
        }

        return;
    }

    // ── Plain-message clue capture ────────────────────────────────────────────
    const game = GameManager.get(message.channelId);
    if (!game || game.state !== "ROUND") return;

    const currentPlayer = game.order[game.currentTurn];
    if (message.author.id !== currentPlayer) return;

    const clue = message.content.trim();

    if (clue.length < 2) {
        const reply = await message.reply("❌ Clue must be at least 2 characters.");
        setTimeout(() => reply.delete().catch(() => {}), 5000);
        return;
    }

    if (clue.includes(" ")) {
        const reply = await message.reply("❌ Only one-word clues are allowed.");
        setTimeout(() => reply.delete().catch(() => {}), 5000);
        return;
    }

    if (!game.clues[game.round]) {
        game.clues[game.round] = {};
    }

    game.clues[game.round][message.author.id] = clue;

    await message.channel.send({
        embeds: [clueSent(message.author.username, clue)]
    });

    game.currentTurn++;

    client.emit("nextTurn", message, game);
});

// ─── Interaction handler (slash commands + vote buttons) ─────────────────────

client.on("interactionCreate", async interaction => {
    try {

        // ── Slash commands ────────────────────────────────────────────────────
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;

            await command.execute(interaction);
            return;
        }

        // ── Vote buttons ──────────────────────────────────────────────────────
        if (interaction.isButton()) {
            const game = GameManager.get(interaction.channelId);
            if (!game) return;
            if (game.state !== "VOTING") return;

            await handleVote(interaction, game);
            return;
        }

    } catch (error) {
        console.error(error);
        try {
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({
                    content: "An error occurred.",
                    ephemeral: true
                });
            } else {
                await interaction.reply({
                    content: "An error occurred.",
                    ephemeral: true
                });
            }
        } catch {}
    }
});

// ─── nextTurn event ───────────────────────────────────────────────────────────

client.on("nextTurn", async (message, game) => {
    try {
        await nextTurn(message, game);
    } catch (error) {
        console.error("Next Turn Error:", error);
    }
});

client.login(process.env.TOKEN);

module.exports = client;