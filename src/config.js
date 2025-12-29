const fs = require('fs').promises;
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '..', 'bot-config.json');

let currentConfig = null;

/**
 * Checks if the bot configuration file exists.
 * @returns {Promise<boolean>}
 */
async function isConfigured() {
    try {
        await fs.access(CONFIG_PATH);
        return true;
    } catch {
        return false;
    }
}

/**
 * Loads the configuration from bot-config.json.
 * @returns {Promise<object|null>}
 */
async function loadConfig() {
    if (currentConfig) return currentConfig;
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
