import React, { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { BotState, InventoryItem, MinimapData } from './types';
import StatusPanel from './components/StatusPanel';
import MinimapPanel from './components/MinimapPanel';
import ChatPanel from './components/ChatPanel';
import PlayerListPanel from './components/PlayerListPanel';
import ControlsPanel from './components/ControlsPanel';
import InventoryModal from './components/InventoryModal';

interface AppProps {
  socket: Socket;
}

const App: React.FC<AppProps> = ({ socket }) => {
  const [botState, setBotState] = useState<BotState | null>(null);
  const [chatMessages, setChatMessages] = useState<string[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[] | null>(null);
  const [minimapData, setMinimapData] = useState<MinimapData | null>(null);

  useEffect(() => {
    socket.on('state', (state: BotState) => setBotState(state));
    socket.on('chat', (message: string) => {
      setChatMessages(prev => [...prev.slice(-99), message]);
    });
    socket.on('inventory-update', (items: InventoryItem[]) => {
      setInventory(items);
      setTimeout(() => setInventory(null), 5000); // Auto-close after 5s
    });
     socket.on('minimap-update', (data: MinimapData) => setMinimapData(data));


    const minimapInterval = setInterval(() => {
        if(botState?.isOnline) socket.emit('get-minimap');
    }, 2000);

    return () => {
      socket.off('state');
      socket.off('chat');
      socket.off('inventory-update');
      socket.off('minimap-update');
      clearInterval(minimapInterval);
    };
  }, [socket, botState]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-4 font-sans">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-1 flex flex-col gap-4">
               {botState && <StatusPanel botState={botState} />}
               {minimapData && <MinimapPanel minimapData={minimapData} />}
            </div>
            <div className="lg:col-span-1 flex flex-col gap-4">
                 <ChatPanel messages={chatMessages} socket={socket} />
            </div>
            <div className="lg:col-span-1 flex flex-col gap-4">
                {botState && <PlayerListPanel playerCount={botState.playerCount} playerList={botState.playerList} />}
                {botState && <ControlsPanel botState={botState} socket={socket} />}
            </div>
        </div>
        {inventory && <InventoryModal inventory={inventory} onClose={() => setInventory(null)} />}
    </div>
  );
};

export default App;
