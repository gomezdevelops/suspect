const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");
const { votingPhaseEmbed, votingWarning } = require("./embeds");

const VOTING_SECONDS = 60;

module.exports = async function startVoting(ctx, game) {

    // Clear discussion timer if still running
    if (game.discussTimer) { clearTimeout(game.discussTimer); game.discussTimer = null; }

    game.state = "VOTING";
    game.votes = {};

    // Build player buttons — max 5 per row, max 5 rows = 25 players
    const rows = [];
    let currentRow = new ActionRowBuilder();
    let count = 0;

    for (const playerId of game.players) {
        const user = await ctx.client.users.fetch(playerId);

        currentRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`vote_${playerId}`)
                .setLabel(user.username)
                .setStyle(ButtonStyle.Primary)
        );

        count++;

        if (count === 5) {
            rows.push(currentRow);
            currentRow = new ActionRowBuilder();
            count = 0;
        }
    }

    if (currentRow.components.length > 0) rows.push(currentRow);

    const message = await ctx.channel.send({
        embeds: [votingPhaseEmbed()],
        components: rows
    });

    game.votingMessageId = message.id;

    // ── Voting timers ────────────────────────────────────────────────────────
    const showResults = require("./showResults");

    // 30s warning
    const warn30 = setTimeout(async () => {
        if (game.state !== "VOTING") return;
        await ctx.channel.send({ embeds: [votingWarning(30)] }).catch(() => {});
    }, 30 * 1000);

    // 10s warning
    const warn10 = setTimeout(async () => {
        if (game.state !== "VOTING") return;
        await ctx.channel.send({ embeds: [votingWarning(10)] }).catch(() => {});
    }, 50 * 1000);

    // Expire — fill abstentions then show results
    game.votingTimer = setTimeout(async () => {
        if (game.state !== "VOTING") return;
        clearTimeout(warn30);
        clearTimeout(warn10);

        // Players who didn't vote abstain (null)
        for (const playerId of game.players) {
            if (!game.votes[playerId]) {
                game.votes[playerId] = null;
            }
        }

        await ctx.channel.send({
            embeds: [{
                color: 0xffa500,
                description: "⏰ Voting time expired. Counting votes with abstentions…"
            }]
        }).catch(() => {});

        await showResults(ctx, game);
    }, VOTING_SECONDS * 1000);

    // Store warn timers for cleanup
    game._votingWarn30 = warn30;
    game._votingWarn10 = warn10;
};