# Advanced Mineflayer AFK Bot & Dashboard

This project provides a powerful, feature-rich Minecraft AFK bot built with Node.js and the Mineflayer library. It features a unified web dashboard that integrates multiple plugins, allowing you to monitor and interact with the bot in real-time from your browser. It's designed for easy setup and can be deployed on cloud services like Render.

## ✨ Features

- **Unified Web Dashboard:** Access all web-based tools from a single, clean interface.
- **🌐 3D World Viewer:** See what the bot sees with a live, in-browser 3D render of the world (`prismarine-viewer`).
- **📦 Live Inventory Management:** View and manage the bot's inventory directly from the web dashboard (`mineflayer-web-inventory`).
- **🏃‍♂️ Movement Controls:** Control the bot's movement directly from the web dashboard and Discord.
- **🔒 Flexible Authentication:** Supports both `microsoft` (premium) and `offline` (cracked) server authentication.
- **🔔 Discord Integration:** Get real-time notifications about bot status (connects, disconnects, kicks) in your Discord server.
- **🛡️ Proxy Support:** Connect through a SOCKS5 proxy by adding your proxies to the `proxies.txt` file.
- **🚀 Ngrok Tunneling:** Automatically creates a secure public URL for your local dashboard, making it easy to share or access from anywhere.

---

## 🚀 Getting Started

Follow these instructions to get the bot up and running on your local machine.

### Prerequisites

- **Node.js:** Version 22.0.0 or higher is required. You can download it from [nodejs.org](https://nodejs.org/).
- **Git:** Required to clone the repository.

### Installation & Setup

**1. Clone the Repository:**
```bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
```

**2. Install Dependencies:**
```bash
npm install
```

**3. Configure the Bot:**
Create a configuration file by copying the example file:
```bash
cp .env.example .env
```
Now, open the `.env` file with a text editor and fill in the required details.

---

## ⚙️ Configuration (`.env` file)

All configuration is done in the `.env` file. Here is a breakdown of all the available variables.

| Variable | Required | Description |
| :--- | :---: | :--- |
| `MC_SERVER_ADDRESS` | **Yes** | The IP address or domain of the Minecraft server. |
| `MC_SERVER_PORT` | No | The port of the server. Defaults to `25565`. |
| `MC_VERSION` | No | The Minecraft version. Auto-detected if left blank. |
| `AUTH_METHOD` | **Yes** | Set to `microsoft` for premium accounts or `offline` for cracked servers. |
| `MC_USERNAME` | **Yes*** | *Required if `AUTH_METHOD` is `offline`.* The bot's in-game username. |
| `MC_PASSWORD` | No | The password for your server's `/login` command. **This is NOT your Microsoft password.** |
| `MICROSOFT_EMAIL` | **Yes*** | *Required if `AUTH_METHOD` is `microsoft`.* The email for your Microsoft account. A browser window will open for you to sign in securely on the first run. |
| `ADMIN_USERNAMES` | No | A comma-separated list of Minecraft usernames that can issue admin commands to the bot. |
| `DISCORD_BOT_TOKEN` | No | The token for your Discord bot to enable notifications. |
| `DISCORD_CHANNEL_ID` | No | The ID of the Discord channel where notifications will be sent. |
| `NGROK_AUTH_TOKEN` | No | Your auth token from [ngrok.com](https://ngrok.com/). If provided, a public URL for your dashboard will be generated on startup. |
| `PORT` | No | The main port for the web dashboard. Defaults to `8080`. |

---

## ▶️ Running the Bot

Once you have configured your `.env` file, you can start the bot with a single command:

```bash
npm start
```

The console will display logs, including the local (and ngrok, if configured) URL for the dashboard.

## ☁️ Deployment

This bot is designed to be deployed on cloud platforms like [Render](https://render.com/). The included `Procfile` and the `start` script in `package.json` ensure that the application builds and runs correctly in a production environment. Simply link your Git repository to a new web service on Render to deploy.
