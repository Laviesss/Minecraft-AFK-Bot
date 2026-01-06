import React, { useEffect, useRef } from 'react';

const InventoryPanel: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  console.log('[InventoryPanel] Render pass');

  useEffect(() => {
    console.log('[InventoryPanel] Component did mount');
    const mainContainer = containerRef.current;

    if (mainContainer) {
      const { clientWidth, clientHeight } = mainContainer;
      console.log(`[InventoryPanel] Main container dimensions on mount: ${clientWidth}x${clientHeight}`);

      const iframeContainer = mainContainer.querySelector('.iframe-container') as HTMLDivElement;
      if (iframeContainer) {
        console.log(`[InventoryPanel] Iframe container dimensions on mount: ${iframeContainer.clientWidth}x${iframeContainer.clientHeight}`);
      } else {
        console.log('[InventoryPanel] Iframe container not found on mount');
      }

      const resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
          const { width, height } = entry.contentRect;
          console.log(`[InventoryPanel] Main container resized to: ${width}x${height}`);

          const iframeContainer = mainContainer.querySelector('.iframe-container') as HTMLDivElement;
          if (iframeContainer) {
            console.log(`[InventoryPanel] Iframe container resized to: ${iframeContainer.clientWidth}x${iframeContainer.clientHeight}`);
          }
        }
      });

      resizeObserver.observe(mainContainer);

      return () => {
        console.log('[InventoryPanel] Component will unmount');
        resizeObserver.unobserve(mainContainer);
      };
    } else {
       console.log('[InventoryPanel] Main container ref not available on mount');
    }
  }, []);

  const iframeSrc = '/inventory';
  console.log(`[InventoryPanel] Creating iframe with src: ${iframeSrc}`);

  return (
    <div ref={containerRef} className="flex-1 bg-[#121212] border border-white/[0.04] rounded-xl overflow-hidden flex flex-col min-w-0">
      <div className="p-3 px-5 border-b border-white/[0.02] flex justify-between items-center">
        <span className="text-[9px] text-white/20 uppercase tracking-widest font-medium">Inventory</span>
      </div>
      <div className="flex-1 relative iframe-container">
        <iframe
          src={iframeSrc}
          className="absolute top-0 left-0 w-full h-full border-0"
          title="Web Inventory"
        />
      </div>
    </div>
  );
};

export default InventoryPanel;
