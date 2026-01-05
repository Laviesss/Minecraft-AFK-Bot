import React, { useContext } from 'react';
import { SocketContext } from '../App';
import { SocketContextType } from '../types';

const InventoryPanel: React.FC = () => {
  const { status } = useContext(SocketContext) as SocketContextType;

  return (
    <div className="flex-[0.8] bg-[#121212] border border-white/[0.04] rounded-xl overflow-hidden flex flex-col min-w-0">
      <div className="p-3 px-5 border-b border-white/[0.02] flex justify-between items-center">
        <span className="text-[9px] text-white/20 uppercase tracking-widest font-medium">Inventory</span>
      </div>
      <div className="flex-1 p-4">
        {status.connected ? (
          <iframe
            src="/inventory"
            className="w-full h-full border-0 rounded-lg bg-white/[0.01]"
            title="Web Inventory"
          />
        ) : (
          <div className="w-full h-full border border-white/[0.04] rounded-lg flex items-center justify-center bg-white/[0.01]">
            <p className="text-[10px] uppercase text-white/10 font-medium tracking-widest">Awaiting connection</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryPanel;