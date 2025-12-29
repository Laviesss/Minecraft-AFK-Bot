require('dotenv').config();
const mineflayer = require('mineflayer');
const http = require('http');
const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');
const ngrok = require('ngrok');
const { Server } = require("socket.io");
const { initDiscord, setDiscordChannel, sendMessageToChannel, updateBotInstance, EmbedBuilder, getClient: getDiscordClient } = require('./discord');
const proxyManager = require('./proxyManager');
const configManager = require('./config');

// --- Plugin Imports ---
const autoAuth = require('mineflayer-auto-auth');
const viewer = require('prismarine-viewer').mineflayer;
const webInventory = require('mineflayer-web-inventory');

// --- Global State ---
let bot;
let viewerInstance;
let inventoryInstance;
let pluginsInitialized = false;
let botState = {
    isOnline: false,
    health: 20,
    hunger: 20,
    position: { x: 0, y: 0, z: 0 },
};

// --- Main Application ---
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// --- API Endpoints ---
app.get('/api/status', async (req, res) => {
    res.json({ configured: await configManager.isConfigured() });
});

app.post('/api/setup', async (req, res) => {
    if (await configManager.saveConfig(req.body)) {
        res.json({ success: true });
        console.log('[System] Config saved. Restarting...');
        setTimeout(() => process.exit(0), 1000);
    } else {
        res.status(500).json({ success: false, message: 'Failed to save config.' });
    }
});

app.get('/api/discord/invite', (req, res) => {
    const discordClient = getDiscordClient();
    if (discordClient && discordClient.isReady()) {
        const inviteLink = `https://discord.com/oauth2/authorize?client_id=${discordClient.user.id}&permissions=2147485696&scope=bot%20applications.commands`;
        res.json({ inviteLink });
    } else {
        res.status(503).json({ error: 'Discord bot not ready or disabled.' });
    }
});

// --- Main Start Function ---
async function start() {
    console.log('[System] Starting application...');
    await initDiscord(botState); // Initialize Discord immediately

    if (await configManager.isConfigured()) {
        startFullApplication();
    } else {
        startWebServerOnly();
    }
}

// --- Startup Modes ---
function startWebServerOnly() {
    server.listen(process.env.PORT || 8080, () => {
        console.log(`[Dashboard] Setup server listening on http://localhost:${process.env.PORT || 8080}`);
    });
}

async function startFullApplication() {
    const config = await configManager.loadConfig();
    if (!config) {
        console.error('[System] CRITICAL: Failed to load configuration.');
        return;
    }

    setDiscordChannel(config); // Set the channel now that we have the config
    setupProxies(config);
    server.listen(config.mainDashboardPort || 8080, () => {
        const localUrl = `http://localhost:${config.mainDashboardPort || 8080}`;
        console.log(`[Dashboard] Main dashboard listening on ${localUrl}`);
        startNgrok(config, localUrl);
    });

    createBot(config);
}

// --- Helper Functions ---
function setupProxies(config) {
    const onProxyError = (err, req, res) => {
        console.error('[Proxy] Error:', err);
        res.writeHead(500).end('Proxy error.');
    };
    app.use('/viewer', createProxyMiddleware({ target: `http://localhost:${config.viewerPort || 3001}`, ws: true, changeOrigin: true, pathRewrite: { '^/viewer': '' }, onError: onProxyError }));
    app.use('/inventory', createProxyMiddleware({ target: `http://localhost:${config.inventoryPort || 3002}`, ws: true, changeOrigin: true, pathRewrite: { '^/inventory': '' }, onError: onProxyError }));
}

async function startNgrok(config, localUrl) {
    if (config.ngrokAuthToken) {
        console.log('[ngrok] NGROK_AUTH_TOKEN found. Starting tunnel...');
        try {
            await ngrok.kill();
            await ngrok.authtoken(config.ngrokAuthToken);
            const url = await ngrok.connect(config.mainDashboardPort || 8080);
            botState.dashboardUrl = url;
            console.log(`[ngrok] Tunnel established at: ${url}`);
        } catch (err) {
            console.error('[ngrok] CRITICAL ERROR:', err.message);
            botState.dashboardUrl = localUrl;
        }
    }
}

function shutdownPlugins() {
    if (viewerInstance) viewerInstance.close();
    if (inventoryInstance) inventoryInstance.close();
    viewerInstance = inventoryInstance = null;
    pluginsInitialized = false;
}

function createBot(config) {
    console.log(`[Bot] Connecting to ${config.serverAddress}:${config.serverPort}...`);
    bot = mineflayer.createBot({
        host: config.serverAddress,
        port: parseInt(config.serverPort, 10),
        username: config.authMethod === 'microsoft' ? config.microsoftEmail : config.botUsername,
        auth: config.authMethod,
        version: config.serverVersion || false,
        plugins: [{ plugin: autoAuth, options: { password: config.serverPassword } }],
    });
    updateBotInstance(bot);
    attachBotListeners(config);
}

function attachBotListeners(config) {
    bot.on('login', () => {
        console.log(`[Bot] Logged in as '${bot.username}'.`);
        botState.isOnline = true;
    });

    bot.on('spawn', () => {
        console.log('[Bot] Spawned into world.');
        if (pluginsInitialized) return;
        try {
            console.log('[System] Initializing plugins...');
            viewerInstance = viewer(bot, { port: config.viewerPort || 3001, firstPerson: false });
            inventoryInstance = webInventory(bot, { port: config.inventoryPort || 3002 });
            pluginsInitialized = true;
        } catch (err) {
            console.error('[System] CRITICAL: Plugin initialization failed. Exiting.', err);
            process.exit(1);
        }
    });

    bot.on('end', (reason) => {
        console.log(`[Bot] Disconnected. Reason: ${reason}. Reconnecting in 10s...`);
        botState.isOnline = false;
        shutdownPlugins();
        if(bot) bot.removeAllListeners();
        setTimeout(() => createBot(config), 10000);
    });

    bot.on('health', () => {
        botState.health = bot.health;
        botState.hunger = bot.food;
    });

    bot.on('move', () => {
        botState.position = bot.entity.position.floored();
    });

    bot.on('chat', (username, message) => {
        if (username === bot.username) return;
        io.emit('chat-message', { message: `<${username}> ${message}` });
    });

    bot.on('error', (err) => console.error('[Bot] A non-fatal error occurred:', err.message));

    // Periodically send state to the dashboard
    setInterval(() => io.emit('bot-state', botState), 1000);
}

// --- Socket.IO Listeners ---
io.on('connection', (socket) => {
    console.log(`[Socket] New connection: ${socket.id}`);
    socket.emit('bot-state', botState); // Send initial state

    socket.on('send-chat-message', ({ message }) => {
        if (bot && botState.isOnline && message) bot.chat(message);
    });

    socket.on('toggle-perspective', () => {
        if (viewerInstance) viewerInstance.toggle();
    });

    socket.on('move', ({ direction }) => {
        if (bot && botState.isOnline) bot.setControlState(direction, true);
    });

    socket.on('stop-move', () => {
        if (bot && botState.isOnline) bot.clearControlStates();
    });
});

// --- Graceful Shutdown ---
process.on('SIGINT', async () => {
    await ngrok.kill();
    process.exit(0);
});

start();
