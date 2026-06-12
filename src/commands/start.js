const { EmbedBuilder } = require("discord.js");
const GameManager = require("../games/GameManager");
const startGame   = require("../utils/startGame");
const sendWords   = require("../utils/sendWords");
const startRound  = require("../utils/startRound");
const { gameStarted, COLOR } = require("../utils/embeds");

module.exports = {
    name: "start",
    description: "Start the game  —  =start normal  or  =start hidden",

    async execute(message, args) {

        const mode = (args[0] || "").toLowerCase();

        if (mode !== "normal" && mode !== "hidden") {
            return message.reply("❌ Please specify a mode: `=start normal` or `=start hidden`");
        }

        const game = GameManager.get(message.channelId);

        if (!game) {
            return message.reply("❌ No lobby found. Use `=enter` first.");
        }

        if (game.state !== "LOBBY") {
            return message.reply("❌ A game is already running.");
        }

        if (game.players.length < 4) {
            return message.reply("❌ At least 4 players are required.");
        }

        game.mode = mode;

        startGame(game);

        // Send a "sending DMs…" holding message so the channel doesn't go silent
        const holdingMsg = await message.channel.send({
            embeds: [
                new EmbedBuilder()
                    .setColor(COLOR)
                    .setDescription("📨 Sending words to all players…")
            ]
        });

        try {
            await sendWords(game, message.guild);
        } catch (error) {
            console.error(error);
            await holdingMsg.delete().catch(() => {});
            return message.reply("❌ Failed to send DMs. Make sure all players have DMs enabled.");
        }

        game.state = "ROUND";

        await holdingMsg.delete().catch(() => {});

        await message.channel.send({
            embeds: [gameStarted(game.players.length, game.mode)]
        });

        await startRound(message, game);
    }
};