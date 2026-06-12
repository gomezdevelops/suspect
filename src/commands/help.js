const {
    SlashCommandBuilder,
    EmbedBuilder
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("help")
        .setDescription(
            "View Suspect commands and information"
        ),

    async execute(interaction) {

        const embed =
            new EmbedBuilder()
                .setColor("#ff2d2d")
                .setTitle(
                    "🎭 Suspect Help"
                )
                .setDescription(
                    "A social deduction game where one player is different."
                )

                .addFields(
                    {
                        name: "📌 Prefix",
                        value: "`=`",
                        inline: true
                    },

                    {
                        name: "🎮 Commands",
                        value:
`=enter - Join a game
=leave - Leave a game
=start - Start a game
=status - View game status`
                    },

                    {
                        name: "🎯 How To Play",
                        value:
`1. Join the lobby
2. Receive your word
3. Give clues in chat
4. Discuss
5. Vote
6. Reveal the Imposter`
                    },

                    {
                        name: "🎭 Game Modes",
                        value:
`**Normal Mode** - The Imposter knows they are different.

**Hidden Mode** - The Imposter does not know they are different.`
                    }
                )

                .setFooter({
                    text:
                        "Trust nobody. Question everything."
                });

        await interaction.reply({
            embeds: [embed]
        });
    }
};