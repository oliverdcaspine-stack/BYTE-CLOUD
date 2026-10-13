import React from 'react';
import { Image, FolderClosed, HardDrive, Settings, Plus } from 'lucide-react';

interface NavigationProps {
  activeTab: 'gallery' | 'vault' | 'storage' | 'settings';
  setActiveTab: (tab: 'gallery' | 'vault' | 'storage' | 'settings') => void;
  onOpenUpload: () => void;
}

export const MobileBottomNav: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  onOpenUpload,
}) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0a0a0c]/95 backdrop-blur-lg border-t border-[#1f1f26] pb-safe">
      <div className="grid grid-cols-5 items-center h-16 px-2">
        {/* Gallery */}
        <button
          onClick={() => setActiveTab('gallery')}
          className="flex flex-col items-center justify-center min-h-[44px] min-w-[44px] transition-colors"
        >
          <Image
            className={`w-5 h-5 transition-colors ${
              activeTab === 'gallery' ? 'text-cyan-400 stroke-[2.5]' : 'text-zinc-500'
            }`}
          />
          <span
            className={`text-[10px] font-medium tracking-tight mt-1 transition-colors ${
              activeTab === 'gallery' ? 'text-cyan-400 font-semibold' : 'text-zinc-500'
            }`}
          >
            Gallery
          </span>
        </button>

        {/* Vault */}
        <button
          onClick={() => setActiveTab('vault')}
          className="flex flex-col items-center justify-center min-h-[44px] min-w-[44px] transition-colors"
        >
          <FolderClosed
            className={`w-5 h-5 transition-colors ${
              activeTab === 'vault' ? 'text-cyan-400 stroke-[2.5]' : 'text-zinc-500'
            }`}
          />
          <span
            className={`text-[10px] font-medium tracking-tight mt-1 transition-colors ${
              activeTab === 'vault' ? 'text-cyan-400 font-semibold' : 'text-zinc-500'
            }`}
          >
            Vault
          </span>
        </button>

        {/* Center Upload Button */}
        <div className="flex items-center justify-center">
          <button
            onClick={onOpenUpload}
            className="w-11 h-11 rounded-full bg-cyan-400 text-[#0a0a0c] flex items-center justify-center shadow-lg shadow-cyan-500/20 active:scale-95 transition-transform"
            aria-label="Upload to Byte Cloud"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Storage */}
        <button
          onClick={() => setActiveTab('storage')}
          className="flex flex-col items-center justify-center min-h-[44px] min-w-[44px] transition-colors"
        >
          <HardDrive
            className={`w-5 h-5 transition-colors ${
              activeTab === 'storage' ? 'text-cyan-400 stroke-[2.5]' : 'text-zinc-500'
            }`}
          />
          <span
            className={`text-[10px] font-medium tracking-tight mt-1 transition-colors ${
              activeTab === 'storage' ? 'text-cyan-400 font-semibold' : 'text-zinc-500'
            }`}
          >
            Storage
          </span>
        </button>

        {/* Settings */}
        <button
          onClick={() => setActiveTab('settings')}
          className="flex flex-col items-center justify-center min-h-[44px] min-w-[44px] transition-colors"
        >
          <Settings
            className={`w-5 h-5 transition-colors ${
              activeTab === 'settings' ? 'text-cyan-400 stroke-[2.5]' : 'text-zinc-500'
            }`}
          />
          <span
            className={`text-[10px] font-medium tracking-tight mt-1 transition-colors ${
              activeTab === 'settings' ? 'text-cyan-400 font-semibold' : 'text-zinc-500'
            }`}
          >
            Settings
          </span>
        </button>
      </div>
    </nav>
  );
};
