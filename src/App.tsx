import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { MobileBottomNav } from './components/Navigation';
import { GalleryView } from './components/gallery/GalleryView';
import { LightboxModal } from './components/gallery/LightboxModal';
import { VaultView } from './components/vault/VaultView';
import { StorageStatsView } from './components/storage/StorageStatsView';
import { SettingsView } from './components/settings/SettingsView';
import { UploadModal } from './components/upload/UploadModal';
import { E2EEUnlockModal } from './components/crypto/E2EEUnlockModal';
import { OfflineIndicator, useOnlineStatus } from './components/OfflineIndicator';
import { FileItemModel, FolderModel, StorageStatsModel } from './server/types';
import { fetchWithAuth, apiUrl } from './lib/config';

export default function App() {
  const [activeTab, setActiveTab] = useState<'gallery' | 'vault' | 'storage' | 'settings'>('gallery');
  const isOnline = useOnlineStatus();

  // Media Gallery State
  const [mediaList, setMediaList] = useState<FileItemModel[]>([]);
  const [isLoadingMedia, setIsLoadingMedia] = useState<boolean>(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Vault State
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [vaultData, setVaultData] = useState<{
    currentFolder: FolderModel | null;
    breadcrumbs: FolderModel[];
    folders: FolderModel[];
    files: FileItemModel[];
  }>({
    currentFolder: null,
    breadcrumbs: [],
    folders: [],
    files: [],
  });
  const [allFolders, setAllFolders] = useState<FolderModel[]>([]);
  const [isLoadingVault, setIsLoadingVault] = useState<boolean>(true);

  // Storage Stats State
  const [storageStats, setStorageStats] = useState<StorageStatsModel | null>(null);
  const [isLoadingStorage, setIsLoadingStorage] = useState<boolean>(true);

  // Modals
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [showE2EEModal, setShowE2EEModal] = useState<boolean>(false);

  // Load Media Gallery
  const loadMedia = useCallback(async () => {
    setIsLoadingMedia(true);
    try {
      const res = await fetchWithAuth('/media');
      if (res.ok) {
        const data = await res.json();
        setMediaList(data.items || []);
      }
    } catch (err) {
      console.warn('Failed to load media gallery:', err);
    } finally {
      setIsLoadingMedia(false);
    }
  }, []);

  // Load Vault Files & Folders
  const loadVault = useCallback(async (folderId: string | null = null) => {
    setIsLoadingVault(true);
    try {
      const query = folderId ? `?folderId=${encodeURIComponent(folderId)}` : '';
      const res = await fetchWithAuth(`/vault/list${query}`);
      if (res.ok) {
        const data = await res.json();
        setVaultData({
          currentFolder: data.currentFolder,
          breadcrumbs: data.breadcrumbs || [],
          folders: data.folders || [],
          files: data.files || [],
        });
      }
    } catch (err) {
      console.warn('Failed to load vault list:', err);
    } finally {
      setIsLoadingVault(false);
    }
  }, []);

  // Load All Folders (for upload destination selector)
  const loadAllFolders = useCallback(async () => {
    try {
      const res = await fetchWithAuth('/vault/list');
      if (res.ok) {
        const data = await res.json();
        setAllFolders(data.folders || []);
      }
    } catch {
      // ignore
    }
  }, []);

  // Load Storage Telemetry
  const loadStorage = useCallback(async () => {
    setIsLoadingStorage(true);
    try {
      const res = await fetchWithAuth('/storage/stats');
      if (res.ok) {
        const data = await res.json();
        setStorageStats(data);
      }
    } catch (err) {
      console.warn('Failed to load storage stats:', err);
    } finally {
      setIsLoadingStorage(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadMedia();
    loadVault(currentFolderId);
    loadAllFolders();
    loadStorage();
  }, [loadMedia, loadVault, loadAllFolders, loadStorage, currentFolderId]);

  // Sync hash URL
  useEffect(() => {
    const hash = window.location.hash.replace('#', '') as 'gallery' | 'vault' | 'storage' | 'settings';
    if (['gallery', 'vault', 'storage', 'settings'].includes(hash)) {
      setActiveTab(hash);
    }
  }, []);

  const handleTabChange = (tab: 'gallery' | 'vault' | 'storage' | 'settings') => {
    setActiveTab(tab);
    window.location.hash = tab;
  };

  // Toggle favorite on media
  const handleToggleFavorite = async (id: string) => {
    // Optimistic update
    setMediaList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isFavorite: !item.isFavorite } : item))
    );

    try {
      await fetchWithAuth(`/media/${id}/favorite`, { method: 'POST' });
    } catch (err) {
      console.warn('Failed to update favorite status', err);
    }
  };

  // Delete media
  const handleDeleteMedia = async (id: string) => {
    setMediaList((prev) => prev.filter((item) => item.id !== id));
    if (lightboxIndex !== null) setLightboxIndex(null);

    try {
      await fetchWithAuth(`/media/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('Failed to delete media', err);
    }
  };

  // Create folder
  const handleCreateFolder = async (name: string) => {
    try {
      await fetchWithAuth('/vault/folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, parentId: currentFolderId }),
      });
      loadVault(currentFolderId);
      loadAllFolders();
    } catch (err) {
      console.warn('Failed to create folder', err);
    }
  };

  // Delete folder
  const handleDeleteFolder = async (id: string) => {
    try {
      await fetchWithAuth(`/vault/folder/${id}`, { method: 'DELETE' });
      loadVault(currentFolderId);
      loadAllFolders();
    } catch (err) {
      console.warn('Failed to delete folder', err);
    }
  };

  // Rename file
  const handleRenameFile = async (id: string, newName: string) => {
    try {
      await fetchWithAuth(`/vault/file/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
      });
      loadVault(currentFolderId);
      loadMedia();
    } catch (err) {
      console.warn('Failed to rename file', err);
    }
  };

  // Delete file
  const handleDeleteFile = async (id: string) => {
    try {
      await fetchWithAuth(`/vault/file/${id}`, { method: 'DELETE' });
      loadVault(currentFolderId);
      loadMedia();
      loadStorage();
    } catch (err) {
      console.warn('Failed to delete file', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-[#f4f4f6] flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-300">
      {/* Top Bar Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        onOpenUpload={() => setShowUploadModal(true)}
        onOpenE2EEMenu={() => setShowE2EEModal(true)}
        isOnline={isOnline}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'gallery' && (
          <GalleryView
            items={mediaList}
            isLoading={isLoadingMedia}
            onRefresh={loadMedia}
            onSelectMedia={(item, index) => setLightboxIndex(index)}
            onToggleFavorite={handleToggleFavorite}
          />
        )}

        {activeTab === 'vault' && (
          <VaultView
            currentFolder={vaultData.currentFolder}
            breadcrumbs={vaultData.breadcrumbs}
            folders={vaultData.folders}
            files={vaultData.files}
            isLoading={isLoadingVault}
            onNavigateFolder={(folderId) => {
              setCurrentFolderId(folderId);
              loadVault(folderId);
            }}
            onCreateFolder={handleCreateFolder}
            onDeleteFolder={handleDeleteFolder}
            onRenameFile={handleRenameFile}
            onDeleteFile={handleDeleteFile}
            onOpenUpload={() => setShowUploadModal(true)}
          />
        )}

        {activeTab === 'storage' && (
          <StorageStatsView
            stats={storageStats}
            isLoading={isLoadingStorage}
            onRefresh={loadStorage}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            onRefreshAll={() => {
              loadMedia();
              loadVault(currentFolderId);
              loadStorage();
            }}
          />
        )}
      </main>

      {/* Mobile-First Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        onOpenUpload={() => setShowUploadModal(true)}
      />

      {/* Lightbox Modal */}
      {lightboxIndex !== null && (
        <LightboxModal
          items={mediaList}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={(newIdx) => setLightboxIndex(newIdx)}
          onToggleFavorite={handleToggleFavorite}
          onDelete={handleDeleteMedia}
        />
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadModal
          currentFolderId={currentFolderId}
          folders={allFolders}
          onClose={() => setShowUploadModal(false)}
          onUploadComplete={() => {
            loadMedia();
            loadVault(currentFolderId);
            loadStorage();
          }}
        />
      )}

      {/* E2EE Quick Unlock Modal */}
      {showE2EEModal && (
        <E2EEUnlockModal
          onClose={() => setShowE2EEModal(false)}
          onStateChanged={() => {
            loadMedia();
          }}
        />
      )}

      {/* Offline Status Toast */}
      <OfflineIndicator />
    </div>
  );
}
