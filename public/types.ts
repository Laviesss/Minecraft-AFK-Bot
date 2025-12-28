export type AuthMethod = 'Offline' | 'Microsoft';

export interface BotConfig {
  serverAddress: string;
  serverPort: number;
  botUsername: string;
  authMethod: AuthMethod;
  microsoftEmail?: string;
  serverPassword?: string;
  discordToken?: string;
  discordChannelId?: string;
}

export interface BotPosition {
  x: number;
  y: number;
  z: number;
}

export interface BotState {
  isOnline: boolean;
  health: number;
  hunger: number;
  position: BotPosition;
}

export interface ChatMessage {
  id: string;
  message: string;
  timestamp: number;
}

export enum MoveDirection {
  FORWARD = 'forward',
  BACK = 'back',
  LEFT = 'left',
  RIGHT = 'right',
  JUMP = 'jump'
}
