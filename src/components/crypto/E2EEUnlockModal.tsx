import React, { useState } from 'react';
import { X, Shield, Lock, Unlock, Key, Check } from 'lucide-react';
import {
  isE2EEUnlocked,
  getSessionPassphrase,
  setSessionPassphrase,
  generateRecoveryKey,
} from '../../lib/crypto';

interface E2EEUnlockModalProps {
  onClose: () => void;
  onStateChanged: () => void;
}

export const E2EEUnlockModal: React.FC<E2EEUnlockModalProps> = ({
  onClose,
  onStateChanged,
}) => {
  const [passphrase, setPassphrase] = useState(getSessionPassphrase() || '');
  const [unlocked, setUnlocked] = useState(isE2EEUnlocked());
  const [recoveryPhrase, setRecoveryPhrase] = useState<string | null>(null);

  const handleToggle = (e: React.FormEvent) => {
    e.preventDefault();
    if (unlocked) {
      setSessionPassphrase(null);
      setPassphrase('');
      setUnlocked(false);
    } else {
      if (!passphrase.trim()) return;
      setSessionPassphrase(passphrase.trim());
      setUnlocked(true);
    }
    onStateChanged();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-md rounded-2xl bg-[#16161a] border border-[#23232b] shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-violet-400" />
            <h3 className="text-base font-bold text-white">End-to-End Encryption (E2EE)</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-zinc-300 leading-relaxed">
          BYTE CLOUD client-side encryption runs entirely inside your browser using the Web Crypto API.
          Your master key is never sent over HTTPS or stored on the server.
        </p>

        <form onSubmit={handleToggle} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">
              Master Passphrase
            </label>
            <input
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              placeholder="Enter passphrase to unlock..."
              disabled={unlocked}
              className="w-full bg-[#101014] border border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-violet-400 disabled:opacity-60"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setRecoveryPhrase(generateRecoveryKey())}
              className="text-[11px] text-violet-400 hover:underline cursor-pointer"
            >
              Generate Recovery Phrase
            </button>

            <button
              type="submit"
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                unlocked
                  ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  : 'bg-violet-600 hover:bg-violet-500 text-white'
              }`}
            >
              {unlocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              <span>{unlocked ? 'Lock Vault' : 'Unlock E2EE'}</span>
            </button>
          </div>

          {recoveryPhrase && (
            <div className="p-3 rounded-xl bg-[#121217] border border-violet-500/30 text-xs font-mono">
              <span className="text-zinc-500 block text-[10px]">Recovery Key:</span>
              <span className="text-violet-300 font-bold select-all">{recoveryPhrase}</span>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
