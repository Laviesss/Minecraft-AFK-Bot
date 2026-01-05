import React from 'react';
import ControlsOverlay from './ControlsOverlay';

const ViewerPanel: React.FC = () => {
  return (
    <div className="relative flex-1 bg-[#121212] border border-white/[0.04] rounded-xl overflow-hidden group min-w-0">
      <iframe
        src="/viewer"
        className="w-full h-full border-0"
        title="Prismarine Viewer"
      />

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