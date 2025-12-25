import React from 'react';
import { Socket } from 'socket.io-client';
import { BotState } from '../types';
import VirtualJoystick from './VirtualJoystick';

interface ControlsPanelProps {
  botState: BotState;
  socket: Socket;
}

const ControlButton: React.FC<{ onClick: () => void; children: React.ReactNode }> = ({ onClick, children }) => (
  <button onClick={onClick} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md w-full transition-colors duration-200">
    {children}
  </button>
);


const ControlsPanel: React.FC<ControlsPanelProps> = ({ botState, socket }) => {
  return (
    <div className="bg-slate-900 p-4 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold text-cyan-400 mb-4 border-b border-slate-700 pb-2">Controls</h2>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <ControlButton onClick={() => socket.emit('toggle-afk')}>{botState.isAfkEnabled ? 'Disable Anti-AFK' : 'Enable Anti-AFK'}</ControlButton>
        <ControlButton onClick={() => socket.emit('get-inventory')}>Get Inventory</ControlButton>
        <ControlButton onClick={() => socket.emit('use-item')}>Use Held Item</ControlButton>
        <ControlButton onClick={() => socket.emit('look-at-player')}>Look at Nearest Player</ControlButton>
        <ControlButton onClick={() => socket.emit('reconnect-bot')}>Reconnect Bot</ControlButton>
      </div>
       <div className="pt-4 border-t border-slate-700">
        <VirtualJoystick socket={socket} />
       </div>
    </div>
  );
};

export default ControlsPanel;
