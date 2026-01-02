const fs = require('fs').promises;
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '..', 'bot-config.json');

let currentConfig = null;

function isDeveloperMode() {
    // Check for the specific mode flag which is the source of truth for developer mode.
    return process.env.DASHBOARD_MODE === 'simple';
}

function loadDevConfig() {
    console.log('[Config] Developer mode detected. Loading configuration from .env file.');

    return {
        serverAddress: process.env.MINECRAFT_HOST,
        serverPort: process.env.MINECRAFT_PORT || '25565',
        serverVersion: process.env.MINECRAFT_VERSION || false,
        authMethod: process.env.AUTH_METHOD || 'mojang', // Default to mojang for dev mode
        microsoftEmail: null, // Not used in mojang auth
        botUsername: process.env.MINECRAFT_USERNAME,
        serverPassword: process.env.SERVER_PASSWORD || null,
        adminUsernames: [],
        useProxy: false,
        discordToken: process.env.DISCORD_TOKEN,
        discordChannelId: process.env.DISCORD_CHANNEL_ID,
        mainDashboardPort: process.env.MAIN_DASHBOARD_PORT || 8080,
        viewerPort: process.env.VIEWER_PORT || 3001,
        inventoryPort: process.env.INVENTORY_PORT || 3002,
        dashboardMode: process.env.DASHBOARD_MODE || 'full',
    };
}

async function isConfigured() {
    if (isDeveloperMode()) return true;
    try {
        await fs.access(CONFIG_PATH);
        return true;
    } catch {
        return false;
    }
}

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

async function saveConfig(configData) {
    try {
        const { discordToken, ...configToSave } = configData;
        await fs.writeFile(CONFIG_PATH, JSON.stringify(configToSave, null, 2));
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
    isDeveloperMode,
};
