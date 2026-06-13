module.exports = async function sendWords(game, guild) {

    for (const playerId of game.players) {

        const member     = await guild.members.fetch(playerId);
        const isImposter = game.imposterIds.includes(playerId);
        const word       = isImposter ? game.imposterWord : game.commonWord;

        if (game.mode === "normal") {
            if (isImposter) {
                await member.send(
`🎭 You are the **IMPOSTER**!

Your word: **${word}**

Try to blend in with the crew.`
                );
            } else {
                await member.send(`📝 Your word: **${word}**`);
            }
        } else {
            // Hidden mode — nobody is told their role, imposters don't know they're different
            await member.send(`📝 Your word: **${word}**`);
        }
    }
};