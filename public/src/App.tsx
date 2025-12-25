import React, { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import StatusPanel from './components/StatusPanel';
import UnifiedControlPanel from './components/UnifiedControlPanel';
import ChatPanel from './components/ChatPanel';
import PlayerListPanel from './components/PlayerListPanel';
import { BotState, MinimapData, InventoryItem } from './types';

const INITIAL_STATE: BotState = {
  isOnline: false,
  serverAddress: 'N/A',
  dashboardUrl: 'N/A',
  uptime: 0,
  health: 20,
  hunger: 20,
  coordinates: { x: 0, y: 0, z: 0 },
  proxy: null,
  playerCount: 0,
  playerList: [],
  isAfkEnabled: false,
};

const App: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [botState, setBotState] = useState<BotState>(INITIAL_STATE);
  const [messages, setMessages] = useState<string[]>([]);
  const [minimapData, setMinimapData] = useState<MinimapData | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[] | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const newSocket = io(window.location.origin);
    setSocket(newSocket);

    newSocket.on('connect', () => setIsConnected(true));
    newSocket.on('disconnect', () => setIsConnected(false));

    newSocket.on('state', (state: BotState) => {
      setBotState(state);
    });

    newSocket.on('chat', (message: string) => {
      setMessages((prev) => [...prev.slice(-99), message]);
    });

    newSocket.on('inventory-update', (items: InventoryItem[]) => {
      setInventory(items);
    });

    newSocket.on('minimap-update', (data: MinimapData) => {
      setMinimapData(data);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    if (!socket || !isConnected) return;
    const interval = setInterval(() => {
      socket.emit('get-minimap');
    }, 2000);
    return () => clearInterval(interval);
  }, [socket, isConnected]);

  const sendMessage = useCallback((msg: string) => {
    socket?.emit('chat-message', msg);
  }, [socket]);

  const emitAction = useCallback((event: string, data?: any) => {
    socket?.emit(event, data);
  }, [socket]);

  return (
    <div className="min-h-screen bg-[#020617] text-[#f8fafc] p-4 lg:p-6 overflow-x-hidden">
      <header className="mb-8 flex flex-col items-center text-center gap-4 border-b border-slate-800 pb-6">
        <div className="relative inline-block">
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter bg-gradient-to-b from-[#A855F7] via-[#8A2BE2] to-[#020617] bg-clip-text text-transparent py-2">
            MINECRAFT AFK BOT
          </h1>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-transparent via-[#8A2BE2] to-transparent opacity-50"></div>
        </div>
        <p className="text-xs font-medium text-[#94a3b8] uppercase tracking-[0.3em] opacity-80">
          Real-time command & control center
        </p>

        <div className="flex items-center gap-3 bg-[#0f172a]/50 p-1.5 px-4 rounded-full border border-slate-800 mt-2 backdrop-blur-sm">
          <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)] animate-pulse' : 'bg-red-500'}`} />
          <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
            {isConnected ? 'System Link Active' : 'System Offline'}
          </span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start max-w-7xl mx-auto">
        {/* Column 1: Status & Players */}
        <div className="lg:col-span-3 space-y-6 flex flex-col order-1 lg:order-1">
          <div className="order-1">
            <StatusPanel botState={botState} />
          </div>
          <div className="order-3 lg:order-2">
            <PlayerListPanel playerCount={botState.playerCount} players={botState.playerList} />
          </div>
        </div>

        {/* Column 2: Shrunken Unified Control Center */}
        <div className="lg:col-span-5 order-2 lg:order-2 flex justify-center">
          <div className="w-full max-w-[480px]">
            <UnifiedControlPanel
              data={minimapData}
              botCoords={botState.coordinates}
              isAfkEnabled={botState.isAfkEnabled}
              onMove={(dir) => emitAction('move', dir)}
              onStop={() => emitAction('stop-move')}
              onAction={emitAction}
              inventory={inventory}
              onCloseInventory={() => setInventory(null)}
            />
          </div>
        </div>

        {/* Column 3: Live Chat */}
        <div className="lg:col-span-4 order-4 lg:order-3 h-[500px] lg:h-[750px]">
          <ChatPanel messages={messages} onSendMessage={sendMessage} />
        </div>
      </div>
    </div>
  );
};

export default App;
