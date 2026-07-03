const { MongoClient } = require("mongodb");

// Connection string lives in .env as MONGO_URI. The database name is forced to
// SuspectBot (override with MONGO_DB) so it doesn't matter whether the URI path
// includes a db name.
const URI     = process.env.MONGO_URI;
const DB_NAME = process.env.MONGO_DB || "SuspectBot";

let client = null;
let db     = null;

/** Connect once at startup. Safe to call multiple times — returns the same db. */
async function connect() {
    if (db) return db;
    if (!URI) throw new Error("MONGO_URI is not set in .env");

    client = new MongoClient(URI, {
        serverSelectionTimeoutMS: 10000,
    });
    await client.connect();
    db = client.db(DB_NAME);
    console.log(`✅ Connected to MongoDB (db: ${DB_NAME})`);
    return db;
}

/** Get the connected db. Throws if connect() hasn't run yet. */
function getDb() {
    if (!db) throw new Error("MongoDB not connected — call connect() first");
    return db;
}

/** Shorthand for a collection on the connected db. */
function collection(name) {
    return getDb().collection(name);
}

/** Close the connection (for the migration script / graceful shutdown). */
async function close() {
    if (client) {
        await client.close();
        client = null;
        db     = null;
    }
}

module.exports = { connect, getDb, collection, close };
