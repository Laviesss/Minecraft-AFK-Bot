const { Vec3 } = require('vec3');

const blockToEmoji = {
    'air': '💨', 'stone': '🪨', 'dirt': '🟫', 'grass_block': '🟩', 'water': '🟦', 'lava': '🟧', 'sand': '🟨', 'gravel': '🔘', 'gold_ore': '💰', 'iron_ore': '⛓️', 'coal_ore': '⚫', 'oak_log': '🪵', 'oak_leaves': '🍃', 'glass': '⬜', 'lapis_ore': '💙', 'sandstone': '🏜️', 'cobblestone': '🗿', 'bedrock': '🧱', 'diamond_ore': '💎', 'redstone_ore': '❤️', 'ice': '🧊', 'snow': '❄️', 'clay': '🧱', 'pumpkin': '🎃', 'torch': '🕯️', 'wheat': '🌾', 'tnt': '🧨',
    'default': '❓'
};

function getDiscordMinimap(bot) {
    const size = 2;
    let map = '';
    if (!bot || !bot.entity) return 'Bot not spawned.';

    const botPos = bot.entity.position.floored();
    for (let z = -size; z <= size; z++) {
        for (let x = -size; x <= size; x++) {
            if (x === 0 && z === 0) {
                map += '🤖';
                continue;
            }
            const blockPos = botPos.offset(x, -1, z);
            const block = bot.blockAt(blockPos);
            const blockName = block ? block.name : 'air';
            map += blockToEmoji[blockName] || blockToEmoji['default'];
        }
        map += '\n';
    }
    return map;
}

function getWebMinimap(bot, mcData) {
    const size = 2;
    const minimap = [];
    if (!bot || !bot.entity) return minimap;
    const botX = Math.floor(bot.entity.position.x);
    const botZ = Math.floor(bot.entity.position.z);
    const botY = Math.floor(bot.entity.position.y - 1);
    for (let z = -size; z <= size; z++) {
        const row = [];
        for (let x = -size; x <= size; x++) {
            const block = bot.blockAt(new Vec3(botX + x, botY, botZ + z));
            const blockColor = block && mcData.blocks[block.type] ? mcData.blocks[block.type].color : 0;
            row.push(`#${(blockColor || 0).toString(16).padStart(6, '0')}`);
        }
        minimap.push(row);
    }
    return minimap;
}

module.exports = {
    getDiscordMinimap,
    getWebMinimap,
};
