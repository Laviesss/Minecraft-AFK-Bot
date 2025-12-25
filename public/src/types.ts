export interface Coordinates {
  x: number;
  y: number;
  z: number;
}

export interface BotState {
  isOnline: boolean;
  serverAddress: string;
  uptime: number;
  health: number;
  hunger: number;
  coordinates: Coordinates;
  proxy: string | null;
  playerCount: number;
  playerList: string[];
  isAfkEnabled: boolean;
}

export interface ChatMessage {
  id: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}
