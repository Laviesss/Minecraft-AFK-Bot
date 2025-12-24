# Minecraft AFK Bot

This is a simple Python script that connects to a Minecraft server and stays AFK. It's designed to be run on a cloud service like PythonAnywhere or any machine with Python installed.

## Setup

1.  **Get the code:** Download or clone this repository to your local machine or directly onto your hosting service.

2.  **Install the dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

## Configuration (config.txt)

The bot is configured using a `config.txt` file.

1.  **Create the config file:** Copy the example file `config.txt.example` to a new file named `config.txt`.
    ```bash
    cp config.txt.example config.txt
    ```

2.  **Edit `config.txt`:** Open the `config.txt` file and fill in your server details.
    *   `MC_SERVER_ADDRESS`: The address of the Minecraft server (e.g., `mc.example.com`).
    *   `MC_USERNAME`: The username for the bot to use.
    *   `MC_SERVER_PORT` (Optional): The port of the Minecraft server. It defaults to `25565` if not specified.

## How to Run on PythonAnywhere

PythonAnywhere is a great service for running this bot 24/7. Here's how to set it up:

#### 1. Get a PythonAnywhere Account
If you don't have one, sign up for a free "Beginner" account on [pythonanywhere.com](https://www.pythonanywhere.com/).

#### 2. Upload Your Code
1.  Go to the **"Files"** tab in your PythonAnywhere dashboard.
2.  Upload the three files from this repository:
    *   `afk_bot.py`
    *   `requirements.txt`
    *   `config.txt.example`

#### 3. Install Dependencies
1.  Start a **"Bash"** console from the "Consoles" tab.
2.  Create a virtual environment. Using a specific Python version like 3.10 is recommended.
    ```bash
    mkvirtualenv --python=/usr/bin/python3.10 my-afk-bot
    ```
3.  Install the required packages into your new virtual environment:
    ```bash
    pip install -r requirements.txt
    ```
4.  You can now exit the console by typing `exit`.

#### 4. Create Your `config.txt` File
1.  In the same Bash console, or by navigating in the **"Files"** tab, copy the example config file:
    ```bash
    cp config.txt.example config.txt
    ```
2.  Click on the `config.txt` file in the Files tab and edit it to add your Minecraft server address and username. Save the changes.

#### 5. Set Up an "Always-on" Task
This will keep your bot running continuously.
1.  Go to the **"Tasks"** tab.
2.  Under "Always-on tasks", click **"Add new Always-on task"**.
3.  Enter the following command. Be sure to replace `/home/YourUsername` with your actual home directory path on PythonAnywhere:
    ```bash
    /home/YourUsername/.virtualenvs/my-afk-bot/bin/python /home/YourUsername/afk_bot.py
    ```
4.  Click the **"Add"** button. The task will start, and your bot will connect to the server! You can view the bot's log file from the same "Tasks" page to see its output.

The bot will now run indefinitely. If it disconnects, it will automatically try to reconnect.
