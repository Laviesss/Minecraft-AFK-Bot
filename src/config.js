const fs = require('fs').promises;
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '..', 'bot-config.json');

let currentConfig = null;

/**
 * Checks if the application is running in developer mode by checking for essential env vars.
 * @returns {boolean}
 */
function isDeveloperMode() {
    return process.env.SERVER_ADDRESS && process.env.AUTH_METHOD;
}

/**
 * Loads configuration from environment variables for developer mode.
 * @returns {object}
 */
function loadDevConfig() {
    console.log('[Config] Developer mode detected. Loading configuration from .env file.');

    // Parse the comma-separated admin usernames into an array, trimming whitespace.
    const adminUsernames = process.env.ADMIN_USERNAMES
        ? process.env.ADMIN_USERNAMES.split(',').map(name => name.trim())
        : [];

    return {
        serverAddress: process.env.SERVER_ADDRESS,
        serverPort: process.env.SERVER_PORT || '25565',
        serverVersion: process.env.SERVER_VERSION || false,
        authMethod: process.env.AUTH_METHOD,
        microsoftEmail: process.env.MICROSOFT_EMAIL,
        botUsername: process.env.BOT_USERNAME,
        serverPassword: process.env.SERVER_PASSWORD,
        adminUsernames: adminUsernames,
        useProxy: process.env.USE_PROXY === 'true',
        discordToken: process.env.DISCORD_TOKEN, // Load the Discord token
        discordChannelId: process.env.DISCORD_CHANNEL_ID,
        mainDashboardPort: process.env.MAIN_DASHBOARD_PORT || 8080,
        viewerPort: process.env.VIEWER_PORT || 3001,
        inventoryPort: process.env.INVENTORY_PORT || 3002,
    };
}

/**
 * Checks if the bot is configured, either via .env (dev mode) or bot-config.json.
 * @returns {Promise<boolean>}
 */
async function isConfigured() {
    if (isDeveloperMode()) return true;
    try {
        await fs.access(CONFIG_PATH);
        return true;
    } catch {
        return false;
    }
}

/**
 * Loads the configuration from the appropriate source (.env or bot-config.json).
 * @returns {Promise<object|null>}
 */
async function loadConfig() {
    if (currentConfig) return currentConfig;

    if (isDeveloperMode()) {
        currentConfig = loadDevConfig();
        return currentConfig;
    }

    if (!(await isConfigured())) return null;

    try {
        const data = await fs.readFile(CONFIG_PATH, 'utf8');
        currentConfig = JSON.parse(data);
        return currentConfig;
    } catch (err) {
        console.error('[Config] Error loading bot-config.json:', err);
        return null;
    }
}

/**
 * Saves the given configuration to bot-config.json.
 * @param {object} configData
 * @returns {Promise<boolean>}
 */
async function saveConfig(configData) {
    try {
        // The token is now managed by environment variables, so we ensure it's not saved in the config file.
        const { discordToken, ...configToSave } = configData;
        await fs.writeFile(CONFIG_PATH, JSON.stringify(configToSave, null, 2));

        // The in-memory config should reflect what's saved.
        currentConfig = configToSave;
        return true;
    } catch (err) {
        console.error('[Config] Error saving bot-config.json:', err);
        return false;
    }
}

module.exports = {
    isConfigured,
    loadConfig,
    saveConfig,
};
