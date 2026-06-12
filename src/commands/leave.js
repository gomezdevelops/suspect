const { EmbedBuilder } = require("discord.js");
const GameManager = require("../games/GameManager");
const { COLOR } = require("../utils/embeds");

module.exports = {
    name: "leave",
    description: "Leave the game lobby",

    async execute(message) {

        const game = GameManager.get(message.channelId);

        if (!game) {
            return message.reply("No active lobby.");
        }

        if (game.state !== "LOBBY") {
            return message.reply("❌ You can't leave once the game has started.");
        }

        if (!game.players.includes(message.author.id)) {
            return message.reply("You're not in the lobby.");
        }

        game.players = game.players.filter(id => id !== message.author.id);

        const embed = new EmbedBuilder()
            .setColor(COLOR)
            .setDescription(`❌ **${message.author.username}** left the lobby.`)
            .setFooter({ text: `Players: ${game.players.length}` });

        await message.channel.send({ embeds: [embed] });
    }
};