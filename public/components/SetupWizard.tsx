import React, { useState, useEffect } from 'react';
import { BotConfig, AuthMethod } from '../types';
import { Server, Shield, MessageSquare, Loader2, ChevronRight, ChevronLeft, CheckCircle2, Link, Globe } from 'lucide-react';

interface SetupWizardProps {
  onComplete: () => void;
}

export const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [config, setConfig] = useState<BotConfig>({
    serverAddress: '',
    serverPort: 25565,
    botUsername: 'Botty',
    authMethod: 'Offline',
    microsoftEmail: '',
    serverPassword: '',
    discordChannelId: '',
    useProxy: false,
  });

  useEffect(() => {
    if (step === 3) { // Discord Step
      const fetchInvite = async () => {
        try {
          const res = await fetch('/api/discord/invite');
          setInviteLink(res.ok ? (await res.json()).inviteLink : null);
        } catch (e) {
          console.error("Failed to fetch invite link", e);
          setInviteLink(null);
        }
      };
      fetchInvite();
    }
  }, [step]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';

    setConfig(prev => ({
      ...prev,
      [name]: isCheckbox ? (e.target as HTMLInputElement).checked : (name === 'serverPort' ? parseInt(value) || 0 : value)
    }));
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data = await response.json();
      if (data.success) {
        onComplete();
      } else {
        setError(data.message || 'Failed to save configuration.');
      }
    } catch (err) {
      setError('An error occurred while connecting to the backend.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1: // Minecraft Connection
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-zinc-400 mb-2">
              <Server className="w-5 h-5 text-purple-500" />
              <h3 className="text-xl font-semibold text-white">Minecraft Connection</h3>
            </div>
            {/* ... form fields for server, port, username */}
          </div>
        );
      case 2: // Authentication
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-zinc-400 mb-2">
              <Shield className="w-5 h-5 text-purple-400" />
              <h3 className="text-xl font-semibold text-white">Authentication</h3>
            </div>
            {/* ... form fields for auth method */}
          </div>
        );
      case 3: // Discord
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-zinc-400 mb-2">
              <MessageSquare className="w-5 h-5 text-purple-600" />
              <h3 className="text-xl font-semibold text-white">Discord Integration (Optional)</h3>
            </div>
            {/* ... discord invite link and channel id input */}
          </div>
        );
      case 4: // Proxy
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-zinc-400 mb-2">
              <Globe className="w-5 h-5 text-green-500" />
              <h3 className="text-xl font-semibold text-white">Proxy Settings (Optional)</h3>
            </div>
            <div className="p-4 bg-zinc-800/50 border border-zinc-700/50 rounded-lg">
              <div className="flex items-center">
                <input
                  id="useProxy"
                  name="useProxy"
                  type="checkbox"
                  checked={config.useProxy}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="useProxy" className="ml-3 block text-sm font-medium text-zinc-300">
                  Enable Proxy
                </label>
              </div>
              <p className="mt-2 text-xs text-zinc-500">
                If enabled, the bot will attempt to connect through a SOCKS5 proxy from the `proxies.txt` file.
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-transparent">
      <div className="w-full max-w-lg bg-zinc-900/80 backdrop-blur-2xl border border-white/5 rounded-2xl p-8 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8),0_0_40px_rgba(168,85,247,0.1)] relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-purple-600/20 rounded-full blur-[80px]" />
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />

        <div className="mb-8 relative z-10">
          <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Configure Bot</h2>
          <p className="text-zinc-500 font-medium">Setup your Mineflayer bot's initial configuration.</p>

          <div className="flex gap-2 mt-6">
            {[1, 2, 3, 4].map(i => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-all duration-500 ${i <= step ? 'bg-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.6)]' : 'bg-zinc-800'}`}
              />
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 text-sm font-medium animate-in fade-in zoom-in-95 relative z-10">
            {error}
          </div>
        )}

        <div className="min-h-[250px] relative z-10">
          {renderStep()}
        </div>

        <div className="flex items-center justify-between mt-8 pt-6 border-t border-zinc-800/50 relative z-10">
          <button
            onClick={prevStep}
            disabled={step === 1 || loading}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-all ${step === 1 || loading ? 'text-zinc-700 cursor-not-allowed' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>

          {step < 4 ? (
            <button
              onClick={nextStep}
              className="flex items-center gap-2 px-6 py-2 bg-zinc-100 text-zinc-900 rounded-lg font-black text-xs uppercase tracking-widest hover:bg-white transition-all shadow-[0_10px_20px_-5px_rgba(255,255,255,0.1)] active:scale-95"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-br from-purple-600 to-black text-white rounded-lg font-black text-xs uppercase tracking-widest hover:from-purple-500 hover:to-zinc-900 transition-all shadow-[0_10px_30px_-5px_rgba(168,85,247,0.3)] border border-purple-500/40 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
              Initiate Link
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
