const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const GameManager = require("../games/GameManager");
const startGame   = require("../utils/startGame");
const sendWords   = require("../utils/sendWords");
const startRound  = require("../utils/startRound");
const { gameStarted, COLOR } = require("../utils/embeds");
const { user, channelId, reply, getArg, isSlash } = require("../utils/ctx");

module.exports = {
    name: "start",
    data: new SlashCommandBuilder()
        .setName("start")
        .setDescription("Start the game")
        .addStringOption(o =>
            o.setName("mode").setDescription("Game mode").setRequired(true)
             .addChoices({ name: "Normal", value: "normal" }, { name: "Hidden", value: "hidden" })
        ),

    async execute(ctx, args = []) {
        const mode = getArg(ctx, "mode", 0, args)?.toLowerCase();
        const cid  = channelId(ctx);

        if (mode !== "normal" && mode !== "hidden") {
            return reply(ctx, { content: "❌ Specify a mode: `=start normal` or `=start hidden`", ephemeral: true });
        }

        const game = GameManager.get(cid);
        if (!game)                  return reply(ctx, { content: "❌ No lobby found. Use `=enter` first.", ephemeral: true });
        if (game.state !== "LOBBY") return reply(ctx, { content: "❌ A game is already running.", ephemeral: true });
        if (game.players.length < 4) return reply(ctx, { content: "❌ At least 4 players are required.", ephemeral: true });

        game.mode = mode;
        startGame(game);

        // Defer slash, or send holding message for prefix
        let holdingMsg = null;
        if (isSlash(ctx)) {
            await ctx.deferReply();
        } else {
            holdingMsg = await ctx.channel.send({
                embeds: [new EmbedBuilder().setColor(COLOR).setDescription("📨 Sending words to all players…")]
            });
        }

        try {
            await sendWords(game, ctx.guild);
        } catch (err) {
            console.error(err);
            if (holdingMsg) await holdingMsg.delete().catch(() => {});
            return reply(ctx, { content: "❌ Failed to send DMs. Make sure all players have DMs enabled." });
        }

        game.state = "ROUND";

        if (holdingMsg) await holdingMsg.delete().catch(() => {});

        await reply(ctx, { embeds: [gameStarted(game.players.length, game.mode, game.imposterIds.length)] });

        await startRound(ctx, game);
    }
};