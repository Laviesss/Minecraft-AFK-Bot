export interface BotState {
  isOnline: boolean;
  serverAddress: string;
  uptime: number;
  health: number;
  hunger: number;
  coordinates: { x: number; y: number; z: number };
  proxy: string | null;
  playerCount: number;
  playerList: string[];
  isAfkEnabled: boolean;
  ping?: number;
}

export interface ChatMessage {
  id: string;
  text: string;
  timestamp: number;
  isSystem: boolean;
}

export interface InventoryItem {
    name: string;
    count: number;
}

export type Minimap = string[][];
