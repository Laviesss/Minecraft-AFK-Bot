const mineflayer = require('mineflayer');
const autoAuth = require('mineflayer-auto-auth');
const proxyManager = require('../proxyManager');
const { attachBotListeners } = require('./events');
const { updateBotInstance } = require('../discord');

let bot = null;

function getBot() {
    return bot;
}

async function createBot(config, io, initializePlugins, shutdownPlugins) {
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
        const proxy = proxyManager.getNextProxy();
        if (proxy && proxy.agent) {
            botOptions.agent = proxy.agent;
            console.log(`[Bot] Connecting via proxy: ${proxy.proxy}`);
        } else {
            console.warn('[Bot] Proxy enabled, but no working proxy is available. Connecting directly.');
        }
    }

    try {
        bot = mineflayer.createBot(botOptions);
    } catch (err) {
        console.error('[Bot] CRITICAL: mineflayer.createBot() failed.', err);
        reconnect(config, io, initializePlugins, shutdownPlugins);
        return;
    }

    // Abstracted plugin initialization
    bot.once('spawn', () => {
        if (initializePlugins) {
            initializePlugins(bot);
        }
    });

    updateBotInstance(bot);
    const reconnectCallback = () => reconnect(config, io, initializePlugins, shutdownPlugins);
    attachBotListeners(bot, config, io, reconnectCallback, shutdownPlugins);
}

function reconnect(config, io, initializePlugins, shutdownPlugins) {
    console.log('[Bot] Reconnecting in 10s...');
    if (bot) {
        bot.removeAllListeners();
        bot = null;
    }
    setTimeout(() => createBot(config, io, initializePlugins, shutdownPlugins), 10000);
}

module.exports = { createBot, getBot };