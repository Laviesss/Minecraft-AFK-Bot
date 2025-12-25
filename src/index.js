require('dotenv').config();
const mineflayer = require('mineflayer');
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');
const { Vec3 } = require('vec3');
const { initDiscord, sendMessageToChannel, updateBotInstance, EmbedBuilder } = require('./discord');
const proxyManager = require('./proxyManager');
const mc = require('minecraft-data');
const { getWebMinimap } = require('./utils');

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
  proxy: null,
  dashboardUrl: null,
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

  socket.on('toggle-afk', () => {
    botState.isAfkEnabled = !botState.isAfkEnabled;
    io.emit('chat', `[SYSTEM] Anti-AFK is now ${botState.isAfkEnabled ? 'ON' : 'OFF'}.`);
  });

  socket.on('get-inventory', () => {
    if (bot && botState.isOnline) {
      const items = bot.inventory.items().map(item => ({ name: item.displayName, count: item.count }));
      socket.emit('inventory-update', items);
    }
  });

  socket.on('use-item', () => {
    if (bot && botState.isOnline) {
      bot.activateItem();
      io.emit('chat', '[SYSTEM] Used held item.');
    }
  });

  socket.on('look-at-player', () => {
    if (bot && botState.isOnline) {
      const nearestPlayer = bot.nearestEntity(entity => entity.type === 'player');
      if (nearestPlayer) {
        bot.lookAt(nearestPlayer.position.offset(0, nearestPlayer.height, 0));
        io.emit('chat', `[SYSTEM] Looking at ${nearestPlayer.username}.`);
      } else {
        io.emit('chat', '[SYSTEM] No players nearby.');
      }
    }
  });

  socket.on('move', (direction) => {
    if (bot && botState.isOnline) {
      const correctedDirection = direction === 'backward' ? 'back' : direction;
      bot.setControlState(correctedDirection, true);
      setTimeout(() => bot.setControlState(correctedDirection, false), 200);
    }
  });

  socket.on('stop-move', (direction) => {
     if (bot && botState.isOnline) {
       bot.clearControlStates();
     }
  });

  socket.on('get-minimap', () => {
    if (!bot || !botState.isOnline || !mcData) return;
    const minimap = getWebMinimap(bot, mcData);
    socket.emit('minimap-update', minimap);
  });

  socket.on('reconnect-bot', () => {
    if (bot) bot.end('Manual reconnect triggered from dashboard.');
  });
});

server.listen(listenerPort, () => {
  const externalUrl = process.env.RENDER_EXTERNAL_URL;
  botState.dashboardUrl = externalUrl || `http://localhost:${listenerPort}`;
  console.log(`Web server listening on ${botState.dashboardUrl}`);
  botState.serverAddress = `${config.host}:${config.port}`;
  botState.version = config.version || 'Auto-detected';
});

setInterval(() => {
    if(bot && bot.player) botState.ping = bot.player.ping;
    io.emit('state', botState)
}, 1000);

// --- Mineflayer Bot Logic ---
let bot;
let antiAfkInterval;
let uptimeInterval;
let mcData;

function createBot() {
  const proxyDetails = proxyManager.getNextProxy();
  botState.proxy = proxyDetails ? proxyDetails.proxy : null;
  console.log(`Connecting to ${config.host}:${config.port} as ${config.username}...`);

  const botOptions = {
    host: config.host,
    port: config.port,
    username: config.authMethod === 'microsoft' ? config.microsoftEmail : config.username,
    auth: config.authMethod,
    version: config.version || false,
    checkTimeoutInterval: 30 * 1000,
  };
  if (proxyDetails) botOptions.agent = proxyDetails.agent;

  bot = mineflayer.createBot(botOptions);
  updateBotInstance(bot);

  bot.on('login', () => {
    console.log(`Logged in as '${bot.username}'.`);
    botState.isOnline = true;
    botState.uptime = 0;
    mcData = mc(bot.version);
    if (uptimeInterval) clearInterval(uptimeInterval);
    uptimeInterval = setInterval(() => botState.uptime++, 1000);
    const embed = new EmbedBuilder().setColor(0x55FF55).setTitle('✅ Bot Connected').setDescription(`Successfully connected to \`${config.host}\` as \`${bot.username}\`.`);
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
    botState.playerList = Object.values(bot.players).map(p => ({ username: p.username, ping: p.ping }));
  };
  bot.on('playerJoined', p => {
    updatePlayers();
    const embed = new EmbedBuilder().setColor(0x55FF55).setTitle('➡️ Player Joined').setDescription(`\`${p.username}\` joined the game.`);
    sendMessageToChannel(embed);
  });
  bot.on('playerLeft', p => {
    updatePlayers();
    const embed = new EmbedBuilder().setColor(0xFF5555).setTitle('⬅️ Player Left').setDescription(`\`${p.username}\` left the game.`);
    sendMessageToChannel(embed);
  });

  bot.on('chat', (username, message) => {
    const chatEmbed = new EmbedBuilder().setColor(0xAAAAAA).setDescription(`**${username}:** ${message}`);
    sendMessageToChannel(chatEmbed);
    io.emit('chat', `<${username}> ${message}`);
    if (username === bot.username || !message.startsWith('!')) return;
    handleCommand(username, message);
  });

  let lastCmdTime = 0;
  function handleCommand(username, message) {
    if (Date.now() - lastCmdTime < 3000) return;
    lastCmdTime = Date.now();
    const [command, ...args] = message.substring(1).split(' ');
    const isAdmin = config.admins.includes(username);
    switch (command.toLowerCase()) {
      case 'status': bot.chat(`Online | Uptime: ${botState.uptime}s`); break;
      case 'health': bot.chat(`HP: ${Math.round(botState.health)}/20`); break;
      case 'coords': const { x, y, z } = botState.coordinates; bot.chat(`X:${Math.round(x)} Y:${Math.round(y)} Z:${Math.round(z)}`); break;
      case 'players': bot.chat(`Players (${botState.playerCount}): ${botState.playerList.join(', ')}`); break;
      case 'ping': bot.chat(`Your ping: ${bot.players[username]?.ping ?? 'N/A'}ms.`); break;
      case 'uptime': bot.chat(`Uptime: ${botState.uptime}s.`); break;
      case 'help': bot.chat('Commands: !status, !health, !coords, !players, !ping, !uptime, !afk, !inventory, !useitem, !look, !move, !stop'); break;
      case 'afk':
        if (!isAdmin) return bot.chat("You don't have permission.");
        botState.isAfkEnabled = !botState.isAfkEnabled;
        bot.chat(`Anti-AFK is now ${botState.isAfkEnabled ? 'ON' : 'OFF'}.`);
        break;
      case 'inventory':
        const items = bot.inventory.items().map(item => `${item.displayName} x${item.count}`);
        bot.chat(items.length ? `Inventory: ${items.join(', ')}` : 'Inventory is empty.');
        break;
      case 'useitem':
        bot.activateItem();
        bot.chat('Used held item.');
        break;
      case 'look':
        const nearestPlayer = bot.nearestEntity(entity => entity.type === 'player');
        if (nearestPlayer) {
          bot.lookAt(nearestPlayer.position.offset(0, nearestPlayer.height, 0));
          bot.chat(`Looking at ${nearestPlayer.username}.`);
        } else {
          bot.chat('No players nearby.');
        }
        break;
      case 'move':
        if (!isAdmin) return bot.chat("You don't have permission.");
        bot.setControlState('forward', true);
        bot.chat('Moving forward.');
        break;
       case 'stop':
         if (!isAdmin) return bot.chat("You don't have permission.");
         bot.clearControlStates();
         bot.chat('Stopped moving.');
         break;
    }
  }

  bot.on('kicked', (reason) => {
      let reasonText = reason;
      try {
        const reasonObj = JSON.parse(reason);
        reasonText = reasonObj.text || reason;
        if (reasonObj.extra) {
            reasonText += reasonObj.extra.map(item => item.text).join('');
        }
      } catch (e) { /* Not JSON */ }
      const embed = new EmbedBuilder().setColor(0xFF5555).setTitle('‼️ Bot Kicked').setDescription(`**Reason:** \`\`\`${reasonText}\`\`\``);
      sendMessageToChannel(embed);
  });
  bot.on('error', (err) => console.error('Bot error:', err));
  bot.on('end', (reason) => {
    console.log(`Disconnected. Reason: ${reason}. Reconnecting...`);
    botState.isOnline = false;
    botState.lastDisconnectReason = reason;
    if (antiAfkInterval) clearInterval(antiAfkInterval);
    if (uptimeInterval) clearInterval(uptimeInterval);

    const embed = new EmbedBuilder()
        .setColor(0xFF5555)
        .setTitle('❌ Bot Disconnected')
        .setDescription(`**Reason:** ${reason}. Reconnecting in 10s...`);
    sendMessageToChannel(embed);

    // Cleanup listeners before creating a new bot instance
    bot.removeAllListeners();
    setTimeout(createBot, 10000);
  });
}

// --- Initial Setup ---
async function start() {
  await proxyManager.initialize();
  initDiscord(botState, config);
  createBot();
}

start();
