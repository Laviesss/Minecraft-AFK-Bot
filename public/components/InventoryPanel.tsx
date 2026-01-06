import React from 'react';

const InventoryPanel: React.FC = () => {
  return (
    <div className="flex-1 bg-[#121212] border border-white/[0.04] rounded-xl overflow-hidden flex flex-col min-w-0">
      <div className="p-3 px-5 border-b border-white/[0.02] flex justify-between items-center">
        <span className="text-[9px] text-white/20 uppercase tracking-widest font-medium">Inventory</span>
      </div>
      <div className="flex-1 w-full h-full">
        <iframe
          src="/inventory"
          className="w-full h-full border-0"
          title="Web Inventory"
        />
      </div>
    </div>
  );
};

export default InventoryPanel;