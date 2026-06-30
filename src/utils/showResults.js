const { EmbedBuilder } = require("discord.js");
const GameManager  = require("../games/GameManager");
const StatsManager = require("./StatsManager");
const { COLOR, COLOR_GREEN, COLOR_AMBER } = require("./embeds");
const { sendConfessionCard } = require("./confessionCard");

module.exports = async function showResults(ctx, game) {

    if (game.state === "LAST_CHANCE" || game.state === "DONE") return;

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

    // ── Tally votes ───────────────────────────────────────────────────────────
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

    // ── Build vote lines ──────────────────────────────────────────────────────
    const voteLines = [];
    for (const playerId of game.players) {
        const u     = await ctx.client.users.fetch(playerId);
        const votes = voteCounts[playerId] || 0;
        const bar   = votes > 0 ? "█".repeat(Math.min(votes, 10)) : "—";
        voteLines.push(`**${u.username}** ${bar} ${votes}`);
    }

    // ── Clue history (chunked to respect Discord's 1024-char field limit) ─────
    const clueFields = [];
    for (const round of Object.keys(game.clues)) {
        const lines = [];
        for (const [pid, clue] of Object.entries(game.clues[round])) {
            const u = await ctx.client.users.fetch(pid);
            lines.push(`**${u.username}**: ${clue}`);
        }
        if (lines.length) {
            for (const chunk of chunkLines(lines, 1000)) {
                clueFields.push({ name: `Round ${round}`, value: chunk });
            }
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // FALSE IMPOSTER MODE
    // ══════════════════════════════════════════════════════════════════════════
    if (game.mode === "false") {
        await showFalseImposterResults(ctx, game, voteLines, clueFields, winners, tie);
        return;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // NORMAL / HIDDEN MODE
    // ══════════════════════════════════════════════════════════════════════════
    const impostersCaught = !tie && winners.every(w => game.imposterIds.includes(w));

    const imposterNames = await Promise.all(
        game.imposterIds.map(async id => {
            const u = await ctx.client.users.fetch(id);
            return u.username;
        })
    );

    // Stats — correct votes and times voted out
    for (const [voterId, votedId] of Object.entries(game.votes)) {
        if (votedId && game.imposterIds.includes(votedId)) {
            StatsManager.update(voterId, { correctVotes: 1 });
        }
    }
    for (const w of winners) {
        if (!tie) StatsManager.update(w, { timesVotedOut: 1 });
    }

    // ── Result embed — NO word reveal yet (happens after last chance) ─────────
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
        .setTitle("📊 Vote Results");

    chunkLines(voteLines, 1000).forEach((chunk, i) => {
        embed.addFields({ name: i === 0 ? "Votes" : "Votes (cont.)", value: chunk });
    });

    // Only reveal imposter identity now — NOT the words
    embed.addFields({
        name: "🎭 Imposter" + (imposterNames.length > 1 ? "s" : ""),
        value: imposterNames.join(", "),
        inline: true
    });

    if (clueFields.length) {
        embed.addFields({ name: "🗒️ Clue History", value: "\u200b" }, ...clueFields);
    }

    embed.addFields({ name: outcomeTitle, value: outcomeDesc });
    await ctx.channel.send({ embeds: [embed] });

    // ── Last chance (words revealed inside lastChance after it resolves) ──────
    if (impostersCaught) {
        game.impostersCaught = true;
        game.state = "LAST_CHANCE";
        const { lastChanceEmbed } = require("./embeds");
        await ctx.channel.send({ embeds: [lastChanceEmbed(imposterNames)] });
        const lastChance = require("./lastChance");
        lastChance.startTimer(ctx, game);
        return;
    }

    // Game over without last chance — reveal words now (imposter won/tied, no suspense left)
    await revealWords(ctx, game);

    // Confession cards — imposter(s) escaped detection entirely
    for (const imposterId of game.imposterIds) {
        sendConfessionCard(ctx.client, imposterId, {
            word: game.imposterWord,
            wasRealImposter: true,
            outcome: "escaped",
            clues: getPlayerClues(game, imposterId)
        });
    }

    await finalizeGame(ctx, game, impostersCaught, tie);
};

// Builds [{ round, clue }] for one player across the whole game
function getPlayerClues(game, playerId) {
    const result = [];
    for (const round of Object.keys(game.clues)) {
        const clue = game.clues[round][playerId];
        if (clue) result.push({ round, clue });
    }
    return result;
}

// ── Word reveal — sent after game conclusively ends ───────────────────────────
async function revealWords(ctx, game) {
    const embed = new EmbedBuilder()
        .setColor(0x444444)
        .setTitle("📖 Word Reveal")
        .addFields(
            { name: "📝 Crew Word",     value: game.commonWord,                    inline: true },
            { name: "🎯 Imposter Word", value: game.imposterWord ?? "—",           inline: true }
        );
    await ctx.channel.send({ embeds: [embed] });
}

// ─── False Imposter reveal ────────────────────────────────────────────────────
async function showFalseImposterResults(ctx, game, voteLines, clueFields, winners, tie) {

    const mostVotedId   = tie ? null : winners[0];
    const fakeImposter  = await ctx.client.users.fetch(game.fakeImposterId);
    const mostVotedUser = mostVotedId ? await ctx.client.users.fetch(mostVotedId) : null;

    // Step 1 — vote results (no word reveal, no role markers)
    const votesEmbed = new EmbedBuilder()
        .setColor(COLOR_AMBER)
        .setTitle("📊 Vote Results");

    chunkLines(voteLines, 1000).forEach((chunk, i) => {
        votesEmbed.addFields({ name: i === 0 ? "Votes" : "Votes (cont.)", value: chunk });
    });

    if (clueFields.length) {
        votesEmbed.addFields({ name: "🗒️ Clue History", value: "\u200b" }, ...clueFields);
    }

    await ctx.channel.send({ embeds: [votesEmbed] });

    // Step 2 — dramatic pause
    await new Promise(r => setTimeout(r, 3000));

    await ctx.channel.send({
        embeds: [
            new EmbedBuilder()
                .setColor(0x111111)
                .setTitle("　")
                .setDescription("```\n  . . .\n```")
        ]
    });

    await new Promise(r => setTimeout(r, 3000));

    // Step 3 — THE reveal (words shown here since no last chance in false mode)
    const revealEmbed = new EmbedBuilder()
        .setColor(COLOR)
        .setTitle("🃏 There Was No Imposter.")
        .setDescription(
            "Everyone had the **same word** the entire game.\n\n" +
            "Every clue was real. Every suspicion was manufactured.\n" +
            "The paranoia? All yours."
        )
        .addFields({
            name: "📝 The Word",
            value: `**${game.commonWord}**\n*Everyone had this. No exceptions.*`,
            inline: true
        });

    await ctx.channel.send({ embeds: [revealEmbed] });

    await new Promise(r => setTimeout(r, 2000));

    // Step 4 — fake imposter callout
    const fakeEmbed = new EmbedBuilder()
        .setColor(COLOR_AMBER)
        .setTitle("🎭 The Fake Imposter")
        .setDescription(
            `**${fakeImposter.username}** was secretly told they were the Imposter.\n\n` +
            `They had the same word as everyone else — **${game.commonWord}** — ` +
            `but spent the entire game trying to blend in.\n\n` +
            (mostVotedUser
                ? (mostVotedUser.id === game.fakeImposterId
                    ? `The crew voted out **${mostVotedUser.username}** — they found the fake Imposter by accident. 😂`
                    : `The crew voted out **${mostVotedUser.username}** instead. **${fakeImposter.username}** fooled everyone. 🏆`)
                : "The vote was tied. Chaos reigned. Nobody won.")
        );

    await ctx.channel.send({ embeds: [fakeEmbed] });

    // Confession card — the fake imposter gets the full experience, even though they were never real
    sendConfessionCard(ctx.client, game.fakeImposterId, {
        word: game.commonWord,
        wasRealImposter: false,
        outcome: "none-existed",
        clues: getPlayerClues(game, game.fakeImposterId)
    });

    for (const playerId of game.players) {
        StatsManager.update(playerId, { gamesPlayed: 1, gamesWon: 1, crewWins: 1 });
    }
    if (mostVotedId && mostVotedId === game.fakeImposterId && !tie) {
        StatsManager.update(game.fakeImposterId, { timesVotedOut: 1 });
    }

    GameManager.delete(game.channelId);
}

// ─── Shared helpers ───────────────────────────────────────────────────────────
async function finalizeGame(ctx, game, impostersCaught, tie) {
    for (const playerId of game.players) {
        const isImposter = game.imposterIds.includes(playerId);
        const delta = { gamesPlayed: 1 };
        if (tie) {
            if (isImposter) { delta.gamesWon = 1; delta.imposterWins = 1; }
        } else if (impostersCaught) {
            if (!isImposter) { delta.gamesWon = 1; delta.crewWins = 1; }
        } else {
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

// Splits an array of lines into chunks that each stay under maxLen characters,
// so no single embed field value can ever exceed Discord's 1024-char limit.
function chunkLines(lines, maxLen) {
    const chunks = [];
    let current = "";

    for (const line of lines) {
        const candidate = current ? `${current}\n${line}` : line;
        if (candidate.length > maxLen) {
            if (current) chunks.push(current);
            current = line.length > maxLen ? line.slice(0, maxLen - 1) + "…" : line;
        } else {
            current = candidate;
        }
    }
    if (current) chunks.push(current);
    return chunks.length ? chunks : ["—"];
}

module.exports.finalizeGame   = finalizeGame;
module.exports.clearAllTimers = clearAllTimers;
module.exports.revealWords    = revealWords;
module.exports.getPlayerClues = getPlayerClues;