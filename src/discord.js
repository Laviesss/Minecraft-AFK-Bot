const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const proxyManager = require('./proxyManager');

let client;
let botStateRef;
let mineflayerBotRef;
let channelWarningLogged = false;
let configRef;

const commands = [
    new SlashCommandBuilder().setName('status').setDescription('✨ Displays the full status of the bot.'),
    new SlashCommandBuilder().setName('health').setDescription('❤️ Shows the bot\'s current health and hunger.'),
    new SlashCommandBuilder().setName('coords').setDescription('🗺️ Gets the bot\'s current coordinates.'),
    new SlashCommandBuilder().setName('players').setDescription('👥 Lists the players currently online.'),
    new SlashCommandBuilder().setName('uptime').setDescription('⏱️ Shows how long the bot has been online.'),
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
        if (!interaction.isChatInputCommand()) return;

        const { commandName } = interaction;
        const isEphemeral = commandName === 'say' || commandName === 'validateproxies';
        await interaction.deferReply({ ephemeral: isEphemeral });

        if ((!mineflayerBotRef || !botStateRef.isOnline) && commandName !== 'validateproxies') {
            const embed = new EmbedBuilder()
                .setColor(0xFF5555) // Red
                .setTitle('❌ Bot Offline')
                .setDescription('The Minecraft bot is currently offline. Please wait for it to reconnect.');
            return interaction.editReply({ embeds: [embed] });
        }

        try {
            const isAdmin = configRef.admins.includes(interaction.user.username) || configRef.admins.includes(interaction.user.id);

            // --- ADMIN COMMANDS ---
            if (commandName === 'validateproxies') {
                if (!isAdmin) {
                    const embed = new EmbedBuilder().setColor(0xFF5555).setTitle('⛔ Access Denied').setDescription('You do not have permission to use this command.');
                    return interaction.editReply({ embeds: [embed] });
                }

                await interaction.editReply({ embeds: [new EmbedBuilder().setColor(0x5555FF).setTitle('🔄 Validating Proxies...').setDescription('Please wait, this may take a moment.')] });

                const allProxies = await proxyManager.loadProxies();
                const validProxies = await proxyManager.validateProxies(allProxies);
                await proxyManager.writeProxies(validProxies);
                proxyManager.setValidProxies(validProxies);

                const embed = new EmbedBuilder()
                    .setColor(0x55FF55) // Green
                    .setTitle('✅ Validation Complete')
                    .setDescription(`Finished validating proxies.\n**${validProxies.length} / ${allProxies.length}** are working.`);
                return interaction.editReply({ embeds: [embed] });
            }

            // --- USER COMMANDS ---
            const embed = new EmbedBuilder().setColor(0x0099FF).setTimestamp();

            switch (commandName) {
                case 'status':
                    embed.setTitle('✨ Bot Status').addFields(
                        { name: 'Status', value: botStateRef.isOnline ? '🟢 Online' : '🔴 Offline', inline: true },
                        { name: 'Server', value: `\`${botStateRef.serverAddress}\``, inline: true },
                        { name: 'Uptime', value: `${botStateRef.uptime}s`, inline: true }
                    );
                    break;
                case 'health':
                    embed.setTitle('❤️ Bot Health').addFields(
                        { name: 'Health', value: `${Math.round(botStateRef.health)} / 20`, inline: true },
                        { name: 'Hunger', value: `${Math.round(botStateRef.hunger)} / 20`, inline: true }
                    );
                    break;
                case 'coords':
                    const { x, y, z } = botStateRef.coordinates;
                    embed.setTitle('🗺️ Bot Coordinates').setDescription(`X: \`${Math.round(x)}\` Y: \`${Math.round(y)}\` Z: \`${Math.round(z)}\``);
                    break;
                case 'players':
                    const playerList = botStateRef.playerList.join(', ') || 'No players online.';
                    embed.setTitle(`👥 Players Online (${botStateRef.playerCount})`).setDescription(`\`\`\`${playerList}\`\`\``);
                    break;
                case 'uptime':
                    embed.setTitle('⏱️ Bot Uptime').setDescription(`The bot has been online for **${botStateRef.uptime}** seconds.`);
                    break;
                case 'say':
                    const message = interaction.options.getString('message');
                    mineflayerBotRef.chat(message);
                    embed.setColor(0xAAAAAA).setTitle('💬 Message Sent').setDescription(`Successfully sent message: \`${message}\``);
                    break;
            }
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Error handling interaction:', error);
            const errorEmbed = new EmbedBuilder().setColor(0xFF5555).setTitle('❌ An Error Occurred').setDescription('Something went wrong while processing your command.');
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ embeds: [errorEmbed], ephemeral: true });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    });

    client.on('clientReady', async () => {
        console.log(`Discord bot logged in as ${client.user.tag}!`);
        const rest = new REST({ version: '10' }).setToken(token);
        try {
            console.log('Refreshing application (/) commands.');
            await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        } catch (error) {
            console.error('Error reloading application commands:', error);
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
        console.warn(`Could not find Discord channel with ID: ${channelId}. Further warnings will be suppressed.`);
        channelWarningLogged = true;
    }
}

module.exports = { initDiscord, sendMessageToChannel, updateBotInstance, EmbedBuilder };
