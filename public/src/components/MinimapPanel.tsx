import React, { useRef, useEffect } from 'react';
import { MinimapData } from '../types';

interface MinimapPanelProps {
  minimapData: MinimapData;
}

const BLOCK_COLORS: { [key: string]: string } = {
  grass: '#55a649',
  dirt: '#7d563c',
  stone: '#7f7f7f',
  water: '#4444dd',
  sand: '#c2b280',
  unknown: '#222222'
};

const MinimapPanel: React.FC<MinimapPanelProps> = ({ minimapData }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !minimapData) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { bot, map, players } = minimapData;
    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    // Background
    ctx.fillStyle = '#1e293b'; // slate-800
    ctx.fillRect(0, 0, width, height);

    const gridSize = Math.min(width, height) / 5;
    const centerX = width / 2;
    const centerY = height / 2;

    // Draw map blocks
    map.forEach(block => {
        const drawX = centerX + block.x * gridSize - gridSize / 2;
        const drawY = centerY + block.z * gridSize - gridSize / 2;
        const color = BLOCK_COLORS[block.type.split('_').shift() || 'unknown'] || BLOCK_COLORS.unknown;

        const heightDiff = block.height - bot.y;
        const brightness = Math.max(0.3, Math.min(1.5, 1 + heightDiff * 0.05));
        ctx.fillStyle = adjustColor(color, brightness);
        ctx.fillRect(drawX, drawY, gridSize, gridSize);
        ctx.strokeStyle = '#0f172a'; // slate-900
        ctx.strokeRect(drawX, drawY, gridSize, gridSize);
    });

    // Draw other players
    players.forEach(player => {
        const drawX = centerX + player.x * gridSize;
        const drawY = centerY + player.z * gridSize;
        ctx.fillStyle = '#8A2BE2'; // purple
        ctx.beginPath();
        ctx.arc(drawX, drawY, gridSize / 4, 0, 2 * Math.PI);
        ctx.fill();
    });

    // Draw bot
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(bot.yaw); // Assumes yaw is in radians. Adjust if it's degrees.
    ctx.fillStyle = '#00FFFF'; // cyan
    ctx.beginPath();
    ctx.moveTo(0, -gridSize/3);
    ctx.lineTo(-gridSize/4, gridSize/3);
    ctx.lineTo(gridSize/4, gridSize/3);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

  }, [minimapData]);

  // Helper to adjust color brightness
  const adjustColor = (color: string, factor: number) => {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    const newR = Math.min(255, r * factor);
    const newG = Math.min(255, g * factor);
    const newB = Math.min(255, b * factor);
    return `#${Math.round(newR).toString(16).padStart(2, '0')}${Math.round(newG).toString(16).padStart(2, '0')}${Math.round(newB).toString(16).padStart(2, '0')}`;
  };

  return (
    <div className="bg-slate-900 p-4 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold text-cyan-400 mb-4 border-b border-slate-700 pb-2">Minimap</h2>
      <canvas ref={canvasRef} width="250" height="250" className="mx-auto rounded-md bg-slate-800"></canvas>
    </div>
  );
};

export default MinimapPanel;
