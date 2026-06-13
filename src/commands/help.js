const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");
const { COLOR } = require("../utils/embeds");
const { reply } = require("../utils/ctx");

const INVITE_URL  = "https://discord.com/oauth2/authorize?client_id=1514691427370799154&permissions=2147871808&integration_type=0&scope=bot+applications.commands";
const SUPPORT_URL = "https://discord.gg/ZGGxXAch4s";
const WEBSITE_URL = "https://suspect-bot.vercel.app/";

function buildHelp() {
    const embed = new EmbedBuilder()
        .setColor(COLOR)
        .setTitle("🎭 Suspect — Help")
        .setDescription(
            "A social deduction game where one player receives a **different word**.\n" +
            "Give clues, read the room, and find the Imposter before it's too late.\n\n" +
            "**Prefix:** `=`  **·**  **Slash:** `/help`"
        )
        .addFields(
            {
                name: "📋 Commands",
                value: [
                    "`=enter` / `/enter` — Join the lobby",
                    "`=leave` / `/leave` — Leave the lobby",
                    "`=start normal` / `/start normal` — Start in Normal mode",
                    "`=start hidden` / `/start hidden` — Start in Hidden mode",
                    "`=skip` / `/skip` — Vote to skip discussion",
                    "`=guess <word>` / `/guess <word>` — Imposter last-chance guess",
                    "`=status` / `/status` — View current game status",
                    "`=leaderboard` / `/leaderboard` — Top 10 players",
                    "`=help` / `/help` — Show this message",
                ].join("\n"),
            },
            {
                name: "🕹️ How to Play",
                value: [
                    "**1.** Everyone uses `=enter` to join the lobby",
                    "**2.** Host runs `=start normal` or `=start hidden`",
                    "**3.** Check your DMs — you'll receive a secret word",
                    "**4.** When it's your turn, **type your clue directly in chat** (no command needed)",
                    "**5.** After all 3 rounds, discuss then vote for the Imposter",
                    "**6.** If caught, Imposters get one last chance to guess the crew word",
                ].join("\n"),
            },
            {
                name: "🟢 Normal Mode",
                value: "The Imposter **knows** they have a different word. They must bluff.",
                inline: true
            },
            {
                name: "🔴 Hidden Mode",
                value: "The Imposter **doesn't know** they're different. 8+ players = 2 Imposters.",
                inline: true
            },
            {
                name: "\u200b", value: "\u200b", inline: true
            },
            {
                name: "⏱️ Timers",
                value: [
                    "• **30s** per clue turn (auto-skip on expiry)",
                    "• **60s** discussion phase (vote to skip with `=skip`)",
                    "• **60s** voting phase (abstentions counted on expiry)",
                    "• **30s** Imposter last-chance guess window",
                ].join("\n"),
            }
        )
        .setFooter({ text: "Suspect · Social Deduction for Discord" });

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setLabel("Invite Bot").setStyle(ButtonStyle.Link).setURL(INVITE_URL).setEmoji("➕"),
        new ButtonBuilder().setLabel("Support Server").setStyle(ButtonStyle.Link).setURL(SUPPORT_URL).setEmoji("💬"),
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