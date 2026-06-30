const { roundStart } = require("./embeds");

const TURN_SECONDS = 60;

module.exports = async function startRound(ctx, game) {

    const orderLines = await Promise.all(
        game.order.map(async (playerId, index) => {
            const user = await ctx.client.users.fetch(playerId);
            return `${index + 1}. ${user.username}`;
        })
    );

    await ctx.channel.send({ embeds: [roundStart(game.round, orderLines, game.order[0])] });

    // Announce first turn as plain text (no embed — ping must be visible)
    await ctx.channel.send(`🎤 It's now <@${game.order[0]}>'s turn.\n⏱ ${TURN_SECONDS}s remaining · max 20 characters`);
    scheduleTurnTimer(ctx, game);
};

function scheduleTurnTimer(ctx, game) {
    if (game.turnTimer) { clearTimeout(game.turnTimer); game.turnTimer = null; }

    const playerId = game.order[game.currentTurn];

    // 10-second warning — plain text so the ping notifies
    const warnTimer = setTimeout(async () => {
        const current = game.order[game.currentTurn];
        if (game.state !== "ROUND" || current !== playerId) return;

        await ctx.channel.send(
            `⏰ <@${playerId}> — **10 seconds** remaining to give your clue!`
        ).catch(() => {});
    }, (TURN_SECONDS - 10) * 1000);

    // Expire timer — plain text for the skip notice too
    game.turnTimer = setTimeout(async () => {
        const current = game.order[game.currentTurn];
        if (game.state !== "ROUND" || current !== playerId) return;

        clearTimeout(warnTimer);

        await ctx.channel.send(
            `⏭️ <@${playerId}>'s turn was skipped — time expired.`
        ).catch(() => {});

        game.currentTurn++;
        ctx.client.emit("nextTurn", ctx, game);
    }, TURN_SECONDS * 1000);

    game._warnTimer = warnTimer;
}

module.exports.scheduleTurnTimer = scheduleTurnTimer;