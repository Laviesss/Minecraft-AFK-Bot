import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (msg: string) => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ messages, onSendMessage }) => {
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input);
      setInput('');
    }
  };

  const formatMessage = (text: string) => {
    // Regex to match <username>
    const userMatch = text.match(/^<([^>]+)>/);
    if (userMatch) {
      const username = userMatch[1];
      const rest = text.substring(userMatch[0].length);
      return (
        <>
          <span className="text-cyan-400 font-bold">&lt;{username}&gt;</span>
          <span className="text-slate-200">{rest}</span>
        </>
      );
    }
    return <span className="text-slate-200">{text}</span>;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl flex flex-col h-[500px] lg:h-[600px] shadow-xl overflow-hidden">
      <div className="p-4 border-b border-slate-800 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(138,43,226,0.8)]"></span>
        <h2 className="text-xl font-bold">Live Chat</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-sm bg-slate-950/50">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-2 ${msg.isSystem ? 'italic text-slate-400' : ''}`}>
             <span className="text-slate-600 shrink-0">
               [{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}]
             </span>
             <div>{formatMessage(msg.text)}</div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 bg-slate-900 border-t border-slate-800 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Send a message..."
          className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all placeholder:text-slate-600"
        />
        <button
          type="submit"
          className="bg-purple-600 hover:bg-purple-500 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors shadow-[0_0_15px_rgba(138,43,226,0.3)]"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatPanel;
