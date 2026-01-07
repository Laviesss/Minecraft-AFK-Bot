import React, { useEffect, useRef } from 'react';

const InventoryPanel: React.FC = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    console.log('[InventoryPanel] Component did mount');

    if (iframeRef.current) {
      const rect = iframeRef.current.getBoundingClientRect();
      console.log('[InventoryPanel] iframe.getBoundingClientRect() on mount:', rect);
    } else {
      console.log('[InventoryPanel] iframe ref not available on mount');
    }

  }, []);

  const iframeSrc = '/inventory';

  return (
    <div ref={containerRef} className="flex-1 bg-[#121212] border border-white/[0.04] rounded-xl flex flex-col min-h-0">
      <div className="p-3 px-5 border-b border-white/[0.02] flex justify-between items-center">
        <span className="text-[9px] text-white/20 uppercase tracking-widest font-medium">Inventory</span>
      </div>
      <div className="flex-1 relative min-h-0">
        <iframe
          ref={iframeRef}
          src={iframeSrc}
          className="absolute top-0 left-0 w-full h-full border-0"
          title="Web Inventory"
        />
      </div>
    </div>
  );
};

export default InventoryPanel;
