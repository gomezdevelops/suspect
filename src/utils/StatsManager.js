const fs   = require("fs");
const path = require("path");

const STATS_FILE = path.join(__dirname, "../data/stats.json");

function load() {
    if (!fs.existsSync(STATS_FILE)) return {};
    try { return JSON.parse(fs.readFileSync(STATS_FILE, "utf8")); }
    catch { return {}; }
}

function save(data) {
    fs.writeFileSync(STATS_FILE, JSON.stringify(data, null, 2));
}

function getDefault() {
    return {
        gamesPlayed:  0,
        gamesWon:     0,
        crewWins:     0,
        imposterWins: 0,
        correctVotes: 0,
        timesVotedOut:0,
        winRate:      0
    };
}

function get(userId) {
    const all = load();
    return { ...getDefault(), ...(all[userId] || {}) };
}

function update(userId, delta) {
    const all  = load();
    const stat = { ...getDefault(), ...(all[userId] || {}) };
    for (const [k, v] of Object.entries(delta)) {
        if (typeof stat[k] === "number") stat[k] += v;
    }
    stat.winRate = stat.gamesPlayed > 0
        ? Math.round((stat.gamesWon / stat.gamesPlayed) * 100)
        : 0;
    all[userId] = stat;
    save(all);
}

function getAll() {
    return load();
}

module.exports = { get, update, getAll };