const fs   = require("fs");
const path = require("path");

const VOTES_FILE = path.join(__dirname, "../data/votes.json");
const TOPGG_URL  = "https://top.gg/bot/1514691427370799154/vote";

// Vote window: top.gg resets every 12 hours
const VOTE_WINDOW_MS = 12 * 60 * 60 * 1000;

// Streak resets if you miss more than 13 hours (1hr grace on top of 12)
const STREAK_GRACE_MS = 13 * 60 * 60 * 1000;

// Shards awarded per vote (doubles on streaks)
const BASE_SHARDS = 50;

// Milestone total-vote thresholds → badge label
const MILESTONES = [
    { votes: 1,   badge: "🗳️ First Vote" },
    { votes: 5,   badge: "🔥 Regular Voter" },
    { votes: 10,  badge: "⭐ Dedicated Voter" },
    { votes: 25,  badge: "💎 Loyal Supporter" },
    { votes: 50,  badge: "👑 Top Supporter" },
    { votes: 100, badge: "🏆 Legend Voter" },
];

function load() {
    if (!fs.existsSync(VOTES_FILE)) return {};
    try { return JSON.parse(fs.readFileSync(VOTES_FILE, "utf8")); }
    catch { return {}; }
}

function save(data) {
    fs.writeFileSync(VOTES_FILE, JSON.stringify(data, null, 2));
}

function getDefault() {
    return {
        lastVoteAt:  0,       // unix ms timestamp of last vote
        totalVotes:  0,       // all-time vote count
        streak:      0,       // current consecutive vote streak
        lastStreakAt:0,       // timestamp last streak-qualifying vote
        earnedBadges: []      // array of badge strings unlocked
    };
}

function get(userId) {
    const all = load();
    return { ...getDefault(), ...(all[userId] || {}) };
}

/** Returns true if the user voted within the last 12 hours */
function hasVotedRecently(userId) {
    const data = get(userId);
    return (Date.now() - data.lastVoteAt) < VOTE_WINDOW_MS;
}

/**
 * Called by the top.gg webhook when a user votes.
 * Returns { shardsEarned, newStreak, newBadges }
 */
function recordVote(userId) {
    const all  = load();
    const data = { ...getDefault(), ...(all[userId] || {}) };
    const now  = Date.now();

    // Streak logic: did they vote within the last STREAK_GRACE_MS?
    const withinStreak = (now - data.lastStreakAt) < STREAK_GRACE_MS;
    data.streak = withinStreak ? data.streak + 1 : 1;

    data.lastVoteAt   = now;
    data.lastStreakAt  = now;
    data.totalVotes   += 1;

    // Shard reward — doubles every 7-day streak milestone
    const streakMultiplier = Math.floor(data.streak / 7) + 1;
    const shardsEarned     = BASE_SHARDS * streakMultiplier;

    // Check for new milestone badges
    const newBadges = [];
    for (const m of MILESTONES) {
        if (data.totalVotes >= m.votes && !data.earnedBadges.includes(m.badge)) {
            data.earnedBadges.push(m.badge);
            newBadges.push(m.badge);
        }
    }

    all[userId] = data;
    save(all);

    return { shardsEarned, newStreak: data.streak, newBadges };
}

/** Returns all milestone badges earned by a user */
function getBadges(userId) {
    return get(userId).earnedBadges;
}

/** Next milestone info for a user */
function getNextMilestone(totalVotes) {
    const next = MILESTONES.find(m => m.votes > totalVotes);
    return next ? { votes: next.votes, remaining: next.votes - totalVotes } : null;
}

/** Returns all data for a user (for profile display) */
function getFullData(userId) {
    return get(userId);
}

module.exports = {
    hasVotedRecently,
    recordVote,
    getBadges,
    getNextMilestone,
    getFullData,
    TOPGG_URL,
    MILESTONES,
    BASE_SHARDS
};