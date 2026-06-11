const { SlashCommandBuilder } = require("discord.js");
const GameManager = require("../games/GameManager");
const startGame = require("../utils/startGame");
const sendWords = require("../utils/sendWords");
const startRound = require("../utils/startRound");
const { gameStarted } = require("../utils/embeds");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("start")
        .setDescription("Start an Imposter game")
        .addStringOption(option =>
            option
                .setName("mode")
                .setDescription("Game mode")
                .setRequired(true)
                .addChoices(
                    { name: "Normal", value: "normal" },
                    { name: "Hidden", value: "hidden" }
                )
        ),

    async execute(interaction) {

        const game =
            GameManager.get(interaction.channelId);

        if (!game) {
            return interaction.reply({
                content: "❌ No lobby found. Use `/enter` first.",
                ephemeral: true
            });
        }

        if (game.state !== "LOBBY") {
            return interaction.reply({
                content: "❌ A game is already running.",
                ephemeral: true
            });
        }

        if (game.players.length < 4) {
            return interaction.reply({
                content: "❌ At least 4 players are required.",
                ephemeral: true
            });
        }

        game.mode = interaction.options.getString("mode");

        startGame(game);

        // Defer immediately so we don't hit the 3-second deadline
        // while sendWords DMs every player
        await interaction.deferReply();

        try {
            await sendWords(game, interaction.guild);
        } catch (error) {
            console.error(error);
            return interaction.editReply({
                content: "❌ Failed to send DMs. Make sure all players have DMs enabled."
            });
        }

        game.state = "ROUND";

        await interaction.editReply({
            embeds: [gameStarted(game.players.length, game.mode)]
        });

        // startRound uses channel.send so it's independent of the interaction
        await startRound(interaction, game);
    }
};