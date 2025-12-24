import os
import sys
import logging
from twisted.internet import reactor
from quarry.net.client import ClientFactory, ClientProtocol

# --- Logging Configuration ---
# Set up logging to output to stderr for better visibility in production environments.
log_level = logging.DEBUG if os.environ.get('ENV') == 'development' else logging.INFO
logging.basicConfig(stream=sys.stderr, level=log_level, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
log = logging.getLogger(__name__)

# --- Minecraft Bot Implementation ---
class AFKBotProtocol(ClientProtocol):
    """
    Handles the bot's connection state and logs key events.
    """
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
    """
    Manages the bot's protocol and implements a reconnection strategy.
    """
    protocol = AFKBotProtocol
    reconnect_delay = 5  # Start with a 5-second reconnect delay.

    def clientConnectionFailed(self, connector, reason):
        log.error("Connection failed: %s", reason.getErrorMessage())
        self.retry(connector)

    def clientConnectionLost(self, connector, reason):
        # Logging is handled in AFKBotProtocol.connection_lost.
        self.retry(connector)

    def retry(self, connector):
        """
        Implements an exponential backoff for reconnection attempts to avoid spamming the server.
        """
        log.info(f"Reconnecting in {self.reconnect_delay} second(s)...")
        reactor.callLater(self.reconnect_delay, connector.connect)
        # Double the delay for the next attempt, up to a maximum of 300 seconds (5 minutes).
        self.reconnect_delay = min(self.reconnect_delay * 2, 300)

    def buildProtocol(self, addr):
        # Reset the reconnect delay after a successful connection.
        self.reconnect_delay = 5
        return super().buildProtocol(addr)

def main():
    """
    Main function to configure and start the Minecraft bot.
    """
    server_address = os.environ.get("MC_SERVER_ADDRESS")
    server_port = int(os.environ.get("MC_SERVER_PORT", 25565))
    username = os.environ.get("MC_USERNAME")

    if not server_address or not username:
        log.error("Missing required environment variables (MC_SERVER_ADDRESS, MC_USERNAME). The bot will not start.")
        return

    log.info(f"Attempting to connect to '{server_address}:{server_port}' as '{username}' in offline mode.")

    factory = AFKBotFactory()
    factory.profile.display_name = username

    reactor.connectTCP(server_address, server_port, factory)

    # Start the Twisted reactor event loop.
    reactor.run()

if __name__ == "__main__":
    main()
