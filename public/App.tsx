import React, { useState, useEffect, createContext } from 'react';
import io, { Socket } from 'socket.io-client';
import Header from './components/Header';
import ViewerPanel from './components/ViewerPanel';
import InventoryPanel from './components/InventoryPanel';
import StatsPanel from './components/StatsPanel';
import ChatPanel from './components/ChatPanel';
import { BotStatus, ChatMessage, SocketContextType } from './types';

export const SocketContext = createContext<SocketContextType | null>(null);

const App: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState<BotStatus>({
    connected: false,
    socketConnected: false,
    health: 20,
    maxHealth: 20,
    hunger: 20,
    position: { x: 0, y: 0, z: 0 },
    isMoving: false,
    activeTask: 'Offline',
  });
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  useEffect(() => {
    const newSocket = io({ path: '/socket.io' });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setStatus(prev => ({ ...prev, socketConnected: true, activeTask: 'Connecting...' }));
    });

    newSocket.on('disconnect', () => {
      setStatus(prev => ({ ...prev, socketConnected: false, connected: false, activeTask: 'Offline' }));
    });

    newSocket.on('bot-state', (newState: Partial<BotStatus> & { isOnline?: boolean }) => {
      setStatus(prev => ({
        ...prev,
        ...newState,
        connected: newState.isOnline || false,
        activeTask: newState.isOnline ? (newState.isMoving ? 'Navigating' : 'Idle') : 'Offline',
      }));
    });

    newSocket.on('chat-message', (newMessage: Omit<ChatMessage, 'id'>) => {
      setChatHistory(prev => [...prev, { ...newMessage, id: Date.now().toString() }]);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const sendChatMessage = (message: string) => {
    if (socket) {
      socket.emit('send-chat-message', { message });
    }
  };

  const contextValue = {
    socket,
    status,
    chatHistory,
    sendChatMessage,
  };

  return (
    <SocketContext.Provider value={contextValue}>
      <div className="flex flex-col h-screen w-full bg-[#0A0A0A] p-4 gap-4 overflow-hidden">
        <Header />
        <div className="flex-[1.4] flex w-full gap-4 min-h-0">
          <InventoryPanel />
          <ViewerPanel />
        </div>
        <div className="flex-1 flex w-full gap-4 min-h-0">
          <div className="w-72 flex-none">
            <StatsPanel />
          </div>
          <div className="flex-1">
            <ChatPanel />
          </div>
        </div>
      </div>
    </SocketContext.Provider>
  );
};

export default App;