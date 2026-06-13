const { EmbedBuilder } = require("discord.js");

const COLOR       = 0xe8001a;
const COLOR_GREEN = 0x00c853;
const COLOR_AMBER = 0xffa500;

function gameStarted(playerCount, mode, imposterCount) {
    return new EmbedBuilder()
        .setColor(COLOR)
        .setTitle("🎮 Game Started")
        .addFields(
            { name: "Players",   value: String(playerCount),                       inline: true },
            { name: "Mode",      value: mode === "normal" ? "Normal" : "Hidden",   inline: true },
            { name: "Imposters", value: String(imposterCount),                     inline: true }
        )
        .setFooter({ text: "Check your DMs for your word!" });
}

function roundStart(round, orderLines, firstPlayerId) {
    return new EmbedBuilder()
        .setColor(COLOR)
        .setTitle(`🎯 Round ${round}`)
        .addFields(
            { name: "Speaking Order", value: orderLines.join("\n") },
            { name: "First Turn",     value: `<@${firstPlayerId}>` }
        )
        .setFooter({ text: "Type your one-word clue in chat when it's your turn." });
}

function nextTurnEmbed(playerId, secondsLeft) {
    const footer = secondsLeft != null ? `⏱ ${secondsLeft}s remaining` : undefined;
    const e = new EmbedBuilder()
        .setColor(COLOR)
        .setDescription(`🎤 It's now <@${playerId}>'s turn.`);
    if (footer) e.setFooter({ text: footer });
    return e;
}

function turnWarning(playerId, secondsLeft) {
    return new EmbedBuilder()
        .setColor(COLOR_AMBER)
        .setDescription(`⏰ <@${playerId}> — **${secondsLeft} seconds** remaining to give your clue!`);
}

function turnSkipped(playerId) {
    return new EmbedBuilder()
        .setColor(COLOR_AMBER)
        .setDescription(`⏭️ <@${playerId}>'s turn was skipped — time expired.`);
}

function duplicateClue(clue) {
    return new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription(`❌ **"${clue}"** was already used this game. Choose a different word — your turn continues.`);
}

function voteReceived(total, max) {
    return new EmbedBuilder()
        .setColor(COLOR)
        .setDescription(`📥 Vote received. **(${total}/${max})** players voted`);
}

function votingPhaseEmbed() {
    return new EmbedBuilder()
        .setColor(COLOR)
        .setTitle("🗳️ Voting Phase")
        .setDescription(
            "Vote for the player you think is the **Imposter**.\n" +
            "Voting closes in **60 seconds**. Missing votes count as abstentions."
        );
}

function votingWarning(secondsLeft) {
    return new EmbedBuilder()
        .setColor(COLOR_AMBER)
        .setDescription(`⏰ **${secondsLeft} seconds** left to vote!`);
}

function discussionPhaseEmbed() {
    return new EmbedBuilder()
        .setColor(COLOR)
        .setTitle("💬 Discussion Phase")
        .setDescription(
            "All clue rounds are complete. Discuss who you think the Imposter is!\n\n" +
            "Use `=skip` or `/skip` to vote to skip straight to voting.\n" +
            "Majority vote will start the vote immediately.\n\n" +
            "Voting will begin automatically in **60 seconds**."
        );
}

function skipVoteUpdate(current, needed) {
    return new EmbedBuilder()
        .setColor(COLOR)
        .setDescription(`⏭️ Skip vote: **${current}/${needed}** needed to skip discussion.`);
}

function lastChanceEmbed(imposterNames) {
    return new EmbedBuilder()
        .setColor(COLOR_AMBER)
        .setTitle("🎲 Imposter Last Chance!")
        .setDescription(
            `The crew caught the Imposter${imposterNames.length > 1 ? "s" : ""}!\n\n` +
            `**${imposterNames.join(", ")}** — you have **30 seconds** to guess the crew's word.\n\n` +
            "Use `=guess <word>` or `/guess <word>`. A correct guess steals the victory!"
        );
}

function clueSent(username, clue) {
    return new EmbedBuilder()
        .setColor(COLOR)
        .setDescription(`💬 **${username}**: ${clue}`);
}

function errorEmbed(message) {
    return new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription(`❌ ${message}`);
}

module.exports = {
    gameStarted,
    roundStart,
    nextTurnEmbed,
    turnWarning,
    turnSkipped,
    duplicateClue,
    voteReceived,
    votingPhaseEmbed,
    votingWarning,
    discussionPhaseEmbed,
    skipVoteUpdate,
    lastChanceEmbed,
    clueSent,
    errorEmbed,
    COLOR,
    COLOR_GREEN,
    COLOR_AMBER
};