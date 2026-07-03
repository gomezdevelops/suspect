const { collection } = require("../db/connect");

// Collection: stats — docs shaped { _id: userId, gamesPlayed, gamesWon, ... }
const col = () => collection("stats");

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

async function get(userId) {
    const doc = await col().findOne({ _id: userId });
    return { ...getDefault(), ...(doc || {}) };
}

async function update(userId, delta) {
    const stat = await get(userId);
    for (const [k, v] of Object.entries(delta)) {
        if (typeof stat[k] === "number") stat[k] += v;
    }
    stat.winRate = stat.gamesPlayed > 0
        ? Math.round((stat.gamesWon / stat.gamesPlayed) * 100)
        : 0;

    await col().updateOne(
        { _id: userId },
        { $set: {
            gamesPlayed:   stat.gamesPlayed,
            gamesWon:      stat.gamesWon,
            crewWins:      stat.crewWins,
            imposterWins:  stat.imposterWins,
            correctVotes:  stat.correctVotes,
            timesVotedOut: stat.timesVotedOut,
            winRate:       stat.winRate
        } },
        { upsert: true }
    );
}

/** Returns every user's stats as a { userId: statObj } map (for leaderboards). */
async function getAll() {
    const docs = await col().find({}).toArray();
    const map  = {};
    for (const doc of docs) {
        const { _id, ...rest } = doc;
        map[_id] = { ...getDefault(), ...rest };
    }
    return map;
}

module.exports = { get, update, getAll };
