const { EmbedBuilder } = require("discord.js");
const GameManager = require("../games/GameManager");
const { COLOR } = require("../utils/embeds");

module.exports = {
    name: "enter",
    description: "Join the game lobby",

    async execute(message) {

        let game = GameManager.get(message.channelId);

        if (!game) {
            game = GameManager.create(message.channelId);
        }

        if (game.state !== "LOBBY") {
            return message.reply("❌ A game is already running. Wait for it to finish.");
        }

        if (game.players.includes(message.author.id)) {
            return message.reply("You already joined.");
        }

        game.players.push(message.author.id);

        const embed = new EmbedBuilder()
            .setColor(COLOR)
            .setDescription(`✅ **${message.author.username}** joined the lobby.`)
            .setFooter({ text: `Players: ${game.players.length}` });

        await message.channel.send({ embeds: [embed] });
    }
};