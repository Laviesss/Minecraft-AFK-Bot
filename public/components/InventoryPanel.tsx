import React, { useEffect, useRef, useState } from 'react';

const InventoryPanel: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeSrc, setIframeSrc] = useState('/inventory');

  // Log every src change
  useEffect(() => {
    console.log(`[InventoryPanel] Assigning iframe src: ${iframeSrc}`);
    fetch('/log', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ panel: 'InventoryPanel', message: 'iframe src change', data: iframeSrc }) });
  }, [iframeSrc]);

  useEffect(() => {
    console.log('[InventoryPanel] Component did mount');

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      console.log('[InventoryPanel] container.getBoundingClientRect() on mount:', rect);
      fetch('/log', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ panel: 'InventoryPanel', message: 'container rect', data: rect }) });
    }

    if (iframeRef.current) {
      const rect = iframeRef.current.getBoundingClientRect();
      console.log('[InventoryPanel] iframe.getBoundingClientRect() on mount:', rect);
      fetch('/log', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ panel: 'InventoryPanel', message: 'iframe rect', data: rect }) });

      const resizeObserver = new ResizeObserver(() => {
        const newRect = iframeRef.current?.getBoundingClientRect();
        console.log('[InventoryPanel] iframe resized:', newRect);
        fetch('/log', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ panel: 'InventoryPanel', message: 'iframe resized', data: newRect }) });
      });
      resizeObserver.observe(iframeRef.current);
      return () => resizeObserver.disconnect();
    }

    const ws = new WebSocket(`ws://${window.location.host}/socket.io/?EIO=4&transport=websocket`);
    ws.onopen = () => console.log('[InventoryPanel] WebSocket opened');
    ws.onclose = () => console.log('[InventoryPanel] WebSocket closed');
    ws.onerror = (e) => console.log('[InventoryPanel] WebSocket error', e);

    return () => ws.close();
  }, []);

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
