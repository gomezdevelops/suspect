const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const GameManager = require("../games/GameManager");
const { COLOR } = require("../utils/embeds");
const { channelId, reply, client } = require("../utils/ctx");

module.exports = {
    name: "status",
    data: new SlashCommandBuilder()
        .setName("status")
        .setDescription("View current game status"),

    async execute(ctx) {
        const game = GameManager.get(channelId(ctx));

        if (!game) return reply(ctx, { content: "❌ No active game.", ephemeral: true });

        let currentTurn = "None";
        if (game.state === "ROUND") {
            const pid = game.order[game.currentTurn];
            if (pid) {
                const u = await client(ctx).users.fetch(pid);
                currentTurn = u.username;
            }
        }

        const embed = new EmbedBuilder()
            .setColor(COLOR)
            .setTitle("🎮 Game Status")
            .addFields(
                { name: "State",        value: game.state,                  inline: true },
                { name: "Round",        value: `${game.round}/3`,           inline: true },
                { name: "Players",      value: String(game.players.length), inline: true },
                { name: "Current Turn", value: currentTurn,                 inline: true },
                { name: "Imposters",    value: String(game.imposterIds?.length ?? 1), inline: true },
                { name: "Mode",         value: game.mode ?? "—",            inline: true }
            );

        await reply(ctx, { embeds: [embed], ephemeral: true });
    }
};