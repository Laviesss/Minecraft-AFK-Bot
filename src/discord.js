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

// Initializes and logs in the Discord client.
async function initDiscord(state) {
    botStateRef = state;
    const token = process.env.DISCORD_TOKEN;

    if (!token) {
        console.warn('[Discord] DISCORD_TOKEN environment variable not set. Discord integration disabled.');
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
                // ... (interaction logic remains the same)
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
        const rest = new REST({ version: '10' }).setToken(token);
        try {
            await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        } catch (error) {
            console.error('[Discord] Error refreshing slash commands:', error);
        }
    });

    try {
        await client.login(token);
    } catch (error) {
        console.error('[Discord] Failed to log in:', error.message);
        client = null; // Disable client on failure
    }
}

// Sets the channel for logging once the bot config is fully loaded.
async function setDiscordChannel(config) {
    if (!client || !config || !config.discordChannelId) return;

    configRef = config;
    try {
        discordLogChannel = await client.channels.fetch(config.discordChannelId);
        console.log(`[Discord] Logging channel set to #${discordLogChannel.name}`);
    } catch (err) {
        console.error(`[Discord] ERROR: Could not find channel with ID ${config.discordChannelId}.`);
        discordLogChannel = null;
    }
}


function sendMessageToChannel(embed) {
    if (discordLogChannel) {
        discordLogChannel.send({ embeds: [embed] }).catch(err => {
            console.error('[Discord] Failed to send message:', err);
        });
    }
}

function getClient() {
    return client;
}

module.exports = { initDiscord, setDiscordChannel, sendMessageToChannel, updateBotInstance, EmbedBuilder, getClient };
