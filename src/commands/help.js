const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");
const { COLOR } = require("../utils/embeds");
const { reply } = require("../utils/ctx");

const INVITE_URL  = "https://discord.com/oauth2/authorize?client_id=1514691427370799154&permissions=8&integration_type=0&scope=bot+applications.commands";
const SUPPORT_URL = "https://discord.gg/EKMaCVuJ9Y";
const WEBSITE_URL = "https://suspect-bot.vercel.app/";
const TOPGG_URL   = "https://top.gg/bot/1514691427370799154/vote";

function buildHelp() {
    const embed = new EmbedBuilder()
        .setColor(COLOR)
        .setTitle("🎭 Suspect — Help")
        .setDescription(
            "A social deduction game where one player receives a **different word**.\n" +
            "Give clues, read the room, and find the Imposter before it's too late.\n\n" +
            "**Prefix:** `=`  **·**  **Slash:** `/`"
        )
        .addFields(
            {
                name: "🎮 Game Commands",
                value: [
                    "`=enter` / `/enter` — Join the lobby",
                    "`=leave` / `/leave` — Leave the lobby",
                    "`=start normal` / `/start normal` — Start in Normal mode",
                    "`=start hidden` / `/start hidden` — Start in Hidden mode",
                    "`=start decoy` / `/start decoy` — Start in Decoy mode (5+ players, vote required)",
                    "`=skip` / `/skip` — Vote to skip discussion phase",
                    "`=guess <word>` / `/guess <word>` — Imposter last-chance word guess",
                    "`=status` / `/status` — View current game state",
                ].join("\n"),
            },
            {
                name: "👤 Profile & Stats",
                value: [
                    "`=profile` / `/profile` — View your full stats, rank, badges & title",
                    "`=profile @user` / `/profile user:@user` — View another player's profile",
                    "`=leaderboard` / `/leaderboard` — Top 10 players by wins",
                ].join("\n"),
            },
            {
                name: "💎 Shards & Shop",
                value: [
                    "`=vote` / `/vote` — Get the top.gg vote link + see your streak & rewards",
                    "`=balance` / `/balance` — Check your Shard balance",
                    "`=shop` / `/shop` — Browse titles available to buy",
                    "`=buy <title_id>` / `/buy <title_id>` — Buy a title from the shop",
                    "`=buy custom <Your Title>` — Create a unique custom title",
                    "`=titles` / `/titles` — View all titles you own",
                    "`=settitle <title_id>` / `/settitle <title_id>` — Equip a title on your profile",
                    "`=settitle none` — Remove your equipped title",
                ].join("\n"),
            },
            {
                name: "🎁 Community",
                value: [
                    "`=giveaway` / `/giveaway` — Monthly Nitro giveaway details",
                    "`=invites` / `/invites` — Your support server invite count *(support server only)*",
                    "`=invite-leaderboard` / `/invite-leaderboard` — Top inviters *(support server only)*",
                    "`=help` / `/help` — Show this message",
                ].join("\n"),
            },
            {
                name: "🕹️ How to Play",
                value: [
                    "**1.** Everyone uses `=enter` to join the lobby",
                    "**2.** Host runs `=start normal`, `=start hidden`, or `=start decoy`",
                    "**3.** Check your DMs — you'll receive a secret word",
                    "**4.** When it's your turn, **type your clue directly in chat** (no command needed, max 20 chars)",
                    "**5.** After 3 rounds, discuss then vote for who you think the Imposter is",
                    "**6.** If caught, Imposters get one last chance to guess the crew word and steal the win",
                ].join("\n"),
            },
            {
                name: "🟢 Normal",
                value: "Imposter **knows** they're different. Must bluff their way through.",
                inline: true
            },
            {
                name: "🔴 Hidden",
                value: "Imposter **doesn't know** they're different. 8+ players = 2 imposters.",
                inline: true
            },
            {
                name: "🃏 Decoy",
                value: "One real imposter + one fake (gets crew word). Two people panic — only one is guilty. **5+ players. Requires a top.gg vote.**",
                inline: true
            },
            {
                name: "⏱️ Timers",
                value: [
                    "• **60s** per clue turn — auto-skipped on expiry, warned at 10s",
                    "• **60s** discussion phase — use `=skip` to majority-vote skip early",
                    "• **60s** voting phase — abstentions counted on expiry",
                    "• **30s** imposter last-chance guess window",
                ].join("\n"),
            },
            {
                name: "💎 Earning Shards",
                value: [
                    "Shards are earned **only by voting** for Suspect on top.gg.",
                    "• Base reward: **50 Shards** per vote",
                    "• Every 7 consecutive votes increases your multiplier",
                    "• Vote reminder DM sent after 12 hours",
                    "• Milestone badges at 1, 5, 10, 25, 50 and 100 total votes",
                    `• Votes reset every 12 hours — [vote here](${TOPGG_URL})`,
                ].join("\n"),
            }
        )
        .setFooter({ text: "Suspect · Social Deduction for Discord" });

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setLabel("Invite Bot").setStyle(ButtonStyle.Link).setURL(INVITE_URL).setEmoji("➕"),
        new ButtonBuilder().setLabel("Support Server").setStyle(ButtonStyle.Link).setURL(SUPPORT_URL).setEmoji("💬"),
        new ButtonBuilder().setLabel("Vote on top.gg").setStyle(ButtonStyle.Link).setURL(TOPGG_URL).setEmoji("🗳️"),
        new ButtonBuilder().setLabel("Website").setStyle(ButtonStyle.Link).setURL(WEBSITE_URL).setEmoji("🌐")
    );

    return { embeds: [embed], components: [row] };
}

module.exports = {
    name: "help",
    data: new SlashCommandBuilder()
        .setName("help")
        .setDescription("Show Suspect commands and how to play"),

    async execute(ctx) {
        await reply(ctx, buildHelp());
    }
};