import os
from flask import Flask

app = Flask(__name__)

@app.route('/')
def hello_world():
    """
    A simple keep-alive endpoint for Render's free tier.
    This prevents the service from spinning down due to inactivity.
    """
    # The real work is done by the bot in the background worker process.
    return 'AFK bot is running in a separate worker process.'

if __name__ == "__main__":
    # This block is for local development and debugging.
    # In production, Gunicorn is used as the WSGI server.
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 8080)))
