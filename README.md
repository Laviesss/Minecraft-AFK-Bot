# Minecraft AFK Bot for Render

This project provides a simple, 24/7 Minecraft AFK bot designed for deployment on [Render's](https://render.com/) free tier.

The architecture is split into two main components:
1.  **A Background Worker:** A Python script (`bot.py`) that connects to a Minecraft server using the `quarry` library and remains AFK. It includes an exponential backoff strategy for reconnection to avoid spamming the server.
2.  **A Web Service:** A lightweight Flask web server (`app.py`) that provides a public URL. This endpoint is used by an external keep-alive service to prevent Render's free instance from spinning down due to inactivity.

This two-process setup ensures that the bot runs in a single, dedicated process, independent of the web server.

## Configuration (Environment Variables)

The bot is configured using environment variables. You will need to set the following for both the Web Service and the Background Worker:

*   `MC_SERVER_ADDRESS`: The address of the Minecraft server (e.g., `mc.example.com`).
*   `MC_USERNAME`: The username for the bot to use (for offline-mode servers).
*   `MC_SERVER_PORT` (Optional): The port of the Minecraft server. Defaults to `25565`.

**Tip:** To keep your environment variables consistent across services, consider using Render's [Environment Groups](https://render.com/docs/environment-variables#environment-groups).

## How to Deploy on Render

This setup requires two services on Render: a **Web Service** and a **Background Worker**.

### Part 1: Deploy the Web Service

1.  **Fork this Repository:** Click the "Fork" button at the top-right of this page.
2.  **Create a New Web Service in Render:**
    *   From your dashboard, click **"New +"** -> **"Web Service"**.
    *   Connect your GitHub account and select your forked repository.
    *   **Name:** Give it a unique name (e.g., `my-afk-bot-web`).
    *   **Region:** Choose a region close to your Minecraft server.
    *   **Runtime:** `Python 3`.
    *   **Build Command:** `pip install -r requirements.txt`.
    *   **Start Command:** `gunicorn --access-logfile /dev/null --error-logfile - app:app` (Render should detect this from the `Procfile`).
    *   **Instance Type:** `Free`.
3.  **Add Environment Variables:**
    *   Before creating the service, go to **"Advanced Settings"**.
    *   Add the Minecraft server details (`MC_SERVER_ADDRESS`, `MC_USERNAME`).
4.  **Deploy:**
    *   Click **"Create Web Service"**.
    *   Once live, copy your service's URL (e.g., `https://my-afk-bot-web.onrender.com`). You will need this for the keep-alive service.

### Part 2: Deploy the Background Worker

1.  **Create a New Background Worker in Render:**
    *   From your dashboard, click **"New +"** -> **"Background Worker"**.
    *   Connect your GitHub account and select the same forked repository.
    *   **Name:** Give it a unique name (e.g., `my-afk-bot-worker`).
    *   **Region:** Choose the same region as your web service.
    *   **Runtime:** `Python 3`.
    *   **Build Command:** `pip install -r requirements.txt`.
    *   **Start Command:** `python bot.py` (Render should detect this from the `Procfile`).
    *   **Instance Type:** `Free`.
2.  **Add Environment Variables:**
    *   Go to **"Advanced Settings"** and add the *same* environment variables you used for the web service.
3.  **Deploy:**
    *   Click **"Create Background Worker"**. The bot will now start and attempt to connect to your Minecraft server. Check the logs to see its status.

## Setting Up a Keep-Alive Service (Required for the Web Service)

Render's free web services spin down after 15 minutes of inactivity. To keep your web service online (which in turn keeps your free instance active), you must use an external service to ping its URL every 15 minutes or less.

**Note:** This is only needed for the **Web Service**, not the Background Worker.

### UptimeRobot (Easiest Method)

1.  **Create a free account** at [uptimerobot.com](https://uptimerobot.com/).
2.  Click **"Add New Monitor"**.
3.  **Monitor Type:** `HTTP(s)`.
4.  **Friendly Name:** Give it a name (e.g., "Minecraft Bot Keep-Alive").
5.  **URL (or IP):** Paste your Render **Web Service** URL.
6.  **Monitoring Interval:** **15 minutes** or less.
7.  Click **"Create Monitor"**.

Your bot is now fully configured to run 24/7 on Render's free tier!
