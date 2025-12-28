const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

let client;
let botStateRef;
let mineflayerBotRef;
let configRef;
let discordLogChannel;

const commands = [
    new SlashCommandBuilder().setName('status').setDescription('✨ Displays the full status of the bot.'),
    new SlashCommandBuilder().setName('health').setDescription('❤️ Shows the bot\'s current health and hunger.'),
    new SlashCommandBuilder().setName('coords').setDescription('🗺️ Gets the bot\'s current coordinates.'),
    new SlashCommandBuilder().setName('players').setDescription('👥 Lists the players currently online.'),
    new SlashCommandBuilder().setName('inventory').setDescription('🎒 Lists the items in the bot\'s inventory.'),
    new SlashCommandBuilder().setName('move').setDescription('🏃‍♂️ Moves the bot in a direction.'),
    new SlashCommandBuilder().setName('stop').setDescription('🛑 Stops the bot\'s movement.'),
    new SlashCommandBuilder().setName('say').setDescription('💬 Sends a message to the in-game chat.')
        .addStringOption(option =>
            option.setName('message')
                .setDescription('The message to send')
                .setRequired(true)),
].map(command => command.toJSON());

function updateBotInstance(newBotInstance) {
    mineflayerBotRef = newBotInstance;
}

async function initDiscord(state, config) {
    botStateRef = state;
    configRef = config;
    const token = config.discordToken;

    if (!token) {
        console.warn('[Discord] discordToken not found in config. Discord integration disabled.');
        return;
    }

    client = new Client({ intents: [GatewayIntentBits.Guilds] });

    client.on('interactionCreate', async interaction => {
        const isButton = interaction.isButton();
        if (!interaction.isChatInputCommand() && !isButton) return;

        await interaction.deferReply({ ephemeral: isButton });

        if (!mineflayerBotRef || !botStateRef.isOnline) {
            const embed = new EmbedBuilder().setColor(0xFF5555).setTitle('❌ Bot Offline').setDescription('The Minecraft bot is currently offline.');
            return interaction.editReply({ embeds: [embed] });
        }

        const action = isButton ? interaction.customId : interaction.commandName;

        try {
            const embed = new EmbedBuilder().setColor(0x0099FF).setTimestamp();

            switch (action) {
                case 'status':
                    embed.setTitle('✨ Bot Status').addFields(
                        { name: 'Status', value: botStateRef.isOnline ? '🟢 Online' : '🔴 Offline', inline: true },
                        { name: 'Server', value: `\`${config.serverAddress}\``, inline: true }
                    );
                    break;
                case 'health':
                    embed.setTitle('❤️ Bot Health').addFields(
                        { name: 'Health', value: `${Math.round(botStateRef.health)}/20`, inline: true },
                        { name: 'Hunger', value: `${Math.round(botStateRef.hunger)}/20`, inline: true }
                    );
                    break;
                case 'coords':
                    embed.setTitle('🗺️ Coords').setDescription(`\`${botStateRef.position.x}, ${botStateRef.position.y}, ${botStateRef.position.z}\``);
                    break;
                case 'players':
                    const players = Object.keys(mineflayerBotRef.players);
                    embed.setTitle(`👥 Players (${players.length})`).setDescription(players.length ? `\`\`\`${players.join(', ')}\`\`\`` : 'No other players online.');
                    break;
                case 'inventory':
                    const items = mineflayerBotRef.inventory.items().map(i => `${i.displayName} x${i.count}`);
                    embed.setTitle('🎒 Inventory').setDescription(items.length ? `\`\`\`${items.join('\n')}\`\`\`` : 'Empty.');
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
            console.error('[Discord] Interaction Error:', error);
            const errorEmbed = new EmbedBuilder().setColor(0xFF5555).setTitle('❌ Error').setDescription('An error occurred.');
            if (interaction.deferred || interaction.replied) await interaction.editReply({ embeds: [errorEmbed], ephemeral: true });
        }
    });

    client.on('ready', async () => {
        console.log(`[Discord] Logged in as ${client.user.tag}!`);
        if (config.discordChannelId) {
            try {
                discordLogChannel = await client.channels.fetch(config.discordChannelId);
                console.log(`[Discord] Logging channel set to #${discordLogChannel.name}`);
            } catch (err) {
                console.error(`[Discord] ERROR: Could not find channel with ID ${config.discordChannelId}.`);
            }
        }
        const rest = new REST({ version: '10' }).setToken(token);
        try {
            await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        } catch (error) {
            console.error('[Discord] Error refreshing slash commands:', error);
        }
    });

    await client.login(token);
}

function sendMessageToChannel(embed) {
    if (discordLogChannel) {
        discordLogChannel.send({ embeds: [embed] }).catch(err => {
            console.error('[Discord] Failed to send message:', err);
        });
    }
}

module.exports = { initDiscord, sendMessageToChannel, updateBotInstance, EmbedBuilder };
