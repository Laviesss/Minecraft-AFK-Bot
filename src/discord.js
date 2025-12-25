const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');

let client;
let botStateRef;
let mineflayerBotRef;
let channelWarningLogged = false; // Flag to prevent spamming the log

const commands = [
    new SlashCommandBuilder().setName('status').setDescription('Displays the full status of the bot.'),
    new SlashCommandBuilder().setName('health').setDescription('Shows the bot\'s current health and hunger.'),
    new SlashCommandBuilder().setName('coords').setDescription('Gets the bot\'s current coordinates.'),
    new SlashCommandBuilder().setName('players').setDescription('Lists the players currently online.'),
    new SlashCommandBuilder().setName('uptime').setDescription('Shows how long the bot has been online.'),
    new SlashCommandBuilder().setName('say').setDescription('Sends a message to the in-game chat.')
        .addStringOption(option =>
            option.setName('message')
                .setDescription('The message to send')
                .setRequired(true)),
].map(command => command.toJSON());

function updateBotInstance(newBotInstance) {
    mineflayerBotRef = newBotInstance;
}

async function initDiscord(state) {
    botStateRef = state;
    const token = process.env.DISCORD_BOT_TOKEN;

    if (!token) {
        console.warn('DISCORD_BOT_TOKEN not set. Discord integration disabled.');
        return;
    }

    client = new Client({ intents: [GatewayIntentBits.Guilds] });

    client.on('interactionCreate', async interaction => {
        if (!interaction.isChatInputCommand()) return;

        await interaction.deferReply({ ephemeral: interaction.commandName === 'say' });

        const { commandName } = interaction;

        if (!mineflayerBotRef || !botStateRef.isOnline) {
            return interaction.editReply({ content: 'The Minecraft bot is currently offline.' });
        }

        try {
            switch (commandName) {
                case 'status':
                    await interaction.editReply(`**Status:** Online\n**Uptime:** ${botStateRef.uptime}s\n**Server:** ${botStateRef.serverAddress}`);
                    break;
                case 'health':
                    await interaction.editReply(`**Health:** ${Math.round(botStateRef.health)}/20\n**Hunger:** ${Math.round(botStateRef.hunger)}/20`);
                    break;
                case 'coords':
                    const { x, y, z } = botStateRef.coordinates;
                    await interaction.editReply(`**Coords:** X:${Math.round(x)}, Y:${Math.round(y)}, Z:${Math.round(z)}`);
                    break;
                case 'players':
                    const playerList = botStateRef.playerList.join(', ') || 'Nobody is online.';
                    await interaction.editReply(`**Players (${botStateRef.playerCount}):** ${playerList}`);
                    break;
                case 'uptime':
                    await interaction.editReply(`The bot has been online for ${botStateRef.uptime} seconds.`);
                    break;
                case 'say':
                    const message = interaction.options.getString('message');
                    mineflayerBotRef.chat(message);
                    await interaction.editReply({ content: `Sent message: "${message}"` });
                    break;
            }
        } catch (error) {
            console.error('Error handling interaction:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: 'An error occurred while processing your command.', ephemeral: true });
            } else {
                await interaction.editReply({ content: 'An error occurred while processing your command.' });
            }
        }
    });

    client.on('clientReady', async () => {
        console.log(`Discord bot logged in as ${client.user.tag}!`);
        const rest = new REST({ version: '10' }).setToken(token);
        try {
            console.log('Refreshing application (/) commands.');
            await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
            console.log('Successfully reloaded application (/) commands.');
        } catch (error) {
            console.error('Error reloading application commands:', error);
        }
    });

    await client.login(token);
}

function sendMessageToChannel(message) {
    const channelId = process.env.DISCORD_CHANNEL_ID;
    if (!client || !channelId) return;

    const channel = client.channels.cache.get(channelId);
    if (channel) {
        channel.send(message).catch(console.error);
    } else {
        if (!channelWarningLogged) {
            console.warn(`Could not find Discord channel with ID: ${channelId}. Further warnings will be suppressed.`);
            channelWarningLogged = true;
        }
    }
}

module.exports = { initDiscord, sendMessageToChannel, updateBotInstance };
