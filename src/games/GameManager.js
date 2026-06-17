const games = new Map();

module.exports = {
    create(channelId) {
        const game = {
            channelId,
            state: "LOBBY",
            mode: null,
            players: [],
            imposterId: null,
            imposterIds: [],

            commonWord:   null,
            imposterWord: null,

            round:       1,
            order:       [],
            currentTurn: 0,
            clues:       {},
            usedClues: new Set(),

            votes:          {},
            skipVotes:      new Set(),
            votingMessageId: null,
            turnTimer:   null,
            votingTimer: null,
            discussTimer:null,
            lastChanceTimer:    null,
            impostersCaught:    false,
        };

        games.set(channelId, game);
        return game;
    },

    get(channelId)    { return games.get(channelId); },
    delete(channelId) { games.delete(channelId); },
    exists(channelId) { return games.has(channelId); }
};