# Frontend Design V2: Minecraft AFK Bot Dashboard

## 1. Design Philosophy

This document outlines the design for a modern, real-time, and responsive web dashboard for the Minecraft AFK Bot. The goal is a clean, "gamer-centric" aesthetic that is both visually appealing and highly functional. The UI should feel like a professional command center.

-   **Theme:** Dark Mode First
-   **Core Technologies:** React, TypeScript, TailwindCSS
- F   **Layout:** A responsive 3-column layout that gracefully collapses on smaller screens.

## 2. Visual Identity

-   **Primary Color Palette:**
    -   **Background:** Slate-900 (`#0f172a`)
    -   **Panels/Cards:** Slate-800 (`#1e293b`)
    -   **Borders:** Slate-700 (`#334155`)
    -   **Primary Text:** Slate-200 (`#e2e8f0`)
    -   **Secondary Text:** Slate-400 (`#94a3b8`)
-   **Accent Colors:**
    -   **Primary Accent (Purple):** `#8A2BE2` (Used for key actions, highlights, and branding)
    -   **Secondary Accent (Cyan):** `#00FFFF` (Used for player names, minimap icons, and secondary info)
-   **Typography:**
    -   **Headings/UI Text:** Inter (or a similar clean sans-serif)
    -   **Monospaced Text (for code/data):** JetBrains Mono
-   **Icons:** Use simple, clean line icons (e.g., from an icon library like Heroicons or Phosphor Icons) or text-based icons (▲, ▼, ◀, ▶) for simplicity.

## 3. Global Layout & Structure

The main interface is a 3-column grid. On mobile, the columns stack vertically.

-   **Column 1 (Left - 25% width):** Status & Information
    -   Status Panel
    -   Player List Panel
-   **Column 2 (Center - 50% width):** Core Interaction
    -   Unified Control Panel (containing Minimap, Movement, and Actions)
-   **Column 3 (Right - 25% width):** Communication
    -   Live Chat Panel

## 4. Component Breakdown

### 4.1. Header

A simple, clean header at the top of the page.
-   **Title:** "MINECRAFT AFK BOT" in a large, bold, gradient text (from Purple to Cyan).
-   **Connection Status:** A small pill-shaped indicator with a colored dot (Green for connected, Red for disconnected) and text ("CONNECTED" / "DISCONNECTED").

### 4.2. Status Panel (Column 1)

-   **Title:** `BOT STATUS`
-   **Layout:** A vertical list of key-value pairs. Each item should have an icon, a label, and the value.
    -   **Server:** Icon: `server`. Label: `Server`. Value: `your.server.com`
    -   **Uptime:** Icon: `clock`. Label: `Uptime`. Value: `1h 23m 45s`
    -   **Health:** Icon: `heart`. Label: `Health`. Displayed as a progress bar with `18 / 20` text overlay. Bar color changes: Green > 12, Yellow > 6, Red <= 6.
    -   **Hunger:** Icon: `beaker`. Label: `Hunger`. Displayed as a progress bar with `19 / 20` text overlay. Bar color changes similarly to health.
    -   **Coordinates:** Icon: `map-pin`. Label: `Coords`. Value: `X: 123, Y: 64, Z: -456`
    -   **Proxy:** Icon: `shield-check`. Label: `Proxy`. Value: `127.0.0.1:9050` or `None`.

### 4.3. Player List Panel (Column 1)

-   **Title:** `PLAYERS ONLINE (5)` - The count should update dynamically.
-   **Layout:** A scrollable list. Each player is an item in the list.
-   **Player Item:** Displays the player's username. The text color should be the Cyan accent.

### 4.4. Unified Control Panel (Column 2)

This is the main interactive component, designed to look like a control console.

-   **Title:** `CONTROL CENTER`
-   **Minimap:**
    -   A square canvas element (`280px` x `280px`).
    -   Renders a top-down view of the world around the bot.
    -   The bot is represented by a Cyan triangle/arrow in the center, indicating its yaw (direction).
    -   Other players are represented by Purple dots.
    -   Blocks are colored based on their type (e.g., stone is grey, water is blue, grass is green).
-   **Movement Controls:**
    -   A D-pad layout using buttons.
    -   **Forward:** `▲` (Sends `forward`)
    -   **Back:** `▼` (Sends `back`)
    -   **Left:** `◀` (Sends `left`)
    -   **Right:** `▶` (Sends `right`)
    -   A central button for **Sneak:** `◆` (Sends `sneak`). This button should be the primary Purple accent color.
    -   **Jump** and **Sprint** buttons below the D-pad.
    -   All movement buttons should trigger `onMove(direction)` on `mousedown` and `onStop()` on `mouseup`/`mouseleave`.
-   **Action Buttons:**
    -   A grid of buttons below the movement controls.
    -   `Toggle AFK`: Button text/style changes based on `isAfkEnabled`.
    -   `Show Inventory`: Opens the Inventory Modal.
    -   `Use Held Item`: Triggers the `use-item` event.
    -   `Look at Player`: Triggers `look-at-player`.
    -   `Reconnect`: A full-width button at the bottom.

### 4.5. Live Chat Panel (Column 3)

-   **Title:** `LIVE CHAT`
-   **Message Area:** A tall, scrollable container. It should auto-scroll to the bottom when new messages arrive.
    -   Messages should be formatted as `<Username> Message`. Usernames should be in the Cyan accent color.
    -   System messages (join/leave) can have a different color (e.g., Slate-400).
-   **Input Area:**
    -   A text input field with the placeholder `Send a message...`.
    -   A "Send" button with the Purple accent color. Pressing "Enter" should also send the message.

### 4.6. Inventory Modal

-   This is not visible by default. It appears as an overlay when the "Show Inventory" button is clicked.
-   **Layout:** A modal window with a dark, blurred background behind it.
-   **Title:** `INVENTORY`
-   **Content:** A list of items. Each item shows its name and count (e.g., "Cobblestone", "x64").
-   **Close Button:** An "X" in the top-right corner and a "Close" button at the bottom to dismiss the modal.

## 5. Socket.io API Reference

### Events from Backend (Listen)
-   `state (BotState)`: The main heartbeat, sent every second with the complete bot state.
-   `chat (string)`: A new chat message or system notification.
-   `inventory-update (InventoryItem[])`: Sent after a `get-inventory` request.
-   `minimap-update (MinimapData)`: Sent after a `get-minimap` request.

### Events to Backend (Emit)
-   `chat-message (string)`: Send a message to in-game chat.
-   `move (direction: MoveDirection)`: Tell the bot to start moving. `direction` is one of `forward`, `back`, `left`, `right`, `jump`, `sprint`, `sneak`.
-   `stop-move`: Tell the bot to stop all movement.
-   `toggle-afk`: Toggle the anti-AFK jumper.
-   `get-inventory`: Request the bot's inventory.
-   `use-item`: Tell the bot to right-click.
-   `look-at-player`: Tell the bot to look at the nearest player.
-   `get-minimap`: Request a minimap update.
-   `reconnect-bot`: Disconnect and reconnect the bot.
