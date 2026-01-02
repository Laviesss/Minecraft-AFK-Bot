import React, { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { StatsPanel } from './StatsPanel.tsx';
import { ChatPanel } from './ChatPanel.tsx';
import { ControlsBar } from './ControlsBar.tsx';
import { BotState, ChatMessage, MoveDirection } from '../types';
import { Terminal, Settings, Wifi, Activity, Cpu, Loader2 } from 'lucide-react';

interface DashboardProps {
  onReset: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onReset }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [stats, setStats] = useState<BotState | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isBooting, setIsBooting] = useState(true);
  const [bootLogs, setBootLogs] = useState<string[]>([]);

  useEffect(() => {
    const logs = [
      "INITIALIZING NEURAL LINK...",
      "AUTHENTICATING WITH MINECRAFT SERVER...",
      "ESTABLISHING SECURE SOCKET TUNNEL...",
      "SYNCING WORLD CHUNKS...",
      "INJECTING CONTROL BUFFERS...",
      "BOT INSTANCE STANDING BY."
    ];

    let currentLog = 0;
    const interval = setInterval(() => {
      if (currentLog < logs.length) {
        setBootLogs(prev => [...prev, `> ${logs[currentLog]}`]);
        currentLog++;
      } else {
        clearInterval(interval);
        setTimeout(() => setIsBooting(false), 800);
      }
    }, 250);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const s = io({ path: '/socket.io' });

    s.on('connect', () => setIsConnected(true));
    s.on('disconnect', () => setIsConnected(false));
    s.on('bot-state', (data: BotState) => setStats(data));
    s.on('chat-message', (data: { message: string }) => {
      setMessages(prev => [
        ...prev,
        { id: crypto.randomUUID(), message: data.message, timestamp: Date.now() }
      ].slice(-100));
    });

    setSocket(s);
    return () => { s.disconnect(); };
  }, []);

  const handleSendMessage = useCallback((msg: string) => {
    socket?.emit('send-chat-message', { message: msg });
  }, [socket]);

  const handleMove = useCallback((direction: MoveDirection) => {
    socket?.emit('move', { direction });
  }, [socket]);

  const handleStop = useCallback(() => {
    socket?.emit('stop-move');
  }, [socket]);

  const handleTogglePerspective = useCallback(() => {
    socket?.emit('toggle-perspective');
  }, [socket]);

  if (isBooting) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center p-8 bg-transparent">
        <div className="max-w-md w-full">
          <div className="flex flex-col items-center gap-4 mb-8">
            <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
            <h2 className="text-xl font-black text-white tracking-[0.3em] uppercase">System Boot</h2>
          </div>
          <div className="space-y-1 font-mono text-[10px] text-zinc-500 bg-black/40 backdrop-blur-xl p-6 rounded-xl border border-white/5 min-h-[200px] shadow-[0_0_50px_rgba(168,85,247,0.1)]">
            {bootLogs.map((log, i) => (
              <div key={i} className="animate-in fade-in slide-in-from-left-2 duration-300 text-purple-400/80">
                {log}
              </div>
            ))}
            <div className="w-1.5 h-3 bg-purple-500 animate-pulse inline-block ml-1 align-middle" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col animate-in fade-in zoom-in-95 duration-1000 bg-transparent">
      {/* Symmetrical Header */}
      <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-black/40 backdrop-blur-3xl z-20">
        <div className="flex-1 flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Wifi className={`w-3.5 h-3.5 ${isConnected ? 'text-purple-500' : 'text-zinc-600'}`} />
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Socket: {isConnected ? 'Stable' : 'Offline'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Activity className={`w-3.5 h-3.5 ${stats?.isOnline ? 'text-purple-400' : 'text-zinc-600'}`} />
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Bot: {stats?.isOnline ? 'Synced' : 'Waiting'}</span>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center px-8 border-x border-white/5 h-full">
          <div className="flex items-center gap-3">
             <Terminal className="w-4 h-4 text-purple-500" />
             <h1 className="font-black text-sm tracking-[0.3em] text-white">CORE_LINK V1.4</h1>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <Cpu className="w-2.5 h-2.5 text-zinc-600" />
            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-tighter">Instance Active</span>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-end gap-6">
          <button className="p-2 text-zinc-500 hover:text-white transition-colors group">
            <Settings className="w-4 h-4 group-hover:rotate-45 transition-transform" />
          </button>
          <button
            onClick={onReset}
            className="px-4 py-1.5 bg-red-500/10 hover:bg-red-500 border border-red-500/20 hover:border-red-500 rounded text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-white transition-all shadow-[0_0_15px_rgba(239,68,68,0.1)]"
          >
            Terminate
          </button>
        </div>
      </header>

      {/* Symmetrical Main Grid */}
      <main className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">

        {/* Three Column Layer: Balanced 25 / 50 / 25 */}
        <div className="flex-[4] min-h-0 flex flex-col lg:flex-row gap-4">

          {/* Left Panel: Stats */}
          <aside className="lg:flex-[2] flex flex-col min-w-[300px]">
            <StatsPanel stats={stats} />
          </aside>

          {/* Center Panel: Viewport */}
          <section className="lg:flex-[5] relative bg-black rounded-2xl border border-white/10 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] group">
            <div className="absolute top-6 left-6 z-10 flex items-center gap-2.5 px-3 py-1.5 bg-black/60 backdrop-blur-lg border border-white/10 rounded-md">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.7)]" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-100">Live_Tactical_Feed</span>
            </div>

            <iframe
              src="/viewer"
              className="w-full h-full border-none opacity-90 transition-opacity group-hover:opacity-100"
              title="Prismarine Viewer"
            />

            {/* Visual HUD symmetry elements */}
            <div className="absolute inset-0 pointer-events-none border-[1px] border-white/[0.03] m-8 rounded-xl" />
            <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-white/[0.02] pointer-events-none" />
            <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-white/[0.02] pointer-events-none" />
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(168,85,247,0.1)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(168,85,247,0.06),rgba(168,85,247,0.02),rgba(168,85,247,0.06))] z-0 bg-[length:100%_2px,3px_100%]" />
          </section>

          {/* Right Panel: Chat */}
          <aside className="lg:flex-[2] flex flex-col min-w-[300px]">
            <ChatPanel messages={messages} onSendMessage={handleSendMessage} />
          </aside>
        </div>

        {/* Bottom Full-Width Logistics Bar */}
        <section className="flex-[1] min-h-[160px] bg-black/30 border border-white/5 rounded-2xl overflow-hidden flex flex-col shadow-2xl backdrop-blur-md">
          <div className="px-6 py-2 border-b border-white/5 flex items-center justify-between bg-black/20">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.8)]" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Inventory_Logistics_Matrix</h3>
            </div>
            <div className="flex items-center gap-6">
               <span className="text-[9px] text-zinc-600 font-mono uppercase tracking-[0.2em]">Sync_Rate: 20hz</span>
               <div className="flex gap-1.5">
                 <div className="w-1 h-1 bg-purple-500/30 rounded-full" />
                 <div className="w-1 h-1 bg-purple-500/50 rounded-full" />
                 <div className="w-1 h-1 bg-purple-500 rounded-full shadow-[0_0_5px_rgba(168,85,247,0.5)]" />
               </div>
            </div>
          </div>
          <div className="flex-1 bg-black/10">
            <iframe
              src="/inventory"
              className="w-full h-full border-none opacity-80 hover:opacity-100 transition-opacity"
              title="Web Inventory"
            />
          </div>
        </section>

      </main>

      {/* Symmetrical Controls Footer */}
      <footer className="z-30 bg-black/60 backdrop-blur-3xl border-t border-white/5">
        <ControlsBar
          onMove={handleMove}
          onStop={handleStop}
          onTogglePerspective={handleTogglePerspective}
        />
      </footer>
    </div>
  );
};
