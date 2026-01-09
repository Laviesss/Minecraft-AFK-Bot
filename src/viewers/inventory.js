const webInventory = require('mineflayer-web-inventory');

let inventoryInstance = null;

function startInventory(bot, port) {
    if (inventoryInstance) {
        console.log('[Inventory] Inventory server is already running.');
        return;
    }
    try {
        console.log(`[Inventory] Initializing Inventory on port ${port}.`);
        inventoryInstance = webInventory(bot, { port });
    } catch (err) {
        console.error('[Inventory] CRITICAL: Failed to start mineflayer-web-inventory.', err);
        inventoryInstance = null;
    }
}

function stopInventory() {
    if (inventoryInstance && typeof inventoryInstance.close === 'function') {
        console.log('[Inventory] Closing inventory server.');
        inventoryInstance.close();
        inventoryInstance = null;
    } else {
        console.log('[Inventory] Inventory instance not found or does not have a close method.');
    }
}

module.exports = { startInventory, stopInventory };
