const { EmbedBuilder } = require("discord.js");

// Brand colour used across all embeds
const COLOR = 0xe8001a;

function gameStarted(playerCount, mode) {
    return new EmbedBuilder()
        .setColor(COLOR)
        .setTitle("🎮 Game Started")
        .addFields(
            { name: "Players", value: String(playerCount), inline: true },
            { name: "Mode", value: mode === "normal" ? "Normal" : "Hidden", inline: true }
        )
        .setFooter({ text: "Check your DMs for your word!" });
}

function roundStart(round, orderLines, firstPlayerId) {
    return new EmbedBuilder()
        .setColor(COLOR)
        .setTitle(`🎯 Round ${round}`)
        .addFields(
            { name: "Speaking Order", value: orderLines.join("\n") },
            { name: "First Turn", value: `<@${firstPlayerId}>` }
        );
}

function nextTurnEmbed(playerId) {
    return new EmbedBuilder()
        .setColor(COLOR)
        .setDescription(`🎤 It's now <@${playerId}>'s turn.`);
}

function voteReceived(total, max) {
    return new EmbedBuilder()
        .setColor(COLOR)
        .setDescription(`📥 Vote received. **(${total}/${max})** players voted`);
}

function votingPhase() {
    return new EmbedBuilder()
        .setColor(COLOR)
        .setTitle("🗳️ Voting Phase")
        .setDescription("All rounds are complete.\n\nVote for the player you think is the **Imposter**.\nEveryone must vote before results are revealed.");
}

function results(voteLines, imposterName, crewWord, imposterWord, clueFields, outcome) {
    const { title, description, color } = outcome;

    const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle("📊 Vote Results")
        .addFields(
            { name: "Votes", value: voteLines.join("\n") },
            { name: "Imposter", value: imposterName, inline: true },
            { name: "Crew Word", value: crewWord, inline: true },
            { name: "Imposter Word", value: imposterWord, inline: true }
        );

    if (clueFields.length > 0) {
        embed.addFields(clueFields);
    }

    embed.addFields({ name: outcome.title, value: outcome.description });

    return embed;
}

function errorEmbed(message) {
    return new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription(`❌ ${message}`);
}

function clueSent(username, clue) {
    return new EmbedBuilder()
        .setColor(COLOR)
        .setDescription(`💬 **${username}**: ${clue}`);
}

module.exports = {
    gameStarted,
    roundStart,
    nextTurnEmbed,
    voteReceived,
    votingPhase,
    results,
    errorEmbed,
    clueSent,
    COLOR
};