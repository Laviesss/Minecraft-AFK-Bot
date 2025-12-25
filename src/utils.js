const { Vec3 } = require('vec3');

// --- Constants ---
const MAP_RADIUS = 2; // The radius of the map chunk to send (2 => 5x5 area)
const BLOCKS_TO_IGNORE = new Set(['air', 'cave_air', 'void_air']);

/**
 * Generates a simplified 2D minimap for the web dashboard.
 * @param {import('mineflayer').Bot} bot - The mineflayer bot instance.
 * @param {import('minecraft-data').IndexedData} mcData - The minecraft-data instance.
 * @returns {object} An object containing the map data and player position.
 */
function getWebMinimap(bot, mcData) {
  const botPos = bot.entity.position;
  const map = [];

  for (let dX = -MAP_RADIUS; dX <= MAP_RADIUS; dX++) {
    for (let dZ = -MAP_RADIUS; dZ <= MAP_RADIUS; dZ++) {
      const realX = botPos.x + dX;
      const realZ = botPos.z + dZ;
      const highestBlock = findHighestBlock(bot, realX, realZ);

      map.push({
        x: dX,
        z: dZ,
        type: highestBlock ? highestBlock.name : 'unknown',
        height: highestBlock ? highestBlock.position.y : botPos.y - 1,
      });
    }
  }

  const players = Object.values(bot.players)
    .filter(p => p.username !== bot.username && p.entity)
    .map(p => ({
        username: p.username,
        x: p.entity.position.x - botPos.x,
        z: p.entity.position.z - botPos.z
    }));


  return {
    bot: {
        x: botPos.x,
        y: botPos.y,
        z: botPos.z,
        yaw: bot.entity.yaw,
    },
    map,
    players,
  };
}

/**
 * Finds the highest non-air block at a given X, Z coordinate.
 * @param {import('mineflayer').Bot} bot - The mineflayer bot instance.
 * @param {number} x - The world X coordinate.
 * @param {number} z - The world Z coordinate.
 * @returns {import('prismarine-block').Block | null} The highest block or null.
 */
function findHighestBlock(bot, x, z) {
  const cursor = new Vec3(x, 0, z);
  for (let y = bot.game.world.height; y >= 0; y--) {
    cursor.y = y;
    const block = bot.blockAt(cursor);
    if (block && !BLOCKS_TO_IGNORE.has(block.name)) {
      return block;
    }
  }
  return null;
}

module.exports = { getWebMinimap };
