const startVoting = require("./startVoting");
const { roundStart, nextTurnEmbed, votingPhase } = require("./embeds");

module.exports =
async function nextTurn(interaction, game) {

    // Next player in current round
    if (game.currentTurn < game.order.length) {

        const nextPlayer = game.order[game.currentTurn];

        await interaction.channel.send({
            embeds: [nextTurnEmbed(nextPlayer)]
        });

        return;
    }

    // Round finished — reset turn, advance round
    game.currentTurn = 0;
    game.round++;

    // More rounds remain
    if (game.round <= 3) {

        const orderLines =
            await Promise.all(
                game.order.map(async (playerId, index) => {
                    const user =
                        await interaction.client.users.fetch(playerId);
                    return `${index + 1}. ${user.username}`;
                })
            );

        await interaction.channel.send({
            embeds: [roundStart(game.round, orderLines, game.order[0])]
        });

        return;
    }

    // All rounds done — move to voting
    game.state = "VOTING";

    await interaction.channel.send({
        embeds: [votingPhase()]
    });

    await startVoting(interaction, game);
};