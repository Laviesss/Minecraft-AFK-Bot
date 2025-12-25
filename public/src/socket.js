import io from 'socket.io-client';

const socket = io();

export const onStateUpdate = (callback) => {
  socket.on('state', callback);
};

export const onChatUpdate = (callback) => {
  socket.on('chat', callback);
};

export const onValidationResult = (callback) => {
    socket.on('validation-result', callback);
};

export const onInventoryUpdate = (callback) => {
    socket.on('inventory-update', callback);
};

export const onMinimapUpdate = (callback) => {
    socket.on('minimap-update', callback);
};

export const emitSendMessage = (message) => {
  socket.emit('chat-message', message);
};

export const emitToggleAfk = () => {
  socket.emit('toggle-afk');
};

export const emitValidateProxies = () => {
    socket.emit('validate-proxies');
};

export const emitReconnect = () => {
    socket.emit('reconnect-bot');
};

export const emitUseItem = () => {
    socket.emit('use-item');
};

export const emitLookAtPlayer = () => {
    socket.emit('look-at-player');
};

export const emitGetInventory = () => {
    socket.emit('get-inventory');
};

export const emitGetMinimap = () => {
    socket.emit('get-minimap');
};

export const emitMove = (direction) => {
    socket.emit('move', direction);
};

export const emitStopMove = () => {
    socket.emit('stop-move');
};
