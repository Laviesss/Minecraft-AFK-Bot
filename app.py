import os
import sys
import socket
import logging
import threading
from flask import Flask
from twisted.internet import reactor
from quarry.net.client import ClientFactory, ClientProtocol

# --- Logging Configuration ---
# Gunicorn captures stdout, so we configure logging to use stderr for clear separation.
# The log level is set to INFO for production and DEBUG for local development.
log_level = logging.DEBUG if os.environ.get('FLASK_ENV') == 'development' else logging.INFO
logging.basicConfig(stream=sys.stderr, level=log_level, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
log = logging.getLogger(__name__)

# --- Flask Web Server Setup ---
app = Flask(__name__)

@app.route('/')
def hello_world():
    """A simple keep-alive endpoint for Render's free tier."""
    return 'AFK bot is running.'

# --- Minecraft Bot Implementation ---
class AFKBotProtocol(ClientProtocol):
    """Handles the bot's connection state and logs key events."""
    def connection_made(self):
        super().connection_made()
        log.info("Connection established. Sending handshake and login packets...")

    def packet_login_success(self, buff):
        super().packet_login_success(buff)
        log.info("Login successful! The bot will now join the server.")

    def player_joined(self, data):
        super().player_joined(data)
        log.info(f"Successfully joined the server as '{self.factory.profile.display_name}' and is now AFK.")

    def connection_lost(self, reason):
        log.warning("Connection lost: %s", reason.getErrorMessage())
        super().connection_lost(reason)

class AFKBotFactory(ClientFactory):
    """Manages the bot's protocol and implements a reconnection strategy."""
    protocol = AFKBotProtocol
    reconnect_delay = 1  # Reconnect every 1 second.

    def clientConnectionFailed(self, connector, reason):
        log.error("Connection failed: %s", reason.getErrorMessage())
        self.retry(connector)

    def clientConnectionLost(self, connector, reason):
        # Logging is handled in AFKBotProtocol.connection_lost.
        self.retry(connector)

    def retry(self, connector):
        """Implements a fixed 1-second reconnection delay."""
        log.info(f"Reconnecting in {self.reconnect_delay} second(s)...")
        reactor.callLater(self.reconnect_delay, connector.connect)

def check_server_connectivity(host, port, timeout=15):
    """
    Performs a simple TCP connection test to a given host and port.
    Returns True if the connection is successful, False otherwise.
    """
    log.info(f"Performing pre-flight network check to {host}:{port}...")
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(timeout)
            s.connect((host, port))
            log.info("Network check successful. Port is open.")
            return True
    except socket.timeout:
        log.error(f"Network check failed: Connection timed out after {timeout} seconds. This could be due to a firewall on the server's end or the server being offline.")
        return False
    except (socket.error, ConnectionRefusedError) as e:
        log.error(f"Network check failed: {e}. The server is reachable but actively refused the connection.")
        return False
    except Exception as e:
        log.error(f"An unexpected network error occurred: {e}")
        return False

def start_minecraft_bot():
    """Configures and starts the Minecraft bot connection."""
    server_address = os.environ.get("MC_SERVER_ADDRESS")
    server_port = int(os.environ.get("MC_SERVER_PORT", 25565))
    username = os.environ.get("MC_USERNAME")

    if not server_address or not username:
        log.error("Missing required environment variables (MC_SERVER_ADDRESS, MC_USERNAME). The bot will not start.")
        return

    # Perform a pre-flight check for diagnostic logging. The bot's own retry logic
    # will handle the actual connection attempts.
    check_server_connectivity(server_address, server_port)

    log.info(f"Handing off to connection logic. The bot will now attempt to connect to '{server_address}:{server_port}' as '{username}' and will retry if the server is offline.")

    factory = AFKBotFactory()
    factory.profile.display_name = username

    reactor.connectTCP(server_address, server_port, factory)

# --- Bot Initialization and Main Execution ---
def initialize_bot():
    """Starts the Twisted reactor in a background thread if it's not already running."""
    if not reactor.running:
        log.info("Starting the Twisted reactor in a background thread.")
        threading.Thread(target=reactor.run, args=(False,), daemon=True).start()
        reactor.callWhenRunning(start_minecraft_bot)
        log.info("Minecraft bot has been scheduled to start.")

# When the application module is loaded by Gunicorn, initialize the bot.
initialize_bot()

if __name__ == "__main__":
    # This block is for local development and debugging.
    log.info("Starting Flask development server.")
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 8080)))
