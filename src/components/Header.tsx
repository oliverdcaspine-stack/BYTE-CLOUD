import React from 'react';
import { Upload, ShieldCheck, Lock, Unlock, HardDrive, Wifi } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { isE2EEUnlocked } from '../lib/crypto';

interface HeaderProps {
  activeTab: 'gallery' | 'vault' | 'storage' | 'settings';
  setActiveTab: (tab: 'gallery' | 'vault' | 'storage' | 'settings') => void;
  onOpenUpload: () => void;
  onOpenE2EEMenu: () => void;
  isOnline: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenUpload,
  onOpenE2EEMenu,
  isOnline,
}) => {
  const e2eeActive = isE2EEUnlocked();

  return (
    <header className="sticky top-0 z-40 bg-[#0a0a0c]/90 backdrop-blur-xl border-b border-[#1f1f26] px-4 lg:px-8 py-3.5 flex items-center justify-between gap-8 transition-colors">
      {/* Zone 1: Single text element brand wordmark with heavy industrial slab styling */}
      <div className="flex items-center gap-3 shrink-0">
        <a
          href="#gallery"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('gallery');
          }}
          className="flex items-center gap-2.5 group select-none text-decoration-none"
        >
          <div className="w-8 h-8 rounded-lg bg-[#16161a] border border-cyan-500/30 flex items-center justify-center relative overflow-hidden group-hover:border-cyan-400 transition-colors shadow-sm">
            <span className="font-slab text-cyan-400 text-sm font-black leading-none">B</span>
            <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-violet-500 rounded-full blur-[2px]" />
          </div>
          <span className="font-slab text-lg lg:text-xl font-bold tracking-tight text-[#f4f4f6] group-hover:text-cyan-400 transition-colors whitespace-nowrap">
            BYTE CLOUD
          </span>
        </a>

        {/* Quiet status marker */}
        <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-zinc-800 text-xs text-zinc-400">
          <span className="inline-flex items-center gap-1.5 text-zinc-400 font-mono text-[11px]">
            <HardDrive className="w-3.5 h-3.5 text-zinc-500" />
            500GB EXT
          </span>
        </div>
      </div>

      {/* Zone 2: 4 single-line nav links with subtle hover underlines */}
      <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
        <button
          onClick={() => setActiveTab('gallery')}
          className={`whitespace-nowrap shrink-0 transition-colors relative py-1 ${
            activeTab === 'gallery'
              ? 'text-white font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-cyan-400'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Gallery
        </button>
        <button
          onClick={() => setActiveTab('vault')}
          className={`whitespace-nowrap shrink-0 transition-colors relative py-1 ${
            activeTab === 'vault'
              ? 'text-white font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-cyan-400'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          File Vault
        </button>
        <button
          onClick={() => setActiveTab('storage')}
          className={`whitespace-nowrap shrink-0 transition-colors relative py-1 ${
            activeTab === 'storage'
              ? 'text-white font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-cyan-400'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Storage Stats
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`whitespace-nowrap shrink-0 transition-colors relative py-1 ${
            activeTab === 'settings'
              ? 'text-white font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-cyan-400'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Settings
        </button>
      </nav>

      {/* Zone 3: 1 primary action + companion actions */}
      <div className="flex items-center gap-2.5 shrink-0">
        <PWAInstallButton compact />

        {/* E2EE Lock / Unlock Trigger */}
        <button
          onClick={onOpenE2EEMenu}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all border ${
            e2eeActive
              ? 'bg-violet-950/40 text-violet-300 border-violet-500/40 hover:bg-violet-900/50'
              : 'bg-[#16161a] text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700'
          }`}
          title={e2eeActive ? 'E2EE Vault Unlocked (AES-256-GCM)' : 'E2EE Locked (Click to configure passphrase)'}
        >
          {e2eeActive ? (
            <Unlock className="w-3.5 h-3.5 text-violet-400" />
          ) : (
            <Lock className="w-3.5 h-3.5 text-zinc-400" />
          )}
          <span className="hidden sm:inline">{e2eeActive ? 'E2EE ON' : 'E2EE'}</span>
        </button>

        {/* Primary CTA Action */}
        <button
          onClick={onOpenUpload}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-[#0a0a0c] font-semibold text-xs transition-transform active:scale-95 shadow-md shadow-cyan-950/20 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Upload</span>
        </button>
      </div>
    </header>
  );
};
