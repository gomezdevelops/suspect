const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const StatsManager = require("../utils/StatsManager");
const { COLOR } = require("../utils/embeds");
const { reply, client } = require("../utils/ctx");

const MEDALS = ["🥇", "🥈", "🥉"];

module.exports = {
    name: "leaderboard",
    data: new SlashCommandBuilder()
        .setName("leaderboard")
        .setDescription("Show the top 10 players"),

    async execute(ctx) {
        const all = await StatsManager.getAll();

        if (Object.keys(all).length === 0) {
            return reply(ctx, { content: "❌ No stats recorded yet. Play some games first!", ephemeral: true });
        }

        // Sort: wins → winRate → gamesPlayed
        const sorted = Object.entries(all)
            .map(([id, s]) => ({ id, ...s }))
            .sort((a, b) =>
                b.gamesWon - a.gamesWon ||
                b.winRate  - a.winRate  ||
                b.gamesPlayed - a.gamesPlayed
            )
            .slice(0, 10);

        // Fetch usernames
        const lines = [];
        for (let i = 0; i < sorted.length; i++) {
            const s    = sorted[i];
            const rank = MEDALS[i] ?? `**${i + 1}.**`;
            let username;
            try {
                const u = await client(ctx).users.fetch(s.id);
                username = u.username;
            } catch {
                username = `Unknown (${s.id.slice(0, 6)})`;
            }

            lines.push(
                `${rank} **${username}**\n` +
                `┗ ${s.gamesWon}W / ${s.gamesPlayed}G · ${s.winRate}% WR`
            );
        }

        const embed = new EmbedBuilder()
            .setColor(COLOR)
            .setTitle("🏆 Suspect Leaderboard")
            .setDescription(lines.join("\n\n"))
            .setFooter({ text: "Sorted by wins · win rate · games played" });

        await reply(ctx, { embeds: [embed] });
    }
};