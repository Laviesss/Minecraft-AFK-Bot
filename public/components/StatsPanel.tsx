import React from 'react';
import { BotState } from '../types';
import { Heart, Utensils, Activity } from 'lucide-react';

interface StatsPanelProps {
  stats: BotState | null;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({ stats }) => {
  const getProgressWidth = (val: number, max: number = 20) => `${(val / max) * 100}%`;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm bg-gradient-to-br from-zinc-900 to-black">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-zinc-400 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
          <Activity className="w-4 h-4 text-purple-500" /> Bot_Status
        </h3>
        <div className="flex items-center gap-2 px-2.5 py-1 bg-zinc-800/50 border border-zinc-700/30 rounded-md">
          <div className={`w-1.5 h-1.5 rounded-full ${stats?.isOnline ? 'bg-purple-500 animate-pulse shadow-[0_0_8px_rgba(168,85,247,0.6)]' : 'bg-red-500'}`} />
          <span className="text-[9px] font-black text-zinc-300 uppercase tracking-tighter">{stats?.isOnline ? 'Active' : 'Standby'}</span>
        </div>
      </div>

      <div className="space-y-5">
        {/* Health */}
        <div>
          <div className="flex justify-between items-end mb-1.5">
            <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
              <Heart className="w-3 h-3 text-red-500 fill-current opacity-80" /> Health
            </span>
            <span className="text-white text-[10px] font-mono font-bold">{stats?.health || 0} / 20</span>
          </div>
          <div className="h-1 w-full bg-zinc-800/80 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(220,38,38,0.3)]"
              style={{ width: getProgressWidth(stats?.health || 0) }}
            />
          </div>
        </div>

        {/* Hunger */}
        <div>
          <div className="flex justify-between items-end mb-1.5">
            <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
              <Utensils className="w-3 h-3 text-orange-500 opacity-80" /> Hunger
            </span>
            <span className="text-white text-[10px] font-mono font-bold">{stats?.hunger || 0} / 20</span>
          </div>
          <div className="h-1 w-full bg-zinc-800/80 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-600 to-orange-400 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(234,88,12,0.3)]"
              style={{ width: getProgressWidth(stats?.hunger || 0) }}
            />
          </div>
        </div>

        {/* Position */}
        <div className="pt-2">
          <span className="text-zinc-600 text-[9px] font-black uppercase tracking-[0.3em] block mb-3">Spatial_Coordinates</span>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'X', val: stats?.position.x, color: 'text-purple-400' },
              { label: 'Y', val: stats?.position.y, color: 'text-purple-300' },
              { label: 'Z', val: stats?.position.z, color: 'text-purple-500' },
            ].map(({ label, val, color }) => (
              <div key={label} className="bg-black/40 border border-zinc-800/50 rounded-lg p-2 flex flex-col items-center">
                <span className={`text-[9px] font-black ${color}`}>{label}</span>
                <span className="text-white font-mono text-[11px] leading-tight mt-0.5">{val?.toFixed(1) || '0.0'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
