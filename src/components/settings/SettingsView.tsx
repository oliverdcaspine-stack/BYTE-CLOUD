import React, { useState } from 'react';
import {
  Server,
  Lock,
  Unlock,
  Key,
  Shield,
  Check,
  AlertCircle,
  RefreshCw,
  HardDrive,
  Copy,
  Terminal,
  Download,
} from 'lucide-react';
import {
  getStoredApiUrl,
  setStoredApiUrl,
  testServerConnection,
  getStoredToken,
  setStoredToken,
} from '../../lib/config';
import {
  getSessionPassphrase,
  setSessionPassphrase,
  isE2EEUnlocked,
  generateRecoveryKey,
} from '../../lib/crypto';
import { PWAInstallButton } from '../PWAInstallButton';

interface SettingsViewProps {
  onRefreshAll: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onRefreshAll }) => {
  // Server URL settings
  const [apiUrlInput, setApiUrlInput] = useState(getStoredApiUrl());
  const [testStatus, setTestStatus] = useState<{
    testing: boolean;
    success?: boolean;
    latencyMs?: number;
    error?: string;
  }>({ testing: false });
  const [saveSuccess, setSaveSuccess] = useState(false);

  // E2EE settings
  const [passphraseInput, setPassphraseInput] = useState(getSessionPassphrase() || '');
  const [recoveryPhrase, setRecoveryPhrase] = useState<string | null>(null);
  const [e2eeUnlocked, setE2EEUnlocked] = useState(isE2EEUnlocked());

  // API Token
  const [copiedToken, setCopiedToken] = useState(false);
  const currentToken = getStoredToken() || 'demo_local_admin_session_token';

  const handleTestConnection = async () => {
    setTestStatus({ testing: true });
    const result = await testServerConnection(apiUrlInput);
    setTestStatus({
      testing: false,
      success: result.success,
      latencyMs: result.latencyMs,
      error: result.error,
    });
  };

  const handleSaveApiUrl = () => {
    setStoredApiUrl(apiUrlInput);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
    onRefreshAll();
  };

  const handleSavePassphrase = (e: React.FormEvent) => {
    e.preventDefault();
    if (passphraseInput.trim()) {
      setSessionPassphrase(passphraseInput.trim());
      setE2EEUnlocked(true);
    } else {
      setSessionPassphrase(null);
      setE2EEUnlocked(false);
    }
  };

  const handleGenerateRecovery = () => {
    const key = generateRecoveryKey();
    setRecoveryPhrase(key);
  };

  const handleCopyToken = () => {
    navigator.clipboard.writeText(currentToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  return (
    <div className="space-y-8 pb-20 md:pb-8 max-w-4xl">
      {/* Title */}
      <div>
        <h2 className="font-slab text-2xl lg:text-3xl font-bold tracking-tight text-white">
          Companion & Server Settings
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          Configure Tailscale MagicDNS endpoints, client-side encryption keys, and companion sync.
        </p>
      </div>

      {/* 1. Dynamic Server URL Configuration */}
      <section className="p-6 rounded-2xl bg-[#16161a] border border-[#23232b] shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Tailscale MagicDNS & API Base URL</h3>
            <p className="text-xs text-zinc-400">
              Allows this companion client (e.g. on GitHub Pages, mobile Safari, or Vercel) to talk to your home server.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={apiUrlInput}
                onChange={(e) => setApiUrlInput(e.target.value)}
                placeholder="https://bytecloud.tailscale.net:3000 or /api"
                className="w-full bg-[#101014] border border-zinc-700/80 rounded-xl px-4 py-2.5 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleTestConnection}
                disabled={testStatus.testing}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testStatus.testing ? 'animate-spin' : ''}`} />
                <span>Test Ping</span>
              </button>

              <button
                onClick={handleSaveApiUrl}
                className="px-4 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-xs font-semibold text-black transition flex items-center gap-1.5"
              >
                {saveSuccess ? <Check className="w-3.5 h-3.5" /> : null}
                <span>Save Endpoint</span>
              </button>
            </div>
          </div>

          {/* Test Ping Result */}
          {testStatus.latencyMs !== undefined && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 font-mono ${
                testStatus.success
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                  : 'bg-red-950/30 border-red-500/40 text-red-300'
              }`}
            >
              {testStatus.success ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    Successfully reached BYTE CLOUD daemon ({testStatus.latencyMs}ms latency).
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{testStatus.error || 'Connection failed'}</span>
                </>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-zinc-500">
            <span>Presets:</span>
            <button
              onClick={() => setApiUrlInput('/api')}
              className="text-cyan-400 hover:underline font-mono"
            >
              Same Host (/api)
            </button>
            <span>·</span>
            <button
              onClick={() => setApiUrlInput('https://bytecloud.tailscale.net:3000')}
              className="text-cyan-400 hover:underline font-mono"
            >
              Tailscale HTTPS
            </button>
            <span>·</span>
            <button
              onClick={() => setApiUrlInput('http://100.92.14.88:3000')}
              className="text-cyan-400 hover:underline font-mono"
            >
              Tailscale Direct IP
            </button>
          </div>
        </div>
      </section>

      {/* 2. End-to-End Encryption (E2EE) Configuration */}
      <section className="p-6 rounded-2xl bg-[#16161a] border border-[#23232b] shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Client-Side End-to-End Encryption (E2EE)</h3>
              <p className="text-xs text-zinc-400">
                AES-GCM 256-bit with PBKDF2 SHA-256. Files are encrypted on your device before transfer.
              </p>
            </div>
          </div>

          <div
            className={`px-3 py-1 rounded-full text-xs font-mono font-semibold flex items-center gap-1.5 ${
              e2eeUnlocked
                ? 'bg-violet-950/60 text-violet-300 border border-violet-500/40'
                : 'bg-zinc-800 text-zinc-400'
            }`}
          >
            {e2eeUnlocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            <span>{e2eeUnlocked ? 'UNLOCKED' : 'LOCKED'}</span>
          </div>
        </div>

        <form onSubmit={handleSavePassphrase} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Master Passphrase (stored in browser memory only)
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                value={passphraseInput}
                onChange={(e) => setPassphraseInput(e.target.value)}
                placeholder="Enter strong vault master passphrase..."
                className="flex-1 bg-[#101014] border border-zinc-700/80 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-violet-400"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-semibold text-white transition flex items-center gap-1.5"
              >
                {e2eeUnlocked ? <Check className="w-3.5 h-3.5" /> : <Key className="w-3.5 h-3.5" />}
                <span>{e2eeUnlocked ? 'Update Key' : 'Unlock Vault'}</span>
              </button>
            </div>
          </div>

          {/* Recovery Phrase Generator */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border-t border-zinc-800/80">
            <span className="text-zinc-400">Need a secure cryptographic backup passphrase?</span>
            <button
              type="button"
              onClick={handleGenerateRecovery}
              className="text-violet-400 hover:text-violet-300 font-semibold self-start sm:self-auto cursor-pointer"
            >
              Generate 8-Word Recovery Key
            </button>
          </div>

          {recoveryPhrase && (
            <div className="p-3.5 rounded-xl bg-[#121217] border border-violet-500/30 text-xs font-mono space-y-1">
              <div className="text-zinc-400 text-[11px]">Recovery Phrase:</div>
              <div className="text-violet-300 font-bold select-all break-all">{recoveryPhrase}</div>
            </div>
          )}
        </form>
      </section>

      {/* 3. Authentication & API Tokens */}
      <section className="p-6 rounded-2xl bg-[#16161a] border border-[#23232b] shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Companion JWT Bearer Token</h3>
            <p className="text-xs text-zinc-400">
              Use this token for CLI synchronization, rclone mount, or iOS shortcuts.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={currentToken}
              className="flex-1 bg-[#101014] border border-zinc-800 rounded-xl px-4 py-2 text-xs font-mono text-zinc-400 select-all"
            />
            <button
              onClick={handleCopyToken}
              className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 font-semibold flex items-center gap-1.5 transition"
            >
              {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedToken ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* 4. Host Physical Storage & Docker Specs */}
      <section className="p-6 rounded-2xl bg-[#16161a] border border-[#23232b] shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Mounted Storage Path</h3>
            <p className="text-xs text-zinc-400">Host disk configuration on the home server.</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#101014] border border-zinc-800 text-xs font-mono space-y-2 text-zinc-300">
          <div className="flex justify-between">
            <span className="text-zinc-500">Host Mount Point</span>
            <span className="text-cyan-400">/mnt/storage/500gb_ext</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Prisma ORM Database</span>
            <span className="text-zinc-300">PostgreSQL 16 (docker-compose)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Caching & Queues</span>
            <span className="text-zinc-300">Redis 7 Alpine</span>
          </div>
        </div>
      </section>
    </div>
  );
};
