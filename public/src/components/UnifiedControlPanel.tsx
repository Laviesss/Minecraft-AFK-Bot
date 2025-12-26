import React from 'react';
import { MoveDirection } from '../types';

interface UnifiedControlPanelProps {
  isAfkEnabled: boolean;
  onMove: (dir: MoveDirection) => void;
  onStop: () => void;
  onAction: (event: string) => void;
}

const UnifiedControlPanel: React.FC<UnifiedControlPanelProps> = ({
  isAfkEnabled,
  onMove,
  onStop,
  onAction,
}) => {

  const ArrowButton = ({ dir, label, icon, isCenter = false }: { dir: MoveDirection; label: string; icon: string; isCenter?: boolean }) => (
    <button
      onMouseDown={() => onMove(dir)}
      onMouseUp={onStop}
      onMouseLeave={onStop}
      onTouchStart={(e) => { e.preventDefault(); onMove(dir); }}
      onTouchEnd={(e) => { e.preventDefault(); onStop(); }}
      className={`w-11 h-11 active:scale-95 border rounded-lg flex items-center justify-center shadow-md transition-all ${
        isCenter
        ? 'bg-[#8A2BE2] hover:bg-[#9d46f5] border-[#a855f7] text-white'
        : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-[#00FFFF]'
      }`}
      aria-label={label}
    >
      <span className="text-lg font-bold">{icon}</span>
    </button>
  );

  const ActionButton = ({ label, onClick, accent = false }: { label: string; onClick: () => void; accent?: boolean }) => (
    <button
      onClick={onClick}
      className={`
        w-full py-2.5 rounded-lg text-[10px] font-bold transition-all active:scale-95
        ${accent
          ? 'bg-[#8A2BE2] hover:bg-[#9d46f5] text-white shadow-md border border-[#a855f7]'
          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
        }
      `}
    >
      {label.toUpperCase()}
    </button>
  );

  return (
    <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-4 shadow-xl space-y-5 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#00FFFF] shadow-[0_0_8px_rgba(0,255,255,0.6)]" />
          <h2 className="text-sm font-bold tracking-tight uppercase text-slate-300">Control Center</h2>
        </div>
      </div>

      {/* Movement Section */}
      <div className="flex flex-col items-center gap-3 py-3 border-y border-slate-800/50">
        <div className="grid grid-cols-3 gap-1.5">
          <div />
          <ArrowButton dir="forward" label="Forward" icon="▲" />
          <div />
          <ArrowButton dir="left" label="Left" icon="◀" />
          <ArrowButton dir="sneak" label="Sneak" icon="◆" isCenter={true} />
          <ArrowButton dir="right" label="Right" icon="▶" />
          <div />
          <ArrowButton dir="back" label="Back" icon="▼" />
          <div />
        </div>

        <div className="flex gap-1.5 w-full max-w-[220px]">
          <button
            onMouseDown={() => onMove('jump')}
            onMouseUp={onStop}
            onMouseLeave={onStop}
            className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-[10px] font-bold rounded-lg border border-slate-700 transition-all uppercase text-[#00FFFF]"
          >
            Jump
          </button>
          <button
            onMouseDown={() => onMove('sprint')}
            onMouseUp={onStop}
            onMouseLeave={onStop}
            className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-[10px] font-bold rounded-lg border border-slate-700 transition-all uppercase text-[#00FFFF]"
          >
            Sprint
          </button>
        </div>
      </div>

      {/* Actions Section */}
      <div className="space-y-2.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <ActionButton
            label={isAfkEnabled ? "AFK On" : "AFK Off"}
            onClick={() => onAction('toggle-afk')}
            accent={isAfkEnabled}
          />
          <ActionButton label="Inventory" onClick={() => onAction('toggle-inventory')} />
          <ActionButton label="Use Held" onClick={() => onAction('use-item')} />
          <ActionButton label="Look Player" onClick={() => onAction('look-at-player')} />
          <div className="sm:col-span-2">
            <ActionButton label="Reconnect Session" onClick={() => onAction('reconnect-bot')} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedControlPanel;
