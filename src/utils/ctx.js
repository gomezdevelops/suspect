
async function reply(ctx, payload) {
    if (typeof payload === "string") payload = { content: payload };
    if (isSlash(ctx)) {
        if (ctx.deferred) return ctx.editReply(payload);
        return ctx.reply({ ...payload, ephemeral: payload.ephemeral ?? false });
    }
    return ctx.channel.send(payload);
}

async function replyEphemeral(ctx, content) {
    if (isSlash(ctx)) {
        if (ctx.deferred) return ctx.editReply({ content });
        return ctx.reply({ content, ephemeral: true });
    }
    const msg = await ctx.channel.send(content);
    setTimeout(() => msg.delete().catch(() => {}), 6000);
}

function getArg(ctx, name, position, args = []) {
    if (isSlash(ctx)) return ctx.options.getString(name) ?? null;
    return args[position] ?? null;
}

function isSlash(ctx) {
    return typeof ctx.isChatInputCommand === "function" && ctx.isChatInputCommand();
}

function channel(ctx)   { return ctx.channel; }
function user(ctx)      { return isSlash(ctx) ? ctx.user : ctx.author; }
function client(ctx)    { return ctx.client; }
function channelId(ctx) { return ctx.channelId; }

module.exports = { reply, replyEphemeral, getArg, isSlash, channel, user, client, channelId };