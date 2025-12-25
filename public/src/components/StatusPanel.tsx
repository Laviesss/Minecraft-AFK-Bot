import React from 'react';
import { BotState } from '../types';
import ProgressBar from './ProgressBar';

interface StatusPanelProps {
  botState: BotState;
}

const StatusPanel: React.FC<StatusPanelProps> = ({ botState }) => {
  const { coordinates } = botState;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col h-full border-l-4 border-l-cyan-500">
      <h2 className="text-2xl font-extrabold mb-8 flex items-center gap-3 text-slate-100">
        Status Panel
      </h2>

      <div className="space-y-6 overflow-y-auto pr-2">
        {/* Status */}
        <div className="flex justify-between items-center group">
          <span className="text-slate-400 font-medium">Status:</span>
          <span className={`font-black text-lg tracking-tight ${botState.isOnline ? 'text-cyan-400' : 'text-red-500'}`}>
            {botState.isOnline ? 'Online' : 'Offline'}
          </span>
        </div>

        {/* Uptime */}
        <div className="flex justify-between items-center">
          <span className="text-slate-400 font-medium">Uptime:</span>
          <span className="font-bold text-slate-100 font-mono">{botState.uptime}s</span>
        </div>

        {/* Health */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-slate-400 font-medium">Health:</span>
            <span className="font-bold text-slate-100 font-mono">{botState.health}/20</span>
          </div>
          <ProgressBar
            value={botState.health}
            max={20}
            colorMap={{ low: 'bg-red-500', med: 'bg-yellow-500', high: 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]' }}
          />
        </div>

        {/* Hunger */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-slate-400 font-medium">Hunger:</span>
            <span className="font-bold text-slate-100 font-mono">{botState.hunger}/20</span>
          </div>
          <ProgressBar
            value={botState.hunger}
            max={20}
            colorMap={{ low: 'bg-red-500', med: 'bg-yellow-500', high: 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.4)]' }}
          />
        </div>

        {/* Coords */}
        <div className="flex justify-between items-center">
          <span className="text-slate-400 font-medium">Coords:</span>
          <span className="font-bold text-slate-100 font-mono text-sm tracking-tight bg-slate-800 px-2 py-1 rounded">
            X:{coordinates.x.toFixed(0)} Y:{coordinates.y.toFixed(0)} Z:{coordinates.z.toFixed(0)}
          </span>
        </div>

        {/* Players */}
        <div className="flex justify-between items-center">
          <span className="text-slate-400 font-medium">Players:</span>
          <div className="flex items-center gap-2">
            <span className="font-black text-cyan-400 text-lg">{botState.playerCount}</span>
            <div className="flex -space-x-2">
               {botState.playerList.slice(0, 3).map((_, i) => (
                 <div key={i} className="w-5 h-5 rounded-full bg-slate-700 border border-slate-900 flex items-center justify-center text-[8px] font-bold text-slate-400">
                    {botState.playerList[i]?.charAt(0) || '?'}
                 </div>
               ))}
               {botState.playerCount > 3 && (
                 <div className="w-5 h-5 rounded-full bg-slate-800 border border-slate-900 flex items-center justify-center text-[8px] text-slate-500">
                   +{botState.playerCount - 3}
                 </div>
               )}
            </div>
          </div>
        </div>

        {/* Proxy Info (Maintained but subtle) */}
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
