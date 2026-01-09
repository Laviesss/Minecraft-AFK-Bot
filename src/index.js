require('dotenv').config();

// --- Stability: Unhandled Rejection Handler ---
process.on('unhandledRejection', (reason, promise) => {
    console.error('[FATAL] Unhandled Rejection at:', promise, 'reason:', reason);
    // Optionally add more robust error reporting here
});

// --- Core Imports ---
const http = require('http');
const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

// --- Modular Imports ---
const configManager = require('./config/configManager');
const proxyManager = require('./proxyManager');
const { initDiscord, setDiscordChannel } = require('./discord');
const { createBot } = require('./minecraft/bot');
const { attachBotListeners } = require('./minecraft/events');
const { startViewer, stopViewer } = require('./viewers/prismarine');
const { startInventory, stopInventory } = require('./viewers/inventory');
const { initSockets, getIo } = require('./sockets/socket');
const apiRoutes = require('./routes/api');

// --- Global State ---
let pluginsInitialized = false;

// --- Express App Initialization ---
const app = express();
const server = http.createServer(app);

// --- Main Application Start ---
async function start() {
    console.log('[System] Starting application...');

    // Initialize Discord Bot early
    await initDiscord();

    if (await configManager.isConfigured()) {
        await startFullApplication();
    } else {
        startWebServerOnly();
    }
}

// --- Startup Modes ---
function startWebServerOnly() {
    // Serve only the setup page if not configured
    app.use(express.static(path.join(__dirname, '../frontend/dist')));
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
    });

    const port = process.env.PORT || 8080;
    server.listen(port, () => {
        console.log(`[Dashboard] Setup server listening on http://localhost:${port}`);
    });
}

async function startFullApplication() {
    const config = await configManager.loadConfig();
    if (!config) {
        console.error('[System] CRITICAL: Failed to load configuration. Halting.');
        return;
    }

    // Initialize the proxy manager if enabled in config
    if (config.useProxy) {
        await proxyManager.initialize();
    }

    // --- Debug Logging Middleware ---
    if (process.env.DEBUG === 'true') {
        app.use((req, res, next) => {
            console.log(`[Debug] Incoming Request: ${req.method} ${req.path}`);
            next();
        });
    }

    // Initialize Discord channel
    setDiscordChannel(config);

    // Initialize Socket.IO and get the instance
    const io = initSockets(server);

    // --- Plugin Lifecycle Management ---
    const initializePlugins = (bot) => {
        if (pluginsInitialized) return;
        const viewerPort = parseInt(config.viewerPort, 10) || 3001;
        const inventoryPort = parseInt(config.inventoryPort, 10) || 3002;
        startViewer(bot, viewerPort);
        startInventory(bot, inventoryPort);
        pluginsInitialized = true;
        console.log('[System] Plugins initialized.');
    };

    const shutdownPlugins = () => {
        stopViewer();
        stopInventory();
        pluginsInitialized = false;
        console.log('[System] Plugins shut down.');
    };

    // --- Middleware Registration ---
    app.use(express.json());

    // Proxy Middleware
    const onProxyError = (err, req, res) => {
        console.error(`[Proxy] Error for ${req.url}:`, err.code || err.message);
        if (res.writeHead && !res.headersSent) {
            res.writeHead(502, { 'Content-Type': 'text/plain' });
        }
        if (!res.headersSent) res.end('Proxy error: Could not connect to plugin service.');
    };

    const requirePluginsInitialized = (req, res, next) => {
        if (!pluginsInitialized) {
            return res.status(503).send('Bot plugins are not ready yet. Please try again in a moment.');
        }
        next();
    };

    app.use('/viewer', requirePluginsInitialized, createProxyMiddleware({
        target: `http://localhost:${config.viewerPort || 3001}`,
        ws: true,
        pathRewrite: { '^/viewer': '' },
        onError: onProxyError,
    }));

    app.use('/inventory', requirePluginsInitialized, createProxyMiddleware({
        target: `http://localhost:${config.inventoryPort || 3002}`,
        ws: true,
        pathRewrite: { '^/inventory': '' },
        onError: onProxyError,
    }));

    // API Routes
    app.use('/api', apiRoutes);

    // Static Assets
    const publicDir = path.join(__dirname, '../frontend/dist');
    app.use(express.static(publicDir));

    // SPA Fallback Middleware
    app.use((req, res, next) => {
        // Excluded paths are already handled by their respective middleware (proxy, api, static)
        // If the request reaches here, it's a candidate for the SPA.
        if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/socket.io')) {
             if (process.env.DEBUG === 'true') {
                console.log(`[Debug] SPA Fallback serving index.html for path: ${req.path}`);
             }
             res.sendFile(path.join(publicDir, 'index.html'));
        } else {
             next();
        }
    });

    // --- Bot Creation ---
    // Reconnection is handled within the bot module itself.
    // Pass the plugin lifecycle functions to the bot creator.
    createBot(config, io, initializePlugins, shutdownPlugins);

    // --- Server Start ---
    const mainPort = config.mainDashboardPort || 8080;
    server.listen(mainPort, () => {
        console.log(`[Dashboard] Main dashboard listening on http://localhost:${mainPort}`);
    });
}

// --- Graceful Shutdown ---
process.on('SIGINT', () => {
    console.log('[System] SIGINT received. Shutting down gracefully.');
    process.exit(0);
});

// --- Start the application ---
start();
