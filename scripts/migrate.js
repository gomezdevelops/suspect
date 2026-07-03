/**
 * One-time migration: import existing data/*.json files into MongoDB.
 *
 * Run ONCE on the machine that has your live JSON data (e.g. the container):
 *     node scripts/migrate.js
 *
 * Safe to re-run — every record is upserted by _id, so running twice won't
 * create duplicates (it just overwrites with the same JSON values).
 */
require("dotenv").config();

const fs   = require("fs");
const path = require("path");
const { connect, collection, close } = require("../src/db/connect");

const DATA_DIR = path.join(__dirname, "../src/data");

function readJson(file) {
    const full = path.join(DATA_DIR, file);
    if (!fs.existsSync(full)) {
        console.log(`  – ${file} not found, skipping`);
        return null;
    }
    try {
        return JSON.parse(fs.readFileSync(full, "utf8"));
    } catch (err) {
        console.log(`  ! ${file} failed to parse: ${err.message}`);
        return null;
    }
}

/** Upsert a { userId: value } map into a collection, mapping value → doc fields. */
async function migrateMap(file, collName, toDoc) {
    const data = readJson(file);
    if (!data) return;

    const ids = Object.keys(data);
    if (!ids.length) { console.log(`  – ${file} empty, skipping`); return; }

    const ops = ids.map(id => ({
        updateOne: {
            filter: { _id: id },
            update: { $set: toDoc(data[id]) },
            upsert: true
        }
    }));

    const res = await collection(collName).bulkWrite(ops);
    console.log(`  ✓ ${file} → ${collName}: ${res.upsertedCount} inserted, ${res.modifiedCount} updated (${ids.length} total)`);
}

async function main() {
    await connect();
    console.log("Migrating JSON → MongoDB…");

    // shards.json: { userId: balanceNumber }
    await migrateMap("shards.json", "shards", v => ({ balance: v }));

    // invites.json: { userId: countNumber }
    await migrateMap("invites.json", "invites", v => ({ count: v }));

    // votes.json: { userId: { lastVoteAt, totalVotes, streak, lastStreakAt, earnedBadges } }
    await migrateMap("votes.json", "votes", v => ({
        lastVoteAt:   v.lastVoteAt   ?? 0,
        totalVotes:   v.totalVotes   ?? 0,
        streak:       v.streak       ?? 0,
        lastStreakAt: v.lastStreakAt ?? 0,
        earnedBadges: v.earnedBadges ?? []
    }));

    // stats.json: { userId: { gamesPlayed, ... } }
    await migrateMap("stats.json", "stats", v => ({
        gamesPlayed:   v.gamesPlayed   ?? 0,
        gamesWon:      v.gamesWon      ?? 0,
        crewWins:      v.crewWins      ?? 0,
        imposterWins:  v.imposterWins  ?? 0,
        correctVotes:  v.correctVotes  ?? 0,
        timesVotedOut: v.timesVotedOut ?? 0,
        winRate:       v.winRate       ?? 0
    }));

    // titles.json: { userId: { activeTitle, ownedTitles, customTitles } }
    await migrateMap("titles.json", "titles", v => ({
        activeTitle:  v.activeTitle  ?? null,
        ownedTitles:  v.ownedTitles  ?? [],
        customTitles: v.customTitles ?? []
    }));

    // usedWords.json: [ { common, imposter }, ... ] → single meta doc
    const history = readJson("usedWords.json");
    if (Array.isArray(history) && history.length) {
        await collection("meta").updateOne(
            { _id: "usedWords" },
            { $set: { history } },
            { upsert: true }
        );
        console.log(`  ✓ usedWords.json → meta: ${history.length} word pairs`);
    }

    console.log("Done.");
    await close();
    process.exit(0);
}

main().catch(async err => {
    console.error("Migration failed:", err);
    await close();
    process.exit(1);
});
