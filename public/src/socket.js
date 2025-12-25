import { io } from "socket.io-client";

const socket = io();

export const onStateUpdate = (callback) => {
    socket.on('state', callback);
};

export const onChatUpdate = (callback) => {
    socket.on('chat', callback);
};

export const onValidationResult = (callback) => {
    socket.on('validation-result', callback);
}

export const emitSendMessage = (message) => {
    socket.emit('chat-message', message);
};

export const emitToggleAfk = () => {
    socket.emit('toggle-afk');
};

export const emitValidateProxies = () => {
    socket.emit('validate-proxies');
};

// --- New Admin Actions ---
export const emitReconnect = () => {
    socket.emit('reconnect-bot');
};

export const emitRespawn = () => {
    socket.emit('force-respawn');
};

export const emitDropInventory = () => {
    socket.emit('drop-inventory');
};
