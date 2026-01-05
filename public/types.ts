export interface BotStatus {
  connected: boolean;
  socketConnected: boolean;
  health: number;
  hunger: number;
  position: { x: number; y: number; z: number };
  isMoving: boolean;
  activeTask: string;
}

export interface ChatMessage {
  id: string;
  timestamp: string;
  sender: string;
  message: string;
  type: 'system' | 'player' | 'bot';
}

export interface SocketContextType {
  socket: any;
  status: BotStatus;
  chatHistory: ChatMessage[];
  sendChatMessage: (message: string) => void;
}