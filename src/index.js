require('dotenv').config();

// --- Stability: Unhandled Rejection Handler ---
// Catches unhandled promise rejections from dependencies (e.g., Mineflayer)
// and prevents them from crashing the entire application.
process.on('unhandledRejection', (reason, promise) => {
  console.error('[FATAL] Unhandled Rejection at:', promise, 'reason:', reason);
});

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
    maxHealth: 20,
    hunger: 20,
    position: { x: 0, y: 0, z: 0 },
};

// --- Main Application ---
const app = express();
const server = http.createServer(app);
const io = new Server(server, { path: '/socket.io' });

app.use(express.json());

// --- API Endpoints ---
app.post('/log', (req, res) => {
    // This endpoint is for client-side logging from the iframes.
    console.log(`[${req.body.panel || 'Client'}]`, req.body.message, req.body.data || '');
    res.sendStatus(200);
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

    // --- Middleware Registration (Non-Negotiable Order) ---

    // 1. Proxy Middleware FIRST
    // These routes must be isolated and handled before any other middleware.
    const inventoryTargetPort = config.viewerPort || 3001;
    const viewerTargetPort = config.inventoryPort || 3002;

    const onProxyError = (err, req, res) => {
        console.error(`[Proxy] Error for ${req.url}:`, err.code || err.message);
        if (res.writeHead && !res.headersSent) {
            res.writeHead(502, { 'Content-Type': 'text/plain' });
        }
        if (!res.headersSent) {
            res.end('Proxy error: Could not connect to plugin service.');
        }
    };

    app.use('/inventory', createProxyMiddleware({
        target: `http://localhost:${inventoryTargetPort}`,
        ws: true,
        pathRewrite: { '^/inventory': '' }, // Isolate plugin path by rewriting the base path.
        onError: onProxyError,
    }));

    app.use('/viewer', createProxyMiddleware({
        target: `http://localhost:${viewerTargetPort}`,
        ws: true,
        pathRewrite: { '^/viewer': '' }, // Isolate plugin path by rewriting the base path.
        onError: onProxyError,
    }));

    // 2. React Static Assets SECOND
    // Serve the compiled React app assets from the 'public' directory.
    const publicDir = path.join(__dirname, '../public');
    app.use(express.static(publicDir));

    // 3. SPA Fallback LAST
    // This route MUST come after all other routes (proxies, static files, APIs).
    app.get(/(.*)/, (req, res) => {
        // Exclude specific backend routes from being handled by the SPA.
        if (
            req.path.startsWith('/inventory') ||
            req.path.startsWith('/viewer') ||
            req.path.startsWith('/socket.io') ||
            req.path.startsWith('/api')
        ) {
            return res.sendStatus(404);
        }

        // For any other path, serve the main index.html and let React Router handle it.
        res.sendFile(path.join(publicDir, 'index.html'));
    });

    const mainPort = config.mainDashboardPort || 8080;
    server.listen(mainPort, () => {
        const localUrl = `http://localhost:${mainPort}`;
        console.log(`[Dashboard] Main dashboard listening on ${localUrl}`);
    });

    createBot(config);
}

// --- Helper Functions ---

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

    try {
        bot = mineflayer.createBot(botOptions);
    } catch (err) {
        console.error('[Bot] CRITICAL: mineflayer.createBot() failed.', err);
        console.log('[Bot] Reconnecting in 10s...');
        setTimeout(() => createBot(config), 10000);
        return;
    }

    bot.once('spawn', () => {
        // IMPORTANT: The viewer and inventory web servers are only initialized AFTER the bot
        // successfully connects to the Minecraft server and the 'spawn' event is emitted.
        // Until then, the Express proxies for /viewer and /inventory will correctly fail
        // with connection errors, which is the expected behavior when the bot is offline.
        console.log('[Bot] Spawn event fired. Initializing plugins...');
        if (pluginsInitialized) return;
        try {
            // Correctly assign ports based on the configuration.
            const viewerPort = config.inventoryPort || 3002; // Viewer plugin runs on the inventoryPort from config
            const inventoryPort = config.viewerPort || 3001;   // Inventory plugin runs on the viewerPort from config

            console.log(`[System] Initializing Viewer on port ${viewerPort} and Inventory on port ${inventoryPort}.`);

            viewer(bot, { port: viewerPort, firstPerson: false });
            inventoryInstance = webInventory(bot, { port: inventoryPort });

            pluginsInitialized = true;
            console.log('[System] Plugins initialized successfully.');
        } catch (err) {
            console.error('[System] CRITICAL: Plugin initialization failed.', err);
            // Do not exit the process, to allow for reconnection attempts.
        }
    });

    updateBotInstance(bot);
    attachBotListeners(config);
}

function attachBotListeners(config) {
    bot.on('login', () => {
        const botSocket = bot._client.socket;
        const address = botSocket ? `${botSocket.remoteAddress}:${botSocket.remotePort}` : 'N/A';
        console.log(`[Bot] Successfully logged in as '${bot.username}' to [${address}].`);
        botState.isOnline = true;
    });

    bot.on('end', (reason) => {
        console.log(`[Bot] Disconnected. Reason: ${reason}. Reconnecting in 10s...`);
        botState.isOnline = false;
        io.emit('bot-state', { isOnline: false });
        shutdownPlugins();
        if(bot) bot.removeAllListeners();
        setTimeout(() => createBot(config), 10000);
    });

    bot.on('error', (err) => {
        console.error('[Bot] A bot error occurred:', err);
        // Also send a system message to the dashboard
        io.emit('chat-message', {
            sender: 'System',
            message: `Bot connection error: ${err.message || err.code}`,
            type: 'system',
            timestamp: new Date().toLocaleTimeString()
        });
    });

    bot.on('message', (jsonMsg) => {
        const message = jsonMsg.toString().trim();
        if (!message) return; // Don't send empty messages
        console.log(`[Chat] Broadcasting: ${message}`);
        io.emit('chat-message', { message });
    });

    bot.on('kicked', (reason) => {
        console.log('[Bot] Kicked from server. Reason:', reason);
        io.emit('chat-message', {
            sender: 'System',
            message: `Kicked from server: ${reason}`,
            type: 'system',
            timestamp: new Date().toLocaleTimeString()
        });
    });

    // Periodically send state to the dashboard
    setInterval(() => {
        if (!bot || !botState.isOnline) return;
        botState.health = bot.health;
        botState.maxHealth = bot.maxHealth;
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

    socket.on('terminate', () => {
        console.log('[System] Received terminate signal from dashboard.');
        if (bot) bot.quit('Dashboard reset.');
    });
});

// --- Graceful Shutdown ---
process.on('SIGINT', async () => {
    process.exit(0);
});

start();
