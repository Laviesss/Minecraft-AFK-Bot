import React from 'react';
import { InventoryItem } from '../types';

interface InventoryPanelProps {
  inventory: InventoryItem[];
}

const InventoryPanel: React.FC<InventoryPanelProps> = ({ inventory }) => {
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 h-full flex flex-col">
      <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">Inventory</h2>
      <div className="overflow-y-auto flex-grow">
        {inventory.length === 0 ? (
          <p className="text-slate-500 text-center mt-4">Inventory is empty.</p>
        ) : (
          <ul className="space-y-2">
            {inventory.map((item, index) => (
              <li key={index} className="flex justify-between items-center bg-slate-800 p-2 rounded">
                <span className="font-mono text-sm">{item.name}</span>
                <span className="font-bold text-xs bg-slate-700 px-2 py-1 rounded">{item.count}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default InventoryPanel;
