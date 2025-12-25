# Node.js Minecraft AFK Bot for Render

This project provides a simple and reliable 24/7 Minecraft AFK bot, rewritten in Node.js for enhanced stability. It is designed for easy deployment on [Render's](https://render.com/) free tier.

## Local Setup

Before running the bot on your local machine, you need to configure your environment variables.

1.  **Create a `.env` file:** Make a copy of the `.env.example` file and rename it to `.env`.
2.  **Fill in the values:** Open the new `.env` file and fill in your server details, Discord bot token, and any other required information.

The application consists of two main components running in a single process:
1.  **A Mineflayer Bot:** A powerful and popular Node.js library for creating Minecraft bots. It handles all the complexities of the Minecraft protocol and includes a robust, event-driven system for managing connections.
2.  **An Express Web Server:** A lightweight web server that provides a public URL. This is used by an external keep-alive service to prevent Render's free web service from spinning down due to inactivity.

## Configuration (Environment Variables)

The bot is configured using environment variables on Render. You will need to set the following:

*   `MC_SERVER_ADDRESS`: The address of the Minecraft server (e.g., `mc.example.com`).
*   `MC_USERNAME`: The username for the bot to use (for offline-mode servers).
*   `MC_SERVER_PORT` (Optional): The port of the Minecraft server. Defaults to `25565`.
*   `MC_VERSION` (Highly Recommended): The Minecraft version of the server (e.g., `1.18.2`). **This is often required for a successful connection.** You can usually find the correct version on your server's main page (like on Aternos).

## How to Deploy on Render

1.  **Fork this Repository:** Click the "Fork" button at the top-right of this page.

2.  **Create a New Web Service in Render:**
    *   From your dashboard, click **"New +"** -> **"Web Service"**.
    *   Connect your GitHub account and select your forked repository.
    *   **Name:** Give it a unique name (e.g., `my-node-afk-bot`).
    *   **Region:** Choose a region close to your Minecraft server.
    *   **Runtime:** `Node`. (Render will automatically detect this from the `package.json` file).
    *   **Build Command:** `npm install` (This is the standard command for Node.js projects).
    *   **Start Command:** `node index.js` (Render should detect this from the `Procfile`).
    *   **Instance Type:** `Free`.

3.  **Add Environment Variables:**
    *   Before creating the service, go to **"Advanced Settings"**.
    *   Click **"Add Environment Variable"** and add your Minecraft server details (`MC_SERVER_ADDRESS`, `MC_USERNAME`, etc.).

4.  **Deploy:**
    *   Click **"Create Web Service"**. Render will install your dependencies, build the project, and deploy the bot.
    *   Once the deployment is live, check the logs to see the bot's status.
    *   Copy your service's URL (e.g., `https://my-node-afk-bot.onrender.com`). You will need this for the next step.

## Setting Up a Keep-Alive Service (Required for Free Tier)

Render's free web services spin down after 15 minutes of inactivity. To keep your bot running 24/7, you must use an external service to ping your bot's URL every 15 minutes or less.

### UptimeRobot (Easiest Method)

1.  **Create a free account** at [uptimerobot.com](https://uptimerobot.com/).
2.  From your dashboard, click **"Add New Monitor"**.
3.  **Monitor Type:** `HTTP(s)`.
4.  **Friendly Name:** Give it a name (e.g., "Minecraft Bot Keep-Alive").
5.  **URL (or IP):** Paste your Render service URL.
6.  **Monitoring Interval:** Set it to **15 minutes** or less.
7.  Click **"Create Monitor"**.

Your bot is now fully configured to run 24/7!
