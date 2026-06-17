const fs   = require("fs");
const path = require("path");

const INVITES_FILE = path.join(__dirname, "../data/invites.json");

const inviteCache = new Map();

function loadData() {
    if (!fs.existsSync(INVITES_FILE)) return {};
    try { return JSON.parse(fs.readFileSync(INVITES_FILE, "utf8")); }
    catch { return {}; }
}

function saveData(data) {
    fs.writeFileSync(INVITES_FILE, JSON.stringify(data, null, 2));
}

function getInviteCount(userId) {
    const data = loadData();
    return data[userId] ?? 0;
}

function getAllInvites() {
    return loadData();
}

/** Credit one invite to a user */
function addInvite(inviterId) {
    const data = loadData();
    data[inviterId] = (data[inviterId] ?? 0) + 1;
    saveData(data);
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
        addInvite(usedInviterId);
    }
}

module.exports = { getInviteCount, getAllInvites, cacheGuildInvites, handleMemberJoin };