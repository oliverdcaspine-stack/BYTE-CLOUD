import React, { useState } from 'react';
import {
  Folder,
  FolderPlus,
  File,
  FileText,
  FileArchive,
  FileCode,
  FileSpreadsheet,
  Download,
  Trash2,
  Edit2,
  Lock,
  ChevronRight,
  Home,
  LayoutGrid,
  List,
  Search,
  Share2,
  Check,
} from 'lucide-react';
import { FileItemModel, FolderModel } from '../../server/types';
import { apiUrl } from '../../lib/config';

interface VaultViewProps {
  currentFolder: FolderModel | null;
  breadcrumbs: FolderModel[];
  folders: FolderModel[];
  files: FileItemModel[];
  isLoading: boolean;
  onNavigateFolder: (folderId: string | null) => void;
  onCreateFolder: (name: string) => void;
  onDeleteFolder: (id: string) => void;
  onRenameFile: (id: string, newName: string) => void;
  onDeleteFile: (id: string) => void;
  onOpenUpload: () => void;
}

export const VaultView: React.FC<VaultViewProps> = ({
  currentFolder,
  breadcrumbs,
  folders,
  files,
  isLoading,
  onNavigateFolder,
  onCreateFolder,
  onDeleteFolder,
  onRenameFile,
  onDeleteFile,
  onOpenUpload,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteItemModal, setDeleteItemModal] = useState<{ type: 'folder' | 'file'; id: string; name: string } | null>(null);
  const [renameItemModal, setRenameItemModal] = useState<{ id: string; name: string } | null>(null);
  const [renameInput, setRenameInput] = useState('');

  // Filter files by search
  const filteredFiles = files.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredFolders = folders.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getFileIcon = (mime: string, isEncrypted: boolean) => {
    if (isEncrypted) return <Lock className="w-5 h-5 text-violet-400" />;
    if (mime.includes('pdf')) return <FileText className="w-5 h-5 text-red-400" />;
    if (mime.includes('zip') || mime.includes('tar') || mime.includes('gzip'))
      return <FileArchive className="w-5 h-5 text-amber-400" />;
    if (mime.includes('sheet') || mime.includes('excel'))
      return <FileSpreadsheet className="w-5 h-5 text-emerald-400" />;
    if (mime.includes('yaml') || mime.includes('json') || mime.includes('code'))
      return <FileCode className="w-5 h-5 text-cyan-400" />;
    return <File className="w-5 h-5 text-zinc-400" />;
  };

  const handleCopyLink = (file: FileItemModel) => {
    const link = `${window.location.origin}/api/vault/download/${file.id}`;
    navigator.clipboard.writeText(link);
    setCopiedId(file.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateFolderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    onCreateFolder(newFolderName.trim());
    setNewFolderName('');
    setShowNewFolderModal(false);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Vault Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-slab text-2xl lg:text-3xl font-bold tracking-tight text-white">
            File Vault
          </h2>
          <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1">
            <span>Hierarchical Storage</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-cyan-400">{folders.length} folders</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-cyan-400">{files.length} documents</span>
          </div>
        </div>

        {/* Action Buttons: New Folder, Grid/List switch, Upload */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowNewFolderModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#16161a] border border-[#23232b] text-xs font-semibold text-zinc-300 hover:text-white hover:border-zinc-700 transition"
          >
            <FolderPlus className="w-3.5 h-3.5 text-cyan-400" />
            <span>New Folder</span>
          </button>

          {/* Grid/List View Switcher */}
          <div className="flex items-center p-1 bg-[#16161a] border border-[#23232b] rounded-xl text-zinc-400">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'grid' ? 'bg-zinc-800 text-white' : 'hover:text-white'
              }`}
              title="Grid view"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'list' ? 'bg-zinc-800 text-white' : 'hover:text-white'
              }`}
              title="List view"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Breadcrumbs & Search Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-[#121217] border border-zinc-800/80 rounded-2xl">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-1.5 text-xs text-zinc-400 overflow-x-auto py-1">
          <button
            onClick={() => onNavigateFolder(null)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg transition ${
              !currentFolder ? 'text-cyan-400 font-semibold bg-cyan-950/30' : 'hover:text-white'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Vault Root</span>
          </button>

          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={crumb.id}>
                <ChevronRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                <button
                  onClick={() => onNavigateFolder(crumb.id)}
                  className={`px-2 py-1 rounded-lg truncate max-w-[120px] transition ${
                    isLast ? 'text-cyan-400 font-semibold bg-cyan-950/30' : 'hover:text-white'
                  }`}
                >
                  {crumb.name}
                </button>
              </React.Fragment>
            );
          })}
        </nav>

        {/* Live Filter Bar */}
        <div className="relative w-full sm:w-60">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search current folder..."
            className="w-full bg-[#18181f] border border-zinc-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50"
          />
        </div>
      </div>

      {/* Folders Section */}
      {filteredFolders.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-500">Folders</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredFolders.map((folder) => (
              <div
                key={folder.id}
                onClick={() => onNavigateFolder(folder.id)}
                className="group flex items-center justify-between p-3.5 rounded-xl bg-[#16161a] border border-[#23232b] hover:border-cyan-500/40 hover:bg-[#1a1a20] transition cursor-pointer shadow-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                    <Folder className="w-4 h-4 fill-cyan-400/20" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-zinc-200 truncate group-hover:text-cyan-300 transition-colors">
                      {folder.name}
                    </p>
                    <p className="text-[10px] font-mono text-zinc-500">
                      {folder.itemCount ?? 0} items
                    </p>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteItemModal({ type: 'folder', id: folder.id, name: folder.name });
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-zinc-500 hover:text-red-400 transition"
                  title="Delete folder"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Files Section */}
      <section className="space-y-3">
        <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-500">Files</h3>

        {filteredFiles.length === 0 && !isLoading && (
          <div className="py-12 text-center rounded-xl bg-[#121216] border border-zinc-800/80 p-6">
            <File className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
            <p className="text-xs text-zinc-400">This folder is empty.</p>
          </div>
        )}

        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredFiles.map((file) => (
              <div
                key={file.id}
                className="group p-4 rounded-xl bg-[#16161a] border border-[#23232b] hover:border-zinc-700 transition shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-[#202028] flex items-center justify-center shrink-0">
                      {getFileIcon(file.mimeType, file.isEncrypted)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-white truncate" title={file.name}>
                        {file.name}
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400 mt-0.5">
                        <span>{(file.sizeBytes / 1024).toFixed(1)} KB</span>
                        {file.isEncrypted && (
                          <>
                            <span>·</span>
                            <span className="text-violet-400">E2EE</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60 text-xs">
                  <span className="text-[10px] font-mono text-zinc-500">
                    {new Date(file.createdAt).toLocaleDateString()}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleCopyLink(file)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                      title="Copy Tailscale secure download link"
                    >
                      {copiedId === file.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Share2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <a
                      href={apiUrl(`/vault/download/${file.id}`)}
                      download={file.name}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-cyan-400 hover:bg-zinc-800 transition"
                      title="Download file"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={() => {
                        setRenameItemModal({ id: file.id, name: file.name });
                        setRenameInput(file.name);
                      }}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                      title="Rename"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setDeleteItemModal({ type: 'file', id: file.id, name: file.name });
                      }}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List Mode */
          <div className="rounded-2xl bg-[#16161a] border border-[#23232b] overflow-hidden">
            <div className="divide-y divide-zinc-800/60">
              {filteredFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3.5 hover:bg-[#1a1a20] transition text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {getFileIcon(file.mimeType, file.isEncrypted)}
                    <div className="min-w-0">
                      <p className="font-medium text-white truncate max-w-xs sm:max-w-md">{file.name}</p>
                      <p className="text-[10px] font-mono text-zinc-500">
                        {new Date(file.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <span className="font-mono text-zinc-400 text-xs">
                      {(file.sizeBytes / 1024).toFixed(1)} KB
                    </span>
                    <a
                      href={apiUrl(`/vault/download/${file.id}`)}
                      download={file.name}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-cyan-400 hover:bg-zinc-800 transition"
                      title="Download"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={() => {
                        setDeleteItemModal({ type: 'file', id: file.id, name: file.name });
                      }}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition"
                      title="Delete file"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Create Folder Modal */}
      {showNewFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <form
            onSubmit={handleCreateFolderSubmit}
            className="w-full max-w-sm rounded-2xl bg-[#16161a] border border-zinc-800 p-6 shadow-2xl space-y-4"
          >
            <h3 className="text-base font-bold text-white">Create New Folder</h3>
            <p className="text-xs text-zinc-400">
              Create a subfolder inside {currentFolder ? `"${currentFolder.name}"` : 'Vault Root'}.
            </p>
            <input
              type="text"
              autoFocus
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="e.g. Invoices 2026"
              className="w-full bg-[#101014] border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewFolderModal(false)}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 font-medium transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-xs text-black font-semibold transition"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#16161a] border border-zinc-800 p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Confirm Deletion</h3>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Are you sure you want to permanently remove {deleteItemModal.type === 'folder' ? 'folder' : 'file'}{' '}
              <strong className="text-white font-mono">"{deleteItemModal.name}"</strong>?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteItemModal(null)}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 font-medium transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (deleteItemModal.type === 'folder') {
                    onDeleteFolder(deleteItemModal.id);
                  } else {
                    onDeleteFile(deleteItemModal.id);
                  }
                  setDeleteItemModal(null);
                }}
                className="px-4 py-1.5 rounded-lg bg-red-500 hover:bg-red-400 text-xs text-white font-semibold transition"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename File Modal */}
      {renameItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (renameInput.trim()) {
                onRenameFile(renameItemModal.id, renameInput.trim());
              }
              setRenameItemModal(null);
            }}
            className="w-full max-w-sm rounded-2xl bg-[#16161a] border border-zinc-800 p-6 shadow-2xl space-y-4"
          >
            <h3 className="text-base font-bold text-white">Rename File</h3>
            <input
              type="text"
              autoFocus
              value={renameInput}
              onChange={(e) => setRenameInput(e.target.value)}
              className="w-full bg-[#101014] border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400 font-mono"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRenameItemModal(null)}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 font-medium transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-xs text-black font-semibold transition"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
