const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const GameManager = require("../games/GameManager");
const { COLOR } = require("../utils/embeds");
const { user, channelId, reply } = require("../utils/ctx");

module.exports = {
    name: "leave",
    data: new SlashCommandBuilder()
        .setName("leave")
        .setDescription("Leave the game lobby"),

    async execute(ctx) {
        const uid = user(ctx).id;
        const cid = channelId(ctx);

        const game = GameManager.get(cid);
        if (!game) return reply(ctx, { content: "❌ No active lobby.", ephemeral: true });
        if (game.state !== "LOBBY") return reply(ctx, { content: "❌ You can't leave once the game has started.", ephemeral: true });
        if (!game.players.includes(uid)) return reply(ctx, { content: "❌ You're not in the lobby.", ephemeral: true });

        game.players = game.players.filter(id => id !== uid);

        const embed = new EmbedBuilder()
            .setColor(COLOR)
            .setDescription(`❌ **${user(ctx).username}** left the lobby.`)
            .setFooter({ text: `Players in lobby: ${game.players.length}` });

        await reply(ctx, { embeds: [embed] });
    }
};