# Minecraft AFK Bot for Render

This is a simple Python script that connects to a Minecraft server and stays AFK. It is designed to be deployed on [Render's](https://render.com/) free tier, which allows for 24/7 uptime using a keep-alive service.

The bot runs in a background thread, while a lightweight Flask web server runs in the main thread. The web server provides a single endpoint for a keep-alive service to ping, preventing Render's free instance from spinning down due to inactivity.

## Configuration (Environment Variables)

The bot is configured using environment variables on Render. You will need to set the following:

*   `MC_SERVER_ADDRESS`: The address of the Minecraft server (e.g., `mc.example.com`).
*   `MC_USERNAME`: The username for the bot to use.
*   `MC_SERVER_PORT` (Optional): The port of the Minecraft server. Defaults to `25565` if not set.

## How to Deploy on Render

1.  **Fork this Repository:** Click the "Fork" button at the top-right of this page to create your own copy.

2.  **Create a Render Account:** Sign up for a free account at [render.com](https://render.com/).

3.  **Create a New Web Service:**
    *   From your Render dashboard, click **"New +"** and select **"Web Service"**.
    *   Connect your GitHub account and select your forked repository.
    *   Give your service a unique name (e.g., `my-afk-bot`).
    *   **Region:** Choose a region close to you.
    *   **Branch:** `master` (or `main`).
    *   **Runtime:** `Python 3`.
    *   **Build Command:** `pip install -r requirements.txt`.
    *   **Start Command:** `gunicorn --access-logfile /dev/null --error-logfile - app:app` (This is important! Make sure this is set correctly).
    *   **Instance Type:** `Free`.

4.  **Add Environment Variables:**
    *   Before creating the service, click **"Advanced Settings"**.
    *   Click **"Add Environment Variable"** and add your Minecraft server details (`MC_SERVER_ADDRESS`, `MC_USERNAME`, etc.).

5.  **Deploy:**
    *   Click **"Create Web Service"** at the bottom of the page. Render will now build and deploy your bot.
    *   Once the deployment is live, copy your service's URL (e.g., `https://my-afk-bot.onrender.com`). You will need this for the next step.

## Setting Up a Keep-Alive Service (Required for Free Tier)

Render's free web services spin down after 15 minutes of inactivity. To keep your bot running 24/7, you must use an external service to ping your bot's URL every 15 minutes or less.

Here are two free methods to do this. You only need to choose one.

### Method 1: UptimeRobot (Easiest)

1.  **Create a free account** at [uptimerobot.com](https://uptimerobot.com/).
2.  From your dashboard, click **"Add New Monitor"**.
3.  **Monitor Type:** `HTTP(s)`.
4.  **Friendly Name:** Give it a name (e.g., "Minecraft Bot Keep-Alive").
5.  **URL (or IP):** Paste your Render service URL.
6.  **Monitoring Interval:** Set it to **15 minutes** or less.
7.  Click **"Create Monitor"**. That's it! UptimeRobot will now keep your bot online.

### Method 2: Google Cloud Scheduler (More Advanced)

This method uses a free-tier Google Cloud Function that is triggered by the free-tier Google Cloud Scheduler.

#### Step A: Create a Google Cloud Function
1.  Go to the [Google Cloud Console](https://console.cloud.google.com/) and create a new project if you don't have one.
2.  Navigate to **"Cloud Functions"** and click **"Create Function"**.
3.  **Function name:** `render-pinger`.
4.  **Region:** Choose a region.
5.  **Trigger type:** `HTTP`.
6.  **Authentication:** Select **"Allow unauthenticated invocations"**.
7.  Click **"Next"**.
8.  **Runtime:** `Python 3.10` (or newer).
9.  **Source code:** Inline Editor.
10. **Entry point:** `handler`.
11. In the `requirements.txt` file, add: `requests`.
12. In the `main.py` file, paste the following code, replacing `'YOUR_RENDER_URL_HERE'` with your bot's actual Render URL:
    ```python
    import requests

    def handler(request):
        try:
            # Replace with your Render service URL
            url = 'YOUR_RENDER_URL_HERE'
            response = requests.get(url, timeout=10)
            print(f"Pinged {url}, status code: {response.status_code}")
            return f"Success: {response.status_code}", 200
        except requests.RequestException as e:
            print(f"Error pinging {url}: {e}")
            return f"Error: {e}", 500
    ```
13. Click **"Deploy"**. Once deployed, copy the function's **Trigger URL**.

#### Step B: Create a Cloud Scheduler Job
1.  In the Google Cloud Console, navigate to **"Cloud Scheduler"**.
2.  Click **"Create Job"**.
3.  **Name:** `ping-render-bot`.
4.  **Region:** Choose the same region as your function.
5.  **Frequency:** Enter `*/15 * * * *` (this is cron syntax for "every 15 minutes").
6.  **Timezone:** Select your timezone.
7.  **Target type:** `HTTP`.
8.  **URL:** Paste the **Trigger URL** of your Cloud Function.
9.  **HTTP method:** `GET`.
10. Click **"Create"**.

Your bot is now fully configured to run 24/7 on Render's free tier!
