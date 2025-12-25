import React, { useState, useRef, useEffect } from 'react';
import { Socket } from 'socket.io-client';

interface ChatPanelProps {
  messages: string[];
  socket: Socket;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ messages, socket }) => {
  const [message, setMessage] = useState('');
  const chatLogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatLogRef.current) {
      chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (message.trim()) {
      socket.emit('chat-message', message);
      setMessage('');
    }
  };

  const parseMessage = (msg: string) => {
    const match = msg.match(/<([^>]+)> (.*)/);
    if (match) {
        return (<span>&lt;<span className="text-cyan-400">{match[1]}</span>&gt; {match[2]}</span>);
    }
    return <span className="text-slate-400">{msg}</span>;
  }

  return (
    <div className="bg-slate-900 p-4 rounded-lg shadow-lg h-[600px] flex flex-col">
      <h2 className="text-xl font-bold text-cyan-400 mb-4 border-b border-slate-700 pb-2">Live Chat</h2>
      <div ref={chatLogRef} className="flex-grow overflow-y-auto mb-4 pr-2">
        {messages.map((msg, i) => (
          <p key={i} className="text-sm mb-1 font-mono">{parseMessage(msg)}</p>
        ))}
      </div>
      <div className="flex">
        <input
          type="text"
          value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && handleSend()}
          placeholder="Send a message..."
          className="flex-grow bg-slate-800 border border-slate-700 rounded-l-md p-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
        <button onClick={handleSend} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-r-md">
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatPanel;
