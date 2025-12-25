import React from 'react';
import { BotState } from '../types';

interface AdminPanelProps {
  botState: BotState;
  onToggleAfk: () => void;
  onValidateProxies: () => void;
  isValidating: boolean;
  validationMsg: string | null;
  onAction: (actionName: string) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({
  botState,
  onToggleAfk,
  onValidateProxies,
  isValidating,
  validationMsg,
  onAction
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col h-full">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-purple-400">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
        </svg>
        Admin Console
      </h2>

      <div className="grid grid-cols-1 gap-3 overflow-y-auto">
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Bot Management</h3>
          <AdminButton
            onClick={onToggleAfk}
            label={botState.isAfkEnabled ? 'Disable Anti-AFK' : 'Enable Anti-AFK'}
            variant={botState.isAfkEnabled ? 'danger' : 'primary'}
          />
          <AdminButton
            onClick={() => onAction('Reconnect Bot')}
            label="Reconnect Bot"
            variant="secondary"
          />
          <AdminButton
            onClick={() => onAction('Force Respawn')}
            label="Force Respawn"
            variant="secondary"
          />
        </div>

        <div className="space-y-3 mt-4">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Network & Data</h3>
          <AdminButton
            onClick={onValidateProxies}
            label={isValidating ? 'Validating...' : 'Validate Proxies'}
            disabled={isValidating}
            variant="primary"
          />
          <AdminButton
            onClick={() => onAction('Clear Local Chat')}
            label="Clear Chat Log"
            variant="secondary"
          />
        </div>

        <div className="space-y-3 mt-4">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Inventory Control</h3>
          <AdminButton
            onClick={() => onAction('Drop Inventory')}
            label="Drop All Items"
            variant="danger"
          />
        </div>

        {validationMsg && (
          <div className="mt-4 p-3 rounded-lg bg-green-500/10 border border-green-500/50 text-green-400 text-xs font-medium animate-pulse text-center">
            {validationMsg}
          </div>
        )}
      </div>
    </div>
  );
};

interface AdminButtonProps {
  onClick: () => void;
  label: string;
  variant: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}

const AdminButton: React.FC<AdminButtonProps> = ({ onClick, label, variant, disabled }) => {
  const baseStyles = "w-full py-2.5 rounded-lg font-bold text-xs transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-purple-600 hover:bg-purple-500 text-white shadow-purple-900/20",
    secondary: "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700",
    danger: "bg-red-600 hover:bg-red-500 text-white shadow-red-900/20"
  };

  return (
    <button onClick={onClick} disabled={disabled} className={`${baseStyles} ${variants[variant]}`}>
      {label}
    </button>
  );
};

export default AdminPanel;
