import React, { useContext } from 'react';
import ControlsOverlay from './ControlsOverlay';
import { SocketContext } from '../App';
import { SocketContextType } from '../types';

const ViewerPanel: React.FC = () => {
  const { status } = useContext(SocketContext) as SocketContextType;

  return (
    <div className="relative flex-1 bg-[#121212] border border-white/[0.04] rounded-xl overflow-hidden group min-w-0">
      {status.connected ? (
        <iframe
          src="/viewer"
          className="w-full h-full border-0"
          title="Prismarine Viewer"
        />
      ) : (
        <div data-testid="viewer-offline-placeholder" className="w-full h-full flex flex-col items-center justify-center">
          <div className="text-center opacity-10 pointer-events-none select-none">
            <p className="text-sm font-medium text-white">Bot Offline</p>
            <p className="text-xs text-white/50">Viewer will appear when the bot is connected.</p>
          </div>
        </div>
      )}

      <div className="absolute top-4 left-5 pointer-events-none">
        <span className="text-[9px] text-white/20 uppercase tracking-widest font-medium">Live Feed</span>
      </div>

      <div className="absolute bottom-4 right-5 scale-75 origin-bottom-right">
        <ControlsOverlay />
      </div>
    </div>
  );
};

export default ViewerPanel;