import React, { useEffect, useRef } from 'react';
import ControlsOverlay from './ControlsOverlay';

const ViewerPanel: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  console.log('[ViewerPanel] Render pass');

  useEffect(() => {
    console.log('[ViewerPanel] Component did mount');
    const mainContainer = containerRef.current;

    if (mainContainer) {
      const { clientWidth, clientHeight } = mainContainer;
      console.log(`[ViewerPanel] Main container dimensions on mount: ${clientWidth}x${clientHeight}`);

      const iframeContainer = mainContainer.querySelector('.iframe-container') as HTMLDivElement;
      if (iframeContainer) {
        console.log(`[ViewerPanel] Iframe container dimensions on mount: ${iframeContainer.clientWidth}x${iframeContainer.clientHeight}`);
      } else {
        console.log('[ViewerPanel] Iframe container not found on mount');
      }

      const resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
          const { width, height } = entry.contentRect;
          console.log(`[ViewerPanel] Main container resized to: ${width}x${height}`);

          const iframeContainer = mainContainer.querySelector('.iframe-container') as HTMLDivElement;
          if (iframeContainer) {
            console.log(`[ViewerPanel] Iframe container resized to: ${iframeContainer.clientWidth}x${iframeContainer.clientHeight}`);
          }
        }
      });

      resizeObserver.observe(mainContainer);

      return () => {
        console.log('[ViewerPanel] Component will unmount');
        resizeObserver.unobserve(mainContainer);
      };
    } else {
       console.log('[ViewerPanel] Main container ref not available on mount');
    }
  }, []);

  const iframeSrc = '/viewer';
  console.log(`[ViewerPanel] Creating iframe with src: ${iframeSrc}`);

  return (
    <div ref={containerRef} className="flex-1 bg-[#121212] border border-white/[0.04] rounded-xl overflow-hidden flex flex-col relative min-w-0">
      <div className="flex-1 relative iframe-container">
        <iframe
          src={iframeSrc}
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
