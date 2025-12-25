# Web Dashboard Design Document

## 1. Overview & Theme

The goal is to create a modern, real-time web dashboard for the Minecraft AFK Bot. The dashboard will be a single-page application (SPA) that provides at-a-glance status information, a live chat feed, and administrative controls.

-   **Theme:** Dark Mode
-   **Primary Accent Color:** Cyan (`#00FFFF`)
-   **Secondary Accent Color:** Purple (`#8A2BE2`)
-   **Font:** A clean, sans-serif font like `Roboto` or `Inter`.
-   **Layout:** A responsive grid-based layout that works well on both desktop and mobile devices. The main view will be divided into three columns on wider screens, which stack vertically on smaller screens.

---

## 2. Layout Structure

The dashboard will be composed of three main panels arranged in a grid.

```
+----------------------+----------------------+----------------------+
|                      |                      |                      |
|     Status Panel     |      Chat Panel      |   Player & Control   |
|      (Column 1)      |      (Column 2)      |        Panel         |
|                      |                      |      (Column 3)      |
|                      |                      |                      |
+----------------------+----------------------+----------------------+
```

---

## 3. Component Breakdown

### 3.1. Status Panel

This panel provides a quick overview of the bot's current state.

-   **Title:** `Bot Status`
-   **Content:** A series of key-value pairs.
    -   `Status`: Displays "🟢 Online" or "🔴 Offline". The color should change accordingly.
    -   `Server`: The server address (e.g., `Laviesss.aternos.me:38373`).
    -   `Uptime`: A dynamically updating timer (e.g., `123s`).
    -   `Health`: A progress bar with the text label (e.g., `18/20`). The bar should be green, turning yellow below 60% and red below 30%.
    -   `Hunger`: A progress bar with the text label (e.g., `19/20`). The bar should be orange, turning yellow below 60% and red below 30%.
    -   `Coordinates`: The bot's current position (e.g., `X: -34, Y: 68, Z: 54`).
    -   `Proxy`: The currently used proxy (e.g., `127.0.0.1:9050`). Should display `None` if no proxy is in use.

### 3.2. Chat Panel

This panel displays the live in-game chat and allows the user to send messages.

-   **Title:** `Live Chat`
-   **Chat Log:**
    -   A scrollable `div` that displays the last 100 chat messages and system notifications (joins/leaves).
    -   New messages should be appended to the bottom, and the view should auto-scroll if the user is already at the bottom.
    -   Minecraft usernames should be rendered in a distinct color (e.g., cyan).
-   **Message Input:**
    -   A text input field with the placeholder `Send a message...`.
    -   A "Send" button with a purple background. Hitting "Enter" in the input field should also trigger sending the message.

### 3.3. Player & Control Panel

This panel lists the players currently online and provides administrative controls.

-   **Title:** `Players & Controls`
-   **Player List:**
    -   A list of all players currently on the server.
    -   A counter at the top showing the total number of players (e.g., `Players Online (5)`).
-   **Control Buttons:**
    -   A section with clearly labeled buttons for admin actions. Each button should have a purple background and a hover effect.
        -   `Toggle Anti-AFK`: Toggles the anti-AFK jumping mechanism. The button text should reflect the current state (e.g., "Disable Anti-AFK" or "Enable Anti-AFK").
        -   `Validate Proxies`: A button that triggers the proxy validation process. When clicked, it should show a temporary "Validating..." state and then display a success or error message.

---

## 4. Socket.io API

The frontend will communicate with the backend over Socket.io.

### 4.1. Events Emitted by the Backend (Listen for these)

-   `state` (emitted every second): The frontend should listen for this event to receive the main `botState` object and update the entire UI.
    -   **Payload (`botState` object):**
        ```json
        {
          "isOnline": true,
          "serverAddress": "Laviesss.aternos.me:38373",
          "uptime": 123,
          "health": 18,
          "hunger": 19,
          "coordinates": { "x": -34, "y": 68, "z": 54 },
          "proxy": "127.0.0.1:9050",
          "playerCount": 5,
          "playerList": ["Player1", "Player2"],
          "isAfkEnabled": true
        }
        ```
-   `chat` (emitted on new chat message or notification):
    -   **Payload (string):** A formatted chat message (e.g., `<Player1> Hello world!`, `➡️ Player2 joined.`).

### 4.2. Events Emitted by the Frontend (Send these)

-   `chat-message`: The frontend should emit this event when the user sends a message from the chat panel.
    -   **Payload (string):** The raw message content (e.g., `Hello from the dashboard!`).
-   `toggle-afk`: Emitted when the "Toggle Anti-AFK" button is clicked.
    -   **Payload:** None.
-   `validate-proxies`: Emitted when the "Validate Proxies" button is clicked.
    -   **Payload:** None.

---

## 5. Implementation Notes

-   The frontend should be a single `index.html` file that includes inline or linked CSS and JavaScript.
-   The JavaScript should handle all Socket.io connections, event listeners, and DOM manipulation to dynamically update the UI based on the data received from the backend.
-   The UI should be designed to be resilient, meaning it should still look good and function correctly even if the bot is offline and some data is unavailable.
