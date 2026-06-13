const { roundStart, nextTurnEmbed, discussionPhaseEmbed } = require("./embeds");
const { scheduleTurnTimer } = require("./startRound");

const TURN_SECONDS = 30;

module.exports = async function nextTurn(ctx, game) {

    // ── Next player in current round ─────────────────────────────────────────
    if (game.currentTurn < game.order.length) {

        const nextPlayer = game.order[game.currentTurn];
        await ctx.channel.send({ embeds: [nextTurnEmbed(nextPlayer, TURN_SECONDS)] });
        scheduleTurnTimer(ctx, game);
        return;
    }

    // ── Round finished ────────────────────────────────────────────────────────
    game.currentTurn = 0;
    game.round++;

    // Clear turn timer — round is over
    if (game.turnTimer)  { clearTimeout(game.turnTimer);  game.turnTimer  = null; }
    if (game._warnTimer) { clearTimeout(game._warnTimer); game._warnTimer = null; }

    // More rounds remain
    if (game.round <= 3) {

        const orderLines = await Promise.all(
            game.order.map(async (playerId, index) => {
                const user = await ctx.client.users.fetch(playerId);
                return `${index + 1}. ${user.username}`;
            })
        );

        await ctx.channel.send({ embeds: [roundStart(game.round, orderLines, game.order[0])] });
        await ctx.channel.send({ embeds: [nextTurnEmbed(game.order[0], TURN_SECONDS)] });
        scheduleTurnTimer(ctx, game);
        return;
    }

    // ── All rounds done → Discussion phase ───────────────────────────────────
    game.state = "DISCUSSION";
    game.skipVotes = new Set();

    await ctx.channel.send({ embeds: [discussionPhaseEmbed()] });

    // Auto-start voting after 60 seconds of discussion
    const startVoting = require("./startVoting");
    game.discussTimer = setTimeout(async () => {
        if (game.state !== "DISCUSSION") return;
        await startVoting(ctx, game);
    }, 60 * 1000);
};