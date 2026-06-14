const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");
const { COLOR } = require("../utils/embeds");
const { reply } = require("../utils/ctx");

const SUPPORT_URL = "https://discord.gg/EKMaCVuJ9Y";

module.exports = {
    name: "giveaway",
    data: new SlashCommandBuilder()
        .setName("giveaway")
        .setDescription("View details about the monthly Nitro giveaway"),

    async execute(ctx) {
        const embed = new EmbedBuilder()
            .setColor(0xf1c40f)
            .setTitle("🎉 Monthly Discord Nitro Giveaway")
            .setDescription(
                "Every month, we give away **Discord Nitro** to active members of the Suspect Support Server!\n\n" +
                "Want to enter? Here's everything you need to know. 👇"
            )
            .addFields(
                {
                    name: "🎁 Prize",
                    value: "**Discord Nitro** (1 month)\nGiven away every month to one lucky winner.",
                    inline: false
                },
                {
                    name: "📋 How to Qualify",
                    value: [
                        "**1.** Join the Suspect Support Server",
                        "**2.** Invite at least **10 members** to the server",
                        "**3.** That's it — you're automatically entered!",
                    ].join("\n"),
                    inline: false
                },
                {
                    name: "📨 Check Your Invites",
                    value: "Use `/invites` in the support server to see how many people you've invited.\nOnly available inside the support server.",
                    inline: false
                },
                {
                    name: "🏆 Invite Leaderboard",
                    value: "Use `/invite-leaderboard` in the support server to see the top inviters.\nGet competitive — the more you invite, the more your name gets noticed!",
                    inline: false
                },
                {
                    name: "📅 When?",
                    value: "Giveaways are held at the **end of each month** in the support server.\nWinners are announced in the giveaway channel.",
                    inline: false
                },
                {
                    name: "⚠️ Rules",
                    value: [
                        "• Must have atleast **10 valid invites** to the support server",
                        "• Fake or bot invites do not count",
                        "• Must be in the support server at the time of draw",
                        "• One entry per person — invite count is tracked automatically",
                    ].join("\n"),
                    inline: false
                }
            )
            .setFooter({ text: "Suspect · Monthly Nitro Giveaway" });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel("Join Support Server")
                .setStyle(ButtonStyle.Link)
                .setURL(SUPPORT_URL)
                .setEmoji("💬"),
            new ButtonBuilder()
                .setLabel("Check My Invites")
                .setStyle(ButtonStyle.Link)
                .setURL(SUPPORT_URL)
                .setEmoji("📨")
        );

        await reply(ctx, { embeds: [embed], components: [row] });
    }
};