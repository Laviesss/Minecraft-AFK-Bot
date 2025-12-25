require('dotenv').config();
const mineflayer = require('mineflayer');
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');
const { initDiscord, sendMessageToChannel, updateBotInstance, EmbedBuilder } = require('./discord');
const proxyManager = require('./proxyManager');

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
  isAfkEnabled: true,
};

// --- Config ---
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
  socket.emit('state', botState);
  socket.on('chat-message', (msg) => {
    if (bot && botState.isOnline && msg) bot.chat(msg);
  });
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
  const proxyAgent = proxyManager.getNextProxy();
  console.log(`Connecting to ${config.host}:${config.port} as ${config.username}...`);

  const botOptions = {
    host: config.host,
    port: config.port,
    username: config.authMethod === 'microsoft' ? config.microsoftEmail : config.username,
    auth: config.authMethod,
    version: config.version || false,
    checkTimeoutInterval: 30 * 1000,
  };
  if (proxyAgent) botOptions.agent = proxyAgent;

  bot = mineflayer.createBot(botOptions);
  updateBotInstance(bot);

  bot.on('login', () => {
    console.log(`Logged in as '${bot.username}'.`);
    botState.isOnline = true;
    botState.uptime = 0;
    if (uptimeInterval) clearInterval(uptimeInterval);
    uptimeInterval = setInterval(() => botState.uptime++, 1000);
    const embed = new EmbedBuilder().setColor(0x_55FF55).setTitle('✅ Bot Connected').setDescription(`Successfully connected to \`${bot.options.host}\` as \`${bot.username}\`.`);
    sendMessageToChannel(embed);
  });

  bot.on('spawn', () => {
    console.log('Bot spawned.');
    botState.health = bot.health;
    botState.hunger = bot.food;
    botState.coordinates = bot.entity.position;
    if (antiAfkInterval) clearInterval(antiAfkInterval);
    antiAfkInterval = setInterval(() => {
      if (botState.isAfkEnabled) bot.setControlState('jump', true);
      bot.setControlState('jump', false);
    }, 45000);
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
  bot.on('playerJoined', p => {
    updatePlayers();
    const embed = new EmbedBuilder().setColor(0x_55FF55).setTitle('➡️ Player Joined').setDescription(`\`${p.username}\` joined the game.`);
    sendMessageToChannel(embed);
  });
  bot.on('playerLeft', p => {
    updatePlayers();
    const embed = new EmbedBuilder().setColor(0x_FF5555).setTitle('⬅️ Player Left').setDescription(`\`${p.username}\` left the game.`);
    sendMessageToChannel(embed);
  });

  bot.on('chat', (username, message) => {
    const chatEmbed = new EmbedBuilder().setColor(0x_AAAAAA).setDescription(`**${username}:** ${message}`);
    sendMessageToChannel(chatEmbed);
    io.emit('chat', `<${username}> ${message}`);
    if (username === bot.username || !message.startsWith('!')) return;
    handleCommand(username, message);
  });

  let lastCmdTime = 0;
  function handleCommand(username, message) {
    if (Date.now() - lastCmdTime < 3000) return;
    lastCmdTime = Date.now();
    const [command] = message.substring(1).split(' ');
    const isAdmin = config.admins.includes(username);
    switch (command.toLowerCase()) {
      case 'status': bot.chat(`Online | Uptime: ${botState.uptime}s`); break;
      case 'health': bot.chat(`HP: ${Math.round(botState.health)}/20`); break;
      case 'coords': const { x, y, z } = botState.coordinates; bot.chat(`X:${Math.round(x)} Y:${Math.round(y)} Z:${Math.round(z)}`); break;
      case 'players': bot.chat(`Players (${botState.playerCount}): ${botState.playerList.join(', ')}`); break;
      case 'ping': bot.chat(`Your ping: ${bot.players[username]?.ping ?? 'N/A'}ms.`); break;
      case 'uptime': bot.chat(`Uptime: ${botState.uptime}s.`); break;
      case 'help': bot.chat('Commands: !status, !health, !coords, !players, !ping, !uptime, !afk'); break;
      case 'afk':
        if (!isAdmin) return bot.chat("You don't have permission.");
        botState.isAfkEnabled = !botState.isAfkEnabled;
        bot.chat(`Anti-AFK is now ${botState.isAfkEnabled ? 'ON' : 'OFF'}.`);
        break;
    }
  }

  bot.on('kicked', (reason) => {
      let reasonText = reason;
      try {
        // Aternos servers sometimes send a JSON object as the kick reason.
        const reasonObj = JSON.parse(reason);
        reasonText = reasonObj.text || reason;
        if (reasonObj.extra) {
            reasonText += reasonObj.extra.map(item => item.text).join('');
        }
      } catch (e) {
        // It's not a JSON object, so we'll just use the raw string.
      }
      const embed = new EmbedBuilder().setColor(0xFF5555).setTitle('‼️ Bot Kicked').setDescription(`**Reason:** \`\`\`${reasonText}\`\`\``);
      sendMessageToChannel(embed);
  });
  bot.on('error', (err) => console.error('Bot error:', err));
  bot.on('end', (reason) => {
    console.log(`Disconnected. Reason: ${reason}. Reconnecting...`);
    botState.isOnline = false;
    if (antiAfkInterval) clearInterval(antiAfkInterval);
    if (uptimeInterval) clearInterval(uptimeInterval);
    const embed = new EmbedBuilder().setColor(0xFF5555).setTitle('❌ Bot Disconnected').setDescription(`**Reason:** ${reason}. Reconnecting in 10s...`);
    sendMessageToChannel(embed);
    setTimeout(createBot, 10000);
  });
}

// --- Initial Setup ---
async function start() {
  const allProxies = await proxyManager.loadProxies();
  const validProxies = await proxyManager.validateProxies(allProxies);
  await proxyManager.writeProxies(validProxies);
  proxyManager.setValidProxies(validProxies);

  initDiscord(botState, config);
  createBot();
}

start();
