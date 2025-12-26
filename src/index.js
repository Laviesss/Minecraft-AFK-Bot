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
const radar = require('mineflayer-radar');
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
  radarPort: parseInt(process.env.RADAR_PORT || 3003, 10),
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

// --- Web Server & Reverse Proxy Setup ---
const app = express();
const server = http.createServer(app);

// Proxy requests to the plugin servers
app.use('/viewer', createProxyMiddleware({ target: `http://localhost:${config.viewerPort}`, ws: true }));
app.use('/inventory', createProxyMiddleware({ target: `http://localhost:${config.inventoryPort}`, ws: true }));
app.use('/radar', createProxyMiddleware({ target: `http://localhost:${config.radarPort}`, ws: true }));

// Serve the main dashboard file
app.use(express.static(path.join(__dirname, '../public')));

server.listen(config.mainDashboardPort, () => {
  const localUrl = `http://localhost:${config.mainDashboardPort}`;
  console.log(`[Dashboard] Main dashboard listening on ${localUrl}`);

  if (config.ngrokAuthToken) {
    console.log('[ngrok] Authenticating and starting tunnel...');
    ngrok.authtoken(config.ngrokAuthToken);
    ngrok.connect(config.mainDashboardPort).then(url => {
      botState.dashboardUrl = url;
      console.log(`[ngrok] Tunnel established. Public dashboard is available at: ${url}`);
    }).catch(err => {
      console.error('[ngrok] Error starting tunnel:', err);
    });
  } else if (process.env.RENDER_EXTERNAL_URL) {
    botState.dashboardUrl = process.env.RENDER_EXTERNAL_URL;
    console.log(`[Dashboard] Render dashboard available at ${botState.dashboardUrl}`);
  } else {
    botState.dashboardUrl = localUrl;
  }
});


// --- Mineflayer Bot Logic ---
let bot;

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
    console.log(`[Viewer] Starting viewer on port ${config.viewerPort}`);
    viewer(bot, { port: config.viewerPort, firstPerson: false });

    console.log(`[Inventory] Starting web inventory on port ${config.inventoryPort}`);
    webInventory(bot, { port: config.inventoryPort });

    console.log(`[Radar] Starting radar on port ${config.radarPort}`);
    radar(bot, { port: config.radarPort });
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

  bot.on('error', (err) => console.error('[Bot] Error:', err));

  bot.on('end', (reason) => {
    console.log(`[Bot] Disconnected. Reason: ${reason}. Reconnecting in 10 seconds...`);
    botState.isOnline = false;

    const embed = new EmbedBuilder()
        .setColor(0xFF5555)
        .setTitle('❌ Bot Disconnected')
        .setDescription(`**Reason:** ${reason}. Reconnecting in 10s...`);
    sendMessageToChannel(embed);

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
