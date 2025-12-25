const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');

let client;
let botStateRef; // Reference to the main botState object
let mineflayerBotRef; // Reference to the mineflayer bot instance

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

async function initDiscord(state, mineflayerBot) {
    botStateRef = state;
    mineflayerBotRef = mineflayerBot;

    const token = process.env.DISCORD_BOT_TOKEN;
    if (!token) {
        console.warn('DISCORD_BOT_TOKEN is not set. Discord integration is disabled.');
        return;
    }

    client = new Client({ intents: [GatewayIntentBits.Guilds] });

    const rest = new REST({ version: '10' }).setToken(token);

    client.on('ready', async () => {
        console.log(`Discord bot logged in as ${client.user.tag}!`);
        try {
            console.log('Started refreshing application (/) commands.');
            await rest.put(
                Routes.applicationCommands(client.user.id),
                { body: commands },
            );
            console.log('Successfully reloaded application (/) commands.');
        } catch (error) {
            console.error(error);
        }
    });

    client.on('interactionCreate', async interaction => {
        if (!interaction.isChatInputCommand()) return;

        const { commandName } = interaction;

        if (!botStateRef.isOnline) {
            await interaction.reply({ content: 'The Minecraft bot is currently offline.', ephemeral: true });
            return;
        }

        switch (commandName) {
            case 'status':
                await interaction.reply(`**Status:** Online\n**Uptime:** ${botStateRef.uptime}s\n**Server:** ${botStateRef.serverAddress}`);
                break;
            case 'health':
                await interaction.reply(`**Health:** ${Math.round(botStateRef.health)}/20\n**Hunger:** ${Math.round(botStateRef.hunger)}/20`);
                break;
            case 'coords':
                const { x, y, z } = botStateRef.coordinates;
                await interaction.reply(`**Coords:** X:${Math.round(x)}, Y:${Math.round(y)}, Z:${Math.round(z)}`);
                break;
            case 'players':
                const playerList = botStateRef.playerList.join(', ') || 'Nobody is online.';
                await interaction.reply(`**Players (${botStateRef.playerCount}):** ${playerList}`);
                break;
            case 'uptime':
                await interaction.reply(`The bot has been online for ${botStateRef.uptime} seconds.`);
                break;
            case 'say':
                const message = interaction.options.getString('message');
                mineflayerBotRef.chat(message);
                await interaction.reply({ content: `Sent message: "${message}"`, ephemeral: true });
                break;
        }
    });

    await client.login(token);
    return client;
}

function sendMessageToChannel(message) {
    const channelId = process.env.DISCORD_CHANNEL_ID;
    if (!client || !channelId) return;

    const channel = client.channels.cache.get(channelId);
    if (channel) {
        channel.send(message);
    } else {
        console.warn(`Could not find Discord channel with ID: ${channelId}`);
    }
}

module.exports = { initDiscord, sendMessageToChannel };
