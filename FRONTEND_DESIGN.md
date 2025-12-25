# Web Dashboard Detailed Design & Implementation Guide

## 1. Overview & Core Principles

This document provides the blueprint for building a modern, real-time web dashboard for the Minecraft AFK Bot using **React and TypeScript**. The goal is a sleek, intuitive, and responsive single-page application (SPA).

-   **Framework:** React v18+ with TypeScript
-   **Styling:** TailwindCSS (to be included via CDN in `index.html`)
-   **State Management:** React Hooks (`useState`, `useEffect`, `useRef`). No external state management library is needed.
-   **Connectivity:** Socket.io Client

## 2. Theme & Color Palette

The entire interface must adhere to a strict dark theme to ensure a modern and visually comfortable experience.

-   **Background:** A very dark slate/near-black (`#020617`).
-   **Primary Accent (Cyan):** Used for highlights, interactive elements, and key information. (`#00FFFF`)
-   **Secondary Accent (Purple):** Used for action buttons and controls. (`#8A2BE2`)
-   **Text (Primary):** A light, off-white for readability. (`#f8fafc`)
-   **Text (Secondary):** A muted gray for less important text or labels. (`#94a3b8`)
-   **Panel Backgrounds:** A slightly lighter dark slate to distinguish panels from the main background. (`#0f172a`)

## 3. Layout & Structure

The layout must be responsive, utilizing a grid system that adapts to different screen sizes.

-   **Desktop (>= 1024px):** A three-column grid.
    -   `Column 1`: Status Panel & Minimap Panel
    -   `Column 2`: Chat Panel
    -   `Column 3`: Player List Panel & Controls Panel
-   **Mobile (< 1024px):** The columns should stack vertically in a single column.
    -   `Row 1`: Status Panel
    -   `Row 2`: Controls Panel
    -   `Row 3`: Minimap Panel
    -   `Row 4`: Chat Panel
    -   `Row 5`: Player List Panel

All panels should have consistent padding, a subtle border, and a title bar.

## 4. Component Breakdown (Implementation Details)

### 4.1. Status Panel (`StatusPanel.tsx`)

-   **Title:** `Bot Status`
-   **Layout:** A list of key-value pairs.
-   **Components:**
    -   **Status Indicator:**
        -   Displays `"🟢 Online"` in green (`#22c55e`) when `botState.isOnline` is `true`.
        -   Displays `"🔴 Offline"` in red (`#ef4444`) when `false`.
    -   **Server Address:** Displays `botState.serverAddress`.
    -   **Dashboard URL:** Displays `botState.dashboardUrl`.
    -   **Uptime:** Displays `botState.uptime` followed by "s" (e.g., `345s`).
    -   **Health & Hunger Bars:**
        -   **Structure:** A container with a label (e.g., `Health: 18/20`) above a progress bar.
        -   **Bar Logic:** The bar's width should be `(current / 20) * 100%`.
        -   **Color Logic:**
            -   `> 60%`: Green (`#22c55e`)
            -   `30% - 60%`: Yellow (`#eab308`)
            -   `< 30%`: Red (`#ef4444`)
    -   **Coordinates:** Displays formatted coordinates from `botState.coordinates` (e.g., `X: 12, Y: 64, Z: -150`).
    -   **Proxy:** Displays `botState.proxy` or `"None"`.

### 4.2. Minimap Panel (`MinimapPanel.tsx`)

-   **Title:** `Minimap`
-   **Canvas:** Use an HTML5 `<canvas>` element for rendering.
-   **Rendering Logic:**
    -   The view should be a 2D top-down grid centered on the bot.
    -   **Blocks:** Render blocks from the `minimap.map` array as squares. Block colors should be a simplified mapping (e.g., `stone` -> gray, `dirt` -> brown, `water` -> blue, `grass` -> green). The brightness of the block color should be affected by its `height` relative to the bot's Y position (higher blocks are brighter).
    -   **Bot:** The bot should be represented by a **cyan triangle or arrow** in the center of the canvas, pointing in the direction of `minimap.bot.yaw`.
    -   **Players:** Other players from `minimap.players` should be rendered as **purple dots**.

### 4.3. Chat Panel (`ChatPanel.tsx`)

-   **Title:** `Live Chat`
-   **Chat Log:**
    -   A scrollable `div` that automatically scrolls to the bottom when new messages are added.
    -   Display a history of the last 100 messages.
    -   **Message Styling:**
        -   Player messages: `<Username> Message` (e.g., `<Steve> Hello!`). The username should be **cyan**.
        -   System messages (`[SYSTEM]`): Should be a muted gray (`#94a3b8`).
-   **Input:**
    -   A text input field with the placeholder `Send a message...`.
    -   A "Send" button with a **purple** background. Pressing "Enter" in the input field must also send the message.

### 4.4. Player List Panel (`PlayerListPanel.tsx`)

-   **Title:** `Players Online (X)`, where `X` is `botState.playerCount`.
-   **Layout:** A list of players.
-   **Each player item should display:**
    -   The player's username.
    -   Their ping on the right side in a muted gray color (e.g., `Steve | 45ms`).

### 4.5. Controls Panel (`ControlsPanel.tsx`)

-   **Title:** `Controls`
-   **Layout:** A grid of action buttons and the virtual joystick.
-   **Virtual Joystick (`VirtualJoystick.tsx`):**
    -   **Appearance:** A circular base with a smaller, draggable knob. The base should be a dark gray, and the knob should be **cyan**.
    -   **Interaction:**
        -   When the user clicks and drags the knob, it should move within the bounds of the base.
        -   The component should determine the primary direction (`forward`, `back`, `left`, `right`) based on the knob's position.
        -   It should emit a `move` event to the socket **continuously** while being held.
        -   When the user releases the knob, it should snap back to the center and emit a `stop-move` event.
-   **Action Buttons:**
    -   All buttons must have a **purple** background with a subtle hover effect (e.g., brightness increase).
    -   `Toggle Anti-AFK`: Text should change based on `botState.isAfkEnabled`.
    -   `Get Inventory`
    -   `Use Held Item`
    -   `Look at Nearest Player`
    -   `Reconnect Bot`

## 5. Socket.io API Reference

The entire application is driven by events from the backend.

### Events to Listen For (from Backend)

-   `connect`: Fired when the dashboard successfully connects to the backend.
-   `disconnect`: Fired on disconnection. The UI should reflect this, perhaps by graying out controls.
-   `state` (emitted 1/sec): The primary data payload. The frontend should update its entire state from this object.
    -   **Payload (`botState`):**
        ```typescript
        interface BotState {
          isOnline: boolean;
          serverAddress: string;
          dashboardUrl: string;
          uptime: number;
          health: number;
          hunger: number;
          coordinates: { x: number; y: number; z: number };
          proxy: string | null;
          playerCount: number;
          playerList: { username: string; ping: number }[];
          isAfkEnabled: boolean;
        }
        ```
-   `chat` (on new message):
    -   **Payload (string):** The formatted chat message.
-   `inventory-update` (in response to `get-inventory`):
    -   **Payload (Array):** `[{ name: string, count: number }]`. The UI should display this in a temporary modal or alert.
-   `minimap-update` (in response to `get-minimap`):
    -   **Payload (Object):** The data needed to render the minimap.

### Events to Emit (to Backend)

-   `chat-message` -> (string)
-   `toggle-afk` -> ()
-   `get-inventory` -> ()
-   `use-item` -> ()
-   `look-at-player` -> ()
-   `reconnect-bot` -> ()
-   `get-minimap` -> ()  *(Note: The frontend should request a minimap update periodically, e.g., every 2 seconds)*
-   `move` -> (direction: 'forward' | 'back' | 'left' | 'right' | 'jump' | 'sprint')
-   `stop-move` -> ()

This document provides a comprehensive guide for building the frontend. The resulting code should be a clean, component-based React application that strictly adheres to these specifications.
