import React from 'react';

interface AdminButtonProps {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}

const AdminButton: React.FC<AdminButtonProps> = ({ onClick, disabled = false, className = '', children }) => {
  const baseClasses = 'w-full px-4 py-3 font-bold text-sm text-left rounded-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900';
  const enabledClasses = 'bg-slate-800/50 hover:bg-slate-700/70 text-slate-200';
  const disabledClasses = 'bg-slate-800/20 text-slate-500 cursor-not-allowed';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${disabled ? disabledClasses : enabledClasses} ${className}`}
    >
      {children}
    </button>
  );
};

export default AdminButton;
