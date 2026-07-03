const { collection } = require("../db/connect");

// Collection: invites — docs shaped { _id: userId, count: Number }
const col = () => collection("invites");

// Runtime-only snapshot of guild invite uses (not persisted)
const inviteCache = new Map();

async function getInviteCount(userId) {
    const doc = await col().findOne({ _id: userId });
    return doc?.count ?? 0;
}

/** Returns every inviter's count as a { userId: count } map. */
async function getAllInvites() {
    const docs = await col().find({}).toArray();
    const map  = {};
    for (const doc of docs) map[doc._id] = doc.count ?? 0;
    return map;
}

/** Credit one invite to a user */
async function addInvite(inviterId) {
    await col().updateOne(
        { _id: inviterId },
        { $inc: { count: 1 } },
        { upsert: true }
    );
}

/** Cache current guild invites snapshot */
async function cacheGuildInvites(guild) {
    try {
        const invites = await guild.invites.fetch();
        const snapshot = {};
        invites.forEach(inv => {
            snapshot[inv.code] = { uses: inv.uses, inviterId: inv.inviter?.id ?? null };
        });
        inviteCache.set(guild.id, snapshot);
    } catch {}
}

/** Called on guildMemberAdd — compare snapshots to find used invite */
async function handleMemberJoin(member) {
    const guild    = member.guild;
    const oldCache = inviteCache.get(guild.id) ?? {};

    // Fetch fresh invites
    let newInvites;
    try {
        newInvites = await guild.invites.fetch();
    } catch { return; }

    // Find the invite whose use count increased
    let usedInviterId = null;
    newInvites.forEach(inv => {
        const cached = oldCache[inv.code];
        if (cached && inv.uses > cached.uses) {
            usedInviterId = inv.inviter?.id ?? null;
        }
    });

    // Update cache
    const newSnapshot = {};
    newInvites.forEach(inv => {
        newSnapshot[inv.code] = { uses: inv.uses, inviterId: inv.inviter?.id ?? null };
    });
    inviteCache.set(guild.id, newSnapshot);

    // Credit inviter
    if (usedInviterId) {
        await addInvite(usedInviterId);
    }
}

module.exports = { getInviteCount, getAllInvites, cacheGuildInvites, handleMemberJoin };
