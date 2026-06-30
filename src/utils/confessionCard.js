const { EmbedBuilder } = require("discord.js");

let canvasLib = null;
try {
    canvasLib = require("@napi-rs/canvas");
} catch {
    console.warn("[confessionCard] @napi-rs/canvas not installed — falling back to text-only confession cards.");
}

const BRAND_RED  = "#e8001a";
const BG_DARK    = "#0d0d0f";
const BG_PANEL   = "#17171a";
const TEXT_MAIN  = "#f2f0ea";
const TEXT_DIM   = "#8a8a8f";

function wrapText(ctx, text, maxWidth) {
    const words = text.split(" ");
    const lines = [];
    let line = "";

    for (const word of words) {
        const test = line ? `${line} ${word}` : word;
        if (ctx.measureText(test).width > maxWidth && line) {
            lines.push(line);
            line = word;
        } else {
            line = test;
        }
    }
    if (line) lines.push(line);
    return lines;
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y,     x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x,     y + h, r);
    ctx.arcTo(x,     y + h, x,     y,     r);
    ctx.arcTo(x,     y,     x + w, y,     r);
    ctx.closePath();
}

async function generateConfessionCard(data) {
    if (!canvasLib) return null;

    const { createCanvas, loadImage, GlobalFonts } = canvasLib;

    const W = 900, H = 1150;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = BG_DARK;
    ctx.fillRect(0, 0, W, H);

    const glow = ctx.createRadialGradient(W * 0.85, H * 0.9, 0, W * 0.85, H * 0.9, 600);
    glow.addColorStop(0, "rgba(232,0,26,0.18)");
    glow.addColorStop(1, "rgba(232,0,26,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    ctx.globalAlpha = 0.04;
    ctx.fillStyle = "#ffffff";
    for (let i = 0; i < 1400; i++) {
        ctx.fillRect(Math.random() * W, Math.random() * H, 1, 1);
    }
    ctx.globalAlpha = 1;

    ctx.fillStyle = BRAND_RED;
    ctx.font = "bold 22px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("◆ CLASSIFIED FILE ◆", W / 2, 70);

    ctx.fillStyle = TEXT_DIM;
    ctx.font = "16px sans-serif";
    ctx.fillText("CASE No. " + Math.floor(100000 + Math.random() * 899999), W / 2, 96);

    ctx.fillStyle = TEXT_MAIN;
    ctx.font = "bold 56px sans-serif";
    ctx.fillText("CONFESSION", W / 2, 165);

    const avatarSize = 160;
    const avatarX = W / 2 - avatarSize / 2;
    const avatarY = 200;

    ctx.save();
    ctx.beginPath();
    ctx.arc(W / 2, avatarY + avatarSize / 2, avatarSize / 2 + 6, 0, Math.PI * 2);
    ctx.strokeStyle = BRAND_RED;
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();

    try {
        const avatarImg = await loadImage(data.avatarUrl);
        ctx.save();
        ctx.beginPath();
        ctx.arc(W / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatarImg, avatarX, avatarY, avatarSize, avatarSize);
        ctx.restore();
    } catch {
        // Fallback circle if avatar fails to load
        ctx.fillStyle = BG_PANEL;
        ctx.beginPath();
        ctx.arc(W / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.fillStyle = TEXT_MAIN;
    ctx.font = "bold 34px sans-serif";
    ctx.fillText(data.username, W / 2, avatarY + avatarSize + 55);

    ctx.fillStyle = data.wasRealImposter ? BRAND_RED : "#f1c40f";
    ctx.font = "bold 18px sans-serif";
    ctx.fillText(
        data.wasRealImposter ? "🎭  THE IMPOSTER" : "🎭  TOLD THEY WERE THE IMPOSTER",
        W / 2, avatarY + avatarSize + 84
    );

    const panelY = avatarY + avatarSize + 115;
    const panelH = 100;
    ctx.fillStyle = BG_PANEL;
    roundRect(ctx, 80, panelY, W - 160, panelH, 14);
    ctx.fill();
    ctx.strokeStyle = "rgba(232,0,26,0.35)";
    ctx.lineWidth = 1;
    roundRect(ctx, 80, panelY, W - 160, panelH, 14);
    ctx.stroke();

    ctx.fillStyle = TEXT_DIM;
    ctx.font = "13px sans-serif";
    ctx.fillText("THEIR WORD", W / 2, panelY + 32);

    ctx.fillStyle = TEXT_MAIN;
    ctx.font = "bold 34px sans-serif";
    ctx.fillText(`"${data.word}"`, W / 2, panelY + 75);

    let y = panelY + panelH + 50;
    ctx.textAlign = "left";
    ctx.fillStyle = TEXT_DIM;
    ctx.font = "13px sans-serif";
    ctx.fillText("CLUE HISTORY", 80, y);
    y += 20;

    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.beginPath();
    ctx.moveTo(80, y);
    ctx.lineTo(W - 80, y);
    ctx.stroke();
    y += 30;

    ctx.font = "20px sans-serif";
    for (const entry of data.clues.slice(0, 3)) {
        ctx.fillStyle = BRAND_RED;
        ctx.font = "bold 16px sans-serif";
        ctx.fillText(`ROUND ${entry.round}`, 80, y);

        ctx.fillStyle = TEXT_MAIN;
        ctx.font = "22px sans-serif";
        ctx.fillText(`"${entry.clue}"`, 200, y + 1);
        y += 42;
    }

    const verdictY = H - 220;
    const verdicts = {
        caught:        { text: "CAUGHT BY THE CREW",        color: "#5e5e64" },
        escaped:       { text: "ESCAPED UNDETECTED",        color: BRAND_RED },
        stole:         { text: "STOLE THE VICTORY",         color: BRAND_RED },
        "none-existed":{ text: "THERE WAS NO IMPOSTER",      color: "#f1c40f" },
    };
    const v = verdicts[data.outcome] ?? verdicts.escaped;

    ctx.fillStyle = "rgba(255,255,255,0.04)";
    roundRect(ctx, 80, verdictY, W - 160, 70, 12);
    ctx.fill();

    ctx.textAlign = "center";
    ctx.fillStyle = v.color;
    ctx.font = "bold 26px sans-serif";
    ctx.fillText(v.text, W / 2, verdictY + 45);

    ctx.fillStyle = TEXT_DIM;
    ctx.font = "14px sans-serif";
    ctx.fillText("SUSPECT  ·  Social Deduction for Discord", W / 2, H - 110);

    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.font = "12px sans-serif";
    ctx.fillText(new Date().toUTCString(), W / 2, H - 85);

    return canvas.toBuffer("image/png");
}


async function sendConfessionCard(client, userId, payload) {
    try {
        const user = await client.users.fetch(userId);

        const cardData = {
            username: user.username,
            avatarUrl: user.displayAvatarURL({ extension: "png", size: 256 }),
            word: payload.word,
            wasRealImposter: payload.wasRealImposter,
            outcome: payload.outcome,
            clues: payload.clues
        };

        const buffer = await generateConfessionCard(cardData);

        if (buffer) {
            const { AttachmentBuilder } = require("discord.js");
            const attachment = new AttachmentBuilder(buffer, { name: "confession.png" });

            await user.send({
                content: "🎭 Your confession card from the last game:",
                files: [attachment]
            });
        } else {
            const embed = new EmbedBuilder()
                .setColor(0xe8001a)
                .setTitle("🎭 Confession Card")
                .setDescription(`Your word: **${payload.word}**`)
                .addFields(
                    payload.clues.map(c => ({ name: `Round ${c.round}`, value: c.clue, inline: true }))
                )
                .setFooter({ text: "Suspect · Social Deduction for Discord" });

            await user.send({ embeds: [embed] });
        }
    } catch (err) {
        console.warn(`[confessionCard] Could not DM user ${userId}:`, err.message);
    }
}

module.exports = { sendConfessionCard, generateConfessionCard };