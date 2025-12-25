import React from 'react';
import { BotState } from '../types';

interface StatusPanelProps {
  botState: BotState;
}

const ProgressBar: React.FC<{ value: number; max: number; label: string; colorClass: string }> = ({ value, max, label, colorClass }) => {
  const percentage = (value / max) * 100;
  return (
    <div>
      <span className="text-sm text-slate-400">{label}: {Math.round(value)}/{max}</span>
      <div className="w-full bg-slate-700 rounded-full h-2.5">
        <div className={colorClass + " h-2.5 rounded-full"} style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
};

const getHealthColor = (health: number) => {
    if (health > 12) return 'bg-green-500';
    if (health > 6) return 'bg-yellow-500';
    return 'bg-red-500';
}

const getHungerColor = (hunger: number) => {
    if (hunger > 12) return 'bg-orange-500';
    if (hunger > 6) return 'bg-yellow-500';
    return 'bg-red-500';
}


const StatusPanel: React.FC<StatusPanelProps> = ({ botState }) => {
  return (
    <div className="bg-slate-900 p-4 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold text-cyan-400 mb-4 border-b border-slate-700 pb-2">Bot Status</h2>
      <div className="space-y-3">
        <p><span className="font-semibold text-slate-400">Status:</span> {botState.isOnline ? <span className="text-green-500">🟢 Online</span> : <span className="text-red-500">🔴 Offline</span>}</p>
        <p><span className="font-semibold text-slate-400">Server:</span> <span className="text-cyan-400">{botState.serverAddress}</span></p>
        <p><span className="font-semibold text-slate-400">Dashboard:</span> <a href={botState.dashboardUrl} className="text-cyan-400 hover:underline" target="_blank" rel="noopener noreferrer">{botState.dashboardUrl}</a></p>
        <p><span className="font-semibold text-slate-400">Uptime:</span> {botState.uptime}s</p>
        <ProgressBar value={botState.health} max={20} label="Health" colorClass={getHealthColor(botState.health)} />
        <ProgressBar value={botState.hunger} max={20} label="Hunger" colorClass={getHungerColor(botState.hunger)} />
        <p><span className="font-semibold text-slate-400">Coordinates:</span> X: {Math.round(botState.coordinates.x)}, Y: {Math.round(botState.coordinates.y)}, Z: {Math.round(botState.coordinates.z)}</p>
        <p><span className="font-semibold text-slate-400">Proxy:</span> {botState.proxy || 'None'}</p>
      </div>
    </div>
  );
};

export default StatusPanel;
