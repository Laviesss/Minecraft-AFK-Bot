import React from 'react';
import { InventoryItem } from '../types';

interface InventoryPanelProps {
  inventory: InventoryItem[];
}

const InventoryPanel: React.FC<InventoryPanelProps> = ({ inventory }) => {
  const renderInventorySlots = () => {
    const slots = new Array(36).fill(null);
    inventory.forEach(item => {
      // This is a simplified mapping. A real implementation would need
      // to handle the difference between main inventory, hotbar, and armor slots.
      if (item.slot >= 9 && item.slot <= 44) {
        slots[item.slot - 9] = item;
      }
    });

    return slots.map((item, index) => (
      <div key={index} className="w-12 h-12 bg-black bg-opacity-50 border border-gray-600 flex items-center justify-center relative">
        {item && (
          <>
            {/* A proper implementation would use item sprites */}
            <div className="text-white text-xs">{item.name.replace(/_/g, ' ').substring(0, 10)}</div>
            <div className="absolute bottom-0 right-1 text-white font-bold text-sm">{item.count > 1 ? item.count : ''}</div>
          </>
        )}
      </div>
    ));
  };

  return (
    <div className="bg-gray-800 bg-opacity-70 p-4 rounded-lg">
      <h2 className="text-white text-lg font-bold mb-4">Inventory</h2>
      <div className="grid grid-cols-9 gap-1">
        {renderInventorySlots()}
      </div>
    </div>
  );
};

export default InventoryPanel;
