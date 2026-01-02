import React, { useState, useEffect } from 'react';
import { SetupWizard } from './components/SetupWizard.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/status');
        const data = await res.json();
        setIsConfigured(data.configured);
      } catch (e) {
        console.error("Failed to fetch status", e);
        // Fallback for demo purposes
        setIsConfigured(false);
      } finally {
        setLoading(false);
      }
    };
    checkStatus();
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#000000] bg-[radial-gradient(circle_at_center,_#1e0c3a_0%,_#000000_100%)]">
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
        <p className="text-zinc-500 font-medium tracking-widest text-xs uppercase animate-pulse">Initializing Neural Link...</p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#000000] bg-[radial-gradient(circle_at_center,_#1e0c3a_0%,_#000000_100%)] text-zinc-100 overflow-hidden font-sans text-selection-purple">
      {!isConfigured ? (
        <SetupWizard onComplete={() => setIsConfigured(true)} />
      ) : (
        <Dashboard onReset={() => setIsConfigured(false)} />
      )}
    </div>
  );
};

export default App;
