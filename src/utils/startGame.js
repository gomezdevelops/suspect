const words = require("./words");

module.exports = function startGame(game) {

    game.imposterId =
        game.players[
            Math.floor(Math.random() * game.players.length)
        ];

    game.commonWord =
        words[
            Math.floor(Math.random() * words.length)
        ];

    do {
        game.imposterWord =
            words[
                Math.floor(Math.random() * words.length)
            ];
    } while (game.imposterWord === game.commonWord);

    game.order =
        [...game.players].sort(() => Math.random() - 0.5);

    game.round = 1;
    game.currentTurn = 0;
    game.clues = {};
    game.votes = {};
};