import React from 'react';

interface MovementPanelProps {
  onMove: (direction: 'forward' | 'backward' | 'left' | 'right') => void;
  onStop: () => void;
}

const MovementPanel: React.FC<MovementPanelProps> = ({ onMove, onStop }) => {
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 h-full flex flex-col items-center justify-center">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">Movement</h2>
        <div className="grid grid-cols-3 gap-2">
            <div></div>
            <button onClick={() => onMove('forward')} className="bg-slate-700 hover:bg-slate-600 p-4 rounded">⬆️</button>
            <div></div>
            <button onClick={() => onMove('left')} className="bg-slate-700 hover:bg-slate-600 p-4 rounded">⬅️</button>
            <button onClick={onStop} className="bg-red-700 hover:bg-red-600 p-4 rounded">🛑</button>
            <button onClick={() => onMove('right')} className="bg-slate-700 hover:bg-slate-600 p-4 rounded">➡️</button>
            <div></div>
            <button onClick={() => onMove('backward')} className="bg-slate-700 hover:bg-slate-600 p-4 rounded">⬇️</button>
            <div></div>
        </div>
    </div>
  );
};

export default MovementPanel;
