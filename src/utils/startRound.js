const { roundStart } = require("./embeds");

module.exports =
async function startRound(interaction, game) {

    const orderLines =
        await Promise.all(
            game.order.map(async (playerId, index) => {
                const user =
                    await interaction.client.users.fetch(playerId);
                return `${index + 1}. ${user.username}`;
            })
        );

    await interaction.channel.send({
        embeds: [roundStart(1, orderLines, game.order[0])]
    });
};