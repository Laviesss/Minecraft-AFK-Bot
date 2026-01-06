import React from 'react';
import ControlsOverlay from './ControlsOverlay';

const ViewerPanel: React.FC = () => {
  return (
    <div className="flex-1 bg-[#121212] border border-white/[0.04] rounded-xl overflow-hidden flex flex-col relative min-w-0">
      <div className="flex-1 w-full h-full relative">
        <iframe
          src="/viewer"
          className="absolute top-0 left-0 w-full h-full border-0"
          title="Prismarine Viewer"
        />
      </div>
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="relative w-full h-full">
          <div className="absolute top-4 left-5">
            <span className="text-[9px] text-white/20 uppercase tracking-widest font-medium">Live Feed</span>
          </div>
          <div className="absolute bottom-4 right-5 scale-75 origin-bottom-right pointer-events-auto">
            <ControlsOverlay />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewerPanel;
