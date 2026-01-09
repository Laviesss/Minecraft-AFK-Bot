const express = require('express');
const configManager = require('../config/configManager');
const { getClient: getDiscordClient } = require('../discord');

const router = express.Router();

// Note: express.json() middleware will be applied in the main index.js
// before this router is mounted.

router.get('/status', async (req, res) => {
    res.json({ configured: await configManager.isConfigured() });
});

router.post('/setup', async (req, res) => {
    try {
        const success = await configManager.saveConfig(req.body);
        if (success) {
            res.json({ success: true });
            console.log('[System] Config saved. Restarting server...');
            // Gracefully restart the process to apply new config
            setTimeout(() => process.exit(0), 1000);
        } else {
            throw new Error('Failed to save config file.');
        }
    } catch (error) {
        console.error('[API] Error during setup:', error);
        res.status(500).json({ success: false, message: error.message || 'An internal error occurred.' });
    }
});

router.get('/discord/invite', (req, res) => {
    const discordClient = getDiscordClient();
    if (discordClient && discordClient.isReady()) {
        const inviteLink = `https://discord.com/oauth2/authorize?client_id=${discordClient.user.id}&permissions=2147485696&scope=bot%20applications.commands`;
        res.json({ inviteLink });
    } else {
        res.status(503).json({ error: 'Discord bot not ready or disabled.' });
    }
});

// The /log endpoint will also be handled here for consistency.
router.post('/log', (req, res) => {
    // Basic validation
    if (!req.body || typeof req.body.message !== 'string') {
        return res.status(400).send('Invalid log format.');
    }
    console.log(`[${req.body.panel || 'Client'}]`, req.body.message, req.body.data || '');
    res.sendStatus(200);
});


module.exports = router;
