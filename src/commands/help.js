const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const { COLOR } = require("../utils/embeds");

const INVITE_URL  = "https://discord.com/oauth2/authorize?client_id=1514691427370799154&permissions=2147871808&integration_type=0&scope=bot+applications.commands";
const SUPPORT_URL = "https://discord.gg/ZGGxXAch4s";
const WEBSITE_URL = "https://suspect-bot.vercel.app/";

// ─── Shared embed + buttons builder ─────────────────────────────────────────

function buildHelp() {

    const embed = new EmbedBuilder()
        .setColor(COLOR)
        .setTitle("🎭 Suspect — Help")
        .setDescription(
            "A social deduction game where one player receives a **different word**.\n" +
            "Give clues, read the room, and find the Imposter before it's too late.\n\n" +
            `**Prefix:** \`=\`  **·**  **Slash:** \`/help\``
        )
        .addFields(
            {
                name: "📋 Commands",
                value: [
                    "`=enter` — Join the lobby",
                    "`=leave` — Leave the lobby",
                    "`=start normal` — Start in Normal mode",
                    "`=start hidden` — Start in Hidden mode",
                    "`=status` — View current game status",
                    "`=help` — Show this message",
                ].join("\n"),
                inline: false
            },
            {
                name: "🕹️ How to Play",
                value: [
                    "**1.** Use `=enter` to join the lobby",
                    "**2.** Host runs `=start normal` or `=start hidden`",
                    "**3.** Check your DMs — you'll receive a secret word",
                    "**4.** When it's your turn, **type your one-word clue in chat**",
                    "**5.** After all rounds, vote for who you think the Imposter is",
                    "**6.** Most votes wins — catch the Imposter or let them slip away",
                ].join("\n"),
                inline: false
            },
            {
                name: "🟢 Normal Mode",
                value: "The Imposter **knows** they have a different word. They must bluff.",
                inline: true
            },
            {
                name: "🔴 Hidden Mode",
                value: "The Imposter **doesn't know** they're different. Pure paranoia.",
                inline: true
            },
            {
                name: "\u200b",
                value: "\u200b",
                inline: true
            },
            {
                name: "💡 Tips",
                value: [
                    "• Clues must be a **single word** — no phrases",
                    "• Be vague enough to hide your word, specific enough to prove you know it",
                    "• In Hidden mode, even the Imposter thinks they're innocent",
                ].join("\n"),
                inline: false
            }
        )
        .setFooter({ text: "Suspect · Social Deduction for Discord" });

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setLabel("Invite Bot")
            .setStyle(ButtonStyle.Link)
            .setURL(INVITE_URL)
            .setEmoji("➕"),
        new ButtonBuilder()
            .setLabel("Support Server")
            .setStyle(ButtonStyle.Link)
            .setURL(SUPPORT_URL)
            .setEmoji("💬"),
        new ButtonBuilder()
            .setLabel("Website")
            .setStyle(ButtonStyle.Link)
            .setURL(WEBSITE_URL)
            .setEmoji("🌐")
    );

    return { embeds: [embed], components: [row] };
}

// ─── Command export ───────────────────────────────────────────────────────────

module.exports = {

    // Prefix command identity
    name: "help",
    description: "Show the help menu",

    // Slash command definition (registered by client.js on ready)
    data: new SlashCommandBuilder()
        .setName("help")
        .setDescription("Show Suspect commands and how to play"),

    // Works for both Message (prefix) and ChatInputCommandInteraction (slash)
    async execute(ctx) {
        const payload = buildHelp();

        // Slash command interaction
        if (typeof ctx.isChatInputCommand === "function" && ctx.isChatInputCommand()) {
            return ctx.reply({ ...payload, ephemeral: false });
        }

        // Prefix message — send to channel
        return ctx.channel.send(payload);
    }
};  