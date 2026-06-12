const { EmbedBuilder } = require("discord.js");
const GameManager = require("../games/GameManager");
const { COLOR } = require("../utils/embeds");

module.exports = {
    name: "status",
    description: "View current game status",

    async execute(message) {

        const game = GameManager.get(message.channelId);

        if (!game) {
            return message.reply("No active game.");
        }

        let currentTurn = "None";

        if (game.state === "ROUND") {
            const currentPlayerId = game.order[game.currentTurn];
            if (currentPlayerId) {
                const user = await message.client.users.fetch(currentPlayerId);
                currentTurn = user.username;
            }
        }

        const embed = new EmbedBuilder()
            .setColor(COLOR)
            .setTitle("🎮 Game Status")
            .addFields(
                { name: "State",        value: game.state,                  inline: true },
                { name: "Round",        value: `${game.round}/3`,           inline: true },
                { name: "Players",      value: String(game.players.length), inline: true },
                { name: "Current Turn", value: currentTurn,                 inline: true }
            );

        await message.channel.send({ embeds: [embed] });
    }
};