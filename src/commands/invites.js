const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const InviteManager = require("../utils/InviteManager");
const { COLOR } = require("../utils/embeds");
const { reply, user, isSlash } = require("../utils/ctx");

const SUPPORT_SERVER_ID = process.env.SUPPORT_SERVER_ID;
const SUPPORT_URL       = "https://discord.gg/EKMaCVuJ9Y";

module.exports = {
    name: "invites",
    data: new SlashCommandBuilder()
        .setName("invites")
        .setDescription("View your invite count in the support server")
        .addUserOption(o =>
            o.setName("user")
             .setDescription("View another user's invites")
             .setRequired(false)
        ),

    async execute(ctx, args = []) {
        const guildId = ctx.guildId ?? ctx.guild?.id;

        // Gate: only usable in support server
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
                .setTitle("📊 Invite Stats")
                .setDescription(
                    "This command is only available in the **Suspect Support Server**.\n\n" +
                    "Join the support server to view invite counts and participate in monthly giveaways!"
                );

            return reply(ctx, { embeds: [embed], components: [row] });
        }

        // Resolve target
        let targetUser;
        if (isSlash(ctx)) {
            targetUser = ctx.options.getUser("user") ?? ctx.user;
        } else {
            targetUser = ctx.mentions?.users?.first() ?? ctx.author;
        }

        const count   = InviteManager.getInviteCount(targetUser.id);
        const eligible = count >= 10;

        const embed = new EmbedBuilder()
            .setColor(eligible ? 0xf1c40f : COLOR)
            .setAuthor({ name: targetUser.username, iconURL: targetUser.displayAvatarURL({ size: 64 }) })
            .setTitle("📨 Invite Count")
            .setDescription(
                `**${targetUser.username}** has invited **${count}** member${count !== 1 ? "s" : ""} to the server.\n\n` +
                (eligible
                    ? "🎉 **Eligible for the monthly Nitro giveaway!**"
                    : `Need **${10 - count}** more invite${10 - count !== 1 ? "s" : ""} to qualify for the giveaway.`)
            )
            .addFields(
                { name: "Invites",    value: String(count),                   inline: true },
                { name: "Giveaway",   value: eligible ? "✅ Eligible" : "❌ Not yet", inline: true },
                { name: "Required",   value: "10 invites",                    inline: true }
            )
            .setFooter({ text: "Use /giveaway to learn more about the monthly giveaway." });

        await reply(ctx, { embeds: [embed] });
    }
};