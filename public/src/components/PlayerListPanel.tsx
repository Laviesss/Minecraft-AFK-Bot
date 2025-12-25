import React from 'react';

interface PlayerListPanelProps {
  playerCount: number;
  playerList: { username: string; ping: number }[];
}

const PlayerListPanel: React.FC<PlayerListPanelProps> = ({ playerCount, playerList }) => {
  return (
    <div className="bg-slate-900 p-4 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold text-cyan-400 mb-4 border-b border-slate-700 pb-2">Players Online ({playerCount})</h2>
      <ul className="space-y-2 h-48 overflow-y-auto">
        {playerList.map(player => (
          <li key={player.username} className="flex justify-between items-center bg-slate-800 p-2 rounded-md">
            <span className="font-semibold">{player.username}</span>
            <span className="text-sm text-slate-400">{player.ping}ms</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PlayerListPanel;
