import React from 'react';
import { BotState } from '../types';

interface StatusPanelProps {
  botState: BotState;
}

const ProgressBar: React.FC<{ label: string; current: number; max: number; colorClass: (p: number) => string }> = ({ label, current, max, colorClass }) => {
  const percentage = Math.min(Math.max((current / max) * 100, 0), 100);
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs font-medium mb-1 px-1">
        <span className="text-slate-400">{label}</span>
        <span className="text-slate-200">{current}/{max}</span>
      </div>
      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700">
        <div
          className={`h-full transition-all duration-500 ${colorClass(percentage)}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

const StatusPanel: React.FC<StatusPanelProps> = ({ botState }) => {
  const getBarColor = (p: number) => {
    if (p > 60) return 'bg-[#22c55e]';
    if (p > 30) return 'bg-[#eab308]';
    return 'bg-[#ef4444] shadow-[0_0_10px_rgba(239,68,68,0.4)]';
  };

  const Row = ({ label, value, mono = false, status = false }: { label: string; value: string | number; mono?: boolean; status?: boolean }) => (
    <div className="flex justify-between items-center py-2 border-b border-slate-800 last:border-0">
      <span className="text-sm text-[#94a3b8]">{label}</span>
      <span className={`text-sm ${status ? (value.toString().includes('Online') ? 'text-green-500' : 'text-red-500') : 'text-slate-200'} ${mono ? 'mono' : ''} font-medium`}>
        {value}
      </span>
    </div>
  );

  return (
    <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-5 shadow-xl">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-[#00FFFF] shadow-[0_0_8px_rgba(0,255,255,0.6)]" />
        <h2 className="text-lg font-bold tracking-tight">BOT STATUS</h2>
      </div>

      <div className="space-y-1 mb-6">
        <Row label="Status" value={botState.isOnline ? "🟢 Online" : "🔴 Offline"} status />
        <Row label="Server" value={botState.serverAddress} />
        <Row label="Dashboard" value={botState.dashboardUrl} mono />
        <Row label="Uptime" value={`${botState.uptime}s`} />
        <Row label="Proxy" value={botState.proxy || "None"} />
      </div>

      <div className="space-y-4 mb-6">
        <ProgressBar label="Health" current={botState.health} max={20} colorClass={getBarColor} />
        <ProgressBar label="Hunger" current={botState.hunger} max={20} colorClass={getBarColor} />
      </div>

      <div className="bg-[#1e293b]/50 rounded-lg p-3 border border-slate-800">
        <span className="text-[10px] text-slate-500 font-bold tracking-widest uppercase block mb-2">Coordinates</span>
        <div className="flex justify-between items-center text-sm mono text-[#00FFFF]">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 uppercase">X</span>
            <span>{Math.round(botState.coordinates.x)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 uppercase">Y</span>
            <span>{Math.round(botState.coordinates.y)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 uppercase">Z</span>
            <span>{Math.round(botState.coordinates.z)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusPanel;
