const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");
const { PRESET_TITLES, CUSTOM_TITLE_COST } = require("../utils/TitleManager");
const ShardManager = require("../utils/ShardManager");
const { COLOR } = require("../utils/embeds");
const { reply, user } = require("../utils/ctx");

const PAGE_SIZE = 5;

module.exports = {
    name: "shop",
    data: new SlashCommandBuilder()
        .setName("shop")
        .setDescription("Browse the Shard shop — titles and cosmetics"),

    async execute(ctx, args = []) {
        const uid     = user(ctx).id;
        const balance = await ShardManager.getBalance(uid);

        await sendShopPage(ctx, uid, balance, 0);
    }
};

async function sendShopPage(ctx, uid, balance, page) {
    const totalPages = Math.ceil(PRESET_TITLES.length / PAGE_SIZE);
    const slice      = PRESET_TITLES.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

    const lines = slice.map(t => {
        const affordable = balance >= t.cost ? "✅" : "❌";
        return `${affordable} **${t.label}** — \`${t.cost} Shards\`\n*${t.desc}*\nBuy: \`=buy ${t.id}\` or \`/buy title:${t.id}\``;
    });

    const embed = new EmbedBuilder()
        .setColor(COLOR)
        .setTitle("🏪 Suspect Shop")
        .setDescription(
            `Your balance: **${balance} Shards** 💎\n\n` +
            "Earn Shards by voting for the bot on top.gg — use `/vote` for the link.\n\n" +
            lines.join("\n\n")
        )
        .addFields({
            name: "✨ Custom Title",
            value: `Create your own unique title for \`${CUSTOM_TITLE_COST} Shards\`.\nUse \`=buy custom <Your Title>\` or \`/buy custom:<Your Title>\``
        })
        .setFooter({ text: `Page ${page + 1} of ${totalPages} · ✅ = affordable · ❌ = need more Shards` });

    const row = new ActionRowBuilder();
    if (page > 0) {
        row.addComponents(
            new ButtonBuilder()
                .setCustomId(`shop_page_${page - 1}`)
                .setLabel("← Previous")
                .setStyle(ButtonStyle.Secondary)
        );
    }
    if (page < totalPages - 1) {
        row.addComponents(
            new ButtonBuilder()
                .setCustomId(`shop_page_${page + 1}`)
                .setLabel("Next →")
                .setStyle(ButtonStyle.Primary)
        );
    }

    const payload = {
        embeds: [embed],
        components: row.components.length ? [row] : []
    };

    await reply(ctx, payload);
}

module.exports.sendShopPage = sendShopPage;