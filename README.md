<p align="center">
  <img src="./assets/banner.png" alt="Suspect Banner" width="100%">
</p>

<h1 align="center">🎭 Suspect</h1>

<p align="center">
  A social deduction game for Discord built around deception, deduction, and strategy.
</p>

<p align="center">
  <a href="https://discord.com/oauth2/authorize?client_id=1514691427370799154&permissions=8&integration_type=0&scope=bot+applications.commands">
    <img src="https://img.shields.io/badge/Invite%20Suspect-5865F2?style=for-the-badge&logo=discord&logoColor=white">
  </a>
</p>

---

## About

Suspect is a multiplayer social deduction game designed for Discord communities. Players receive secret words and must work together through clues, discussion, and voting to identify who doesn't belong.

Most players receive the same word, while one or more players receive a different word. Through observation, communication, and deduction, players must uncover the Imposter before the final vote.

Every match offers unique moments of strategy, deception, and unexpected twists, making Suspect perfect for friend groups, gaming communities, events, and active Discord servers.

---

## Features

* Secret word social deduction gameplay
* Multiple game modes
* Normal and Hidden modes
* Interactive clue and voting phases
* Timed turns and automatic game progression
* Duplicate clue prevention
* Word repeat prevention
* Persistent player statistics
* Global leaderboard system
* Supports slash commands and prefix commands
* Endless replayability with thousands of possible word combinations

---

## How To Play

### Join a Game

Players join the lobby and wait for enough participants.

### Receive Your Word

Each player receives a secret word through direct messages.

Most players receive the same word.

One or more players may receive a different word.

### Give Clues

Players take turns providing clues related to their word while avoiding revealing too much information.

### Discuss

Analyze clues, identify inconsistencies, and determine who may be hiding a different word.

### Vote

Vote for the player you believe is the Imposter.

### Reveal

The game reveals all words, roles, votes, and the final outcome.

---

## Commands

| Command      | Description              |
| ------------ | ------------------------ |
| /help        | View game information    |
| /enter       | Join a game              |
| /leave       | Leave the lobby          |
| /start       | Start a game             |
| /status      | View current game status |
| /leaderboard | View top players         |
| /skip        | Vote to skip discussion  |
| /guess       | Final Imposter guess     |

All commands are also available using the `=` prefix.

---

## Statistics

Suspect tracks player performance across games, including:

* Games Played
* Wins
* Crew Wins
* Imposter Wins
* Correct Votes
* Win Rate

Compete against other players and climb the leaderboard.

---

## Installation

Clone the repository:

```bash
git clone https://github.com/gomezdevelops/suspect.git
cd suspect
```

Install dependencies:

```bash
npm install
```

Create a `.env` file:

```env
TOKEN=YOUR_BOT_TOKEN
CLIENT_ID=YOUR_CLIENT_ID
```

Start the bot:

```bash
npm start
```

---

## Built With

* Node.js
* Discord.js v14

---

## Contributing

Suggestions, improvements, and bug reports are welcome. Feel free to open an issue or submit a pull request.

---

## License

This project is licensed under the MIT License.

---

<p align="center">
  <strong>Trust Nobody.</strong><br>
  <strong>Question Everything.</strong><br>
  <strong>Find the Imposter.</strong>
</p>
