import React from 'react';
import { BotState } from '../types';

interface StatusPanelProps {
  botState: BotState;
}

const StatusPanel: React.FC<StatusPanelProps> = ({ botState }) => {

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const getBarColor = (value: number, max: number) => {
    const percentage = (value / max) * 100;
    if (percentage <= 30) return 'bg-red-500';
    if (percentage <= 60) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const ProgressBar: React.FC<{ label: string; value: number; max: number }> = ({ label, value, max }) => (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
        <span className="text-xs mono font-semibold">{value} / {max}</span>
      </div>
      <div className="w-full bg-slate-700/50 rounded-full h-2.5 border border-slate-700">
        <div
          className={`${getBarColor(value, max)} h-full rounded-full transition-all duration-300`}
          style={{ width: `${(value / max) * 100}%` }}
        />
      </div>
    </div>
  );

  const StatusItem: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div className="flex justify-between items-center py-2 border-b border-slate-800/50 last:border-b-0">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
      <span className="text-xs mono font-semibold text-right">{value}</span>
    </div>
  );

  return (
    <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-4 shadow-xl">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1.5 h-1.5 rounded-full bg-[#00FFFF] shadow-[0_0_8px_rgba(0,255,255,0.6)]" />
        <h2 className="text-sm font-bold tracking-tight uppercase text-slate-300">Bot Status</h2>
      </div>

      <div className="space-y-3">
        <StatusItem label="Status" value={
          <span className={botState.isOnline ? 'text-green-400' : 'text-red-400'}>
            {botState.isOnline ? 'ONLINE' : 'OFFLINE'}
          </span>
        }/>
        <StatusItem label="Server" value={<span className="truncate">{botState.serverAddress || 'N/A'}</span>} />
        <StatusItem label="Uptime" value={formatUptime(botState.uptime)} />
        <StatusItem label="Coordinates" value={
            `X:${botState.coordinates.x.toFixed(0)} Y:${botState.coordinates.y.toFixed(0)} Z:${botState.coordinates.z.toFixed(0)}`
        } />
        <ProgressBar label="Health" value={botState.health} max={20} />
        <ProgressBar label="Hunger" value={botState.hunger} max={20} />
      </div>
    </div>
  );
};

export default StatusPanel;
