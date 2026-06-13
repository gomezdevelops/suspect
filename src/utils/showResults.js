const { EmbedBuilder } = require("discord.js");
const GameManager  = require("../games/GameManager");
const StatsManager = require("./StatsManager");
const { COLOR, COLOR_GREEN, COLOR_AMBER } = require("./embeds");

module.exports = async function showResults(ctx, game) {

    // Guard — only run once
    if (game.state === "LAST_CHANCE" || game.state === "DONE") return;

    // Clear all remaining timers
    clearAllTimers(game);

    // Disable voting buttons
    if (game.votingMessageId) {
        try {
            const votingMsg = await ctx.channel.messages.fetch(game.votingMessageId);
            const disabledRows = votingMsg.components.map(row => ({
                type: row.type,
                components: row.components.map(b => ({
                    type: b.data.type, style: b.data.style,
                    label: b.data.label, custom_id: b.data.custom_id, disabled: true
                }))
            }));
            await votingMsg.edit({ components: disabledRows });
        } catch {}
    }

    // ── Tally votes (skip nulls/abstentions) ─────────────────────────────────
    const voteCounts = {};
    for (const playerId of game.players) voteCounts[playerId] = 0;
    for (const votedId of Object.values(game.votes)) {
        if (votedId) voteCounts[votedId] = (voteCounts[votedId] || 0) + 1;
    }

    let highestVotes = 0;
    let winners = [];
    for (const [pid, votes] of Object.entries(voteCounts)) {
        if (votes > highestVotes)       { highestVotes = votes; winners = [pid]; }
        else if (votes === highestVotes) { winners.push(pid); }
    }

    const tie = winners.length > 1 || highestVotes === 0;

    // Check if ALL winners are imposters
    const impostersCaught = !tie && winners.every(w => game.imposterIds.includes(w));

    // ── Build vote lines ──────────────────────────────────────────────────────
    const voteLines = [];
    for (const playerId of game.players) {
        const user   = await ctx.client.users.fetch(playerId);
        const votes  = voteCounts[playerId] || 0;
        const marker = game.imposterIds.includes(playerId) ? " 🎭" : "";
        const bar    = votes > 0 ? "█".repeat(Math.min(votes, 10)) : "—";
        voteLines.push(`**${user.username}**${marker} ${bar} ${votes}`);
    }

    // ── Clue history fields ───────────────────────────────────────────────────
    const clueFields = [];
    for (const round of Object.keys(game.clues)) {
        const lines = [];
        for (const [pid, clue] of Object.entries(game.clues[round])) {
            const u = await ctx.client.users.fetch(pid);
            lines.push(`**${u.username}**: ${clue}`);
        }
        if (lines.length) clueFields.push({ name: `Round ${round}`, value: lines.join("\n") });
    }

    // ── Imposter names ────────────────────────────────────────────────────────
    const imposterNames = await Promise.all(
        game.imposterIds.map(async id => {
            const u = await ctx.client.users.fetch(id);
            return u.username;
        })
    );

    // ── Stats update (preliminary — will be overridden if last-chance succeeds) ──
    // Track correct votes
    for (const [voterId, votedId] of Object.entries(game.votes)) {
        if (votedId && game.imposterIds.includes(votedId)) {
            StatsManager.update(voterId, { correctVotes: 1 });
        }
    }

    // Track times voted out
    for (const w of winners) {
        if (!tie) StatsManager.update(w, { timesVotedOut: 1 });
    }

    // ── Build result embed ────────────────────────────────────────────────────
    let outcomeTitle, outcomeDesc, outcomeColor;
    if (tie) {
        outcomeTitle = "⚠️ Tie Vote — Imposter Wins!";
        outcomeDesc  = "The vote was tied. The Imposters slip away.";
        outcomeColor = COLOR_AMBER;
    } else if (impostersCaught) {
        outcomeTitle = "🎯 Imposters Caught!";
        outcomeDesc  = `The crew voted out **${imposterNames.join(", ")}**!`;
        outcomeColor = COLOR_GREEN;
    } else {
        outcomeTitle = "🎉 Imposters Win!";
        outcomeDesc  = "The crew voted incorrectly.";
        outcomeColor = COLOR;
    }

    const embed = new EmbedBuilder()
        .setColor(outcomeColor)
        .setTitle("📊 Vote Results")
        .addFields(
            { name: "Votes", value: voteLines.join("\n") },
            { name: "🎭 Imposter" + (imposterNames.length > 1 ? "s" : ""), value: imposterNames.join(", "), inline: true },
            { name: "📝 Crew Word",     value: game.commonWord,   inline: true },
            { name: "🎯 Imposter Word", value: game.imposterWord, inline: true }
        );

    if (clueFields.length) {
        embed.addFields({ name: "🗒️ Clue History", value: "\u200b" }, ...clueFields);
    }

    embed.addFields({ name: outcomeTitle, value: outcomeDesc });

    await ctx.channel.send({ embeds: [embed] });

    // ── Last Chance if imposters were caught ──────────────────────────────────
    if (impostersCaught) {
        game.impostersCaught = true;
        game.state = "LAST_CHANCE";

        const { lastChanceEmbed } = require("./embeds");
        await ctx.channel.send({ embeds: [lastChanceEmbed(imposterNames)] });

        const lastChance = require("./lastChance");
        lastChance.startTimer(ctx, game);
        return;
    }

    // ── Finalize game ─────────────────────────────────────────────────────────
    await finalizeGame(ctx, game, impostersCaught, tie);
};

async function finalizeGame(ctx, game, impostersCaught, tie) {
    // Update stats for all players
    for (const playerId of game.players) {
        const isImposter = game.imposterIds.includes(playerId);
        const delta = { gamesPlayed: 1 };

        if (tie) {
            // Tie = imposter wins
            if (isImposter) { delta.gamesWon = 1; delta.imposterWins = 1; }
        } else if (impostersCaught) {
            // Crew wins
            if (!isImposter) { delta.gamesWon = 1; delta.crewWins = 1; }
        } else {
            // Imposters win
            if (isImposter) { delta.gamesWon = 1; delta.imposterWins = 1; }
        }

        StatsManager.update(playerId, delta);
    }

    GameManager.delete(game.channelId);
}

function clearAllTimers(game) {
    const keys = ["turnTimer", "_warnTimer", "votingTimer", "_votingWarn30", "_votingWarn10", "discussTimer", "lastChanceTimer"];
    for (const k of keys) {
        if (game[k]) { clearTimeout(game[k]); game[k] = null; }
    }
}

module.exports.finalizeGame  = finalizeGame;
module.exports.clearAllTimers = clearAllTimers;