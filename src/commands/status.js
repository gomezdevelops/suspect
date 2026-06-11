const { SlashCommandBuilder } = require("discord.js");
const { EmbedBuilder } = require("discord.js");
const GameManager = require("../games/GameManager");
const { COLOR } = require("../utils/embeds");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("status")
        .setDescription("View game status"),

    async execute(interaction) {

        const game =
            GameManager.get(interaction.channelId);

        if (!game) {
            return interaction.reply({
                content: "No active game.",
                ephemeral: true
            });
        }

        let currentTurn = "None";

        if (game.state === "ROUND") {
            const currentPlayerId = game.order[game.currentTurn];
            if (currentPlayerId) {
                const user =
                    await interaction.client.users.fetch(currentPlayerId);
                currentTurn = user.username;
            }
        }

        const embed = new EmbedBuilder()
            .setColor(COLOR)
            .setTitle("🎮 Game Status")
            .addFields(
                { name: "State", value: game.state, inline: true },
                { name: "Round", value: `${game.round}/3`, inline: true },
                { name: "Players", value: String(game.players.length), inline: true },
                { name: "Current Turn", value: currentTurn, inline: true }
            );

        await interaction.reply({
            embeds: [embed],
            ephemeral: true
        });
    }
};