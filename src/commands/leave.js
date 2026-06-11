const { SlashCommandBuilder } = require("discord.js");
const GameManager = require("../games/GameManager");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("leave")
        .setDescription("Leave the game"),

    async execute(interaction) {

        const game =
            GameManager.get(interaction.channelId);

        if (!game) {
            return interaction.reply({
                content: "No active lobby.",
                ephemeral: true
            });
        }

        game.players =
            game.players.filter(
                id => id !== interaction.user.id
            );

        await interaction.reply(
            `❌ ${interaction.user.username} left the game.`
        );
    }
};