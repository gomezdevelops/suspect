const { SlashCommandBuilder } = require("discord.js");
const GameManager  = require("../games/GameManager");
const startVoting  = require("../utils/startVoting");
const { skipVoteUpdate } = require("../utils/embeds");
const { user, channelId, reply } = require("../utils/ctx");

module.exports = {
    name: "skip",
    data: new SlashCommandBuilder()
        .setName("skip")
        .setDescription("Vote to skip discussion and go straight to voting"),

    async execute(ctx) {
        const uid  = user(ctx).id;
        const game = GameManager.get(channelId(ctx));

        if (!game || game.state !== "DISCUSSION") {
            return reply(ctx, { content: "❌ Skip is only available during the discussion phase.", ephemeral: true });
        }

        if (!game.players.includes(uid)) {
            return reply(ctx, { content: "❌ You're not in this game.", ephemeral: true });
        }

        if (game.skipVotes.has(uid)) {
            return reply(ctx, { content: "❌ You already voted to skip.", ephemeral: true });
        }

        game.skipVotes.add(uid);

        const needed  = Math.floor(game.players.length / 2) + 1;  // strict majority
        const current = game.skipVotes.size;

        await reply(ctx, { embeds: [skipVoteUpdate(current, needed)] });

        if (current >= needed) {
            await startVoting(ctx, game);
        }
    }
};