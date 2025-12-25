export interface Coordinates {
  x: number;
  y: number;
  z: number;
}

export interface Player {
  username: string;
  ping: number;
}

export interface BotState {
  isOnline: boolean;
  serverAddress: string;
  dashboardUrl: string;
  uptime: number;
  health: number;
  hunger: number;
  coordinates: Coordinates;
  proxy: string | null;
  playerCount: number;
  playerList: Player[];
  isAfkEnabled: boolean;
}

export interface MinimapBlock {
  type: string;
  height: number;
}

export interface MinimapData {
  map: MinimapBlock[][];
  bot: {
    yaw: number;
  };
  players: {
    x: number;
    z: number;
    username: string;
  }[];
}

export interface InventoryItem {
  name: string;
  count: number;
}

export type MoveDirection = 'forward' | 'back' | 'left' | 'right' | 'jump' | 'sprint' | 'sneak';
