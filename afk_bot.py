import os
import sys
import logging
from twisted.internet import reactor
from quarry.net.client import ClientFactory, ClientProtocol

# Configure logging
logging.basicConfig(stream=sys.stdout, level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

class AFKBotProtocol(ClientProtocol):
    def player_joined(self, data):
        super().player_joined(data)
        logging.info("Successfully joined the server!")

    def connection_lost(self, reason):
        super().connection_lost(reason)
        logging.warning("Connection lost: %s", reason.value)


class AFKBotFactory(ClientFactory):
    protocol = AFKBotProtocol

    def __init__(self):
        super().__init__()
        self.reconnect_delay = 30

    def clientConnectionFailed(self, connector, reason):
        logging.error("Connection failed: %s", reason.getErrorMessage())
        self.retry(connector)

    def clientConnectionLost(self, connector, reason):
        logging.warning("Connection lost: %s", reason.getErrorMessage())
        self.retry(connector)

    def retry(self, connector):
        logging.info("Reconnecting in %d seconds...", self.reconnect_delay)
        reactor.callLater(self.reconnect_delay, connector.connect)

def main():
    # Get configuration from environment variables
    server_address = os.environ.get("MC_SERVER_ADDRESS")
    server_port = int(os.environ.get("MC_SERVER_PORT", 25565))
    username = os.environ.get("MC_USERNAME")

    if not server_address or not username:
        logging.error("MC_SERVER_ADDRESS and MC_USERNAME environment variables are required.")
        sys.exit(1)

    factory = AFKBotFactory()
    factory.profile.display_name = username

    reactor.connectTCP(server_address, server_port, factory)
    reactor.run()


if __name__ == "__main__":
    main()
