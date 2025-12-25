import React from 'react';

interface MinimapPanelProps {
  minimap: string[][];
}

const MinimapPanel: React.FC<MinimapPanelProps> = ({ minimap }) => {
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 h-full flex flex-col">
      <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">Minimap</h2>
      <div className="flex-grow flex items-center justify-center">
        <div className="grid grid-cols-5 gap-1">
          {minimap.flat().map((color, index) => (
            <div
              key={index}
              className="w-8 h-8 rounded"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default MinimapPanel;
