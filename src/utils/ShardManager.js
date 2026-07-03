const { collection } = require("../db/connect");

// Collection: shards — docs shaped { _id: userId, balance: Number }
const col = () => collection("shards");

async function getBalance(userId) {
    const doc = await col().findOne({ _id: userId });
    return doc?.balance ?? 0;
}

async function addShards(userId, amount) {
    const doc = await col().findOneAndUpdate(
        { _id: userId },
        { $inc: { balance: amount } },
        { upsert: true, returnDocument: "after" }
    );
    return doc?.balance ?? amount;
}

/** Atomically deducts if the balance is sufficient. Returns new balance, or false. */
async function spendShards(userId, amount) {
    const doc = await col().findOneAndUpdate(
        { _id: userId, balance: { $gte: amount } },
        { $inc: { balance: -amount } },
        { returnDocument: "after" }
    );
    if (!doc) return false; // no doc matched → insufficient balance
    return doc.balance;
}

module.exports = { getBalance, addShards, spendShards };
