import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ChatMessage } from '../types';
import { Send, Hash, MessageSquare, ChevronDown, Bell } from 'lucide-react';

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (msg: string) => void;
}

// Minecraft Color & Style Mapping
const MC_COLORS: Record<string, string> = {
  '0': '#000000', '1': '#0000AA', '2': '#00AA00', '3': '#00AAAA',
  '4': '#AA0000', '5': '#AA00AA', '6': '#FFAA00', '7': '#AAAAAA',
  '8': '#555555', '9': '#5555FF', 'a': '#55FF55', 'b': '#55FFFF',
  'c': '#FF5555', 'd': '#FF55FF', 'e': '#FFFF55', 'f': '#FFFFFF'
};

const MC_STYLES: Record<string, string> = {
  'l': 'font-bold',
  'm': 'line-through',
  'n': 'underline',
  'o': 'italic'
};

/**
 * Component to parse and render Minecraft formatted text
 */
const MinecraftText: React.FC<{ text: string }> = ({ text }) => {
  const parts = useMemo(() => {
    const result: React.ReactNode[] = [];
    const segments = text.split(/§/);

    // The first segment has no formatting if the string didn't start with §
    if (segments[0]) {
      result.push(<span key="start">{segments[0]}</span>);
    }

    let currentColor = MC_COLORS['f']; // Default white
    let activeStyles: string[] = [];

    for (let i = 1; i < segments.length; i++) {
      const seg = segments[i];
      if (seg.length === 0) continue;

      const code = seg[0].toLowerCase();
      const content = seg.slice(1);

      if (MC_COLORS[code]) {
        currentColor = MC_COLORS[code];
        // In Minecraft, setting a color also resets styles
        activeStyles = [];
      } else if (MC_STYLES[code]) {
        if (!activeStyles.includes(MC_STYLES[code])) {
          activeStyles.push(MC_STYLES[code]);
        }
      } else if (code === 'r') {
        currentColor = MC_COLORS['f'];
        activeStyles = [];
      }

      if (content) {
        result.push(
          <span
            key={`seg-${i}`}
            style={{ color: currentColor }}
            className={activeStyles.join(' ')}
          >
            {content}
          </span>
        );
      }
    }
    return result;
  }, [text]);

  return <>{parts}</>;
};

export const ChatPanel: React.FC<ChatPanelProps> = ({ messages, onSendMessage }) => {
  const [input, setInput] = useState('');
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
      setUnreadCount(0);
    }
  }, []);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const isNearBottom = scrollHeight - (scrollTop + clientHeight) < 100;
      setShowScrollButton(!isNearBottom);
      if (isNearBottom) setUnreadCount(0);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const isAtBottom = scrollHeight - (scrollTop + clientHeight) < 150;
      if (isAtBottom) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        setUnreadCount(0);
      } else if (messages.length > 0) {
        setUnreadCount(prev => prev + 1);
      }
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input);
      setInput('');
      setTimeout(scrollToBottom, 50);
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col shadow-2xl h-full relative group">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-md relative z-10">
        <h3 className="text-zinc-400 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
          <MessageSquare className="w-3.5 h-3.5 text-purple-500" /> Log_Stream
        </h3>
        <div className="flex items-center gap-2">
          <span className="w-1 h-1 rounded-full bg-purple-500 animate-pulse" />
          <span className="text-[9px] text-zinc-600 font-bold tracking-widest uppercase">Encryption: AES-256</span>
        </div>
      </div>

      <div className="flex-1 min-h-0 relative">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="absolute inset-0 overflow-y-auto p-4 space-y-1.5 custom-scrollbar scroll-smooth"
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-700 space-y-3 opacity-50">
              <Hash className="w-10 h-10 stroke-[1px]" />
              <p className="text-[10px] uppercase font-black tracking-[0.3em]">No_Data_Incoming</p>
            </div>
          ) : (
            messages.map((m) => (
              <div key={m.id} className="group/msg animate-in fade-in slide-in-from-bottom-1 duration-300 flex gap-2.5 items-start">
                <span className="text-[8px] font-mono text-zinc-700 shrink-0 mt-1 select-none">
                  {new Date(m.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                <div className="text-zinc-300 text-[13px] leading-tight break-words selection:bg-purple-500/30 font-medium">
                  <MinecraftText text={m.message} />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Scroll to Bottom Tactical Button */}
        {showScrollButton && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-full shadow-[0_0_20px_rgba(168,85,247,0.4)] border border-purple-400/50 animate-in fade-in slide-in-from-bottom-4 duration-300 z-20 group/btn transition-all active:scale-95"
          >
            {unreadCount > 0 && (
              <span className="flex items-center gap-1.5 bg-black/40 px-2 py-0.5 rounded-full text-[9px] font-black tracking-tighter animate-pulse">
                <Bell className="w-2.5 h-2.5" />
                {unreadCount} NEW
              </span>
            )}
            <ChevronDown className={`w-4 h-4 transition-transform ${unreadCount === 0 ? 'group-hover:translate-y-0.5' : ''}`} />
          </button>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-white/5 bg-black/40 backdrop-blur-xl relative z-10">
        <div className="relative group/input">
          <div className="absolute inset-0 bg-purple-500/5 rounded-lg opacity-0 group-focus-within/input:opacity-100 transition-opacity pointer-events-none" />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="LINK_COMMAND_..."
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg pl-4 pr-12 py-2.5 text-[12px] text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all font-mono"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-zinc-500 hover:text-purple-400 disabled:opacity-20 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
