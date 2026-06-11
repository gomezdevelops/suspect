const showResults = require("./showResults");
const { voteReceived } = require("./embeds");

module.exports =
async function handleVote(interaction, game) {

    const votedId =
        interaction.customId.replace("vote_", "");

    if (votedId === interaction.user.id) {
        return interaction.reply({
            content: "You cannot vote for yourself.",
            ephemeral: true
        });
    }

    if (game.votes[interaction.user.id]) {
        return interaction.reply({
            content: "You already voted.",
            ephemeral: true
        });
    }

    game.votes[interaction.user.id] = votedId;

    await interaction.reply({
        content: "✅ Vote submitted.",
        ephemeral: true
    });

    const totalVotes = Object.keys(game.votes).length;

    await interaction.channel.send({
        embeds: [voteReceived(totalVotes, game.players.length)]
    });

    if (totalVotes === game.players.length) {
        await showResults(interaction, game);
    }
};