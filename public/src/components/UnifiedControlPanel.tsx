import React, { useRef, useEffect } from 'react';
import { MinimapData, Coordinates, MoveDirection, InventoryItem } from '../types';

interface UnifiedControlPanelProps {
  data: MinimapData | null;
  botCoords: Coordinates;
  isAfkEnabled: boolean;
  onMove: (dir: MoveDirection) => void;
  onStop: () => void;
  onAction: (event: string, data?: any) => void;
  inventory: InventoryItem[] | null;
  onCloseInventory: () => void;
}

const BLOCK_COLORS: Record<string, string> = {
  stone: '#737373',
  dirt: '#78350f',
  grass_block: '#22c55e',
  water: '#3b82f6',
  air: '#0f172a',
  sand: '#facc15',
  gravel: '#64748b',
  bedrock: '#171717',
  wood: '#713f12',
  leaves: '#15803d',
};

const UnifiedControlPanel: React.FC<UnifiedControlPanelProps> = ({
  data,
  botCoords,
  isAfkEnabled,
  onMove,
  onStop,
  onAction,
  inventory,
  onCloseInventory
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const gridSize = data.map.length;
    if (gridSize === 0) return;
    const cellSize = size / gridSize;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, size, size);

    for (let x = 0; x < gridSize; x++) {
      for (let z = 0; z < gridSize; z++) {
        const block = data.map[x][z];
        const color = BLOCK_COLORS[block.type] || '#475569';

        const heightDiff = block.height - botCoords.y;
        const brightness = Math.min(Math.max(1 + heightDiff * 0.1, 0.4), 1.6);

        ctx.fillStyle = color;
        ctx.globalAlpha = brightness;
        ctx.fillRect(x * cellSize, z * cellSize, cellSize, cellSize);
        ctx.globalAlpha = 1.0;
      }
    }

    if (data.players) {
        data.players.forEach(p => {
            const centerX = Math.floor(gridSize / 2);
            const centerZ = Math.floor(gridSize / 2);

            const relX = centerX + (p.x - botCoords.x);
            const relZ = centerZ + (p.z - botCoords.z);

            if (relX >= 0 && relX < gridSize && relZ >= 0 && relZ < gridSize) {
                ctx.fillStyle = '#8A2BE2';
                ctx.beginPath();
                ctx.arc(relX * cellSize + cellSize/2, relZ * cellSize + cellSize/2, cellSize * 0.7, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        });
    }

    const centerX = size / 2;
    const centerY = size / 2;
    const arrowSize = cellSize * 2;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(-data.bot.yaw * (Math.PI / 180));

    ctx.fillStyle = '#00FFFF';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00FFFF';
    ctx.beginPath();
    ctx.moveTo(0, -arrowSize);
    ctx.lineTo(-arrowSize * 0.7, arrowSize);
    ctx.lineTo(0, arrowSize * 0.4);
    ctx.lineTo(arrowSize * 0.7, arrowSize);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

  }, [data, botCoords]);

  const ArrowButton = ({ dir, label, icon, isCenter = false }: { dir: MoveDirection; label: string; icon: string; isCenter?: boolean }) => (
    <button
      onMouseDown={() => onMove(dir)}
      onMouseUp={onStop}
      onMouseLeave={onStop}
      onTouchStart={(e) => { e.preventDefault(); onMove(dir); }}
      onTouchEnd={(e) => { e.preventDefault(); onStop(); }}
      className={`w-11 h-11 active:scale-95 border rounded-lg flex items-center justify-center shadow-md transition-all ${
        isCenter
        ? 'bg-[#8A2BE2] hover:bg-[#9d46f5] border-[#a855f7] text-white'
        : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-[#00FFFF]'
      }`}
      aria-label={label}
    >
      <span className="text-lg font-bold">{icon}</span>
    </button>
  );

  const ActionButton = ({ label, onClick, accent = false }: { label: string; onClick: () => void; accent?: boolean }) => (
    <button
      onClick={onClick}
      className={`
        w-full py-2.5 rounded-lg text-[10px] font-bold transition-all active:scale-95
        ${accent
          ? 'bg-[#8A2BE2] hover:bg-[#9d46f5] text-white shadow-md border border-[#a855f7]'
          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
        }
      `}
    >
      {label.toUpperCase()}
    </button>
  );

  return (
    <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-4 shadow-xl space-y-5 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#00FFFF] shadow-[0_0_8px_rgba(0,255,255,0.6)]" />
          <h2 className="text-sm font-bold tracking-tight uppercase text-slate-300">Control Center</h2>
        </div>
      </div>

      {/* Minimap Section */}
      <div className="space-y-2">
        <div className="aspect-square w-full max-w-[280px] mx-auto bg-black rounded-lg border border-slate-700 overflow-hidden relative shadow-inner">
          {!data && (
             <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-[10px] italic">
               Syncing...
             </div>
          )}
          <canvas
            ref={canvasRef}
            width={400}
            height={400}
            className="w-full h-full block image-render-pixel"
            style={{ imageRendering: 'pixelated' }}
          />
        </div>
      </div>

      {/* Movement Section */}
      <div className="flex flex-col items-center gap-3 py-3 border-y border-slate-800/50">
        <div className="grid grid-cols-3 gap-1.5">
          <div />
          <ArrowButton dir="forward" label="Forward" icon="▲" />
          <div />
          <ArrowButton dir="left" label="Left" icon="◀" />
          <ArrowButton dir="sneak" label="Sneak" icon="◆" isCenter={true} />
          <ArrowButton dir="right" label="Right" icon="▶" />
          <div />
          <ArrowButton dir="back" label="Back" icon="▼" />
          <div />
        </div>

        <div className="flex gap-1.5 w-full max-w-[220px]">
          <button
            onMouseDown={() => onMove('jump')}
            onMouseUp={onStop}
            onMouseLeave={onStop}
            className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-[10px] font-bold rounded-lg border border-slate-700 transition-all uppercase text-[#00FFFF]"
          >
            Jump
          </button>
          <button
            onMouseDown={() => onMove('sprint')}
            onMouseUp={onStop}
            onMouseLeave={onStop}
            className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-[10px] font-bold rounded-lg border border-slate-700 transition-all uppercase text-[#00FFFF]"
          >
            Sprint
          </button>
        </div>
      </div>

      {/* Actions Section */}
      <div className="space-y-2.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <ActionButton
            label={isAfkEnabled ? "AFK On" : "AFK Off"}
            onClick={() => onAction('toggle-afk')}
            accent={isAfkEnabled}
          />
          <ActionButton label="Inventory" onClick={() => onAction('get-inventory')} />
          <ActionButton label="Use Held" onClick={() => onAction('use-item')} />
          <ActionButton label="Look Player" onClick={() => onAction('look-at-player')} />
          <div className="sm:col-span-2">
            <ActionButton label="Reconnect Session" onClick={() => onAction('reconnect-bot')} />
          </div>
        </div>
      </div>

      {/* Inventory Overlay */}
      {inventory && (
        <div className="absolute inset-0 z-50 bg-[#0f172a] flex flex-col p-4 border-t-2 border-[#8A2BE2] shadow-2xl animate-in slide-in-from-bottom duration-300">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[10px] font-bold text-[#8A2BE2] tracking-widest uppercase">Inventory</h3>
            <button onClick={onCloseInventory} className="text-slate-500 hover:text-white text-xl leading-none">&times;</button>
          </div>
          <div className="flex-grow overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
            {inventory.length === 0 ? (
              <div className="text-center py-8 text-slate-600 text-[10px] italic border border-dashed border-slate-800 rounded-lg">
                Empty
              </div>
            ) : (
              inventory.map((item, i) => (
                <div key={i} className="flex justify-between items-center bg-slate-800/50 p-2 rounded-md border border-slate-700">
                  <span className="text-[10px] text-slate-200">{item.name}</span>
                  <span className="text-[#00FFFF] mono font-bold bg-slate-900 px-1.5 py-0.5 rounded text-[10px]">x{item.count}</span>
                </div>
              ))
            )}
          </div>
          <button
            onClick={onCloseInventory}
            className="mt-4 w-full py-2 bg-[#8A2BE2] text-white rounded-md font-bold text-[10px] uppercase"
          >
            Back
          </button>
        </div>
      )}
    </div>
  );
};

export default UnifiedControlPanel;
