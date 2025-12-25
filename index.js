const mineflayer = require('mineflayer');
const express = require('express');

// --- Environment Variable Validation ---
const host = process.env.MC_SERVER_ADDRESS;
const port = parseInt(process.env.MC_SERVER_PORT || 25565, 10);
const username = process.env.MC_USERNAME;

if (!host || !username) {
  console.error('Missing required environment variables: MC_SERVER_ADDRESS and MC_USERNAME. The bot will not start.');
  process.exit(1); // Exit if essential config is missing.
}

// --- Express Keep-Alive Server ---
const app = express();
const listenerPort = process.env.PORT || 8080;

app.get('/', (req, res) => {
  res.send('AFK bot is running.');
});

app.listen(listenerPort, () => {
  console.log(`Keep-alive server listening on port ${listenerPort}`);
});

// --- Mineflayer Bot Logic ---
let bot;

function createBot() {
  console.log(`Attempting to connect to ${host}:${port} as ${username}`);

  bot = mineflayer.createBot({
    host: host,
    port: port,
    username: username,
    // Mineflayer's auth is 'mojang' for premium or 'microsoft' for MSA.
    // For offline mode ('cracked') servers, we don't specify an auth method.
    checkTimeoutInterval: 15 * 1000, // 15-second timeout for connection.
  });

  // --- Bot Event Handlers ---
  bot.on('login', () => {
    console.log(`Login successful. Bot is connecting to the server as '${bot.username}'.`);
  });

  bot.on('spawn', () => {
    console.log('Bot has successfully joined the server and is now AFK.');
  });

  bot.on('kicked', (reason, loggedIn) => {
    console.warn(`Bot was kicked from the server. Reason: ${reason}`);
  });

  bot.on('error', (err) => {
    console.error('An error occurred with the bot:', err.message);
  });

  // The 'end' event is the primary signal for reconnection.
  bot.on('end', (reason) => {
    console.log(`Bot disconnected. Reason: ${reason}`);
    console.log('Attempting to reconnect in 1 second...');
    // A simple and reliable fixed-delay reconnect.
    setTimeout(createBot, 1000);
  });
}

// Initial bot creation
createBot();
