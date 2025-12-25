require('dotenv').config();
const mineflayer = require('mineflayer');
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');
const { initDiscord, sendMessageToChannel } = require('./discord');

// --- Global State ---
const botState = {
  isOnline: false,
  serverAddress: null,
  version: null,
  uptime: 0,
  lastDisconnectReason: 'N/A',
  ping: -1,
  health: 20,
  hunger: 20,
  coordinates: { x: 0, y: 0, z: 0 },
  dimension: 'minecraft:overworld',
  heldItem: 'Empty Hand',
  time: 'day',
  weather: 'clear',
  playerCount: 0,
  playerList: [],
  lastChatMessage: '',
  lastSystemMessage: '',
  errorCount: 0,
  lastError: 'N/A',
  isAfkEnabled: true,
};

// --- Environment Variable Validation & Config ---
const config = {
  host: process.env.MC_SERVER_ADDRESS,
  port: parseInt(process.env.MC_SERVER_PORT || 25565, 10),
  username: process.env.MC_USERNAME,
  version: process.env.MC_VERSION,
  authMethod: process.env.AUTH_METHOD || 'offline',
  microsoftEmail: process.env.MICROSOFT_EMAIL,
  admins: (process.env.ADMIN_USERNAMES || '').split(',').filter(Boolean),
};

if (!config.host || !config.username) {
  console.error('Missing required environment variables: MC_SERVER_ADDRESS and MC_USERNAME.');
  process.exit(1);
}
if (config.authMethod === 'microsoft' && !config.microsoftEmail) {
  console.error('AUTH_METHOD is "microsoft" but MICROSOFT_EMAIL is not set.');
  process.exit(1);
}

// --- Web Server & Socket.io ---
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const listenerPort = process.env.PORT || 8080;

app.use(express.static(path.join(__dirname, '../public')));

io.on('connection', (socket) => {
  console.log('Dashboard user connected.');
  socket.emit('state', botState);
  socket.on('chat-message', (msg) => {
    if (bot && botState.isOnline && msg) bot.chat(msg);
  });
  socket.on('disconnect', () => console.log('Dashboard user disconnected.'));
});

server.listen(listenerPort, () => {
  console.log(`Web server listening on port ${listenerPort}`);
  botState.serverAddress = `${config.host}:${config.port}`;
  botState.version = config.version || 'Auto-detected';
});

setInterval(() => io.emit('state', botState), 1000);

// --- Mineflayer Bot Logic ---
let bot;
let antiAfkInterval;
let uptimeInterval;

function createBot() {
  console.log(`Attempting to connect to ${config.host}:${config.port} as ${config.username} (auth: ${config.authMethod})`);

  bot = mineflayer.createBot({
    host: config.host,
    port: config.port,
    username: config.authMethod === 'microsoft' ? config.microsoftEmail : config.username,
    auth: config.authMethod,
    version: config.version || false,
    checkTimeoutInterval: 15 * 1000,
  });

  initDiscord(botState, bot);

  const startAntiAfk = () => {
    if (antiAfkInterval) clearInterval(antiAfkInterval);
    antiAfkInterval = setInterval(() => {
      if (botState.isAfkEnabled) {
        bot.setControlState('jump', true);
        bot.setControlState('jump', false);
      }
    }, 45000);
  };

  bot.on('login', () => {
    console.log(`Login successful as '${bot.username}'.`);
    botState.isOnline = true;
    botState.uptime = 0;
    if (uptimeInterval) clearInterval(uptimeInterval);
    uptimeInterval = setInterval(() => botState.uptime++, 1000);
    sendMessageToChannel(`✅ Bot **${bot.username}** has connected.`);
  });

  bot.on('spawn', () => {
    console.log('Bot has joined the server.');
    botState.health = bot.health;
    botState.hunger = bot.food;
    botState.coordinates = bot.entity.position;
    startAntiAfk();
  });

  bot.on('health', () => {
    botState.health = bot.health;
    botState.hunger = bot.food;
  });

  bot.on('move', () => botState.coordinates = bot.entity.position.floored());

  const updatePlayers = () => {
    botState.playerCount = Object.keys(bot.players).length;
    botState.playerList = Object.keys(bot.players);
  };
  bot.on('playerJoined', (player) => {
    updatePlayers();
    const joinMessage = `➡️ ${player.username} joined.`;
    io.emit('chat', joinMessage);
    sendMessageToChannel(joinMessage);
  });
  bot.on('playerLeft', (player) => {
    updatePlayers();
    const leftMessage = `⬅️ ${player.username} left.`;
    io.emit('chat', leftMessage);
    sendMessageToChannel(leftMessage);
  });

  bot.on('chat', (username, message) => {
    const chatMessage = `<${username}> ${message}`;
    io.emit('chat', chatMessage);
    sendMessageToChannel(chatMessage.replace(/@/g, '@ '));
    if (username === bot.username) return;
    if (message.startsWith('!')) handleCommand(username, message);
  });

  let lastCommandTime = 0;
  function handleCommand(username, message) {
    const now = Date.now();
    if (now - lastCommandTime < 3000) return;
    lastCommandTime = now;

    const [command, ...args] = message.substring(1).split(' ');
    const isAdmin = config.admins.includes(username);

    switch (command.toLowerCase()) {
      case 'status': bot.chat(`Online | Uptime: ${botState.uptime}s`); break;
      case 'health': bot.chat(`HP: ${Math.round(botState.health)}/20 | Hunger: ${Math.round(botState.hunger)}/20`); break;
      case 'coords': const { x, y, z } = botState.coordinates; bot.chat(`Coords: X:${Math.round(x)} Y:${Math.round(y)} Z:${Math.round(z)}`); break;
      case 'players': bot.chat(`Players (${botState.playerCount}): ${botState.playerList.join(', ')}`); break;
      case 'ping': bot.chat(`Your ping: ${bot.players[username]?.ping ?? 'N/A'}ms.`); break;
      case 'uptime': bot.chat(`Uptime: ${botState.uptime}s.`); break;
      case 'help': bot.chat('Commands: !status, !health, !coords, !players, !ping, !uptime, !afk'); break;
      case 'afk':
        if (!isAdmin) return bot.chat("You don't have permission to use this command.");
        botState.isAfkEnabled = !botState.isAfkEnabled;
        bot.chat(`Anti-AFK is now ${botState.isAfkEnabled ? 'ON' : 'OFF'}.`);
        break;
    }
  }

  bot.on('kicked', (reason) => {
    const kickMessage = `‼️ Kicked. Reason: ${reason}`;
    console.warn(kickMessage);
    sendMessageToChannel(kickMessage);
  });
  bot.on('error', (err) => console.error('An error occurred:', err.message));
  bot.on('end', (reason) => {
    const endMessage = `❌ Disconnected. Reason: ${reason}. Reconnecting...`;
    console.log(endMessage);
    botState.isOnline = false;
    if (antiAfkInterval) clearInterval(antiAfkInterval);
    if (uptimeInterval) clearInterval(uptimeInterval);
    sendMessageToChannel(endMessage);
    setTimeout(createBot, 5000);
  });
}

createBot();
