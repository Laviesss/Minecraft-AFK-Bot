const { Server } = require("socket.io");
const { getBot } = require('../minecraft/bot');
const { getBotState } = require('../minecraft/events');

let io = null;

function initSockets(server) {
    io = new Server(server, { path: '/socket.io' });

    io.on('connection', (socket) => {
        const bot = getBot();
        const botState = getBotState();

        console.log(`[Socket] New connection: ${socket.id}`);
        socket.emit('bot-state', botState);

        socket.on('send-chat-message', ({ message }) => {
            const bot = getBot(); // Re-fetch bot instance in case of reconnect
            if (bot && getBotState().isOnline && message) {
                bot.chat(message);
            }
        });

        socket.on('toggle-perspective', () => {
            const bot = getBot();
            if (bot && bot.viewer) {
                bot.viewer.toggle();
            }
        });

        socket.on('move', ({ direction }) => {
            const bot = getBot();
            if (bot && getBotState().isOnline) {
                bot.setControlState(direction, true);
            }
        });

        socket.on('stop-move', () => {
            const bot = getBot();
            if (bot && getBotState().isOnline) {
                bot.clearControlStates();
            }
        });

        socket.on('terminate', () => {
            const bot = getBot();
            console.log('[System] Received terminate signal from dashboard.');
            if (bot) {
                bot.quit('Dashboard reset.');
            }
        });
    });

    return io;
}

function getIo() {
    if (!io) {
        throw new Error("Socket.IO not initialized. Call initSockets first.");
    }
    return io;
}

module.exports = { initSockets, getIo };
