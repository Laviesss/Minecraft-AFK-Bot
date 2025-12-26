import React from 'react';
import { Player } from '../types';

interface PlayerListPanelProps {
  playerCount: number;
  players: Player[];
}

const PlayerListPanel: React.FC<PlayerListPanelProps> = ({ playerCount, players }) => {
  return (
    <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-4 shadow-xl">
       <div className="flex items-center gap-2 mb-4">
        <div className="w-1.5 h-1.5 rounded-full bg-[#00FFFF] shadow-[0_0_8px_rgba(0,255,255,0.6)]" />
        <h2 className="text-sm font-bold tracking-tight uppercase text-slate-300">
          PLAYERS ONLINE ({playerCount})
        </h2>
      </div>
      <div className="bg-slate-900/50 rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto custom-scrollbar border border-slate-700/50 shadow-inner">
        {players.length > 0 ? (
          players.map((p) => (
            <div key={p.username} className="text-xs text-slate-300 flex justify-between items-center">
              <span>{p.username}</span>
              <span className="text-slate-500 mono">{p.ping}ms</span>
            </div>
          ))
        ) : (
          <p className="text-xs text-slate-500 italic">No players online.</p>
        )}
      </div>
    </div>
  );
};

export default PlayerListPanel;
