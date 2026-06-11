const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");
const { votingPhase } = require("./embeds");

module.exports =
async function startVoting(interaction, game) {

    const rows = [];
    let currentRow = new ActionRowBuilder();
    let count = 0;

    for (const playerId of game.players) {

        const user =
            await interaction.client.users.fetch(playerId);

        currentRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`vote_${playerId}`)
                .setLabel(user.username)
                .setStyle(ButtonStyle.Primary)
        );

        count++;

        if (count === 5) {
            rows.push(currentRow);
            currentRow = new ActionRowBuilder();
            count = 0;
        }
    }

    if (currentRow.components.length > 0) {
        rows.push(currentRow);
    }

    const message =
        await interaction.channel.send({
            embeds: [votingPhase()],
            components: rows
        });

    game.votingMessageId = message.id;
};