const GameManager  = require("../games/GameManager");
const StatsManager = require("./StatsManager");
const { EmbedBuilder } = require("discord.js");
const { COLOR, COLOR_GREEN } = require("./embeds");
const { finalizeGame } = require("./showResults");

const LAST_CHANCE_SECONDS = 30;

function startTimer(ctx, game) {
    if (game.lastChanceTimer) clearTimeout(game.lastChanceTimer);

    game.lastChanceTimer = setTimeout(async () => {
        if (game.state !== "LAST_CHANCE") return;

        await ctx.channel.send({
            embeds: [
                new EmbedBuilder()
                    .setColor(COLOR)
                    .setDescription("⏰ Time's up! The Imposters failed to guess the crew word.\n\n✅ **Crew Wins!**")
            ]
        }).catch(() => {});

        await endLastChance(ctx, game, false);
    }, LAST_CHANCE_SECONDS * 1000);
}

async function handleGuess(ctx, game, guesser, guessedWord) {
    if (game.state !== "LAST_CHANCE") return;

    // Only imposters can guess
    const guesserUser = ctx.author ?? ctx.user;
    const guesserId   = guesserUser?.id ?? guesser?.id;

    if (!game.imposterIds.includes(guesserId)) {
        const msg = await ctx.channel.send("❌ Only the Imposter(s) can guess the crew word.");
        setTimeout(() => msg.delete().catch(() => {}), 5000);
        return;
    }

    const correct = guessedWord.trim().toLowerCase() === game.commonWord.toLowerCase();

    if (correct) {
        if (game.lastChanceTimer) { clearTimeout(game.lastChanceTimer); game.lastChanceTimer = null; }

        await ctx.channel.send({
            embeds: [
                new EmbedBuilder()
                    .setColor(COLOR)
                    .setTitle("🎉 Imposters Steal the Win!")
                    .setDescription(
                        `**${guesserUser.username}** correctly guessed the crew word: **${game.commonWord}**!\n\n` +
                        `🎭 **Imposters Win!**`
                    )
            ]
        });

        await endLastChance(ctx, game, true);
    } else {
        await ctx.channel.send({
            embeds: [
                new EmbedBuilder()
                    .setColor(0xff0000)
                    .setDescription(`❌ **"${guessedWord}"** is wrong. Keep trying — you still have time!`)
            ]
        });
    }
}

async function endLastChance(ctx, game, imposterWon) {
    game.state = "DONE";

    // Stats — crew already got correctVotes etc in showResults
    // Now update win/loss for the game outcome reversal
    for (const playerId of game.players) {
        const isImposter = game.imposterIds.includes(playerId);
        const delta = { gamesPlayed: 1 };

        if (imposterWon) {
            // Imposter guessed right → imposters win
            if (isImposter) { delta.gamesWon = 1; delta.imposterWins = 1; }
        } else {
            // Imposter failed → crew wins
            if (!isImposter) { delta.gamesWon = 1; delta.crewWins = 1; }
        }

        StatsManager.update(playerId, delta);
    }

    GameManager.delete(game.channelId);
}

module.exports = { startTimer, handleGuess };