const { mineflayer: viewer } = require('prismarine-viewer');

let viewerInstance = null;

function startViewer(bot, port) {
    if (viewerInstance) {
        console.log('[Viewer] Viewer is already running.');
        return;
    }
    try {
        console.log(`[Viewer] Initializing Viewer on port ${port}.`);
        // The viewer plugin attaches its instance to bot.viewer
        viewer(bot, { port, firstPerson: false });
        viewerInstance = bot.viewer;
        if (!viewerInstance) {
             console.error('[Viewer] CRITICAL: bot.viewer was not created after initialization.');
        }
    } catch (err) {
        console.error('[Viewer] CRITICAL: Failed to start prismarine-viewer.', err);
        viewerInstance = null;
    }
}

function stopViewer() {
    if (viewerInstance && typeof viewerInstance.close === 'function') {
        console.log('[Viewer] Closing viewer server.');
        viewerInstance.close();
        viewerInstance = null;
    } else {
        console.log('[Viewer] Viewer instance not found or does not have a close method.');
    }
}

module.exports = { startViewer, stopViewer };
