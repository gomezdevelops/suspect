const { SlashCommandBuilder } = require("discord.js");
const GameManager = require("../games/GameManager");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("enter")
        .setDescription("Join the game"),

    async execute(interaction) {

        let game =
            GameManager.get(interaction.channelId);

        if (!game) {
            game = GameManager.create(interaction.channelId);
        }

        if (game.players.includes(interaction.user.id)) {
            return interaction.reply({
                content: "You already joined.",
                ephemeral: true
            });
        }

        game.players.push(interaction.user.id);

        await interaction.reply(
            `✅ ${interaction.user.username} joined.\nPlayers: ${game.players.length}`
        );
    }
};