import React, { useContext } from 'react';
import { SocketContext } from '../App';
import { SocketContextType } from '../types';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, ArrowUpFromLine, ChevronsDown, SwitchCamera } from 'lucide-react';

const ControlsOverlay: React.FC = () => {
  const { socket } = useContext(SocketContext) as SocketContextType;

  const handleMove = (direction: string, active: boolean) => {
    if (socket) socket.emit('move', { direction, active });
  };

  const handleTogglePerspective = () => {
    if (socket) socket.emit('toggle-perspective');
  };

  return (
    <div className="flex flex-col gap-2 p-3 bg-white/[0.02] border border-white/[0.05] rounded-2xl backdrop-blur-sm">
      <div className="grid grid-cols-3 gap-1.5">
        <div />
        <Key icon={<ArrowUp size={14} />} onMouseDown={() => handleMove('forward', true)} onMouseUp={() => handleMove('forward', false)} />
        <div />
        <Key icon={<ArrowLeft size={14} />} onMouseDown={() => handleMove('left', true)} onMouseUp={() => handleMove('left', false)} />
        <Key icon={<ArrowDown size={14} />} onMouseDown={() => handleMove('back', true)} onMouseUp={() => handleMove('back', false)} />
        <Key icon={<ArrowRight size={14} />} onMouseDown={() => handleMove('right', true)} onMouseUp={() => handleMove('right', false)} />
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <ActionButton label="Shift" icon={<ChevronsDown size={12} />} onMouseDown={() => handleMove('sneak', true)} onMouseUp={() => handleMove('sneak', false)} />
        <ActionButton label="Jump" icon={<ArrowUpFromLine size={12} />} onMouseDown={() => handleMove('jump', true)} onMouseUp={() => handleMove('jump', false)} />
      </div>
      <div className="grid grid-cols-3 gap-1.5 mt-1">
        <div />
        <Key icon={<SwitchCamera size={14} />} onClick={handleTogglePerspective} />
        <div />
      </div>
    </div>
  );
};

const Key: React.FC<{ icon: React.ReactNode; onClick?: () => void; onMouseDown?: () => void; onMouseUp?: () => void; }> = ({ icon, onClick, onMouseDown, onMouseUp }) => (
  <div
    onClick={onClick}
    onMouseDown={onMouseDown}
    onMouseUp={onMouseUp}
    onTouchStart={onMouseDown}
    onTouchEnd={onMouseUp}
    onMouseLeave={onMouseUp}
    className="w-8 h-8 flex items-center justify-center border border-white/5 rounded-lg text-white/20 hover:border-purple-500/50 hover:text-purple-400 transition-colors cursor-pointer select-none"
  >
    {icon}
  </div>
);

const ActionButton: React.FC<{ label: string; icon: React.ReactNode; onMouseDown?: () => void; onMouseUp?: () => void; }> = ({ label, icon, onMouseDown, onMouseUp }) => (
  <div
    onMouseDown={onMouseDown}
    onMouseUp={onMouseUp}
    onTouchStart={onMouseDown}
    onTouchEnd={onMouseUp}
    onMouseLeave={onMouseUp}
    className="flex items-center justify-center gap-1.5 py-1.5 px-2 border border-white/5 rounded-lg text-[9px] font-bold uppercase tracking-tighter text-white/20 hover:text-white/60 transition-colors cursor-pointer select-none"
  >
    {icon}
    <span>{label}</span>
  </div>
);

export default ControlsOverlay;