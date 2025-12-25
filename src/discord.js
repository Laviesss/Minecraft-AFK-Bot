const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const proxyManager = require('./proxyManager');
const { getDiscordMinimap } = require('./utils');

let client;
let botStateRef;
let mineflayerBotRef;
let channelWarningLogged = false;
let configRef;
let mcData;

const commands = [
    new SlashCommandBuilder().setName('status').setDescription('✨ Displays the full status of the bot.'),
    new SlashCommandBuilder().setName('health').setDescription('❤️ Shows the bot\'s current health and hunger.'),
    new SlashCommandBuilder().setName('coords').setDescription('🗺️ Gets the bot\'s current coordinates.'),
    new SlashCommandBuilder().setName('players').setDescription('👥 Lists the players currently online.'),
    new SlashCommandBuilder().setName('uptime').setDescription('⏱️ Shows how long the bot has been online.'),
    new SlashCommandBuilder().setName('inventory').setDescription('🎒 Lists the items in the bot\'s inventory.'),
    new SlashCommandBuilder().setName('useitem').setDescription('✋ Uses the currently held item.'),
    new SlashCommandBuilder().setName('look').setDescription('👀 Looks at the nearest player.'),
    new SlashCommandBuilder().setName('move').setDescription('🏃‍♂️ Moves the bot in a direction.'),
    new SlashCommandBuilder().setName('stop').setDescription('🛑 Stops the bot\'s movement.'),
    new SlashCommandBuilder().setName('map').setDescription('🗺️ Shows a 5x5 map of the bot\'s surroundings.'),
    new SlashCommandBuilder().setName('say').setDescription('💬 Sends a message to the in-game chat.')
        .addStringOption(option =>
            option.setName('message')
                .setDescription('The message to send')
                .setRequired(true)),
    new SlashCommandBuilder().setName('validateproxies').setDescription('🔄 [Admin] Validates all proxies in proxies.txt.'),
].map(command => command.toJSON());

function updateBotInstance(newBotInstance) {
    mineflayerBotRef = newBotInstance;
}

async function initDiscord(state, config) {
    botStateRef = state;
    configRef = config;
    const token = process.env.DISCORD_BOT_TOKEN;

    if (!token) {
        console.warn('DISCORD_BOT_TOKEN not set. Discord integration disabled.');
        return;
    }

    client = new Client({ intents: [GatewayIntentBits.Guilds] });

    client.on('interactionCreate', async interaction => {
        const isButton = interaction.isButton();
        if (!interaction.isChatInputCommand() && !isButton) return;

        const { commandName, customId } = interaction;
        const isEphemeral = commandName === 'say' || commandName === 'validateproxies' || isButton;
        await interaction.deferReply({ ephemeral: isEphemeral });

        if ((!mineflayerBotRef || !botStateRef.isOnline) && commandName !== 'validateproxies') {
            const embed = new EmbedBuilder().setColor(0xFF5555).setTitle('❌ Bot Offline').setDescription('The Minecraft bot is currently offline.');
            return interaction.editReply({ embeds: [embed] });
        }

        const isAdmin = configRef.admins.includes(interaction.user.username) || configRef.admins.includes(interaction.user.id);
        const action = isButton ? customId : commandName;

        try {
            if (action === 'validateproxies') {
                if (!isAdmin) return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0xFF5555).setTitle('⛔ Access Denied')] });
                await interaction.editReply({ embeds: [new EmbedBuilder().setColor(0x5555FF).setTitle('🔄 Validating Proxies...')] });
                const allProxies = await proxyManager.loadProxies();
                const validProxies = await proxyManager.validateProxies(allProxies);
                await proxyManager.writeProxies(validProxies);
                proxyManager.setValidProxies(validProxies);
                return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0x55FF55).setTitle('✅ Validation Complete').setDescription(`**${validProxies.length} / ${allProxies.length}** working.`)] });
            }

            const embed = new EmbedBuilder().setColor(0x0099FF).setTimestamp();

            switch (action) {
                case 'status':
                    embed.setTitle('✨ Bot Status').addFields(
                        { name: 'Status', value: botStateRef.isOnline ? '🟢 Online' : '🔴 Offline', inline: true },
                        { name: 'Server', value: `\`${botStateRef.serverAddress}\``, inline: true },
                        { name: 'Uptime', value: `${botStateRef.uptime}s`, inline: true }
                    );
                    break;
                case 'health':
                    embed.setTitle('❤️ Bot Health').addFields(
                        { name: 'Health', value: `${Math.round(botStateRef.health)}/20`, inline: true },
                        { name: 'Hunger', value: `${Math.round(botStateRef.hunger)}/20`, inline: true }
                    );
                    break;
                case 'coords':
                    embed.setTitle('🗺️ Coords').setDescription(`\`${botStateRef.coordinates.x.toFixed(0)}, ${botStateRef.coordinates.y.toFixed(0)}, ${botStateRef.coordinates.z.toFixed(0)}\``);
                    break;
                case 'players':
                    embed.setTitle(`👥 Players (${botStateRef.playerCount})`).setDescription(`\`\`\`${botStateRef.playerList.join(', ') || 'None'}\`\`\``);
                    break;
                case 'uptime':
                    embed.setTitle('⏱️ Uptime').setDescription(`${botStateRef.uptime} seconds.`);
                    break;
                case 'inventory':
                    const items = mineflayerBotRef.inventory.items().map(i => `${i.displayName} x${i.count}`);
                    embed.setTitle('🎒 Inventory').setDescription(items.length ? `\`\`\`${items.join('\n')}\`\`\`` : 'Empty.');
                    break;
                case 'useitem':
                    mineflayerBotRef.activateItem();
                    embed.setTitle('✋ Use Item').setDescription('Right-clicked with the held item.');
                    break;
                case 'look':
                    const player = mineflayerBotRef.nearestEntity(e => e.type === 'player');
                    if (player) {
                        mineflayerBotRef.lookAt(player.position.offset(0, player.height, 0));
                        embed.setTitle('👀 Look').setDescription(`Looking at ${player.username}.`);
                    } else {
                        embed.setTitle('👀 Look').setDescription('No players nearby.');
                    }
                    break;
                case 'map':
                    mcData = require('minecraft-data')(mineflayerBotRef.version);
                    const minimap = getDiscordMinimap(mineflayerBotRef);
                    embed.setTitle('🗺️ Minimap').setDescription(`\`\`\`\n${minimap}\`\`\``).setFooter({ text: '🤖 is you!' });
                    break;
                case 'move':
                    const row = new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('forward').setLabel('⬆️').setStyle(ButtonStyle.Primary),
                        new ButtonBuilder().setCustomId('back').setLabel('⬇️').setStyle(ButtonStyle.Primary),
                        new ButtonBuilder().setCustomId('left').setLabel('⬅️').setStyle(ButtonStyle.Primary),
                        new ButtonBuilder().setCustomId('right').setLabel('➡️').setStyle(ButtonStyle.Primary),
                        new ButtonBuilder().setCustomId('stop').setLabel('🛑').setStyle(ButtonStyle.Danger)
                    );
                    embed.setTitle('🏃‍♂️ Move').setDescription('Use the buttons to move the bot.');
                    return interaction.editReply({ embeds: [embed], components: [row] });
                case 'forward':
                case 'back':
                case 'left':
                case 'right':
                    mineflayerBotRef.setControlState(action, true);
                    setTimeout(() => mineflayerBotRef.setControlState(action, false), 500);
                    embed.setDescription(`Moving ${action}...`);
                    break;
                case 'stop':
                    mineflayerBotRef.clearControlStates();
                    embed.setDescription('Movement stopped.');
                    break;
                case 'say':
                    const message = interaction.options.getString('message');
                    mineflayerBotRef.chat(message);
                    embed.setColor(0xAAAAAA).setTitle('💬 Message Sent').setDescription(`\`${message}\``);
                    break;
            }
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Interaction Error:', error);
            const errorEmbed = new EmbedBuilder().setColor(0xFF5555).setTitle('❌ Error').setDescription('An error occurred.');
            if (interaction.deferred || interaction.replied) await interaction.editReply({ embeds: [errorEmbed], ephemeral: true });
            else await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    });

    client.on('ready', async () => {
        console.log(`Discord bot logged in as ${client.user.tag}!`);
        const rest = new REST({ version: '10' }).setToken(token);
        try {
            await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        } catch (error) {
            console.error('Error refreshing commands:', error);
        }
    });

    await client.login(token);
}

function sendMessageToChannel(embed) {
    const channelId = process.env.DISCORD_CHANNEL_ID;
    if (!client || !channelId) return;

    const channel = client.channels.cache.get(channelId);
    if (channel) {
        channel.send({ embeds: [embed] }).catch(console.error);
    } else if (!channelWarningLogged) {
        console.warn(`Could not find Discord channel ID: ${channelId}.`);
        channelWarningLogged = true;
    }
}

module.exports = { initDiscord, sendMessageToChannel, updateBotInstance, EmbedBuilder };
