module.exports =
async function sendWords(game, guild) {

    for (const playerId of game.players) {

        const member =
            await guild.members.fetch(playerId);

        const isImposter =
            playerId === game.imposterId;

        const word =
            isImposter
                ? game.imposterWord
                : game.commonWord;

        if (game.mode === "normal") {

            if (isImposter) {
                await member.send(
`🎭 You are the **IMPOSTER**!

Your word: **${word}**

Try to blend in.`
                );
            } else {
                await member.send(
`📝 Your word: **${word}**`
                );
            }

        } else {

            // Hidden mode — everyone gets their word, nobody is told their role
            await member.send(
`📝 Your word: **${word}**`
            );
        }
    }
};