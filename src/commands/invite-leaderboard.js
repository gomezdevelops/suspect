const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const InviteManager = require("../utils/InviteManager");
const { COLOR } = require("../utils/embeds");
const { reply, client } = require("../utils/ctx");

const SUPPORT_SERVER_ID = process.env.SUPPORT_SERVER_ID;
const SUPPORT_URL       = "https://discord.gg/EKMaCVuJ9Y";

const MEDALS = ["🥇", "🥈", "🥉"];

module.exports = {
    name: "invite-leaderboard",
    data: new SlashCommandBuilder()
        .setName("invite-leaderboard")
        .setDescription("Top 10 inviters in the support server"),

    async execute(ctx, args = []) {
        const guildId = ctx.guildId ?? ctx.guild?.id;

        // Gate: support server only
        if (guildId !== SUPPORT_SERVER_ID) {
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setLabel("Join Support Server")
                    .setStyle(ButtonStyle.Link)
                    .setURL(SUPPORT_URL)
                    .setEmoji("💬")
            );

            const embed = new EmbedBuilder()
                .setColor(COLOR)
                .setTitle("🏆 Invite Leaderboard")
                .setDescription(
                    "This command is only available in the **Suspect Support Server**.\n\n" +
                    "Join to see who's invited the most members and compete for the monthly Nitro giveaway!"
                );

            return reply(ctx, { embeds: [embed], components: [row] });
        }

        const all = InviteManager.getAllInvites();

        if (Object.keys(all).length === 0) {
            return reply(ctx, { content: "❌ No invite data yet.", ephemeral: true });
        }

        const sorted = Object.entries(all)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10);

        const lines = [];
        for (let i = 0; i < sorted.length; i++) {
            const [userId, count] = sorted[i];
            const rank = MEDALS[i] ?? `**${i + 1}.**`;
            const eligible = count >= 10 ? " ✅" : "";

            let username;
            try {
                const u = await client(ctx).users.fetch(userId);
                username = u.username;
            } catch {
                username = `Unknown`;
            }

            lines.push(`${rank} **${username}**${eligible} — ${count} invite${count !== 1 ? "s" : ""}`);
        }

        const embed = new EmbedBuilder()
            .setColor(COLOR)
            .setTitle("🏆 Invite Leaderboard")
            .setDescription(lines.join("\n"))
            .addFields({
                name: "✅ = Giveaway Eligible",
                value: "Users with **10+ invites** can enter the monthly Nitro giveaway.\nUse `/invites` to check your count."
            })
            .setFooter({ text: "Top 10 inviters · Updated in real-time" });

        await reply(ctx, { embeds: [embed] });
    }
};