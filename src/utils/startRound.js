const { roundStart, nextTurnEmbed } = require("./embeds");

const TURN_SECONDS = 30;

module.exports = async function startRound(ctx, game) {

    const orderLines = await Promise.all(
        game.order.map(async (playerId, index) => {
            const user = await ctx.client.users.fetch(playerId);
            return `${index + 1}. ${user.username}`;
        })
    );

    await ctx.channel.send({ embeds: [roundStart(game.round, orderLines, game.order[0])] });

    // Announce first turn and start its timer
    await ctx.channel.send({ embeds: [nextTurnEmbed(game.order[0], TURN_SECONDS)] });
    scheduleTurnTimer(ctx, game);
};

function scheduleTurnTimer(ctx, game) {
    // Clear any existing timer
    if (game.turnTimer) { clearTimeout(game.turnTimer); game.turnTimer = null; }

    const playerId = game.order[game.currentTurn];

    // 10-second warning
    const warnTimer = setTimeout(async () => {
        // Check game is still active and still this player's turn
        const current = game.order[game.currentTurn];
        if (game.state !== "ROUND" || current !== playerId) return;

        const { turnWarning } = require("./embeds");
        await ctx.channel.send({ embeds: [turnWarning(playerId, 10)] }).catch(() => {});
    }, (TURN_SECONDS - 10) * 1000);

    // Expire timer
    game.turnTimer = setTimeout(async () => {
        const current = game.order[game.currentTurn];
        if (game.state !== "ROUND" || current !== playerId) return;

        clearTimeout(warnTimer);

        const { turnSkipped } = require("./embeds");
        await ctx.channel.send({ embeds: [turnSkipped(playerId)] }).catch(() => {});

        game.currentTurn++;
        ctx.client.emit("nextTurn", ctx, game);
    }, TURN_SECONDS * 1000);

    // Store warn timer so we can clear it if player submits early
    game._warnTimer = warnTimer;
}

module.exports.scheduleTurnTimer = scheduleTurnTimer;