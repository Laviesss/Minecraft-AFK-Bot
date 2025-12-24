import os
import sys
import logging
import threading
from flask import Flask
from twisted.internet import reactor
from quarry.net.client import ClientFactory, ClientProtocol

# Configure logging for verbose output
logging.basicConfig(stream=sys.stdout, level=logging.DEBUG, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
log = logging.getLogger(__name__)

# --- Flask Web Server Setup ---
app = Flask(__name__)

@app.route('/')
def hello_world():
    """Keep-alive endpoint."""
    return 'AFK bot is running.'

# --- Minecraft Bot Setup ---
class AFKBotProtocol(ClientProtocol):
    def player_joined(self, data):
        super().player_joined(data)
        log.info("Successfully joined the server!")

    def connection_lost(self, reason):
        super().connection_lost(reason)
        log.warning("Connection lost: %s", reason.value)


class AFKBotFactory(ClientFactory):
    protocol = AFKBotProtocol

    def __init__(self):
        super().__init__()
        self.reconnect_delay = 30

    def clientConnectionFailed(self, connector, reason):
        log.error("Connection failed: %s", reason.getErrorMessage())
        self.retry(connector)

    def clientConnectionLost(self, connector, reason):
        log.warning("Connection lost: %s", reason.getErrorMessage())
        self.retry(connector)

    def retry(self, connector):
        log.info("Reconnecting in %d seconds...", self.reconnect_delay)
        reactor.callLater(self.reconnect_delay, connector.connect)

def start_minecraft_bot():
    """Configures and starts the Minecraft bot connection."""
    server_address = os.environ.get("MC_SERVER_ADDRESS")
    server_port = int(os.environ.get("MC_SERVER_PORT", 25565))
    username = os.environ.get("MC_USERNAME")

    if not server_address or not username:
        log.error("MC_SERVER_ADDRESS and MC_USERNAME env vars are required. Bot not starting.")
        return

    factory = AFKBotFactory()
    factory.profile.display_name = username

    log.info(f"Attempting to connect to {server_address}:{server_port} as {username}")
    try:
        reactor.connectTCP(server_address, server_port, factory)
        log.debug("reactor.connectTCP call was successful.")
    except Exception as e:
        log.critical(f"An unexpected error occurred when trying to connect: {e}")

# --- Main Execution ---

# The Twisted reactor runs in a background thread.
# This allows the Flask app (run by Gunicorn) to be the main process.
if not reactor.running:
    # Use a daemon thread so it exits when the main thread (Gunicorn) exits.
    # installSignalHandlers=False is crucial for running in a thread.
    threading.Thread(target=reactor.run, args=(False,), daemon=True).start()
    log.info("Twisted reactor started in a background thread.")

# Schedule the bot to start once the reactor is running.
reactor.callWhenRunning(start_minecraft_bot)

if __name__ == "__main__":
    # This block is for local testing only.
    # On Render, Gunicorn runs the 'app' object directly.
    # The bot will start automatically due to the module-level code above.
    log.info("Starting Flask development server for local testing.")
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 8080)))
