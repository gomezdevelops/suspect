const showResults = require("./showResults");
const { voteReceived } = require("./embeds");

module.exports = async function handleVote(interaction, game) {

    const votedId = interaction.customId.replace("vote_", "");

    if (votedId === interaction.user.id) {
        return interaction.reply({ content: "❌ You cannot vote for yourself.", ephemeral: true });
    }

    if (game.votes[interaction.user.id] !== undefined) {
        return interaction.reply({ content: "❌ You already voted.", ephemeral: true });
    }

    game.votes[interaction.user.id] = votedId;

    await interaction.reply({ content: "✅ Vote submitted.", ephemeral: true });

    const totalVotes = Object.values(game.votes).filter(v => v !== null && v !== undefined).length;
    // Count real votes (not abstentions)
    const realVotes  = Object.values(game.votes).filter(v => v !== null).length;

    await interaction.channel.send({
        embeds: [voteReceived(realVotes, game.players.length)]
    });

    // If every player has voted (no need to wait for timer)
    const allVoted = game.players.every(id => game.votes[id] !== undefined);
    if (allVoted) {
        // Clear voting timers
        if (game.votingTimer)   { clearTimeout(game.votingTimer);   game.votingTimer   = null; }
        if (game._votingWarn30) { clearTimeout(game._votingWarn30); game._votingWarn30 = null; }
        if (game._votingWarn10) { clearTimeout(game._votingWarn10); game._votingWarn10 = null; }

        await showResults(interaction, game);
    }
};