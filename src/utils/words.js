const fs   = require("fs");
const path = require("path");

const words = [
    ...new Set(
        fs.readFileSync(path.join(__dirname, "../data/words.txt"), "utf8")
          .split("\n")
          .map(w => w.trim().replace(/\d+$/, ""))
          .filter(Boolean)
    )
];

module.exports = words;