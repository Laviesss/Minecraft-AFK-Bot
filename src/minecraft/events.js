// Centralized bot state management
const botState = {
    isOnline: false,
    health: 20,
    maxHealth: 20,
    hunger: 20,
    position: { x: 0, y: 0, z: 0 },
};

function getBotState() {
    return botState;
}

function attachBotListeners(bot, config, io, reconnect, shutdownPlugins) {
    bot.on('login', () => {
        const botSocket = bot._client.socket;
        const address = botSocket ? `${botSocket.remoteAddress}:${botSocket.remotePort}` : 'N/A';
        console.log(`[Bot] Successfully logged in as '${bot.username}' to [${address}].`);
        botState.isOnline = true;
    });

    bot.on('end', (reason) => {
        console.log(`[Bot] Disconnected. Reason: ${reason}.`);
        botState.isOnline = false;
        io.emit('bot-state', { isOnline: false });
        if (shutdownPlugins) shutdownPlugins();
        reconnect();
    });

    bot.on('error', (err) => {
        console.error('[Bot] A bot error occurred:', err);
        io.emit('chat-message', {
            sender: 'System',
            message: `Bot connection error: ${err.message || err.code}`,
            type: 'system',
            timestamp: new Date().toLocaleTimeString()
        });
    });

    bot.on('message', (jsonMsg) => {
        const message = jsonMsg.toString().trim();
        if (!message) return;
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

    // Bot state updater
    setInterval(() => {
        if (!bot || !bot.entity || !botState.isOnline) return;
        botState.health = bot.health;
        botState.maxHealth = bot.maxHealth;
        botState.hunger = bot.food;
        botState.position = bot.entity.position.floored();
        io.emit('bot-state', botState)
    }, 1000);
}

module.exports = { attachBotListeners, getBotState };
