const fs   = require("fs");
const path = require("path");

const SHARDS_FILE = path.join(__dirname, "../data/shards.json");

function load() {
    if (!fs.existsSync(SHARDS_FILE)) return {};
    try { return JSON.parse(fs.readFileSync(SHARDS_FILE, "utf8")); }
    catch { return {}; }
}

function save(data) {
    fs.writeFileSync(SHARDS_FILE, JSON.stringify(data, null, 2));
}

function getBalance(userId) {
    const all = load();
    return all[userId] ?? 0;
}

function addShards(userId, amount) {
    const all = load();
    all[userId] = (all[userId] ?? 0) + amount;
    save(all);
    return all[userId];
}

/** Returns false if insufficient balance, otherwise deducts and returns new balance */
function spendShards(userId, amount) {
    const all = load();
    const bal = all[userId] ?? 0;
    if (bal < amount) return false;
    all[userId] = bal - amount;
    save(all);
    return all[userId];
}

module.exports = { getBalance, addShards, spendShards };