const { collection } = require("../db/connect");

// Collection: titles — docs shaped { _id: userId, activeTitle, ownedTitles, customTitles }
const col = () => collection("titles");

// ── Preset shop titles ─────────────────────────────────────────────────────────
// Each has: id, label (displayed in profile), cost (Shards), description
const PRESET_TITLES = [
    // Deception themed
    { id: "the_phantom",       label: "The Phantom",        cost: 300,  desc: "You move in shadows." },
    { id: "the_mastermind",    label: "The Mastermind",     cost: 500,  desc: "Always three steps ahead." },
    { id: "the_deceiver",      label: "The Deceiver",       cost: 250,  desc: "Truth is a costume." },
    { id: "the_ghost",         label: "The Ghost",          cost: 200,  desc: "Nobody sees you coming." },
    { id: "the_architect",     label: "The Architect",      cost: 400,  desc: "You built the trap." },
    // Crew themed
    { id: "the_detective",     label: "The Detective",      cost: 300,  desc: "Nothing slips past you." },
    { id: "the_analyst",       label: "The Analyst",        cost: 200,  desc: "Every clue is data." },
    { id: "the_watcher",       label: "The Watcher",        cost: 150,  desc: "Silent and observant." },
    { id: "the_interrogator",  label: "The Interrogator",   cost: 350,  desc: "Everyone breaks eventually." },
    { id: "the_sentinel",      label: "The Sentinel",       cost: 250,  desc: "The crew is safe with you." },
    // Chaotic / fun
    { id: "the_wildcard",      label: "The Wildcard",       cost: 200,  desc: "Nobody knows what you'll do." },
    { id: "the_chaos_agent",   label: "The Chaos Agent",    cost: 300,  desc: "Let it burn." },
    { id: "the_gambler",       label: "The Gambler",        cost: 150,  desc: "Win or lose in style." },
    { id: "the_innocent",      label: "The Innocent",       cost: 100,  desc: "Who, me?" },
    { id: "the_scapegoat",     label: "The Scapegoat",      cost: 100,  desc: "Voted out first. Every time." },
    // Prestigious
    { id: "the_legend",        label: "The Legend",         cost: 1000, desc: "A name spoken with respect." },
    { id: "the_sovereign",     label: "The Sovereign",      cost: 800,  desc: "All bow." },
    { id: "the_untouchable",   label: "The Untouchable",    cost: 600,  desc: "Never caught. Never suspected." },
    { id: "the_oracle",        label: "The Oracle",         cost: 700,  desc: "You knew before it began." },
    { id: "the_phantom_king",  label: "The Phantom King",   cost: 1500, desc: "The rarest of them all." },
];

const CUSTOM_TITLE_COST = 2000; // Shards to create a custom title

function getDefault() {
    return {
        activeTitle:   null,   // id of equipped title, or null
        ownedTitles:   [],     // array of owned title ids
        customTitles:  []      // array of { id, label } for custom titles
    };
}

async function get(userId) {
    const doc = await col().findOne({ _id: userId });
    return { ...getDefault(), ...(doc || {}) };
}

/** Returns the display string for profile, e.g. "The Mastermind" or null */
async function getActiveTitle(userId) {
    const data = await get(userId);
    if (!data.activeTitle) return null;

    // Check preset titles
    const preset = PRESET_TITLES.find(t => t.id === data.activeTitle);
    if (preset) return preset.label;

    // Check custom titles
    const custom = data.customTitles.find(t => t.id === data.activeTitle);
    if (custom) return custom.label;

    return null;
}

/** Returns all titles a user owns (preset + custom), with metadata */
async function getOwnedTitles(userId) {
    const data = await get(userId);
    const presets  = PRESET_TITLES.filter(t => data.ownedTitles.includes(t.id));
    const customs  = (data.customTitles || []).map(t => ({
        id: t.id, label: t.label, cost: 0, desc: "Custom title", isCustom: true
    }));
    return [...presets, ...customs];
}

/** Grants a preset title to a user (after purchase). Returns false if already owned. */
async function grantTitle(userId, titleId) {
    const data = await get(userId);

    if (data.ownedTitles.includes(titleId)) return false;
    data.ownedTitles.push(titleId);

    await col().updateOne(
        { _id: userId },
        { $set: { ownedTitles: data.ownedTitles } },
        { upsert: true }
    );
    return true;
}

/** Creates a custom title for a user after purchase */
async function grantCustomTitle(userId, label) {
    const data = await get(userId);

    const id = `custom_${Date.now()}`;
    data.customTitles.push({ id, label });

    await col().updateOne(
        { _id: userId },
        { $set: { customTitles: data.customTitles } },
        { upsert: true }
    );
    return id;
}

/** Equips a title the user already owns */
async function setActiveTitle(userId, titleId) {
    const data = await get(userId);

    const ownsPreset = data.ownedTitles.includes(titleId);
    const ownsCustom = data.customTitles.some(t => t.id === titleId);

    if (!ownsPreset && !ownsCustom) return false;

    await col().updateOne(
        { _id: userId },
        { $set: { activeTitle: titleId } },
        { upsert: true }
    );
    return true;
}

/** Removes equipped title */
async function clearTitle(userId) {
    await col().updateOne(
        { _id: userId },
        { $set: { activeTitle: null } },
        { upsert: true }
    );
}

module.exports = {
    PRESET_TITLES,
    CUSTOM_TITLE_COST,
    get,
    getActiveTitle,
    getOwnedTitles,
    grantTitle,
    grantCustomTitle,
    setActiveTitle,
    clearTitle
};
