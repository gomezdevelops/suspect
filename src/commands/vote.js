const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const VoteTracker  = require("../utils/VoteTracker");
const ShardManager = require("../utils/ShardManager");
const { COLOR } = require("../utils/embeds");
const { reply, user } = require("../utils/ctx");

module.exports = {
    name: "vote",
    data: new SlashCommandBuilder()
        .setName("vote")
        .setDescription("Vote for Suspect on top.gg and earn Shards"),

    async execute(ctx) {
        const uid      = user(ctx).id;
        const voteData = await VoteTracker.getFullData(uid);
        const balance  = await ShardManager.getBalance(uid);
        const canVote  = !(await VoteTracker.hasVotedRecently(uid));
        const nextMile = VoteTracker.getNextMilestone(voteData.totalVotes);

        const multiplier   = Math.floor(voteData.streak / 7) + 1;
        const shardsOnVote = VoteTracker.BASE_SHARDS * multiplier;

        // Build streak bar
        const streakBar = voteData.streak >= 7
            ? "▰".repeat(7) + ` ×${multiplier} multiplier!`
            : "▰".repeat(voteData.streak % 7) + "▱".repeat(7 - (voteData.streak % 7)) + ` (${7 - (voteData.streak % 7)} more for ×${multiplier + 1})`;

        const embed = new EmbedBuilder()
            .setColor(canVote ? COLOR : 0x444444)
            .setTitle("🗳️ Vote for Suspect")
            .setDescription(
                canVote
                    ? `**You can vote right now!**\nVoting earns you **${shardsOnVote} Shards** 💎`
                    : "You've already voted recently. Votes reset every **12 hours**."
            )
            .addFields(
                { name: "Your Balance",   value: `**${balance} Shards**`,          inline: true },
                { name: "Vote Streak",    value: `**${voteData.streak}** days`,     inline: true },
                { name: "Total Votes",    value: `**${voteData.totalVotes}**`,      inline: true },
                { name: "Streak Progress",value: streakBar,                          inline: false },
            );

        if (nextMile) {
            embed.addFields({
                name: `Next Milestone — ${nextMile.votes} votes`,
                value: `**${nextMile.remaining}** more vote${nextMile.remaining !== 1 ? "s" : ""} to unlock the next badge.`
            });
        }

        if (voteData.earnedBadges.length) {
            embed.addFields({
                name: "🏅 Badges Earned",
                value: voteData.earnedBadges.join("  ")
            });
        }

        embed.setFooter({ text: "Every 7-vote streak increases your Shard multiplier · /shop to spend Shards" });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel(canVote ? "Vote Now" : "Already Voted")
                .setStyle(canVote ? ButtonStyle.Success : ButtonStyle.Secondary)
                .setURL(VoteTracker.TOPGG_URL)
                .setEmoji("🗳️")
                .setDisabled(!canVote)
        );

        // Note: URL buttons cannot be disabled in Discord API — replace disabled with secondary style
        const finalRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel(canVote ? "Vote Now on top.gg" : "Come Back in ~12h")
                .setStyle(ButtonStyle.Link)
                .setURL(VoteTracker.TOPGG_URL)
                .setEmoji("🗳️")
        );

        return reply(ctx, { embeds: [embed], components: [finalRow] });
    }
};