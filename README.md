# Minecraft AFK Bot

This is a simple Python script that connects to a Minecraft server and stays AFK. It's designed to be run on a cloud service or any machine with Python installed.

## Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```

2.  **Install the dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

## Configuration

The bot is configured using environment variables:

*   `MC_SERVER_ADDRESS`: The address of the Minecraft server (e.g., `mc.example.com`).
*   `MC_SERVER_PORT`: The port of the Minecraft server (defaults to `25565`).
*   `MC_USERNAME`: The username for the bot to use.

## Running the Bot

To run the bot, set the required environment variables and then run the `afk_bot.py` script:

```bash
export MC_SERVER_ADDRESS="mc.example.com"
export MC_USERNAME="MyAFKBot"
python afk_bot.py
```

The bot will then connect to the server and stay AFK until the script is stopped. If the connection is lost, it will automatically try to reconnect after a 30-second delay.
