const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const GameManager   = require("../games/GameManager");
const startGame     = require("../utils/startGame");
const sendWords     = require("../utils/sendWords");
const startRound    = require("../utils/startRound");
const VoteTracker   = require("../utils/VoteTracker");
const { gameStarted, COLOR } = require("../utils/embeds");
const { user, channelId, reply, getArg, isSlash } = require("../utils/ctx");

const TOPGG_URL = "https://top.gg/bot/1514691427370799154/vote";

module.exports = {
    name: "start",
    data: new SlashCommandBuilder()
        .setName("start")
        .setDescription("Start the game")
        .addStringOption(o =>
            o.setName("mode").setDescription("Game mode").setRequired(true)
             .addChoices(
                 { name: "Normal", value: "normal" },
                 { name: "Hidden", value: "hidden" },
                 { name: "Decoy",  value: "decoy"  }
             )
        ),

    async execute(ctx, args = []) {
        const mode = getArg(ctx, "mode", 0, args)?.toLowerCase();
        const cid  = channelId(ctx);

        if (!["normal", "hidden", "decoy"].includes(mode)) {
            return reply(ctx, { content: "❌ Specify a mode: `=start normal`, `=start hidden`, or `=start decoy`", ephemeral: true });
        }

        const game = GameManager.get(cid);
        if (!game)                  return reply(ctx, { content: "❌ No lobby found. Use `=enter` first.", ephemeral: true });
        if (game.state !== "LOBBY") return reply(ctx, { content: "❌ A game is already running.", ephemeral: true });

        const minPlayers = mode === "decoy" ? 5 : 4;
        if (game.players.length < minPlayers) {
            return reply(ctx, {
                content: `❌ At least ${minPlayers} players are required for ${mode === "decoy" ? "Decoy" : "this"} mode.`,
                ephemeral: true
            });
        }

        // ── Decoy mode: require all players to have voted recently ─────────────
        if (mode === "decoy") {
            const voteChecks = await Promise.all(
                game.players.map(async id => ({ id, voted: await VoteTracker.hasVotedRecently(id) }))
            );
            const nonVoters = voteChecks.filter(v => !v.voted).map(v => v.id);

            if (nonVoters.length > 0) {
                const mentions = nonVoters.map(id => `<@${id}>`).join(", ");

                const embed = new EmbedBuilder()
                    .setColor(0xff0000)
                    .setTitle("🗳️ Vote Required for Decoy Mode")
                    .setDescription(
                        `**Decoy mode is a premium game mode** — all players must have voted for Suspect on top.gg within the last 12 hours to play it.\n\n` +
                        `The following player${nonVoters.length > 1 ? "s have" : " has"} not voted recently:\n\n` +
                        `${mentions}\n\n` +
                        `**[Vote here to unlock Decoy mode](${TOPGG_URL})**\n\n` +
                        `Voting also earns you **Shards** to spend in \`/shop\`. Once everyone has voted, try \`=start decoy\` again.`
                    )
                    .setFooter({ text: "Votes reset every 12 hours on top.gg" });

                return reply(ctx, { embeds: [embed] });
            }
        }

        game.mode = mode;
        await startGame(game);

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