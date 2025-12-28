import React from 'react';
import { MoveDirection } from '../types';
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Square,
  Eye,
  Zap,
  ArrowUp,
  Cpu
} from 'lucide-react';

interface ControlsBarProps {
  onMove: (dir: MoveDirection) => void;
  onStop: () => void;
  onTogglePerspective: () => void;
}

export const ControlsBar: React.FC<ControlsBarProps> = ({ onMove, onStop, onTogglePerspective }) => {
  const btnClass = "w-12 h-12 flex items-center justify-center bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl transition-all active:scale-90 border border-zinc-800/50 hover:border-purple-500/30 shadow-[0_4px_10px_rgba(0,0,0,0.3)]";
  const labelClass = "text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-3 block text-center";

  return (
    <div className="px-12 py-6 flex items-center justify-between gap-8">
      {/* Left Info */}
      <div className="flex-1 flex items-center gap-5">
         <div className="relative">
           <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center overflow-hidden group">
              <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-black flex items-center justify-center font-black text-white text-xs transition-transform group-hover:scale-110">
                MF
              </div>
           </div>
           <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-purple-500 rounded-full border-2 border-black shadow-[0_0_12px_rgba(168,85,247,0.8)]" />
         </div>
         <div className="text-left">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none">Terminal_Operator</p>
            <div className="flex items-center gap-1.5 mt-1.5">
               <Cpu className="w-3 h-3 text-zinc-700" />
               <span className="text-[9px] font-mono text-zinc-600 uppercase">Buffer: Stable</span>
            </div>
         </div>
      </div>

      {/* Center Controls: Movement & Actions */}
      <div className="flex items-center gap-12 px-12 py-2 border-x border-white/5">
        {/* Movement */}
        <div>
          <span className={labelClass}>Axis_Input</span>
          <div className="grid grid-cols-3 gap-2">
            <div />
            <button onClick={() => onMove(MoveDirection.FORWARD)} className={btnClass} title="W">
              <ChevronUp className="w-5 h-5" />
            </button>
            <div />
            <button onClick={() => onMove(MoveDirection.LEFT)} className={btnClass} title="A">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={onStop} className="w-12 h-12 flex items-center justify-center bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all border border-red-500/20 hover:border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.1)] group" title="STOP">
              <Square className="w-4 h-4 fill-current group-hover:scale-90 transition-transform" />
            </button>
            <button onClick={() => onMove(MoveDirection.RIGHT)} className={btnClass} title="D">
              <ChevronRight className="w-5 h-5" />
            </button>
            <div />
            <button onClick={() => onMove(MoveDirection.BACK)} className={btnClass} title="S">
              <ChevronDown className="w-5 h-5" />
            </button>
            <div />
          </div>
        </div>

        {/* Action Tray */}
        <div className="flex items-end gap-3 h-full pb-1">
          <div className="flex flex-col items-center">
            <span className={labelClass}>Vertical</span>
            <button onClick={() => onMove(MoveDirection.JUMP)} className={`${btnClass} w-14 h-14 bg-purple-500/10 text-purple-400 border-purple-500/20 hover:border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.1)]`}>
              <ArrowUp className="w-6 h-6" />
            </button>
          </div>
          <div className="flex flex-col items-center">
            <span className={labelClass}>Optic</span>
            <button onClick={onTogglePerspective} className={`${btnClass} w-14 h-14`}>
              <Eye className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Right Warning / Status */}
      <div className="flex-1 flex flex-col items-end gap-2">
        <div className="flex items-center gap-2 text-purple-400/70">
          <Zap className="w-3 h-3 fill-current" />
          <span className="text-[9px] font-black tracking-[0.2em] uppercase">Tactical_Override</span>
        </div>
        <p className="text-[9px] text-right text-zinc-600 font-medium tracking-tight max-w-[200px]">
          Direct neural injection active. Latency buffered at 15ms. Symmetrical sync achieved.
        </p>
      </div>
    </div>
  );
};
