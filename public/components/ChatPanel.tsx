import React, { useContext, useState, useEffect, useRef } from 'react';
import { SocketContext } from '../App';
import { SocketContextType } from '../types';

const ChatPanel: React.FC = () => {
  const { chatHistory, sendChatMessage } = useContext(SocketContext) as SocketContextType;
  const [inputValue, setInputValue] = useState('');
  const chatBodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to the bottom of the chat on new messages
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleSendMessage = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim() !== '') {
      sendChatMessage(inputValue);
      setInputValue('');
    }
  };

  return (
    <div className="h-full bg-[#121212] border border-white/[0.04] rounded-xl flex flex-col overflow-hidden">
      <div className="p-3 px-5 border-b border-white/[0.02]">
        <span className="text-[9px] text-white/20 uppercase tracking-widest font-medium">Console Log</span>
      </div>

      <div ref={chatBodyRef} className="flex-1 overflow-y-auto p-5 space-y-2 font-mono">
        {chatHistory.map((msg) => (
          <div key={msg.id} className="text-[11px] flex gap-3">
            <span className="text-white/5 text-[9px] shrink-0">{msg.timestamp}</span>
            <span className={`font-semibold shrink-0 ${
              msg.type === 'system' ? 'text-purple-500/60' :
              msg.type === 'bot' ? 'text-blue-400/60' : 'text-white/20'
            }`}>
              {msg.sender}:
            </span>
            <span className="text-white/60 whitespace-pre-wrap">{msg.message}</span>
          </div>
        ))}
      </div>

      <div className="p-4 pt-0">
        <div className="relative">
          <input
            type="text"
            placeholder="Enter command or message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleSendMessage}
            className="w-full bg-white/[0.01] border border-white/[0.05] rounded-lg px-4 py-2 text-xs focus:outline-none focus:border-white/10 transition-all text-white/60 placeholder:text-white/10"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-white/5 uppercase font-bold tracking-tighter">
            Press Enter
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;