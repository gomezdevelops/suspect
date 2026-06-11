const { SlashCommandBuilder } = require("discord.js");
const GameManager = require("../games/GameManager");
const { clueSent } = require("../utils/embeds");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("clue")
        .setDescription("Submit your clue")
        .addStringOption(option =>
            option
                .setName("word")
                .setDescription("Your clue")
                .setRequired(true)
        ),

    async execute(interaction) {

        const game =
            GameManager.get(interaction.channelId);

        if (!game) {
            return interaction.reply({
                content: "❌ No active game.",
                ephemeral: true
            });
        }

        if (game.state !== "ROUND") {
            return interaction.reply({
                content: "❌ The game is not accepting clues right now.",
                ephemeral: true
            });
        }

        const currentPlayer = game.order[game.currentTurn];

        if (interaction.user.id !== currentPlayer) {
            return interaction.reply({
                content: "❌ It's not your turn.",
                ephemeral: true
            });
        }

        const clue =
            interaction.options.getString("word").trim();

        if (clue.length < 2) {
            return interaction.reply({
                content: "❌ Clue must be at least 2 characters long.",
                ephemeral: true
            });
        }

        if (clue.includes(" ")) {
            return interaction.reply({
                content: "❌ Only one-word clues are allowed.",
                ephemeral: true
            });
        }

        if (!game.clues[game.round]) {
            game.clues[game.round] = {};
        }

        game.clues[game.round][interaction.user.id] = clue;

        await interaction.reply({
            content: "✅ Clue submitted.",
            ephemeral: true
        });

        await interaction.channel.send({
            embeds: [clueSent(interaction.user.username, clue)]
        });

        game.currentTurn++;

        interaction.client.emit("nextTurn", interaction, game);
    }
};