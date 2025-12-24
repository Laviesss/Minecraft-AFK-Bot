# Minecraft AFK Bot for Render

This project provides a simple, 24/7 Minecraft AFK bot designed for deployment on [Render's](https://render.com/) free tier.

The bot runs in a background thread within a single web service. A lightweight Flask server provides a public URL, which is used by an external keep-alive service to prevent Render's free instance from spinning down due to inactivity.

The application is configured to run with a single [Gunicorn](https://gunicorn.org/) worker process. This is a critical setting that ensures only one instance of the bot is ever running, even in a production environment.

## Configuration (Environment Variables)

The bot is configured using environment variables on Render. You will need to set the following:

*   `MC_SERVER_ADDRESS`: The address of the Minecraft server (e.g., `mc.example.com`).
*   `MC_USERNAME`: The username for the bot to use (for offline-mode servers).
*   `MC_SERVER_PORT` (Optional): The port of the Minecraft server. Defaults to `25565`.

## How to Deploy on Render

1.  **Fork this Repository:** Click the "Fork" button at the top-right of this page.

2.  **Create a New Web Service in Render:**
    *   From your dashboard, click **"New +"** -> **"Web Service"**.
    *   Connect your GitHub account and select your forked repository.
    *   **Name:** Give it a unique name (e.g., `my-afk-bot`).
    *   **Region:** Choose a region close to your Minecraft server.
    *   **Runtime:** `Python 3`.
    *   **Build Command:** `pip install -r requirements.txt`.
    *   **Start Command:** `gunicorn --workers 1 --access-logfile /dev/null --error-logfile - app:app` (Render should detect this from the `Procfile`).
    *   **Instance Type:** `Free`.

3.  **Add Environment Variables:**
    *   Before creating the service, go to **"Advanced Settings"**.
    *   Click **"Add Environment Variable"** and add your Minecraft server details (`MC_SERVER_ADDRESS`, `MC_USERNAME`, etc.).

4.  **Deploy:**
    *   Click **"Create Web Service"**. Render will build and deploy your bot.
    *   Once the deployment is live, check the logs to see the bot's status.
    *   Copy your service's URL (e.g., `https://my-afk-bot.onrender.com`). You will need this for the next step.

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
