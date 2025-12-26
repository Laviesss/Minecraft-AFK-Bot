import React, { useRef, useEffect } from 'react';
import { MinimapData, Coordinates } from '../types';

interface MinimapPanelProps {
  data: MinimapData | null;
  botCoords: Coordinates;
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
  // Add more block colors as needed
};

const MinimapPanel: React.FC<MinimapPanelProps> = ({ data, botCoords }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data || !data.map) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const mapSize = Math.sqrt(data.map.length);
    if (!Number.isInteger(mapSize)) return;

    const pixelSize = canvas.width / mapSize;

    ctx.fillStyle = BLOCK_COLORS['air'];
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (const block of data.map) {
      const { x, z, type, height } = block;
      const color = BLOCK_COLORS[type] || '#475569'; // Default to gray

      const heightDiff = height - botCoords.y;
      const brightness = Math.min(Math.max(1 + heightDiff * 0.1, 0.4), 1.6);

      // Basic color tinting for brightness - a more sophisticated approach might be needed
      ctx.globalAlpha = brightness;
      ctx.fillStyle = color;
      ctx.fillRect((x + mapSize / 2) * pixelSize, (z + mapSize / 2) * pixelSize, pixelSize, pixelSize);
      ctx.globalAlpha = 1.0;
    }

    // Draw players
    if (data.players) {
        data.players.forEach(p => {
            const relX = p.x - data.bot.x;
            const relZ = p.z - data.bot.z;

            if (Math.abs(relX) <= mapSize / 2 && Math.abs(relZ) <= mapSize / 2) {
                ctx.fillStyle = '#8A2BE2'; // Purple for other players
                ctx.beginPath();
                ctx.arc(
                    (relX + mapSize / 2) * pixelSize + pixelSize / 2,
                    (relZ + mapSize / 2) * pixelSize + pixelSize / 2,
                    pixelSize * 0.7, 0, Math.PI * 2
                );
                ctx.fill();
            }
        });
    }

    // Draw bot arrow
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const arrowSize = pixelSize * 2;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(data.bot.yaw);
    ctx.fillStyle = '#00FFFF'; // Cyan for the bot
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00FFFF';
    ctx.beginPath();
    ctx.moveTo(0, -arrowSize * 0.8);
    ctx.lineTo(-arrowSize * 0.5, arrowSize * 0.5);
    ctx.lineTo(0, arrowSize * 0.2);
    ctx.lineTo(arrowSize * 0.5, arrowSize * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }, [data, botCoords]);

  return (
    <div className="aspect-square w-full bg-black rounded-lg border border-slate-700 overflow-hidden relative shadow-inner">
      {!data && (
        <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-xs italic">
          Loading map...
        </div>
      )}
      <canvas
        ref={canvasRef}
        width={512} // Increased resolution for a 32x32 map (16px per block)
        height={512}
        className="w-full h-full"
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  );
};

export default MinimapPanel;
