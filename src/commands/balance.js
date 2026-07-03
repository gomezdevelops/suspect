const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const ShardManager  = require("../utils/ShardManager");
const VoteTracker   = require("../utils/VoteTracker");
const { COLOR } = require("../utils/embeds");
const { reply, user } = require("../utils/ctx");

module.exports = {
    name: "balance",
    data: new SlashCommandBuilder()
        .setName("balance")
        .setDescription("Check your Shard balance"),

    async execute(ctx) {
        const uid      = user(ctx).id;
        const balance  = await ShardManager.getBalance(uid);
        const voteData = await VoteTracker.getFullData(uid);
        const canVote  = !(await VoteTracker.hasVotedRecently(uid));

        const embed = new EmbedBuilder()
            .setColor(COLOR)
            .setTitle("💎 Shard Balance")
            .addFields(
                { name: "Balance",      value: `**${balance} Shards**`,               inline: true },
                { name: "Vote Streak",  value: `**${voteData.streak}** days`,          inline: true },
                { name: "Total Votes",  value: `**${voteData.totalVotes}**`,           inline: true }
            )
            .setDescription(
                canVote
                    ? `You can vote now to earn **${VoteTracker.BASE_SHARDS * (Math.floor(voteData.streak / 7) + 1)} Shards**!\n[Vote here](${VoteTracker.TOPGG_URL})`
                    : "You've already voted recently. Come back in ~12 hours!"
            )
            .setFooter({ text: "Vote on top.gg every 12 hours to earn Shards · /shop to spend them" });

        return reply(ctx, { embeds: [embed], ephemeral: true });
    }
};