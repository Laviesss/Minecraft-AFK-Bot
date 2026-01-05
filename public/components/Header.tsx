import React, { useContext } from 'react';
import { SocketContext } from '../App';
import { SocketContextType } from '../types';

const Header: React.FC = () => {
  const { socket, status } = useContext(SocketContext) as SocketContextType;

  const handleStop = () => {
    if (socket) socket.emit('stop-move');
  };

  const handleReset = () => {
    if (socket) socket.emit('terminate');
  };

  return (
    <header className="flex items-center justify-between h-8 w-full px-1">
      <div className="flex items-center gap-5">
        <span className="font-semibold text-xs tracking-tight text-white/90">
          Bot Dashboard
        </span>

        <div className="flex items-center gap-3 text-[9px] font-medium text-white/30 uppercase tracking-wider">
          <div className="flex items-center gap-1.5">
            <div className={`h-1 w-1 rounded-full ${status.socketConnected ? 'bg-purple-500' : 'bg-red-500'}`} />
            <span>{status.socketConnected ? (status.connected ? 'Bot Connected' : 'Bot Offline') : 'Server Offline'}</span>
          </div>
          <span className="opacity-20">•</span>
          <span>{status.activeTask}</span>
        </div>
      </div>

      <div className="flex items-center gap-5">
        <button onClick={handleReset} className="text-[9px] font-bold text-white/20 hover:text-white transition-colors uppercase">
          Reset
        </button>
        <button onClick={handleStop} className="text-[9px] font-bold text-red-500/40 hover:text-red-500 transition-colors uppercase">
          Stop
        </button>
      </div>
    </header>
  );
};

export default Header;