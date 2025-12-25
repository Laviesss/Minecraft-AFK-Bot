import React, { useState, useEffect, useCallback } from 'react';
import { BotState, ChatMessage, InventoryItem, Minimap } from './types';
import StatusPanel from './components/StatusPanel';
import ChatPanel from './components/ChatPanel';
import PlayerPanel from './components/PlayerPanel';
import AdminPanel from './components/AdminPanel';
import MinimapPanel from './components/MinimapPanel';
import InventoryPanel from './components/InventoryPanel';
import MovementPanel from './components/MovementPanel';
import * as socket from './socket';

const App: React.FC = () => {
  const [botState, setBotState] = useState<BotState>({
    isOnline: false,
    serverAddress: "Connecting...",
    uptime: 0,
    health: 20,
    hunger: 20,
    coordinates: { x: 0, y: 0, z: 0 },
    proxy: null,
    playerCount: 0,
    playerList: [],
    isAfkEnabled: true
  });

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [minimap, setMinimap] = useState<Minimap>(Array(5).fill(Array(5).fill('#000')));
  const [isValidating, setIsValidating] = useState(false);
  const [validationMsg, setValidationMsg] = useState<string | null>(null);

  useEffect(() => {
    socket.onStateUpdate(setBotState);
    socket.onChatUpdate((messageText: string) => {
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        text: messageText,
        timestamp: Date.now(),
        isSystem: !messageText.startsWith('<'),
      };
      setChatMessages(prev => [...prev.slice(-99), newMessage]);
    });
    socket.onValidationResult((message: string) => {
        setIsValidating(false);
        setValidationMsg(message);
        setTimeout(() => setValidationMsg(null), 5000);
    });
    socket.onInventoryUpdate(setInventory);
    socket.onMinimapUpdate(setMinimap);

    const inventoryInterval = setInterval(() => {
        if(botState.isOnline) socket.emitGetInventory();
    }, 2000);

    const minimapInterval = setInterval(() => {
        if(botState.isOnline) socket.emitGetMinimap();
    }, 1000);

    return () => {
        clearInterval(inventoryInterval);
        clearInterval(minimapInterval);
    }
  }, [botState.isOnline]);

  const handleSendMessage = useCallback((msg: string) => socket.emitSendMessage(msg), []);
  const toggleAfk = useCallback(() => socket.emitToggleAfk(), []);
  const validateProxies = useCallback(() => {
    setIsValidating(true);
    setValidationMsg(null);
    socket.emitValidateProxies();
  }, []);
  const handleMove = useCallback((direction: 'forward' | 'backward' | 'left' | 'right') => socket.emitMove(direction), []);
  const handleStopMove = useCallback(() => socket.emitStopMove(), []);

  const handleAdminAction = useCallback((action: string) => {
    setChatMessages(prev => [...prev.slice(-99), { id: Date.now().toString(), text: `[SYSTEM] Executing: ${action}...`, timestamp: Date.now(), isSystem: true }]);
    if (action === 'Clear Local Chat') setChatMessages([]);
    else if (action === 'Reconnect Bot') socket.emitReconnect();
    else if (action === 'Use Held Item') socket.emitUseItem();
    else if (action === 'Look at Nearest Player') socket.emitLookAtPlayer();
  }, []);

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center">
      <header className="w-full max-w-7xl mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter bg-gradient-to-r from-cyan-400 via-purple-400 to-purple-600 bg-clip-text text-transparent italic">
            AFK BOT COMMAND
          </h1>
          <p className="text-slate-500 text-xs font-mono uppercase tracking-widest">v3.0.0 • INTERACTIVE</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
             <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Connection State</span>
             <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${botState.isOnline ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`} />
                <span className="font-bold text-sm tracking-tight">{botState.isOnline ? 'ESTABLISHED' : 'DISCONNECTED'}</span>
             </div>
          </div>
        </div>
      </header>

      <main className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-6">
            <StatusPanel botState={botState} />
            <PlayerPanel botState={botState} />
        </div>
        <div className="lg:col-span-2">
          <ChatPanel messages={chatMessages} onSendMessage={handleSendMessage} />
        </div>
        <div className="space-y-6 lg:col-span-1">
            <MinimapPanel minimap={minimap} />
            <InventoryPanel inventory={inventory} />
        </div>
        <div className="lg:col-span-2 space-y-6">
            <MovementPanel onMove={handleMove} onStop={handleStopMove} />
        </div>
        <div className="lg:col-span-2 space-y-6">
            <AdminPanel
              botState={botState}
              onToggleAfk={toggleAfk}
              onValidateProxies={validateProxies}
              isValidating={isValidating}
              validationMsg={validationMsg}
              onAction={handleAdminAction}
            />
        </div>
      </main>

      <footer className="mt-12 w-full max-w-7xl border-t border-slate-900 pt-6 flex justify-between text-slate-600 text-[10px] font-mono uppercase tracking-widest">
        <span>© {new Date().getFullYear()} MC-AFK-CORE</span>
        <span>Latency: {botState.ping ?? 0}ms</span>
      </footer>
    </div>
  );
};

export default App;
