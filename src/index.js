require('dotenv').config();
const mineflayer = require('mineflayer');
const http = require('http');
const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { Server } = require("socket.io");
const { initDiscord, setDiscordChannel, updateBotInstance } = require('./discord');
const configManager = require('./config');
const autoAuth = require('mineflayer-auto-auth');
const { mineflayer: viewer } = require('prismarine-viewer');
const webInventory = require('mineflayer-web-inventory');

let bot;
let pluginsInitialized = false;
let botState = { isOnline: false, health: 20, hunger: 20, position: { x: 0, y: 0, z: 0 } };

const app = express();
const server = http.createServer(app);
const io = new Server(server, { path: '/socket.io' });

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.get('/', async (req, res) => {
    try {
        const config = await configManager.loadConfig();
        if (configManager.isDeveloperMode() && config && config.dashboardMode === 'simple') {
            res.sendFile(path.join(__dirname, '../public/simple.html'));
        } else {
            res.sendFile(path.join(__dirname, '../public/index.html'));
        }
    } catch (error) {
        console.error('[Server] Error serving dashboard:', error);
        res.status(500).send('Error loading dashboard.');
    }
});

app.get('/api/status', async (req, res) => res.json({ configured: await configManager.isConfigured() }));

app.post('/api/setup', async (req, res) => {
    if (await configManager.saveConfig(req.body)) {
        res.json({ success: true });
        console.log('[System] Config saved. Restarting...');
        setTimeout(() => process.exit(0), 1000);
    } else {
        res.status(500).json({ success: false, message: 'Failed to save config.' });
    }
});

function createBot(config) {
    console.log(`[Bot] Connecting to ${config.serverAddress}:${config.serverPort}...`);
    bot = mineflayer.createBot({
        host: config.serverAddress,
        port: parseInt(config.serverPort, 10),
        username: config.authMethod === 'microsoft' ? config.microsoftEmail : config.botUsername,
        auth: config.authMethod,
        version: config.serverVersion || false,
        plugins: [{ plugin: autoAuth, options: { password: config.serverPassword } }],
        hideErrors: false,
    });

    bot.on('login', () => {
        console.log(`[Bot] Logged in as '${bot.username}'.`);
        botState.isOnline = true;
        updateBotInstance(bot);
    });

    bot.once('spawn', () => {
        console.log('[Bot] Spawn event fired. Initializing plugins...');
        if (pluginsInitialized) return;
        try {
            viewer(bot, { port: config.viewerPort || 3001, firstPerson: false });
            webInventory(bot, { port: config.inventoryPort || 3002 });
            pluginsInitialized = true;
        } catch (err) {
            console.error('[System] CRITICAL: Plugin initialization failed.', err);
        }
    });

    bot.on('messagestr', (message) => message.trim() && io.emit('chat-message', { message }));
    bot.on('kicked', (reason) => console.log('[Bot] Kicked. Reason:', reason));
    bot.on('error', (err) => console.error('[Bot] A non-fatal error occurred:', err.code));

    bot.on('end', (reason) => {
        console.log(`[Bot] Disconnected. Reason: ${reason}. Reconnecting in 10s...`);
        botState.isOnline = false;
        shutdownPlugins();
        setTimeout(() => createBot(config), 10000);
    });
}

io.on('connection', (socket) => {
    socket.emit('bot-state', botState);
    socket.on('send-chat-message', ({ message }) => bot && botState.isOnline && bot.chat(message));
    socket.on('toggle-perspective', () => bot && bot.viewer && bot.viewer.toggle());
    socket.on('move', ({ direction }) => bot && bot.setControlState(direction, true));
    socket.on('stop-move', ({ direction }) => bot && bot.setControlState(direction, false));
});

// Gracefully shutdown plugins
function shutdownPlugins() {
    if (bot && bot.viewer && bot.viewer.close) {
        bot.viewer.close();
        console.log('[Viewer] Server closed.');
    }
    // mineflayer-web-inventory does not have a close method, so we just lose the reference.
    pluginsInitialized = false;
}

function runBot(config) {
    app.use('/viewer', createProxyMiddleware({ target: `http://localhost:${config.viewerPort || 3001}`, ws: true, changeOrigin: true }));
    app.use('/inventory', createProxyMiddleware({ target: `http://localhost:${config.inventoryPort || 3002}`, ws: true, changeOrigin: true }));

    setDiscordChannel(config);
    server.listen(config.mainDashboardPort || 8080, () => console.log(`[Dashboard] Listening on http://localhost:${config.mainDashboardPort || 8080}`));
    createBot(config);

    setInterval(() => {
        if (bot && bot.entity) {
            botState.health = bot.health;
            botState.hunger = bot.food;
            botState.position = bot.entity.position;
            io.emit('bot-state', botState);
        }
    }, 1000);
}

async function start() {
    console.log('[System] Starting application...');
    await initDiscord(botState);

    const isDev = configManager.isDeveloperMode();
    const config = await configManager.loadConfig();

    if (config) {
        if (isDev) console.log('[System] Developer mode detected. Starting bot from .env...');
        else console.log('[System] Config file found. Starting bot...');
        runBot(config);
    } else {
        if (isDev) {
            console.error('[System] CRITICAL: Developer mode is on but .env file is missing or invalid. Shutting down.');
            process.exit(1);
        } else {
            console.log('[System] No config file found. Starting setup server...');
            server.listen(process.env.PORT || 8080, () => console.log(`[Dashboard] Setup server listening on http://localhost:${process.env.PORT || 8080}`));
        }
    }
}

start();
