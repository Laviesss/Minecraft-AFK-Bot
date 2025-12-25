import React, { useState, useRef, useEffect } from 'react';

interface ChatPanelProps {
  messages: string[];
  onSendMessage: (msg: string) => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ messages, onSendMessage }) => {
  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (inputValue.trim()) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSend();
  };

  const renderMessage = (msg: string, index: number) => {
    // Basic detection for <User> message vs [SYSTEM]
    if (msg.startsWith('[SYSTEM]')) {
      return (
        <div key={index} className="py-1 text-slate-500 text-sm italic">
          {msg}
        </div>
      );
    }

    // Attempt to colorize <Username>
    const match = msg.match(/^<([^>]+)>(.*)$/);
    if (match) {
      return (
        <div key={index} className="py-1 text-sm break-words leading-relaxed">
          <span className="text-[#00FFFF] font-bold mono mr-2">&lt;{match[1]}&gt;</span>
          <span className="text-slate-200">{match[2]}</span>
        </div>
      );
    }

    return (
      <div key={index} className="py-1 text-sm text-slate-300 break-words leading-relaxed">
        {msg}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#0f172a] rounded-xl border border-slate-800 shadow-xl overflow-hidden">
      <div className="p-4 border-b border-slate-800 bg-[#0f172a] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#00FFFF] shadow-[0_0_8px_rgba(0,255,255,0.6)]" />
          <h2 className="text-lg font-bold tracking-tight">LIVE CHAT</h2>
        </div>
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Global Stream</span>
      </div>

      <div
        ref={scrollRef}
        className="flex-grow overflow-y-auto p-4 space-y-1 bg-[#020617]/50"
      >
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-600 text-sm italic">
            Waiting for activity...
          </div>
        ) : (
          messages.map((msg, idx) => renderMessage(msg, idx))
        )}
      </div>

      <div className="p-4 bg-[#0f172a] border-t border-slate-800 flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Send a message..."
          className="flex-grow bg-[#1e293b] border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-[#00FFFF] transition-colors"
        />
        <button
          onClick={handleSend}
          className="bg-[#8A2BE2] hover:bg-[#9d46f5] text-white px-6 py-2 rounded-lg text-sm font-bold transition-all shadow-lg shadow-[#8A2BE2]/20 active:scale-95"
        >
          SEND
        </button>
      </div>
    </div>
  );
};

export default ChatPanel;
