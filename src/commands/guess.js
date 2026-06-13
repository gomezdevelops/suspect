const { SlashCommandBuilder } = require("discord.js");
const GameManager  = require("../games/GameManager");
const lastChance   = require("../utils/lastChance");
const { user, channelId, reply, getArg } = require("../utils/ctx");

module.exports = {
    name: "guess",
    data: new SlashCommandBuilder()
        .setName("guess")
        .setDescription("Guess the crew word (Imposters only, during Last Chance)")
        .addStringOption(o =>
            o.setName("word").setDescription("Your guess for the crew word").setRequired(true)
        ),

    async execute(ctx, args = []) {
        const uid   = user(ctx).id;
        const game  = GameManager.get(channelId(ctx));
        const word  = getArg(ctx, "word", 0, args);

        if (!game || game.state !== "LAST_CHANCE") {
            return reply(ctx, { content: "❌ No last-chance phase is active.", ephemeral: true });
        }

        if (!game.imposterIds.includes(uid)) {
            return reply(ctx, { content: "❌ Only the Imposter(s) can use this command.", ephemeral: true });
        }

        if (!word) {
            return reply(ctx, { content: "❌ Provide a word to guess. Example: `=guess ocean`", ephemeral: true });
        }

        // Acknowledge slash command so it doesn't time out
        if (typeof ctx.isChatInputCommand === "function" && ctx.isChatInputCommand()) {
            await ctx.deferReply({ ephemeral: true });
            await ctx.deleteReply().catch(() => {});
        }

        await lastChance.handleGuess(ctx, game, user(ctx), word);
    }
};