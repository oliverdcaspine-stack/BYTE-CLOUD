import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Shield,
  File,
  CheckCircle,
  AlertCircle,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { FolderModel } from '../../server/types';
import { apiUrl, fetchWithAuth } from '../../lib/config';
import {
  isE2EEUnlocked,
  getSessionPassphrase,
  encryptFile,
} from '../../lib/crypto';

interface UploadModalProps {
  currentFolderId: string | null;
  folders: FolderModel[];
  onClose: () => void;
  onUploadComplete: () => void;
}

interface QueuedFile {
  file: File;
  id: string;
  status: 'pending' | 'encrypting' | 'uploading' | 'completed' | 'error';
  progress: number;
  error?: string;
  isEncrypted: boolean;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  currentFolderId,
  folders,
  onClose,
  onUploadComplete,
}) => {
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(currentFolderId);
  const [encryptBeforeUpload, setEncryptBeforeUpload] = useState<boolean>(isE2EEUnlocked());
  const [passphrase, setPassphrase] = useState<string>(getSessionPassphrase() || '');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesAdded = (filesList: FileList | null) => {
    if (!filesList) return;
    const newItems: QueuedFile[] = Array.from(filesList).map((f) => ({
      file: f,
      id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      status: 'pending',
      progress: 0,
      isEncrypted: encryptBeforeUpload,
    }));
    setQueue((prev) => [...prev, ...newItems]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      handleFilesAdded(e.dataTransfer.files);
    }
  };

  // Convert buffer to base64
  const bufferToBase64 = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  const startUpload = async () => {
    if (queue.length === 0) return;
    setIsProcessing(true);

    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      if (item.status === 'completed') continue;

      try {
        // Step 1: Read file
        let fileData = await item.file.arrayBuffer();
        let e2eeIv: string | undefined;
        let e2eeSalt: string | undefined;
        let e2eeAuthTag: string | undefined;

        // Step 2: Encrypt if requested
        if (encryptBeforeUpload) {
          if (!passphrase.trim()) {
            throw new Error('Enter a passphrase to encrypt files');
          }

          setQueue((prev) =>
            prev.map((q, idx) => (idx === i ? { ...q, status: 'encrypting', progress: 20 } : q))
          );

          const encResult = await encryptFile(fileData, passphrase.trim());
          fileData = encResult.data;
          e2eeIv = encResult.iv;
          e2eeSalt = encResult.salt;
        }

        // Step 3: Chunk and Upload (1MB chunks)
        const CHUNK_SIZE = 1024 * 1024; // 1MB
        const totalChunks = Math.ceil(fileData.byteLength / CHUNK_SIZE);

        setQueue((prev) =>
          prev.map((q, idx) => (idx === i ? { ...q, status: 'uploading', progress: 30 } : q))
        );

        // Init upload session
        const initRes = await fetchWithAuth('/vault/upload/init', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: encryptBeforeUpload ? `${item.file.name}.byteenc` : item.file.name,
            fileSize: fileData.byteLength,
            folderId: selectedFolderId,
            mimeType: encryptBeforeUpload ? 'application/octet-stream' : item.file.type,
            totalChunks,
            isEncrypted: encryptBeforeUpload,
            e2eeIv,
            e2eeSalt,
            e2eeAuthTag,
          }),
        });

        if (!initRes.ok) {
          throw new Error('Failed to initialize upload session on disk');
        }

        const { sessionId } = await initRes.json();

        // Send chunks sequentially
        for (let chunkIdx = 0; chunkIdx < totalChunks; chunkIdx++) {
          const start = chunkIdx * CHUNK_SIZE;
          const end = Math.min(start + CHUNK_SIZE, fileData.byteLength);
          const chunkSlice = fileData.slice(start, end);
          const chunkBase64 = bufferToBase64(chunkSlice);

          const chunkRes = await fetchWithAuth('/vault/upload/chunk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId,
              chunkIndex: chunkIdx,
              totalChunks,
              chunkData: chunkBase64,
            }),
          });

          if (!chunkRes.ok) {
            throw new Error(`Failed to upload chunk ${chunkIdx + 1}`);
          }

          const progressPercent = Math.round(((chunkIdx + 1) / totalChunks) * 100);
          setQueue((prev) =>
            prev.map((q, idx) =>
              idx === i ? { ...q, progress: Math.min(progressPercent, 99) } : q
            )
          );
        }

        setQueue((prev) =>
          prev.map((q, idx) => (idx === i ? { ...q, status: 'completed', progress: 100 } : q))
        );
      } catch (err: any) {
        setQueue((prev) =>
          prev.map((q, idx) =>
            idx === i ? { ...q, status: 'error', error: err.message || 'Upload failed' } : q
          )
        );
      }
    }

    setIsProcessing(false);
    onUploadComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-xl rounded-2xl bg-[#16161a] border border-[#23232b] shadow-2xl p-6 space-y-5 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Upload className="w-4 h-4 text-cyan-400" />
              Upload to External 500GB Storage
            </h3>
            <p className="text-xs text-zinc-400">
              Files are streamed directly to <span className="font-mono text-zinc-300">/mnt/storage/500gb_ext</span>.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drop Zone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-zinc-700 hover:border-cyan-400/60 rounded-2xl p-6 text-center cursor-pointer transition bg-[#101014]/60 group"
        >
          <input
            type="file"
            ref={fileInputRef}
            multiple
            className="hidden"
            onChange={(e) => handleFilesAdded(e.target.files)}
          />
          <Upload className="w-8 h-8 text-zinc-500 group-hover:text-cyan-400 mx-auto mb-2 transition-colors" />
          <p className="text-xs font-semibold text-zinc-200">
            Drag files here or click to browse
          </p>
          <p className="text-[11px] text-zinc-500 mt-1">
            Supports multi-file photos, 4K videos, archives, and documents
          </p>
        </div>

        {/* Destination & Encryption Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-[#101014] border border-zinc-800 text-xs">
          <div>
            <label className="block text-zinc-400 mb-1">Destination Folder</label>
            <select
              value={selectedFolderId || 'root'}
              onChange={(e) =>
                setSelectedFolderId(e.target.value === 'root' ? null : e.target.value)
              }
              className="w-full bg-[#18181f] border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-cyan-400"
            >
              <option value="root">Vault Root (/)</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.path}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-zinc-400 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-violet-400" />
                Client-Side E2EE
              </label>
              <input
                type="checkbox"
                checked={encryptBeforeUpload}
                onChange={(e) => setEncryptBeforeUpload(e.target.checked)}
                className="rounded accent-violet-500 cursor-pointer"
              />
            </div>
            {encryptBeforeUpload && (
              <input
                type="password"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="Passphrase for AES-GCM"
                className="w-full bg-[#18181f] border border-violet-500/50 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none placeholder-zinc-500 font-mono"
              />
            )}
          </div>
        </div>

        {/* Queued Files List */}
        {queue.length > 0 && (
          <div className="flex-1 overflow-y-auto space-y-2 max-h-48 pr-1">
            {queue.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#121217] border border-zinc-800 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <File className="w-4 h-4 text-zinc-400 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-white truncate font-medium">{item.file.name}</p>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500">
                      <span>{(item.file.size / 1024).toFixed(1)} KB</span>
                      {item.isEncrypted && <span className="text-violet-400">· Encrypted</span>}
                      {item.status === 'uploading' && (
                        <span className="text-cyan-400">· {item.progress}%</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 ml-3">
                  {item.status === 'completed' && (
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                  )}
                  {item.status === 'error' && (
                    <span className="text-red-400 flex items-center gap-1" title={item.error}>
                      <AlertCircle className="w-4 h-4" />
                      Failed
                    </span>
                  )}
                  {item.status === 'uploading' && (
                    <div className="w-16 bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-cyan-400 h-full rounded-full transition-all"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  )}
                  {item.status === 'encrypting' && (
                    <span className="text-violet-400 text-[10px] font-mono animate-pulse">
                      Encrypting...
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
          <span className="text-xs text-zinc-400 font-mono">
            {queue.length} file{queue.length === 1 ? '' : 's'} queued
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 font-medium transition"
            >
              Cancel
            </button>
            <button
              onClick={startUpload}
              disabled={queue.length === 0 || isProcessing}
              className="px-4 py-1.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-xs text-black font-semibold transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{isProcessing ? 'Streaming...' : 'Start Transfer'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
