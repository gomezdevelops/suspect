require("dotenv").config();

const {
    REST,
    Routes
} = require("discord.js");

const help =
require("./commands/help");

const commands = [
    help.data.toJSON()
];

const rest =
new REST({
    version: "10"
}).setToken(
    process.env.TOKEN
);

(async () => {

    await rest.put(
        Routes.applicationCommands(
            process.env.CLIENT_ID
        ),
        {
            body: commands
        }
    );

    console.log(
        "Help command deployed."
    );

})();