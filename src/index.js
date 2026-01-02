require('dotenv').config();
const mineflayer = require('mineflayer');
const http = require('http');
const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { Server } = require("socket.io");
const { initDiscord, setDiscordChannel, sendMessageToChannel, updateBotInstance, EmbedBuilder, getClient: getDiscordClient } = require('./discord');
const proxyManager = require('./proxyManager');
const configManager = require('./config');

// --- Plugin Imports ---
const autoAuth = require('mineflayer-auto-auth');
const { mineflayer: viewer } = require('prismarine-viewer');
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
const io = new Server(server, { path: '/socket.io' });

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Serve the correct dashboard based on the environment variable
app.get('/', (req, res) => {
    console.log(`[Server] Handling request. DASHBOARD_MODE is currently: '${process.env.DASHBOARD_MODE}'`);
    if (process.env.DASHBOARD_MODE === 'simple') {
        console.log('[Server] Serving simple.html');
        res.sendFile(path.join(__dirname, '../public/simple.html'));
    } else {
        console.log('[Server] Serving index.html');
        res.sendFile(path.join(__dirname, '../public/index.html'));
    }
});

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

    setDiscordChannel(config);
    setupProxies(config); // Re-add the proxy setup

    const mainPort = config.mainDashboardPort || 8080;
    server.listen(mainPort, () => {
        const localUrl = `http://localhost:${mainPort}`;
        console.log(`[Dashboard] Main dashboard listening on ${localUrl}`);
    });

    createBot(config);
}

// --- Helper Functions ---
function setupProxies(config) {
    const viewerPort = config.viewerPort || 3001;
    const inventoryPort = config.inventoryPort || 3002;

    const onProxyError = (err, req, res) => {
        console.error(`[Proxy] Error for ${req.url}:`, err);
        res.writeHead(500).end('Proxy error.');
    };

    app.use('/viewer', createProxyMiddleware({
        target: `http://localhost:${viewerPort}`,
        ws: true,
        changeOrigin: true,
        pathRewrite: { '^/viewer': '' },
        onError: onProxyError,
        logLevel: 'debug',
    }));

    app.use('/inventory', createProxyMiddleware({
        target: `http://localhost:${inventoryPort}`,
        ws: true,
        changeOrigin: true,
        pathRewrite: { '^/inventory': '' },
        onError: onProxyError,
        logLevel: 'debug',
    }));
}

function shutdownPlugins() {
    if (viewerInstance) viewerInstance.close();
    if (inventoryInstance) inventoryInstance.close();
    viewerInstance = inventoryInstance = null;
    pluginsInitialized = false;
}

async function createBot(config) {
    console.log(`[Bot] Connecting to ${config.serverAddress}:${config.serverPort}...`);

    const botOptions = {
        host: config.serverAddress,
        port: parseInt(config.serverPort, 10),
        username: config.authMethod === 'microsoft' ? config.microsoftEmail : config.botUsername,
        auth: config.authMethod,
        version: config.serverVersion || false,
        plugins: [{ plugin: autoAuth, options: { password: config.serverPassword } }],
    };

    if (config.useProxy) {
        const proxyAgent = await proxyManager.getProxyAgent();
        if (proxyAgent) {
            console.log('[Bot] Connecting with proxy...');
            botOptions.agent = proxyAgent;
        } else {
            console.warn('[Bot] Proxy enabled, but no working proxy found. Connecting directly.');
        }
    }

    bot = mineflayer.createBot(botOptions);

    bot.once('spawn', () => {
        console.log('[Bot] Spawn event fired. Initializing plugins...');
        if (pluginsInitialized) return;
        try {
            const viewerPort = config.viewerPort || 3001;
            const inventoryPort = config.inventoryPort || 3002;
            viewer(bot, { port: viewerPort, firstPerson: false });
            inventoryInstance = webInventory(bot, { port: inventoryPort });
            pluginsInitialized = true;
            console.log('[System] Plugins initialized successfully.');
        } catch (err) {
            console.error('[System] CRITICAL: Plugin initialization failed. Exiting.', err);
            process.exit(1);
        }
    });

    updateBotInstance(bot);
    attachBotListeners(config);
}

function attachBotListeners(config) {
    bot.on('login', () => {
        console.log(`[Bot] Logged in as '${bot.username}'.`);
        botState.isOnline = true;
    });

    bot.on('end', (reason) => {
        console.log(`[Bot] Disconnected. Reason: ${reason}. Reconnecting in 10s...`);
        botState.isOnline = false;
        shutdownPlugins();
        if(bot) bot.removeAllListeners();
        setTimeout(() => createBot(config), 10000);
    });

    bot.on('error', (err) => console.error('[Bot] A non-fatal error occurred:', err));
    bot.on('kicked', (reason) => console.log('[Bot] Kicked from server. Reason:', reason));

    // Periodically send state to the dashboard
    setInterval(() => {
        if (!bot || !botState.isOnline) return;
        botState.health = bot.health;
        botState.hunger = bot.food;
        if (bot.entity) {
            botState.position = bot.entity.position.floored();
        }
        io.emit('bot-state', botState)
    }, 1000);
}

// --- Socket.IO Listeners ---
io.on('connection', (socket) => {
    console.log(`[Socket] New connection: ${socket.id}`);
    socket.emit('bot-state', botState); // Send initial state

    socket.on('send-chat-message', ({ message }) => {
        if (bot && botState.isOnline && message) bot.chat(message);
    });

    socket.on('toggle-perspective', () => {
        if (bot && bot.viewer) bot.viewer.toggle();
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
    process.exit(0);
});

start();
