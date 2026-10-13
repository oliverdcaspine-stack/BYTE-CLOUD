import React, { useEffect, useState } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Star,
  Info,
  Camera,
  Calendar,
  HardDrive,
  Shield,
  Maximize2,
  FileVideo,
  MapPin,
  Lock,
  Unlock,
} from 'lucide-react';
import { FileItemModel } from '../../server/types';
import { apiUrl } from '../../lib/config';
import { isE2EEUnlocked, getSessionPassphrase, decryptFile } from '../../lib/crypto';

interface LightboxModalProps {
  items: FileItemModel[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({
  items,
  currentIndex,
  onClose,
  onNavigate,
  onToggleFavorite,
  onDelete,
}) => {
  const currentItem = items[currentIndex];
  const [showInfo, setShowInfo] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptedUrl, setDecryptedUrl] = useState<string | null>(null);
  const [decryptError, setDecryptError] = useState<string | null>(null);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && currentIndex > 0) onNavigate(currentIndex - 1);
      if (e.key === 'ArrowRight' && currentIndex < items.length - 1) onNavigate(currentIndex + 1);
      if (e.key === 'i' || e.key === 'I') setShowInfo((prev) => !prev);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, items.length, onClose, onNavigate]);

  // Handle client-side E2EE decryption if file is marked encrypted
  useEffect(() => {
    let active = true;
    setDecryptedUrl(null);
    setDecryptError(null);

    if (currentItem?.isEncrypted) {
      if (!isE2EEUnlocked()) {
        setDecryptError('Vault is locked. Unlock E2EE with passphrase to view.');
        return;
      }

      setIsDecrypting(true);
      const passphrase = getSessionPassphrase()!;

      fetch(apiUrl(`/media/${currentItem.id}/stream`))
        .then((res) => res.arrayBuffer())
        .then(async (buffer) => {
          if (!active) return;
          try {
            const decrypted = await decryptFile(
              buffer,
              currentItem.e2eeIv || '',
              currentItem.e2eeSalt || '',
              passphrase
            );
            const blob = new Blob([decrypted], { type: currentItem.mimeType });
            const url = URL.createObjectURL(blob);
            if (active) setDecryptedUrl(url);
          } catch (err: any) {
            if (active) setDecryptError('Decryption failed: incorrect passphrase or corrupted data');
          }
        })
        .catch(() => {
          if (active) setDecryptError('Failed to fetch encrypted media chunk from external disk');
        })
        .finally(() => {
          if (active) setIsDecrypting(false);
        });
    }

    return () => {
      active = false;
      if (decryptedUrl) URL.revokeObjectURL(decryptedUrl);
    };
  }, [currentItem]);

  if (!currentItem) return null;

  const isVideo = currentItem.mimeType.startsWith('video/');
  const meta = currentItem.mediaMetadata;
  const mediaSrc = decryptedUrl || apiUrl(`/media/${currentItem.id}/stream`);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = decryptedUrl || apiUrl(`/vault/download/${currentItem.id}`);
    link.download = currentItem.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0a0c]/98 backdrop-blur-2xl flex flex-col select-none">
      {/* Lightbox Top Bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-zinc-800/80 bg-[#101014]/60 z-10">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-xs font-mono text-zinc-400">
            {currentIndex + 1} / {items.length}
          </span>
          <span className="text-sm font-semibold text-zinc-200 truncate max-w-[200px] sm:max-w-md">
            {currentItem.name}
          </span>
          {currentItem.isEncrypted && (
            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-violet-400 bg-violet-950/40 px-2 py-0.5 rounded border border-violet-800/40">
              <Lock className="w-3 h-3" />
              E2EE
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Favorite Toggle */}
          <button
            onClick={() => onToggleFavorite(currentItem.id)}
            className={`p-2 rounded-lg transition-colors ${
              currentItem.isFavorite
                ? 'text-amber-400 bg-amber-400/10'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
            title="Toggle favorite"
          >
            <Star className={`w-4 h-4 ${currentItem.isFavorite ? 'fill-amber-400' : ''}`} />
          </button>

          {/* EXIF Info Drawer Toggle */}
          <button
            onClick={() => setShowInfo(!showInfo)}
            className={`p-2 rounded-lg transition-colors ${
              showInfo ? 'text-cyan-400 bg-cyan-400/10' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
            title="Toggle EXIF & Storage Inspector (I)"
          >
            <Info className="w-4 h-4" />
          </button>

          {/* Download File */}
          <button
            onClick={handleDownload}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Download original file"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Close Lightbox */}
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors ml-2"
            title="Close viewer (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Viewing Canvas & Navigation */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden p-2 sm:p-6">
        {/* Previous Button */}
        {currentIndex > 0 && (
          <button
            onClick={() => onNavigate(currentIndex - 1)}
            className="absolute left-4 z-20 w-11 h-11 rounded-full bg-black/60 hover:bg-black/80 border border-zinc-700/60 text-white flex items-center justify-center transition-transform active:scale-90"
            title="Previous (Arrow Left)"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Next Button */}
        {currentIndex < items.length - 1 && (
          <button
            onClick={() => onNavigate(currentIndex + 1)}
            className="absolute right-4 z-20 w-11 h-11 rounded-full bg-black/60 hover:bg-black/80 border border-zinc-700/60 text-white flex items-center justify-center transition-transform active:scale-90"
            title="Next (Arrow Right)"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        {/* Media Container */}
        <div className="w-full h-full flex items-center justify-center">
          {isDecrypting ? (
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-mono text-violet-300">Decrypting AES-GCM 256-bit ciphertext on client...</p>
            </div>
          ) : decryptError ? (
            <div className="max-w-md p-6 rounded-2xl bg-zinc-900 border border-red-500/30 text-center">
              <Lock className="w-10 h-10 text-red-400 mx-auto mb-3" />
              <h4 className="text-base font-bold text-white mb-1">Encrypted Vault Protected</h4>
              <p className="text-xs text-zinc-400 mb-4">{decryptError}</p>
              <button
                onClick={handleDownload}
                className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 font-semibold transition"
              >
                Download Raw Encrypted Envelope
              </button>
            </div>
          ) : isVideo ? (
            <video
              src={mediaSrc}
              controls
              autoPlay
              playsInline
              className="max-h-[82vh] max-w-[92vw] rounded-lg shadow-2xl object-contain bg-black"
            />
          ) : (
            <img
              src={mediaSrc}
              alt={currentItem.name}
              referrerPolicy="no-referrer"
              className="max-h-[82vh] max-w-[92vw] rounded-lg shadow-2xl object-contain transition-transform"
            />
          )}
        </div>

        {/* EXIF & Storage Inspector Drawer */}
        {showInfo && (
          <div className="absolute top-0 right-0 bottom-0 w-80 sm:w-96 bg-[#121217]/95 border-l border-zinc-800 p-6 overflow-y-auto backdrop-blur-xl z-30 transition-transform shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-white">Metadata Inspector</h3>
              </div>
              <button
                onClick={() => setShowInfo(false)}
                className="text-zinc-500 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-5 space-y-6 text-xs">
              {/* File Details */}
              <div>
                <h4 className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider mb-2">
                  File Properties
                </h4>
                <div className="space-y-2 bg-[#18181f] p-3 rounded-xl border border-zinc-800/80">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">File Name</span>
                    <span className="font-mono text-zinc-200 truncate max-w-[180px]">{currentItem.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">MIME Type</span>
                    <span className="font-mono text-zinc-300">{currentItem.mimeType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Size</span>
                    <span className="font-mono text-cyan-300">
                      {(currentItem.sizeBytes / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Dimensions</span>
                    <span className="font-mono text-zinc-300">
                      {meta?.width ? `${meta.width} × ${meta.height} px` : 'Native Stream'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Created</span>
                    <span className="font-mono text-zinc-300">
                      {new Date(currentItem.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Camera & EXIF */}
              {meta?.cameraMake && (
                <div>
                  <h4 className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider mb-2">
                    Camera & Optical EXIF
                  </h4>
                  <div className="space-y-2 bg-[#18181f] p-3 rounded-xl border border-zinc-800/80">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Camera</span>
                      <span className="text-zinc-200 font-medium">
                        {meta.cameraMake} {meta.cameraModel}
                      </span>
                    </div>
                    {meta.lens && (
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Lens</span>
                        <span className="text-zinc-300 truncate max-w-[180px]">{meta.lens}</span>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800/60 font-mono text-[11px]">
                      <div>
                        <span className="text-zinc-500 block">Aperture</span>
                        <span className="text-cyan-300 font-bold">{meta.aperture || '—'}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block">Shutter</span>
                        <span className="text-cyan-300 font-bold">{meta.shutterSpeed || '—'}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block">ISO</span>
                        <span className="text-cyan-300 font-bold">{meta.iso || '—'}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block">Focal Length</span>
                        <span className="text-cyan-300 font-bold">{meta.focalLength || '—'}</span>
                      </div>
                    </div>
                    {meta.locationName && (
                      <div className="flex items-center gap-1.5 pt-2 border-t border-zinc-800/60 text-zinc-300">
                        <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                        <span>{meta.locationName}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Physical Storage & Encryption Info */}
              <div>
                <h4 className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider mb-2">
                  Physical Storage & Security
                </h4>
                <div className="space-y-2 bg-[#18181f] p-3 rounded-xl border border-zinc-800/80">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Mount Path</span>
                    <span className="font-mono text-zinc-300 text-[11px]">/mnt/storage/500gb_ext</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">E2EE State</span>
                    <span className={`font-mono ${currentItem.isEncrypted ? 'text-violet-400' : 'text-zinc-400'}`}>
                      {currentItem.isEncrypted ? 'AES-256-GCM (Enforced)' : 'Cleartext (HTTPS/TLS only)'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Transport Security</span>
                    <span className="font-mono text-emerald-400">Tailscale WireGuard TLS</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
