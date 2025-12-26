import React, { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import StatusPanel from './components/StatusPanel';
import UnifiedControlPanel from './components/UnifiedControlPanel';
import ChatPanel from './components/ChatPanel';
import PlayerListPanel from './components/PlayerListPanel';
import InventoryPanel from './components/InventoryPanel';
import MinimapPanel from './components/MinimapPanel'; // Import the new minimap component
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
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [showInventory, setShowInventory] = useState(false);

  useEffect(() => {
    const newSocket = io(window.location.origin);
    setSocket(newSocket);

    newSocket.on('connect', () => setIsConnected(true));
    newSocket.on('disconnect', () => setIsConnected(false));
    newSocket.on('state', (state: BotState) => setBotState(state));
    newSocket.on('chat', (message: string) => setMessages((prev) => [...prev.slice(-99), message]));
    newSocket.on('inventory-update', (items: InventoryItem[]) => setInventory(items));
    newSocket.on('minimap-update', (data: MinimapData) => setMinimapData(data));

    return () => newSocket.close();
  }, []);

  useEffect(() => {
    if (!socket || !isConnected) return;
    const minimapInterval = setInterval(() => socket.emit('get-minimap'), 2000);
    const inventoryInterval = setInterval(() => socket.emit('get-inventory'), 5000);
    socket.emit('get-inventory');

    return () => {
      clearInterval(minimapInterval);
      clearInterval(inventoryInterval);
    };
  }, [socket, isConnected]);

  const sendMessage = useCallback((msg: string) => socket?.emit('chat-message', msg), [socket]);
  const emitAction = useCallback((event: string, data?: any) => socket?.emit(event, data), [socket]);

  return (
    <div className="min-h-screen bg-[#020617] text-[#f8fafc] p-4 lg:p-6 overflow-x-hidden">
      <header className="mb-8 flex flex-col items-center text-center gap-4 border-b border-slate-800 pb-6">
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter bg-gradient-to-b from-[#A855F7] via-[#8A2BE2] to-[#020617] bg-clip-text text-transparent py-2">
          MINECRAFT AFK BOT
        </h1>
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
        <div className="lg:col-span-3 space-y-6 flex flex-col order-1">
          <StatusPanel botState={botState} />
          <PlayerListPanel playerCount={botState.playerCount} players={botState.playerList} />
        </div>

        {/* Column 2: Minimap & Controls */}
        <div className="lg:col-span-5 order-2 flex flex-col items-center gap-6">
          <div className="w-full max-w-[480px]">
            <MinimapPanel data={minimapData} botCoords={botState.coordinates} />
          </div>
          <div className="w-full max-w-[480px]">
             <UnifiedControlPanel
               isAfkEnabled={botState.isAfkEnabled}
               onMove={(dir) => emitAction('move', dir)}
               onStop={() => emitAction('stop-move')}
               onAction={(action) => {
                 if (action === 'toggle-inventory') {
                   setShowInventory(!showInventory);
                 } else {
                   emitAction(action);
                 }
               }}
             />
          </div>
        </div>

        {/* Column 3: Chat & Inventory */}
        <div className="lg:col-span-4 order-3 flex flex-col gap-6">
          <div className="h-[500px] lg:h-[auto] lg:flex-grow">
            <ChatPanel messages={messages} onSendMessage={sendMessage} />
          </div>
          {showInventory && (
            <div className="w-full">
              <InventoryPanel inventory={inventory} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
