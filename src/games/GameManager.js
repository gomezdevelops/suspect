const games = new Map();

module.exports = {
    create(channelId) {
        const game = {
            channelId,
            state: "LOBBY",
            mode: null,
            players: [],
            imposterId: null,
            commonWord: null,
            imposterWord: null,
            round: 1,
            order: [],
            currentTurn: 0,
            clues: {},
            votes: {},
            votingMessageId: null,
        };

        games.set(channelId, game);

        return game;
    },

    get(channelId) {
        return games.get(channelId);
    },

    delete(channelId) {
        games.delete(channelId);
    },

    exists(channelId) {
        return games.has(channelId);
    }
};