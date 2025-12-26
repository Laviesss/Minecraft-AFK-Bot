import React, { useState, useRef, useEffect } from 'react';

interface ChatPanelProps {
  messages: string[];
  onSendMessage: (message: string) => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ messages, onSendMessage }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = () => {
    if (input.trim()) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const parseMessage = (msg: string) => {
    const match = msg.match(/<([^>]+)> (.*)/);
    if (match) {
      return { username: match[1], content: match[2] };
    }
    return { username: null, content: msg };
  };

  return (
    <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-4 shadow-xl flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1.5 h-1.5 rounded-full bg-[#00FFFF] shadow-[0_0_8px_rgba(0,255,255,0.6)]" />
        <h2 className="text-sm font-bold tracking-tight uppercase text-slate-300">Live Chat</h2>
      </div>
      <div className="flex-grow bg-slate-900/50 rounded-lg p-3 overflow-y-auto custom-scrollbar border border-slate-700/50 shadow-inner">
        {messages.map((msg, i) => {
           const { username, content } = parseMessage(msg);
           return (
            <div key={i} className="text-xs leading-relaxed text-slate-300 mb-1.5 last:mb-0">
              {username ? (
                <>
                  <span className="font-bold text-[#00FFFF] mr-1.5">{username}:</span>
                  <span className="text-slate-200">{content}</span>
                </>
              ) : (
                <span className="text-slate-400 italic">{content}</span>
              )}
            </div>
           );
        })}
        <div ref={messagesEndRef} />
      </div>
      <div className="mt-4 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Send a message..."
          className="flex-grow bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#8A2BE2] transition-all"
        />
        <button
          onClick={handleSend}
          className="bg-[#8A2BE2] text-white font-bold rounded-lg px-4 py-2 text-xs hover:bg-[#9d46f5] transition-colors active:scale-95"
        >
          SEND
        </button>
      </div>
    </div>
  );
};

export default ChatPanel;
