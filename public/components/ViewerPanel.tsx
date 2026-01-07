import React, { useEffect, useRef, useState } from 'react';
import ControlsOverlay from './ControlsOverlay';

const ViewerPanel: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeSrc, setIframeSrc] = useState('/viewer');

  // Log every src change
  useEffect(() => {
    console.log(`[ViewerPanel] Assigning iframe src: ${iframeSrc}`);
    fetch('/log', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ panel: 'ViewerPanel', message: 'iframe src change', data: iframeSrc }) });
  }, [iframeSrc]);

  useEffect(() => {
    console.log('[ViewerPanel] Component did mount');

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      console.log('[ViewerPanel] container.getBoundingClientRect() on mount:', rect);
      fetch('/log', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ panel: 'ViewerPanel', message: 'container rect', data: rect }) });
    }

    if (iframeRef.current) {
      const rect = iframeRef.current.getBoundingClientRect();
      console.log('[ViewerPanel] iframe.getBoundingClientRect() on mount:', rect);
      fetch('/log', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ panel: 'ViewerPanel', message: 'iframe rect', data: rect }) });

      const resizeObserver = new ResizeObserver(() => {
        const newRect = iframeRef.current?.getBoundingClientRect();
        console.log('[ViewerPanel] iframe resized:', newRect);
        fetch('/log', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ panel: 'ViewerPanel', message: 'iframe resized', data: newRect }) });
      });
      resizeObserver.observe(iframeRef.current);
      return () => resizeObserver.disconnect();
    }

    const ws = new WebSocket(`ws://${window.location.host}/socket.io/?EIO=4&transport=websocket`);
    ws.onopen = () => console.log('[ViewerPanel] WebSocket opened');
    ws.onclose = () => console.log('[ViewerPanel] WebSocket closed');
    ws.onerror = (e) => console.log('[ViewerPanel] WebSocket error', e);

    return () => ws.close();
  }, []);

  return (
    <div ref={containerRef} className="flex-1 bg-[#121212] border border-white/[0.04] rounded-xl flex flex-col relative min-h-0">
      <div className="flex-1 relative min-h-0">
        <iframe
          ref={iframeRef}
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
