const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getOwnedTitles, getActiveTitle } = require("../utils/TitleManager");
const { COLOR } = require("../utils/embeds");
const { reply, user } = require("../utils/ctx");

module.exports = {
    name: "titles",
    data: new SlashCommandBuilder()
        .setName("titles")
        .setDescription("View all titles you own"),

    async execute(ctx) {
        const uid    = user(ctx).id;
        const owned  = await getOwnedTitles(uid);
        const active = await getActiveTitle(uid);

        if (!owned.length) {
            return reply(ctx, {
                embeds: [
                    new EmbedBuilder()
                        .setColor(COLOR)
                        .setTitle("🏷️ Your Titles")
                        .setDescription(
                            "You don't own any titles yet.\n\n" +
                            "Visit \`/shop\` to browse available titles.\n" +
                            "Earn Shards by voting at \`/vote\`."
                        )
                ],
                ephemeral: true
            });
        }

        const lines = owned.map(t => {
            const equipped = t.label === active || t.id === active ? " ◀ **equipped**" : "";
            const tag      = t.isCustom ? " *(custom)*" : "";
            return `\`${t.id}\`${tag}${equipped}\n**${t.label}**`;
        });

        const embed = new EmbedBuilder()
            .setColor(COLOR)
            .setTitle("🏷️ Your Titles")
            .setDescription(lines.join("\n\n"))
            .setFooter({ text: "Use /settitle <id> to equip one · /shop to buy more" });

        return reply(ctx, { embeds: [embed], ephemeral: true });
    }
};