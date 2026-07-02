const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const StatsManager  = require("../utils/StatsManager");
const ShardManager  = require("../utils/ShardManager");
const VoteTracker   = require("../utils/VoteTracker");
const { getActiveTitle } = require("../utils/TitleManager");
const { reply, user, client, isSlash } = require("../utils/ctx");

// ── Rank tiers ────────────────────────────────────────────────────────────────
function getRank(stats) {
    const { gamesPlayed, winRate, imposterWins, correctVotes } = stats;
    if (gamesPlayed === 0) return { title: "Unranked",      icon: "👁️",  color: 0x444444 };
    if (gamesPlayed < 5)   return { title: "Suspect",       icon: "🔍",  color: 0x888888 };
    if (winRate >= 75 && imposterWins >= 10) return { title: "Phantom",     icon: "🎭", color: 0xe8001a };
    if (winRate >= 70 && gamesPlayed >= 20)  return { title: "Mastermind",  icon: "🧠", color: 0xcc0015 };
    if (winRate >= 65 && correctVotes >= 15) return { title: "Detective",   icon: "🕵️", color: 0x0099ff };
    if (winRate >= 60 && gamesPlayed >= 15)  return { title: "Operative",   icon: "⚔️", color: 0x9b59b6 };
    if (winRate >= 50 && gamesPlayed >= 10)  return { title: "Agent",       icon: "🔫", color: 0x2ecc71 };
    return                                          { title: "Rookie",      icon: "🪖", color: 0xf39c12 };
}

function bar(value, max, length = 12) {
    const pct    = max > 0 ? Math.min(value / max, 1) : 0;
    const filled = Math.round(pct * length);
    return `${"█".repeat(filled)}${"░".repeat(length - filled)}`;
}

function statRow(label, value, max) {
    return `\`${label.padEnd(14, " ")}\` ${bar(value, max)} \`${value}\``;
}

function getNextRankHint(stats) {
    const { gamesPlayed, winRate, imposterWins, correctVotes, gamesWon } = stats;
    if (gamesPlayed === 0) return "Play your first game to get ranked.";
    if (gamesPlayed < 5)   return `${5 - gamesPlayed} more game(s) to leave Suspect rank.`;
    if (!(winRate >= 75 && imposterWins >= 10)) {
        const w = Math.max(0, Math.ceil(gamesPlayed * 0.75) - gamesWon);
        const i = Math.max(0, 10 - imposterWins);
        return `Phantom: ${w} more win(s) & ${i} more imposter win(s).`;
    }
    if (!(winRate >= 70 && gamesPlayed >= 20)) return `Mastermind: ${Math.max(0, 20 - gamesPlayed)} more game(s) at 70%+ WR.`;
    if (!(winRate >= 65 && correctVotes >= 15)) return `Detective: ${Math.max(0, 15 - correctVotes)} more correct vote(s).`;
    return "Maximum rank achieved. You are the Phantom. 🎭";
}

// ── Profile embed builder ─────────────────────────────────────────────────────
function buildProfileEmbed(targetUser, stats, shards, voteData, activeTitle, avatarUrl) {
    const rank   = getRank(stats);
    const losses = stats.gamesPlayed - stats.gamesWon;

    const crewRate     = stats.gamesPlayed > 0 ? Math.round((stats.crewWins / stats.gamesPlayed) * 100) : 0;
    const imposterRate = stats.gamesPlayed > 0 ? Math.round((stats.imposterWins / stats.gamesPlayed) * 100) : 0;
    const detectRate   = stats.gamesPlayed > 0 ? Math.round((stats.correctVotes / stats.gamesPlayed) * 100) : 0;

    const winBarFilled = Math.round((stats.winRate / 100) * 20);
    const winBar       = `${"▰".repeat(winBarFilled)}${"▱".repeat(20 - winBarFilled)}`;

    // Title line — shows purchased cosmetic title under username
    const titleLine = activeTitle ? `*"${activeTitle}"*\n\n` : "\n";

    // Header block
    const headerBlock =
        `╔═══════════════════════════╗\n` +
        `  ${rank.icon}  ${rank.title.toUpperCase()}\n` +
        `  ${targetUser.username}\n` +
        (activeTitle ? `  ${activeTitle}\n` : "") +
        `╚═══════════════════════════╝`;

    const winRateBlock =
        `**WIN RATE**\n${winBar}\n` +
        `\`${stats.winRate}%\`  ·  **${stats.gamesWon}W** / **${losses}L**`;

    const coreStats =
        statRow("Games Played",   stats.gamesPlayed,  100)  + "\n" +
        statRow("Games Won",      stats.gamesWon,      Math.max(stats.gamesPlayed, 1)) + "\n" +
        statRow("Crew Wins",      stats.crewWins,      Math.max(stats.gamesPlayed, 1)) + "\n" +
        statRow("Imp. Wins",      stats.imposterWins,  Math.max(stats.gamesPlayed, 1));

    const voteStats =
        statRow("Correct Votes",  stats.correctVotes,  Math.max(stats.gamesPlayed, 1)) + "\n" +
        statRow("Times Voted Out",stats.timesVotedOut, Math.max(stats.gamesPlayed, 1));

    const ratioLine =
        `\`🕵️ ${detectRate}% detect\`  \`🎭 ${imposterRate}% imp\`  \`👥 ${crewRate}% crew\``;

    // Badges row
    const badgeLine = voteData.earnedBadges.length
        ? voteData.earnedBadges.join("  ")
        : "*No badges yet — vote on top.gg to earn them!*";

    // Shards and vote streak line
    const shardsLine = `💎 **${shards} Shards**  ·  🗳️ **${voteData.totalVotes}** votes  ·  🔥 **${voteData.streak}** day streak`;

    const embed = new EmbedBuilder()
        .setColor(rank.color)
        .setAuthor({
            name: activeTitle
                ? `${targetUser.username} — ${activeTitle}`
                : `${targetUser.username}'s Profile`,
            iconURL: avatarUrl
        })
        .setThumbnail(avatarUrl)
        .setDescription("```" + headerBlock + "```")
        .addFields(
            { name: "━━━━━━  WIN RATE  ━━━━━━",  value: winRateBlock, inline: false },
            { name: "━━━━━━  STATS  ━━━━━━━━━",  value: coreStats,    inline: false },
            { name: "━━━━━━  VOTING  ━━━━━━━━",  value: voteStats,    inline: false },
            { name: "━━━━━━  RATIOS  ━━━━━━━━",  value: ratioLine,    inline: false },
            { name: "━━━━━━  BADGES  ━━━━━━━━",  value: badgeLine,    inline: false },
            { name: "━━━━━━  SHARDS  ━━━━━━━━",  value: shardsLine,   inline: false }
        )
        .setFooter({ text: getNextRankHint(stats), iconURL: avatarUrl });

    return embed;
}

// ── Command ───────────────────────────────────────────────────────────────────
module.exports = {
    name: "profile",
    data: new SlashCommandBuilder()
        .setName("profile")
        .setDescription("View your Suspect profile and stats")
        .addUserOption(o =>
            o.setName("user")
             .setDescription("View another player's profile")
             .setRequired(false)
        ),

    async execute(ctx, args = []) {
        let targetUser;

        if (isSlash(ctx)) {
            targetUser = ctx.options.getUser("user") ?? ctx.user;
        } else {
            const mention = ctx.mentions?.users?.first();
            targetUser = mention ?? ctx.author;
        }

        const stats       = StatsManager.get(targetUser.id);
        const shards      = ShardManager.getBalance(targetUser.id);
        const voteData    = VoteTracker.getFullData(targetUser.id);
        const activeTitle = getActiveTitle(targetUser.id);
        const avatarUrl   = targetUser.displayAvatarURL({ size: 256 });
        const embed       = buildProfileEmbed(targetUser, stats, shards, voteData, activeTitle, avatarUrl);

        await reply(ctx, { embeds: [embed] });
    }
};