const { roundStart, discussionPhaseEmbed } = require("./embeds");
const { scheduleTurnTimer } = require("./startRound");

const TURN_SECONDS = 60;

module.exports = async function nextTurn(ctx, game) {

    // ── Next player in current round ─────────────────────────────────────────
    if (game.currentTurn < game.order.length) {

        const nextPlayer = game.order[game.currentTurn];

        // Plain text so the mention actually pings and is visible
        await ctx.channel.send(
            `🎤 It's now <@${nextPlayer}>'s turn.\n⏱ ${TURN_SECONDS}s remaining`
        );
        scheduleTurnTimer(ctx, game);
        return;
    }

    // ── Round finished ────────────────────────────────────────────────────────
    game.currentTurn = 0;
    game.round++;

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

        // First turn of new round — plain text
        await ctx.channel.send(
            `🎤 It's now <@${game.order[0]}>'s turn.\n⏱ ${TURN_SECONDS}s remaining`
        );
        scheduleTurnTimer(ctx, game);
        return;
    }

    // ── All rounds done → Discussion phase ───────────────────────────────────
    game.state = "DISCUSSION";
    game.skipVotes = new Set();

    await ctx.channel.send({ embeds: [discussionPhaseEmbed()] });

    const startVoting = require("./startVoting");
    game.discussTimer = setTimeout(async () => {
        if (game.state !== "DISCUSSION") return;
        await startVoting(ctx, game);
    }, 60 * 1000);
};