# Advanced Mineflayer AFK Bot & Dashboard

This project provides a powerful, feature-rich Minecraft AFK bot built with Node.js and the Mineflayer library. It features a unified web dashboard that integrates multiple plugins, allowing you to monitor and interact with the bot in real-time from your browser. It's designed for easy setup and can be deployed on cloud services like Render.

## ✨ Features

- **Configuration Wizard:** A user-friendly, web-based wizard for initial bot setup. No more manual file editing to get started!
- **Unified Web Dashboard:** Access all web-based tools from a single, clean interface.
- **🌐 3D World Viewer:** See what the bot sees with a live, in-browser 3D render of the world (`prismarine-viewer`).
- **📦 Live Inventory Management:** View and manage the bot's inventory directly from the web dashboard (`mineflayer-web-inventory`).
- **🏃‍♂️ Movement Controls:** Control the bot's movement directly from the web dashboard and Discord.
- **🔒 Flexible Authentication:** Supports both `microsoft` (premium) and `offline` (cracked) server authentication.
- **🔔 Discord Integration:** Get real-time notifications and control the bot via slash commands in your Discord server.
- **🛡️ Configurable Proxy Support:** Easily enable or disable the use of a SOCKS5 proxy through the setup wizard.

---

## 🚀 Getting Started

This application uses a web-based setup wizard, so you don't need to manually create any configuration files.

### Prerequisites

- **Node.js:** Version 22.0.0 or higher is required. You can download it from [nodejs.org](https://nodejs.org/).
- **Git:** Required to clone the repository.
- **(Optional) Discord Bot Token:** If you plan to use the Discord integration, you will need to have a Discord bot token set as an environment variable.

### Installation & First-Time Setup

**1. Clone the Repository:**
```bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
```

**2. Install Dependencies:**
```bash
npm install
```

**3. (Optional) Set Discord Token:**
If you want to enable the Discord bot, set the `DISCORD_TOKEN` environment variable. You can do this by creating a `.env` file in the project root:
```
DISCORD_TOKEN=your_super_secret_discord_bot_token
```
The application will automatically load this variable.

**4. Run the Application:**
```bash
npm start
```

**5. Complete the Web Setup:**
- When you first run the application, it will start in **setup mode**.
- Open your browser and navigate to the URL shown in the console (usually `http://localhost:8080`).
- Follow the on-screen instructions in the **Setup Wizard** to configure your bot.
- Once you save the configuration, the application will automatically restart in **full mode**.

---

## ⚙️ Configuration

After the initial setup, the bot's configuration is stored in a `bot-config.json` file. You can edit this file directly or delete it to run the Setup Wizard again.

### Discord Integration Setup

The Discord integration is now easier than ever:
1.  **Bot Owner:** The owner of the bot application must set the `DISCORD_TOKEN` as an environment variable on the server where the bot is running.
2.  **User:** During the web-based setup, the Discord step will provide you with an **invite link**.
3.  Click the link to invite the pre-configured bot to your server.
4.  In Discord, right-click the channel where you want the bot to send messages and click **"Copy Channel ID"**.
5.  Paste this ID into the "Channel ID" field in the setup wizard.

### Proxy Configuration

The setup wizard includes a "Proxy Settings" step that allows you to enable or disable the use of a SOCKS5 proxy.
- If enabled, the bot will attempt to connect through a proxy from the `proxies.txt` file.
- If disabled, the bot will connect directly to the Minecraft server.
