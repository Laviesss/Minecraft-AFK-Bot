import React from 'react';
import { BotState } from '../types';

interface PlayerPanelProps {
  botState: BotState;
}

const PlayerPanel: React.FC<PlayerPanelProps> = ({ botState }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col h-full">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-cyan-400">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
        </svg>
        Server Players
      </h2>

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Currently Online</h3>
        <span className="px-2 py-0.5 bg-slate-800 text-cyan-400 text-xs rounded-full font-bold">
          {botState.isOnline ? botState.playerCount : 'N/A'}
        </span>
      </div>

      <div className="flex-1 bg-slate-950/50 rounded-lg border border-slate-800 p-3 overflow-y-auto">
        {!botState.isOnline ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 py-8">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-2 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m-12.728 0a9 9 0 010-12.728m12.728 0L5.636 18.364" />
            </svg>
            <p className="text-sm italic">Bot is offline</p>
          </div>
        ) : botState.playerList.length > 0 ? (
          <ul className="space-y-2">
            {botState.playerList.map((player, idx) => (
              <li key={idx} className="flex items-center justify-between p-2 rounded hover:bg-slate-900/50 group transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400 group-hover:text-cyan-400 transition-colors">
                    {player.charAt(0)}
                  </div>
                  <span className="text-sm text-slate-200">{player}</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]"></span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 py-8">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-2 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <p className="text-sm italic">No players detected</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerPanel;
