const { EmbedBuilder } = require("discord.js");
const GameManager = require("../games/GameManager");
const { COLOR } = require("./embeds");

module.exports =
async function showResults(interaction, game) {

    const voteCounts = {};

    for (const votedId of Object.values(game.votes)) {
        voteCounts[votedId] = (voteCounts[votedId] || 0) + 1;
    }

    // Disable voting buttons
    if (game.votingMessageId) {
        try {
            const votingMessage =
                await interaction.channel.messages.fetch(
                    game.votingMessageId
                );

            const disabledRows =
                votingMessage.components.map(row => ({
                    type: row.type,
                    components: row.components.map(button => ({
                        type: button.data.type,
                        style: button.data.style,
                        label: button.data.label,
                        custom_id: button.data.custom_id,
                        disabled: true
                    }))
                }));

            await votingMessage.edit({ components: disabledRows });

        } catch (err) {
            console.error("Failed to disable vote buttons:", err);
        }
    }

    // Determine winner
    let highestVotes = 0;
    let winners = [];

    for (const [playerId, votes] of Object.entries(voteCounts)) {
        if (votes > highestVotes) {
            highestVotes = votes;
            winners = [playerId];
        } else if (votes === highestVotes) {
            winners.push(playerId);
        }
    }

    const tie = winners.length > 1;
    const imposterCaught = !tie && winners[0] === game.imposterId;

    const imposterUser =
        await interaction.client.users.fetch(game.imposterId);

    // Vote tally lines
    const voteLines = [];
    for (const playerId of game.players) {
        const user = await interaction.client.users.fetch(playerId);
        const votes = voteCounts[playerId] || 0;
        const bar = "█".repeat(votes) || "—";
        voteLines.push(`**${user.username}** ${bar} ${votes} vote(s)`);
    }

    // Clue history fields — one field per round
    const clueFields = [];
    for (const round of Object.keys(game.clues)) {
        const lines = [];
        for (const [playerId, clue] of Object.entries(game.clues[round])) {
            const user = await interaction.client.users.fetch(playerId);
            lines.push(`**${user.username}**: ${clue}`);
        }
        if (lines.length > 0) {
            clueFields.push({
                name: `Round ${round}`,
                value: lines.join("\n"),
                inline: false
            });
        }
    }

    // Outcome
    let outcomeTitle, outcomeDesc, outcomeColor;

    if (tie) {
        outcomeTitle = "⚠️ Tie Vote — Imposter Wins!";
        outcomeDesc = "The vote was tied. The Imposter slips away.";
        outcomeColor = 0xffa500;
    } else if (imposterCaught) {
        outcomeTitle = "✅ Crew Wins!";
        outcomeDesc = "The Imposter was caught.";
        outcomeColor = 0x00c853;
    } else {
        outcomeTitle = "🎉 Imposter Wins!";
        outcomeDesc = "The crew voted incorrectly.";
        outcomeColor = 0xe8001a;
    }

    const embed = new EmbedBuilder()
        .setColor(outcomeColor)
        .setTitle("📊 Vote Results")
        .addFields(
            { name: "Votes", value: voteLines.join("\n") },
            { name: "🎭 Imposter", value: imposterUser.username, inline: true },
            { name: "📝 Crew Word", value: game.commonWord, inline: true },
            { name: "🎯 Imposter Word", value: game.imposterWord, inline: true }
        );

    if (clueFields.length > 0) {
        embed.addFields({ name: "🗒️ Clue History", value: "\u200b" });
        embed.addFields(clueFields);
    }

    embed.addFields({ name: outcomeTitle, value: outcomeDesc });

    await interaction.channel.send({ embeds: [embed] });

    GameManager.delete(game.channelId);
};