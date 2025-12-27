require('dotenv').config();
const mineflayer = require('mineflayer');
const http = require('http');
const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');
const ngrok = require('ngrok');
const { initDiscord, sendMessageToChannel, updateBotInstance, EmbedBuilder } = require('./discord');
const proxyManager = require('./proxyManager');

// --- Plugin Imports ---
const autoAuth = require('mineflayer-auto-auth');
const viewer = require('prismarine-viewer').mineflayer;
const webInventory = require('mineflayer-web-inventory');

// --- Global State ---
const botState = {
  isOnline: false,
  serverAddress: null,
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
  authPassword: process.env.MC_PASSWORD,
  mainDashboardPort: parseInt(process.env.PORT || 8080, 10),
  viewerPort: parseInt(process.env.VIEWER_PORT || 3001, 10),
  inventoryPort: parseInt(process.env.INVENTORY_PORT || 3002, 10),
  ngrokAuthToken: process.env.NGROK_AUTH_TOKEN,
};

// --- Environment Variable Checks ---
if (!config.host || !config.username) {
  console.error('Missing required environment variables: MC_SERVER_ADDRESS and MC_USERNAME.');
  process.exit(1);
}
if (config.authMethod === 'microsoft' && !config.microsoftEmail) {
  console.error('AUTH_METHOD is "microsoft" but MICROSOFT_EMAIL is not set.');
  process.exit(1);
}
if (!config.authPassword) {
  console.warn('Warning: MC_PASSWORD is not set. The auto-auth plugin will not be able to log in.');
}

const { Server } = require("socket.io");

// --- Web Server & Reverse Proxy Setup ---
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// --- Socket.io Event Handlers ---
io.on('connection', (socket) => {
  console.log(`[Socket] New connection: ${socket.id}`);

  socket.on('move', (direction) => {
    console.log(`[Socket] Received move: ${direction}`);
    if (bot && botState.isOnline) {
      const correctedDirection = direction === 'backward' ? 'back' : direction;
      bot.setControlState(correctedDirection, true);
    }
  });

  socket.on('stop-move', () => {
    console.log('[Socket] Received stop-move');
     if (bot && botState.isOnline) {
       bot.clearControlStates();
     }
  });
});

// --- Proxy Error Handler ---
const onProxyError = (err, req, res) => {
  console.error('[Proxy] Error:', err);
  res.writeHead(500, {
    'Content-Type': 'text/plain',
  });
  res.end('Something went wrong. And we are reporting a custom error message.');
};

// Proxy requests to the plugin servers
const viewerProxy = createProxyMiddleware({ target: `http://localhost:${config.viewerPort}`, ws: true, onError: onProxyError });
const inventoryProxy = createProxyMiddleware({ target: `http://localhost:${config.inventoryPort}`, ws: true, onError: onProxyError });

app.use('/viewer', viewerProxy);
app.use('/inventory', inventoryProxy);

// Serve the main dashboard file
app.use(express.static(path.join(__dirname, '../public')));

server.listen(config.mainDashboardPort, async () => {
  const localUrl = `http://localhost:${config.mainDashboardPort}`;
  console.log(`[Dashboard] Main dashboard listening on ${localUrl}`);
  console.log('[Proxy] Reverse proxy routes for /viewer, /radar, and /inventory are configured.');
  botState.dashboardUrl = localUrl;

  if (config.ngrokAuthToken) {
    console.log('[ngrok] NGROK_AUTH_TOKEN found. Authenticating and starting tunnel...');
    try {
      await ngrok.authtoken(config.ngrokAuthToken);
      const url = await ngrok.connect(config.mainDashboardPort);
      botState.dashboardUrl = url;
      console.log(`[ngrok] Tunnel established. Public dashboard is available at: ${url}`);
    } catch (err) {
      console.error('---');
      console.error('[ngrok] CRITICAL ERROR: Could not create ngrok tunnel.');
      if (err.body && err.body.details && err.body.details.err.includes('authentication failed')) {
          console.error('[ngrok] Reason: Your NGROK_AUTH_TOKEN is invalid or expired. Please check it on dash.ngrok.com');
      } else if (err.code === 'ECONNREFUSED') {
          console.error('[ngrok] Reason: The connection was refused. This is often caused by antivirus software or a firewall blocking Node.js.');
          console.error('[ngrok] Action: Please check your firewall/antivirus settings and allow Node.js to make local connections.');
      } else {
          console.error('[ngrok] An unexpected error occurred:', err);
      }
      console.error(`[ngrok] The bot will continue to run, but the public dashboard will not be available.`);
      console.error(`[ngrok] You can still access the local dashboard at: ${localUrl}`);
      console.error('---');
    }
  } else {
    console.log('[ngrok] NGROK_AUTH_TOKEN not found in .env file. Skipping public tunnel.');
  }
});


// --- Mineflayer Bot Logic ---
let bot;
let pluginsInitialized = false;

function createBot() {
  const proxyDetails = proxyManager.getNextProxy();
  console.log(`Connecting to ${config.host}:${config.port} as ${config.username}...`);

  const botOptions = {
    host: config.host,
    port: config.port,
    username: config.authMethod === 'microsoft' ? config.microsoftEmail : config.username,
    auth: config.authMethod,
    version: config.version || false,
    checkTimeoutInterval: 30 * 1000,
    plugins: [
      {
        plugin: autoAuth,
        options: {
          password: config.authPassword,
          login: `/login ${config.authPassword}`,
          register: `/register ${config.authPassword} ${config.authPassword}`,
        }
      }
    ]
  };
  if (proxyDetails) botOptions.agent = proxyDetails.agent;

  bot = mineflayer.createBot(botOptions);
  updateBotInstance(bot);

  // --- Bot Event Handlers ---
  bot.on('login', () => {
    console.log(`[Bot] Logged in as '${bot.username}'${bot.socket ? ` to ${bot.socket.remoteAddress}` : ''}.`);
    botState.isOnline = true;
    const embed = new EmbedBuilder().setColor(0x55FF55).setTitle('✅ Bot Connected').setDescription(`Successfully connected to \`${config.host}\` as \`${bot.username}\`.`);
    sendMessageToChannel(embed);
  });

  bot.on('spawn', () => {
    console.log('[Bot] Spawned into the world.');
    if (pluginsInitialized) return;

    console.log('[System] First spawn event. Initializing dashboard plugins...');
    try {
      console.log(`[Viewer] Initializing viewer on port ${config.viewerPort}...`);
      viewer(bot, { port: config.viewerPort, firstPerson: false });
      console.log(`[Viewer] Viewer initialization complete.`);

      console.log(`[Inventory] Initializing web inventory on port ${config.inventoryPort}...`);
      webInventory(bot, { port: config.inventoryPort });
      console.log(`[Inventory] Web inventory initialization complete.`);

      pluginsInitialized = true;
      console.log('[System] All dashboard plugins initialized successfully.');
    } catch (err) {
        console.error('[System] CRITICAL: A dashboard plugin failed to start. The bot will exit.', err);
        process.exit(1);
    }
  });

  bot.on('kicked', (reason) => {
    let reasonText = reason;
    try {
      const reasonObj = JSON.parse(reason);
      reasonText = reasonObj.text || reason;
      if (reasonObj.extra) {
          reasonText += reasonObj.extra.map(item => item.text).join('');
      }
    } catch (e) { /* Not JSON */ }
    console.warn(`[Bot] Kicked from server. Reason: ${reasonText}`);
    const embed = new EmbedBuilder().setColor(0xFF5555).setTitle('‼️ Bot Kicked').setDescription(`**Reason:** \`\`\`${reasonText}\`\`\``);
    sendMessageToChannel(embed);
  });

  bot.on('error', (err) => {
    // An error event is not always fatal. Sometimes it's a temporary network issue.
    // We will log the error, but we will let the 'end' event handle the reconnection logic.
    console.error('[Bot] A non-fatal error occurred:', err);
  });

  bot.on('end', (reason) => {
    const wasOnline = botState.isOnline;
    botState.isOnline = false;
    pluginsInitialized = false; // Reset the flag

    // Clean up all listeners to prevent memory leaks
    if(bot) bot.removeAllListeners();

    if (wasOnline) {
      // If the bot was fully connected and then disconnected, it's a critical event.
      // We exit the process to ensure all resources (web servers, etc.) are cleaned up
      // and the service manager can restart the bot in a pristine state.
      console.log(`[Bot] Disconnected from an active session. Reason: ${reason}. Exiting for a clean restart.`);
      const embed = new EmbedBuilder().setColor(0xFF5555).setTitle('❌ Bot Disconnected').setDescription(`**Reason:** ${reason}. The bot will now restart.`);
      sendMessageToChannel(embed);
      process.exit(0);
    } else {
      // If the bot was never online, it means the initial connection failed.
      // This is common with temporary network issues, so we will retry internally.
      console.log(`[Bot] Failed to connect. Reason: ${reason}. Retrying in 10 seconds...`);
      const embed = new EmbedBuilder().setColor(0xFFA500).setTitle('⚠️ Connection Failed').setDescription(`**Reason:** ${reason}. Retrying in 10s...`);
      sendMessageToChannel(embed);
      setTimeout(createBot, 10000);
    }
  });
}

// --- Graceful Shutdown ---
async function shutdown() {
  console.log('[System] Shutting down...');
  if (config.ngrokAuthToken) {
    console.log('[ngrok] Disconnecting tunnel...');
    await ngrok.disconnect();
    console.log('[ngrok] Tunnel disconnected.');
  }
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);


// --- Initial Setup ---
async function start() {
  // Forcefully terminate any lingering ngrok processes on startup
  await ngrok.kill();

  await proxyManager.initialize();
  initDiscord(botState, config);
  createBot();
}

start();
