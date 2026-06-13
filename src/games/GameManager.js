const games = new Map();

module.exports = {
    create(channelId) {
        const game = {
            channelId,
            state: "LOBBY",      // LOBBY | ROUND | DISCUSSION | VOTING | LAST_CHANCE
            mode: null,
            players: [],

            // Single-imposter (normal) — kept for backward compat
            imposterId: null,
            // Multi-imposter support (used everywhere internally)
            imposterIds: [],

            commonWord:   null,
            imposterWord: null,

            round:       1,
            order:       [],
            currentTurn: 0,
            clues:       {},

            // Duplicate clue guard — lowercased set across entire game
            usedClues: new Set(),

            votes:          {},
            skipVotes:      new Set(),   // =skip votes during DISCUSSION
            votingMessageId: null,

            // Active timer handles — cleared on early completion
            turnTimer:   null,
            votingTimer: null,
            discussTimer:null,

            // Last-chance state
            lastChanceTimer:    null,
            impostersCaught:    false,   // set true when imposters lose vote phase
        };

        games.set(channelId, game);
        return game;
    },

    get(channelId)    { return games.get(channelId); },
    delete(channelId) { games.delete(channelId); },
    exists(channelId) { return games.has(channelId); }
};