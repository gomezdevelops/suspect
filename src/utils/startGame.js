const words = require("./words");
const { collection } = require("../db/connect");

// Word history lives in the `meta` collection as a single doc:
// { _id: "usedWords", history: [ { common, imposter }, ... ] }
const meta = () => collection("meta");
const HISTORY_ID   = "usedWords";
const HISTORY_SIZE = 20;

async function loadHistory() {
    const doc = await meta().findOne({ _id: HISTORY_ID });
    return doc?.history ?? [];
}

async function saveHistory(history) {
    await meta().updateOne(
        { _id: HISTORY_ID },
        { $set: { history } },
        { upsert: true }
    );
}

function pickWord(pool) {
    return pool[Math.floor(Math.random() * pool.length)];
}

module.exports = async function startGame(game) {
    const history  = await loadHistory();
    const usedSet  = new Set(history.flatMap(h => [h.common, h.imposter]));
    const freshPool = words.filter(w => !usedSet.has(w));
    // Fall back to full pool if too many words have been used
    const pool = freshPool.length >= 2 ? freshPool : words;

    // Pick crew word
    game.commonWord = pickWord(pool);

    // Pick imposter word — different from crew word
    const impPool = pool.filter(w => w !== game.commonWord);
    game.imposterWord = pickWord(impPool.length ? impPool : words.filter(w => w !== game.commonWord));

    // Persist this game's words to history
    history.push({ common: game.commonWord, imposter: game.imposterWord });
    if (history.length > HISTORY_SIZE) history.splice(0, history.length - HISTORY_SIZE);
    await saveHistory(history);

    // ── Imposter selection ──────────────────────────────────────────────────
    const count = game.players.length;
    let imposterCount = 1;
    if (game.mode === "hidden" && count >= 8) imposterCount = 2;

    const shuffled = [...game.players].sort(() => Math.random() - 0.5);
    game.imposterIds = shuffled.slice(0, imposterCount);
    game.imposterId  = game.imposterIds[0]; // backward compat

    // ── Decoy selection (Decoy mode only) ─────────────────────────────────────
    // A second player is told they're the imposter, but secretly gets the crew word.
    // Min 5 players enforced in start.js — guarantees at least 3 real crew remain.
    game.decoyId = null;
    if (game.mode === "decoy") {
        const remaining = shuffled.slice(imposterCount);
        game.decoyId = remaining[0];
    }

    // ── Round order ──────────────────────────────────────────────────────────
    game.order       = [...game.players].sort(() => Math.random() - 0.5);
    game.round       = 1;
    game.currentTurn = 0;
    game.clues       = {};
    game.votes       = {};
    game.skipVotes   = new Set();
    game.usedClues   = new Set();
};
