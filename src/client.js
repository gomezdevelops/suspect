require("dotenv").config();

const fs = require("fs");
const path = require("path");

const {
    Client,
    Collection,
    GatewayIntentBits
} = require("discord.js");

const GameManager = require("./games/GameManager");
const nextTurn = require("./utils/nextTurn");
const handleVote = require("./utils/handleVote");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds
    ]
});

client.commands = new Collection();

const commandsPath =
    path.join(__dirname, "commands");

const commandFiles =
    fs.readdirSync(commandsPath)
        .filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);

    if (command.data && command.execute) {
        client.commands.set(command.data.name, command);
        console.log(`Loaded command: ${command.data.name}`);
    } else {
        console.warn(`[WARNING] ${file} is missing data or execute.`);
    }
}

client.once("ready", () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on("interactionCreate", async interaction => {

    try {

        // Vote buttons
        if (interaction.isButton()) {
            const game =
                GameManager.get(interaction.channelId);

            if (!game) return;
            if (game.state !== "VOTING") return;

            await handleVote(interaction, game);
            return;
        }

        // Slash commands
        if (!interaction.isChatInputCommand()) return;

        const command =
            client.commands.get(interaction.commandName);

        if (!command) return;

        await command.execute(interaction, client);

    } catch (error) {

        console.error(error);

        try {
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({
                    content: "An error occurred while executing this interaction.",
                    ephemeral: true
                });
            } else {
                await interaction.reply({
                    content: "An error occurred while executing this interaction.",
                    ephemeral: true
                });
            }
        } catch {}
    }
});

client.on("nextTurn", async (interaction, game) => {
    try {
        await nextTurn(interaction, game);
    } catch (error) {
        console.error("Next Turn Error:", error);
    }
});

client.login(process.env.TOKEN);

module.exports = client;