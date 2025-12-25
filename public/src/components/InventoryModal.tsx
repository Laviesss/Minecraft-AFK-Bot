import React from 'react';
import { InventoryItem } from '../types';

interface InventoryModalProps {
  inventory: InventoryItem[];
  onClose: () => void;
}

const InventoryModal: React.FC<InventoryModalProps> = ({ inventory, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-900 p-6 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center border-b border-slate-700 pb-3 mb-4">
          <h2 className="text-xl font-bold text-cyan-400">Inventory</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">&times;</button>
        </div>
        <div className="max-h-64 overflow-y-auto pr-2">
            {inventory.length === 0 ? (
                <p className="text-slate-400">Inventory is empty.</p>
            ) : (
                <ul className="space-y-2">
                    {inventory.map((item, index) => (
                    <li key={index} className="flex justify-between items-center bg-slate-800 p-2 rounded-md">
                        <span>{item.name}</span>
                        <span className="font-semibold text-cyan-400">{item.count}</span>
                    </li>
                    ))}
                </ul>
            )}
        </div>
      </div>
    </div>
  );
};

export default InventoryModal;
