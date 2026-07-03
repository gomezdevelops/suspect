const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getOwnedTitles, setActiveTitle, clearTitle, getActiveTitle } = require("../utils/TitleManager");
const { COLOR } = require("../utils/embeds");
const { reply, user, getArg, isSlash } = require("../utils/ctx");

module.exports = {
    name: "settitle",
    data: new SlashCommandBuilder()
        .setName("settitle")
        .setDescription("Equip a title on your profile")
        .addStringOption(o =>
            o.setName("title")
             .setDescription("Title ID to equip, or 'none' to remove your title")
             .setRequired(true)
        ),

    async execute(ctx, args = []) {
        const uid   = user(ctx).id;
        const input = (getArg(ctx, "title", 0, args) ?? "").trim().toLowerCase();

        if (!input) {
            return reply(ctx, { content: "❌ Provide a title ID. Use `/titles` to see yours.", ephemeral: true });
        }

        // Remove title
        if (input === "none" || input === "clear" || input === "remove") {
            await clearTitle(uid);
            return reply(ctx, {
                embeds: [
                    new EmbedBuilder()
                        .setColor(COLOR)
                        .setDescription("✅ Title removed from your profile.")
                ]
            });
        }

        const owned = await getOwnedTitles(uid);

        // Match by id or partial label
        const match = owned.find(t =>
            t.id === input ||
            t.label.toLowerCase() === input ||
            t.id.includes(input)
        );

        if (!match) {
            const ownedList = owned.length
                ? owned.map(t => `\`${t.id}\` — ${t.label}`).join("\n")
                : "You don't own any titles yet. Visit \`/shop\` to buy one.";

            return reply(ctx, {
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xff0000)
                        .setTitle("❌ Title Not Found")
                        .setDescription(`You don't own a title with that ID.\n\n**Your titles:**\n${ownedList}`)
                ],
                ephemeral: true
            });
        }

        await setActiveTitle(uid, match.id);

        return reply(ctx, {
            embeds: [
                new EmbedBuilder()
                    .setColor(COLOR)
                    .setTitle("✅ Title Equipped!")
                    .setDescription(
                        `Your profile now shows: **${user(ctx).username}** *"${match.label}"*\n\n` +
                        "Use `/profile` to see how it looks."
                    )
            ]
        });
    }
};