import React from 'react';
import { BotState } from '../types';
import AdminButton from './AdminButton';

interface AdminPanelProps {
  botState: BotState;
  onToggleAfk: () => void;
  onValidateProxies: () => void;
  isValidating: boolean;
  validationMsg: string | null;
  onAction: (action: string) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ botState, onToggleAfk, onValidateProxies, isValidating, validationMsg, onAction }) => {
  const actions = ['Use Held Item', 'Look at Nearest Player', 'Reconnect Bot', 'Clear Local Chat'];

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 h-full flex flex-col">
      <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">Admin Controls</h2>
      <div className="flex flex-col space-y-2">
        <AdminButton onClick={onToggleAfk} className={botState.isAfkEnabled ? 'bg-green-600/50 hover:bg-green-700/70' : 'bg-red-600/50 hover:bg-red-700/70'}>
          Anti-AFK: {botState.isAfkEnabled ? 'ON' : 'OFF'}
        </AdminButton>
        {actions.map(action => (
          <AdminButton key={action} onClick={() => onAction(action)}>
            {action}
          </AdminButton>
        ))}
        <AdminButton onClick={onValidateProxies} disabled={isValidating}>
          {isValidating ? 'Validating...' : 'Validate Proxies'}
        </AdminButton>
        {validationMsg && <p className="text-xs text-center text-green-400 mt-2">{validationMsg}</p>}
      </div>
    </div>
  );
};

export default AdminPanel;
