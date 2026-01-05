import React, { useContext } from 'react';
import { SocketContext } from '../App';
import { SocketContextType } from '../types';

const StatsPanel: React.FC = () => {
  const { status } = useContext(SocketContext) as SocketContextType;

  const healthPercentage = (status.health / 20) * 100;
  const hungerPercentage = (status.hunger / 20) * 100;

  return (
    <div className="h-full bg-[#121212] border border-white/[0.04] rounded-xl p-5 flex flex-col justify-between overflow-hidden">
      <div className="space-y-3">
        <StatRow label="HP" value={`${healthPercentage.toFixed(0)}%`} color={healthPercentage > 50 ? 'text-white' : 'text-red-400'} />
        <StatRow label="Food" value={`${hungerPercentage.toFixed(0)}%`} color="text-white/40" />
      </div>

      <div className="h-[1px] bg-white/[0.02] w-full" />

      <div className="grid grid-cols-3 gap-2">
        <DataPoint label="X" value={status.position.x.toFixed(0)} />
        <DataPoint label="Y" value={status.position.y.toFixed(0)} />
        <DataPoint label="Z" value={status.position.z.toFixed(0)} />
      </div>

      <div className="flex justify-between items-center mt-2">
        <div className="flex flex-col">
          <span className="text-[8px] text-white/10 uppercase">Biome</span>
          <span className="text-[10px] text-white/40 font-medium">--</span>
        </div>
        <div className="flex flex-col text-right">
          <span className="text-[8px] text-white/10 uppercase">Dimension</span>
          <span className="text-[10px] text-white/40 font-medium">--</span>
        </div>
      </div>
    </div>
  );
};

const StatRow: React.FC<{ label: string; value: string; color?: string }> = ({ label, value, color }) => (
  <div className="flex justify-between items-center">
    <span className="text-[9px] uppercase tracking-wider text-white/20 font-medium">{label}</span>
    <span className={`text-xs font-medium ${color || 'text-white/60'}`}>{value}</span>
  </div>
);

const DataPoint: React.FC<{ label: string; value: string; className?: string }> = ({ label, value, className }) => (
  <div className={`flex flex-col ${className}`}>
    <span className="text-[8px] text-white/10 font-medium uppercase">{label}</span>
    <span className="text-[11px] text-white/50 font-medium mono">{value}</span>
  </div>
);

export default StatsPanel;