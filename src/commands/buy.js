const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { PRESET_TITLES, CUSTOM_TITLE_COST, grantTitle, grantCustomTitle, getOwnedTitles } = require("../utils/TitleManager");
const ShardManager = require("../utils/ShardManager");
const { COLOR } = require("../utils/embeds");
const { reply, user, getArg, isSlash } = require("../utils/ctx");

const MAX_CUSTOM_LENGTH = 30;

module.exports = {
    name: "buy",
    data: new SlashCommandBuilder()
        .setName("buy")
        .setDescription("Buy a title from the shop")
        .addStringOption(o =>
            o.setName("item")
             .setDescription("Title ID from /shop, or 'custom Your Title Here'")
             .setRequired(true)
        ),

    async execute(ctx, args = []) {
        const uid  = user(ctx).id;
        const raw  = getArg(ctx, "item", 0, args) ?? "";
        // Join all args so prefix users can do =buy custom My Cool Title
        const fullInput = isSlash(ctx) ? raw : [raw, ...args.slice(1)].join(" ");

        if (!fullInput) {
            return reply(ctx, { content: "❌ Provide a title ID or `custom <title>`. Use `/shop` to browse.", ephemeral: true });
        }

        // ── Custom title ───────────────────────────────────────────────────────
        if (fullInput.toLowerCase().startsWith("custom")) {
            const label = fullInput.slice(6).trim();

            if (!label) {
                return reply(ctx, {
                    content: `❌ Provide a name for your custom title. Example: \`=buy custom The Night Owl\``,
                    ephemeral: true
                });
            }

            if (label.length > MAX_CUSTOM_LENGTH) {
                return reply(ctx, {
                    content: `❌ Custom title must be ${MAX_CUSTOM_LENGTH} characters or fewer.`,
                    ephemeral: true
                });
            }

            const balance = ShardManager.getBalance(uid);
            if (balance < CUSTOM_TITLE_COST) {
                return reply(ctx, {
                    content: `❌ Not enough Shards. Custom titles cost **${CUSTOM_TITLE_COST} Shards** — you have **${balance}**.`,
                    ephemeral: true
                });
            }

            ShardManager.spendShards(uid, CUSTOM_TITLE_COST);
            grantCustomTitle(uid, label);

            const newBal = ShardManager.getBalance(uid);
            const embed = new EmbedBuilder()
                .setColor(COLOR)
                .setTitle("✨ Custom Title Created!")
                .setDescription(
                    `Your title **"${label}"** has been created and added to your collection.\n\n` +
                    `Use \`=settitle custom\` or browse your titles with \`=titles\` to equip it.\n\n` +
                    `Remaining balance: **${newBal} Shards** 💎`
                );

            return reply(ctx, { embeds: [embed] });
        }

        // ── Preset title ───────────────────────────────────────────────────────
        const titleId = fullInput.trim().toLowerCase();
        const title   = PRESET_TITLES.find(t => t.id === titleId);

        if (!title) {
            return reply(ctx, {
                content: `❌ Unknown title \`${titleId}\`. Use \`/shop\` or \`=shop\` to see available titles.`,
                ephemeral: true
            });
        }

        // Already owned?
        const owned = getOwnedTitles(uid);
        if (owned.some(t => t.id === titleId)) {
            return reply(ctx, {
                content: `❌ You already own **${title.label}**. Use \`/settitle\` to equip it.`,
                ephemeral: true
            });
        }

        const balance = ShardManager.getBalance(uid);
        if (balance < title.cost) {
            return reply(ctx, {
                content: `❌ Not enough Shards. **${title.label}** costs **${title.cost} Shards** — you have **${balance}**.`,
                ephemeral: true
            });
        }

        ShardManager.spendShards(uid, title.cost);
        grantTitle(uid, titleId);

        const newBal = ShardManager.getBalance(uid);
        const embed = new EmbedBuilder()
            .setColor(COLOR)
            .setTitle("🎉 Title Purchased!")
            .setDescription(
                `You now own **${title.label}**.\n*${title.desc}*\n\n` +
                `Use \`/settitle\` or \`=settitle ${titleId}\` to equip it on your profile.\n\n` +
                `Remaining balance: **${newBal} Shards** 💎`
            );

        return reply(ctx, { embeds: [embed] });
    }
};