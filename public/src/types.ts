export interface BotState {
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

export interface InventoryItem {
  name: string;
  count: number;
}

export interface MinimapData {
  bot: {
    x: number;
    y: number;
    z: number;
    yaw: number;
  };
  map: {
    x: number;
    z: number;
    type: string;
    height: number;
  }[];
  players: {
    username: string;
    x: number;
    z: number;
  }[];
}
