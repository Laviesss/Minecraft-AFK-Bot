const { Vec3 } = require('vec3');

// --- Constants ---
const MAP_RADIUS = 16; // The radius of the map chunk to send (16 => 33x33 area)
const BLOCKS_TO_IGNORE = new Set(['air', 'cave_air', 'void_air']);

/**
 * Generates a simplified 2D minimap for the web dashboard.
 * @param {import('mineflayer').Bot} bot - The mineflayer bot instance.
 * @returns {object} An object containing the map data and player position.
 */
function getWebMinimap(bot) {
  const botPos = bot.entity.position;
  const map = [];

  for (let dX = -MAP_RADIUS; dX <= MAP_RADIUS; dX++) {
    for (let dZ = -MAP_RADIUS; dZ <= MAP_RADIUS; dZ++) {
      const realX = Math.floor(botPos.x) + dX;
      const realZ = Math.floor(botPos.z) + dZ;
      const highestBlock = findHighestBlock(bot, realX, realZ);

      map.push({
        x: dX,
        z: dZ,
        type: highestBlock ? highestBlock.name : 'unknown',
        height: highestBlock ? highestBlock.position.y : -1,
      });
    }
  }

  const players = Object.values(bot.players)
    .filter(p => p.username !== bot.username && p.entity)
    .map(p => ({
        username: p.username,
        x: p.entity.position.x,
        z: p.entity.position.z
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
  // The world might not be loaded yet when the bot just spawned.
  if (!bot.world || !bot.world.height) {
    return null;
  }

  const cursor = new Vec3(x, 0, z);
  for (let y = bot.world.height; y >= 0; y--) {
    cursor.y = y;
    const block = bot.blockAt(cursor);
    if (block && !BLOCKS_TO_IGNORE.has(block.name)) {
      return block;
    }
  }
  return null;
}

/**
 * Generates a textual minimap for Discord embeds.
 * @param {import('mineflayer').Bot} bot - The mineflayer bot instance.
 * @returns {string} A string representation of the map.
 */
function getDiscordMinimap(bot) {
    const radius = 2;
    let map = '';
    const botPos = bot.entity.position;

    for (let dz = -radius; dz <= radius; dz++) {
        for (let dx = -radius; dx <= radius; dx++) {
            if (dx === 0 && dz === 0) {
                map += '🤖';
                continue;
            }

            const blockPos = botPos.offset(dx, -1, dz);
            const block = bot.blockAt(blockPos);

            if (block) {
                if (block.name.includes('water')) map += '🟦';
                else if (block.name.includes('lava')) map += '🟧';
                else if (block.name.includes('grass')) map += '🟩';
                else if (block.name.includes('sand')) map += '🟨';
                else if (block.name.includes('stone') || block.name.includes('ore')) map += '⬛';
                else map += '⬜️';
            } else {
                map += '❓';
            }
        }
        map += '\n';
    }
    return map;
}

module.exports = { getWebMinimap, getDiscordMinimap };
