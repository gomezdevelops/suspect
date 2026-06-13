const fs   = require("fs");
const path = require("path");
const words = require("./words");

const HISTORY_FILE = path.join(__dirname, "../data/usedWords.json");
const HISTORY_SIZE = 20;

function loadHistory() {
    if (!fs.existsSync(HISTORY_FILE)) return [];
    try { return JSON.parse(fs.readFileSync(HISTORY_FILE, "utf8")); }
    catch { return []; }
}

function saveHistory(history) {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
}

function pickWord(pool) {
    return pool[Math.floor(Math.random() * pool.length)];
}

module.exports = function startGame(game) {
    const history  = loadHistory();
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
    saveHistory(history);

    // ── Imposter selection ──────────────────────────────────────────────────
    const count = game.players.length;
    let imposterCount = 1;
    if (game.mode === "hidden" && count >= 8) imposterCount = 2;

    const shuffled = [...game.players].sort(() => Math.random() - 0.5);
    game.imposterIds = shuffled.slice(0, imposterCount);
    game.imposterId  = game.imposterIds[0]; // backward compat

    // ── Round order ──────────────────────────────────────────────────────────
    game.order       = [...game.players].sort(() => Math.random() - 0.5);
    game.round       = 1;
    game.currentTurn = 0;
    game.clues       = {};
    game.votes       = {};
    game.skipVotes   = new Set();
    game.usedClues   = new Set();
};