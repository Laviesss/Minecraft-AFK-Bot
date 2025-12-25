import React from 'react';
import { Player } from '../types';

interface PlayerListPanelProps {
  playerCount: number;
  players: Player[];
}

const PlayerListPanel: React.FC<PlayerListPanelProps> = ({ playerCount, players }) => {
  return (
    <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#00FFFF] shadow-[0_0_8px_rgba(0,255,255,0.6)]" />
          <h2 className="text-lg font-bold tracking-tight uppercase">Players</h2>
        </div>
        <div className="bg-slate-800 text-[#00FFFF] text-[10px] font-bold px-2 py-0.5 rounded border border-slate-700">
          {playerCount} ONLINE
        </div>
      </div>

      <div className="max-h-[250px] overflow-y-auto pr-1 -mr-1 space-y-2">
        {players.length === 0 ? (
          <div className="py-8 text-center text-slate-600 text-xs italic border border-dashed border-slate-800 rounded-lg">
            No other players nearby
          </div>
        ) : (
          players.map((p, idx) => (
            <div
              key={idx}
              className="flex justify-between items-center p-2 rounded-lg bg-slate-800/50 border border-slate-800 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded bg-slate-700 flex items-center justify-center text-[10px] text-slate-400 font-bold mono">
                  {p.username.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm text-slate-200 font-medium truncate max-w-[120px]">
                  {p.username}
                </span>
              </div>
              <span className="text-[10px] mono text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded">
                {p.ping}ms
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PlayerListPanel;
