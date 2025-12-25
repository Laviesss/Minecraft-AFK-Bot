import React from 'react';
import { BotState } from '../types';
import ProgressBar from './ProgressBar';

interface StatusPanelProps {
  botState: BotState;
}

const StatusPanel: React.FC<StatusPanelProps> = ({ botState }) => {
  const { coordinates, isOnline } = botState;

  const offlineDisplay = <span className="font-mono text-slate-500">N/A</span>;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col h-full border-l-4 border-l-cyan-500">
      <h2 className="text-2xl font-extrabold mb-8 flex items-center gap-3 text-slate-100">
        Status Panel
      </h2>

      <div className="space-y-6 overflow-y-auto pr-2">
        {/* Status */}
        <div className="flex justify-between items-center group">
          <span className="text-slate-400 font-medium">Status:</span>
          <span className={`font-black text-lg tracking-tight ${isOnline ? 'text-cyan-400' : 'text-red-500'}`}>
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>

        {/* Uptime */}
        <div className="flex justify-between items-center">
          <span className="text-slate-400 font-medium">Uptime:</span>
          {isOnline ? <span className="font-bold text-slate-100 font-mono">{botState.uptime}s</span> : offlineDisplay}
        </div>

        {/* Health */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-slate-400 font-medium">Health:</span>
            {isOnline ? <span className="font-bold text-slate-100 font-mono">{botState.health}/20</span> : offlineDisplay}
          </div>
          <ProgressBar
            value={isOnline ? botState.health : 0}
            max={20}
            colorMap={{ low: 'bg-red-500', med: 'bg-yellow-500', high: 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]' }}
          />
        </div>

        {/* Hunger */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-slate-400 font-medium">Hunger:</span>
            {isOnline ? <span className="font-bold text-slate-100 font-mono">{botState.hunger}/20</span> : offlineDisplay}
          </div>
          <ProgressBar
            value={isOnline ? botState.hunger : 0}
            max={20}
            colorMap={{ low: 'bg-red-500', med: 'bg-yellow-500', high: 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.4)]' }}
          />
        </div>

        {/* Coords */}
        <div className="flex justify-between items-center">
          <span className="text-slate-400 font-medium">Coords:</span>
          {isOnline ? (
            <span className="font-bold text-slate-100 font-mono text-sm tracking-tight bg-slate-800 px-2 py-1 rounded">
              X:{coordinates.x.toFixed(0)} Y:{coordinates.y.toFixed(0)} Z:{coordinates.z.toFixed(0)}
            </span>
          ) : offlineDisplay}
        </div>

        {/* Players */}
        <div className="flex justify-between items-center">
          <span className="text-slate-400 font-medium">Players:</span>
          {isOnline ? (
            <div className="flex items-center gap-2">
              <span className="font-black text-cyan-400 text-lg">{botState.playerCount}</span>
            </div>
          ) : offlineDisplay}
        </div>

        {/* Proxy Info */}
        {botState.proxy && (
          <div className="mt-4 pt-4 border-t border-slate-800/50 flex justify-between items-center opacity-50 text-[10px] uppercase tracking-widest font-bold">
            <span className="text-slate-500">Network Proxy</span>
            <span className="text-cyan-600">{botState.proxy}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatusPanel;
