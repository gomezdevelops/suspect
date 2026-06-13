const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const GameManager = require("../games/GameManager");
const { COLOR } = require("../utils/embeds");
const { user, channelId, reply } = require("../utils/ctx");

module.exports = {
    name: "enter",
    data: new SlashCommandBuilder()
        .setName("enter")
        .setDescription("Join the game lobby"),

    async execute(ctx) {
        const uid = user(ctx).id;
        const cid = channelId(ctx);

        let game = GameManager.get(cid);
        if (!game) game = GameManager.create(cid);

        if (game.state !== "LOBBY") {
            return reply(ctx, { content: "❌ A game is already running. Wait for it to finish.", ephemeral: true });
        }

        if (game.players.includes(uid)) {
            return reply(ctx, { content: "❌ You already joined.", ephemeral: true });
        }

        game.players.push(uid);

        const embed = new EmbedBuilder()
            .setColor(COLOR)
            .setDescription(`✅ **${user(ctx).username}** joined the lobby.`)
            .setFooter({ text: `Players in lobby: ${game.players.length}` });

        await reply(ctx, { embeds: [embed] });
    }
};