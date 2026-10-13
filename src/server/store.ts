import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { FileItemModel, FolderModel, StorageStatsModel, UploadInitSchema } from './types';

export class ByteStorageStore {
  private baseDir: string;
  private folders: Map<string, FolderModel> = new Map();
  private files: Map<string, FileItemModel> = new Map();
  private uploadSessions: Map<string, {
    init: any;
    chunks: Map<number, Buffer>;
    createdAt: number;
  }> = new Map();

  constructor() {
    this.baseDir = process.env.STORAGE_MOUNT_PATH || path.resolve(process.cwd(), 'data_storage/500gb_ext');
    this.initStorage();
  }

  private initStorage() {
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }

    // Seed default folders
    const rootFolders: FolderModel[] = [
      {
        id: 'fld_photos',
        name: 'Photos & Media',
        parentId: null,
        path: '/Photos & Media',
        createdAt: '2026-01-10T08:00:00Z',
        updatedAt: '2026-03-01T12:00:00Z',
      },
      {
        id: 'fld_documents',
        name: 'Documents',
        parentId: null,
        path: '/Documents',
        createdAt: '2026-01-11T09:30:00Z',
        updatedAt: '2026-03-05T15:20:00Z',
      },
      {
        id: 'fld_archives',
        name: 'Archives & Backups',
        parentId: null,
        path: '/Archives & Backups',
        createdAt: '2026-01-12T10:15:00Z',
        updatedAt: '2026-02-18T11:45:00Z',
      },
      {
        id: 'fld_encrypted',
        name: 'E2EE Encrypted Vault',
        parentId: null,
        path: '/E2EE Encrypted Vault',
        createdAt: '2026-02-01T14:00:00Z',
        updatedAt: '2026-03-12T09:10:00Z',
      },
      {
        id: 'fld_work',
        name: 'Projects & Schematics',
        parentId: 'fld_documents',
        path: '/Documents/Projects & Schematics',
        createdAt: '2026-02-15T11:00:00Z',
        updatedAt: '2026-03-10T16:40:00Z',
      },
    ];

    rootFolders.forEach((f) => this.folders.set(f.id, f));

    // Seed Gallery Photos with generated assets
    const mediaFiles: FileItemModel[] = [
      {
        id: 'media_glacier_01',
        name: 'Alpine_Glacier_Summit.jpg',
        originalName: 'Alpine_Glacier_Summit.jpg',
        folderId: 'fld_photos',
        mimeType: 'image/jpeg',
        sizeBytes: 8_420_000,
        diskPath: '/src/assets/images/gallery_mountain_glacier_1791872351571.jpg',
        isEncrypted: false,
        isFavorite: true,
        createdAt: '2026-03-12T18:42:00Z',
        updatedAt: '2026-03-12T18:42:00Z',
        mediaMetadata: {
          width: 3840,
          height: 2160,
          cameraMake: 'Leica',
          cameraModel: 'M11-P',
          lens: 'Summilux-M 35mm f/1.4 ASPH',
          iso: 100,
          shutterSpeed: '1/1250s',
          focalLength: '35mm',
          aperture: 'f/4.0',
          takenAt: '2026-03-12T17:15:00Z',
          locationName: 'Matterhorn Ridge, Zermatt',
        },
      },
      {
        id: 'media_tokyo_02',
        name: 'Shibuya_Night_Reflections.jpg',
        originalName: 'Shibuya_Night_Reflections.jpg',
        folderId: 'fld_photos',
        mimeType: 'image/jpeg',
        sizeBytes: 6_810_000,
        diskPath: '/src/assets/images/gallery_tokyo_cyberpunk_1791872352354.jpg',
        isEncrypted: false,
        isFavorite: true,
        createdAt: '2026-03-10T22:18:00Z',
        updatedAt: '2026-03-10T22:18:00Z',
        mediaMetadata: {
          width: 3840,
          height: 2560,
          cameraMake: 'Sony',
          cameraModel: 'ILCE-7RM5',
          lens: 'FE 24-70mm F2.8 GM II',
          iso: 800,
          shutterSpeed: '1/160s',
          focalLength: '50mm',
          aperture: 'f/2.8',
          takenAt: '2026-03-10T21:40:00Z',
          locationName: 'Shibuya District, Tokyo',
        },
      },
      {
        id: 'media_interior_03',
        name: 'Brutalist_Pavilion_Oak.jpg',
        originalName: 'Brutalist_Pavilion_Oak.jpg',
        folderId: 'fld_photos',
        mimeType: 'image/jpeg',
        sizeBytes: 7_350_000,
        diskPath: '/src/assets/images/gallery_minimal_interior_1791872353225.jpg',
        isEncrypted: false,
        isFavorite: false,
        createdAt: '2026-03-08T11:05:00Z',
        updatedAt: '2026-03-08T11:05:00Z',
        mediaMetadata: {
          width: 4096,
          height: 2730,
          cameraMake: 'Fujifilm',
          cameraModel: 'GFX 100 II',
          lens: 'GF 32-64mm F4 R LM WR',
          iso: 200,
          shutterSpeed: '1/250s',
          focalLength: '45mm',
          aperture: 'f/5.6',
          takenAt: '2026-03-08T10:30:00Z',
          locationName: 'Kyoto Architectural Studio',
        },
      },
      {
        id: 'media_sunset_04',
        name: 'Pacific_Sea_Stacks_Golden_Hour.jpg',
        originalName: 'Pacific_Sea_Stacks_Golden_Hour.jpg',
        folderId: 'fld_photos',
        mimeType: 'image/jpeg',
        sizeBytes: 11_200_000,
        diskPath: '/src/assets/images/gallery_coastal_sunset_1791872352549.jpg',
        isEncrypted: false,
        isFavorite: true,
        createdAt: '2026-03-04T19:30:00Z',
        updatedAt: '2026-03-04T19:30:00Z',
        mediaMetadata: {
          width: 5120,
          height: 2880,
          cameraMake: 'Hasselblad',
          cameraModel: 'X2D 100C',
          lens: 'XCD 21mm f/4',
          iso: 64,
          shutterSpeed: '1/500s',
          focalLength: '21mm',
          aperture: 'f/8.0',
          takenAt: '2026-03-04T18:45:00Z',
          locationName: 'Big Sur Coastline, California',
        },
      },
      // Video demo entry
      {
        id: 'media_drone_reel_05',
        name: 'Highland_Ridge_Cinematic_4K.mp4',
        originalName: 'Highland_Ridge_Cinematic_4K.mp4',
        folderId: 'fld_photos',
        mimeType: 'video/mp4',
        sizeBytes: 184_000_000,
        diskPath: '/src/assets/images/gallery_coastal_sunset_1791872352549.jpg', // Streams preview poster
        isEncrypted: false,
        isFavorite: false,
        createdAt: '2026-02-28T16:12:00Z',
        updatedAt: '2026-02-28T16:12:00Z',
        mediaMetadata: {
          width: 3840,
          height: 2160,
          durationSeconds: 124.5,
          cameraMake: 'DJI',
          cameraModel: 'Inspire 3',
          lens: 'DL 50mm F2.8 LS ASPH',
          takenAt: '2026-02-28T15:20:00Z',
          locationName: 'Scottish Highlands',
        },
      },
      // Documents & E2EE files
      {
        id: 'doc_homelab_spec',
        name: 'Tailscale_MagicDNS_Network_Architecture.pdf',
        originalName: 'Tailscale_MagicDNS_Network_Architecture.pdf',
        folderId: 'fld_documents',
        mimeType: 'application/pdf',
        sizeBytes: 3_450_000,
        diskPath: '',
        isEncrypted: false,
        isFavorite: true,
        createdAt: '2026-03-09T14:10:00Z',
        updatedAt: '2026-03-09T14:10:00Z',
      },
      {
        id: 'doc_compose_config',
        name: 'docker-compose-production.yaml',
        originalName: 'docker-compose-production.yaml',
        folderId: 'fld_work',
        mimeType: 'text/yaml',
        sizeBytes: 42_000,
        diskPath: '',
        isEncrypted: false,
        isFavorite: false,
        createdAt: '2026-03-02T10:00:00Z',
        updatedAt: '2026-03-02T10:00:00Z',
      },
      {
        id: 'doc_tax_vault',
        name: 'Private_Financial_Ledger_2025.xlsx.byteenc',
        originalName: 'Private_Financial_Ledger_2025.xlsx',
        folderId: 'fld_encrypted',
        mimeType: 'application/octet-stream',
        sizeBytes: 1_280_000,
        diskPath: '',
        isEncrypted: true,
        e2eeIv: 'p8K1e9Lm2qA=',
        e2eeSalt: 'dHJ1c3Rub3dvbmUyMDI2',
        e2eeAuthTag: 'f9V2kP7zX0m=',
        isFavorite: true,
        createdAt: '2026-03-11T13:25:00Z',
        updatedAt: '2026-03-11T13:25:00Z',
      },
      {
        id: 'archive_sys_backup',
        name: 'System_Config_Backup_20260301.tar.gz',
        originalName: 'System_Config_Backup_20260301.tar.gz',
        folderId: 'fld_archives',
        mimeType: 'application/gzip',
        sizeBytes: 84_000_000,
        diskPath: '',
        isEncrypted: false,
        isFavorite: false,
        createdAt: '2026-03-01T04:00:00Z',
        updatedAt: '2026-03-01T04:00:00Z',
      },
    ];

    mediaFiles.forEach((file) => this.files.set(file.id, file));
  }

  public getFolders(parentId: string | null = null): FolderModel[] {
    const list: FolderModel[] = [];
    for (const folder of this.folders.values()) {
      if (folder.parentId === parentId) {
        // Count items inside
        let itemCount = 0;
        for (const f of this.files.values()) {
          if (f.folderId === folder.id) itemCount++;
        }
        for (const sub of this.folders.values()) {
          if (sub.parentId === folder.id) itemCount++;
        }
        list.push({ ...folder, itemCount });
      }
    }
    return list;
  }

  public getFolder(id: string): FolderModel | undefined {
    return this.folders.get(id);
  }

  public getFolderBreadcrumbs(folderId: string | null): FolderModel[] {
    const breadcrumbs: FolderModel[] = [];
    let currId = folderId;
    while (currId) {
      const f = this.folders.get(currId);
      if (!f) break;
      breadcrumbs.unshift(f);
      currId = f.parentId;
    }
    return breadcrumbs;
  }

  public createFolder(name: string, parentId: string | null = null): FolderModel {
    const id = `fld_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const parent = parentId ? this.folders.get(parentId) : null;
    const folderPath = parent ? `${parent.path}/${name}` : `/${name}`;
    const newFolder: FolderModel = {
      id,
      name,
      parentId,
      path: folderPath,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      itemCount: 0,
    };
    this.folders.set(id, newFolder);
    return newFolder;
  }

  public deleteFolder(folderId: string): boolean {
    // Delete all child folders and files
    const deleteRecursive = (id: string) => {
      for (const [fId, file] of this.files.entries()) {
        if (file.folderId === id) this.files.delete(fId);
      }
      for (const [subId, sub] of this.folders.entries()) {
        if (sub.parentId === id) {
          deleteRecursive(subId);
        }
      }
      this.folders.delete(id);
    };
    deleteRecursive(folderId);
    return true;
  }

  public getFiles(folderId: string | null = null): FileItemModel[] {
    const list: FileItemModel[] = [];
    for (const file of this.files.values()) {
      if (folderId === undefined || file.folderId === folderId) {
        list.push(file);
      }
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getAllFiles(): FileItemModel[] {
    return Array.from(this.files.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public getMediaGallery(): FileItemModel[] {
    return Array.from(this.files.values())
      .filter((f) => f.mimeType.startsWith('image/') || f.mimeType.startsWith('video/'))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getFile(id: string): FileItemModel | undefined {
    return this.files.get(id);
  }

  public toggleFavorite(id: string): FileItemModel | null {
    const file = this.files.get(id);
    if (!file) return null;
    file.isFavorite = !file.isFavorite;
    file.updatedAt = new Date().toISOString();
    return file;
  }

  public renameFile(id: string, newName: string): FileItemModel | null {
    const file = this.files.get(id);
    if (!file) return null;
    file.name = newName;
    file.updatedAt = new Date().toISOString();
    return file;
  }

  public deleteFile(id: string): boolean {
    return this.files.delete(id);
  }

  // Upload Handling
  public initUploadSession(initData: any): { sessionId: string } {
    const sessionId = `upl_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    this.uploadSessions.set(sessionId, {
      init: initData,
      chunks: new Map(),
      createdAt: Date.now(),
    });
    return { sessionId };
  }

  public addUploadChunk(sessionId: string, chunkIndex: number, chunkBuffer: Buffer): {
    uploadedChunks: number;
    totalChunks: number;
    isComplete: boolean;
    file?: FileItemModel;
  } {
    const session = this.uploadSessions.get(sessionId);
    if (!session) {
      throw new Error('Upload session expired or invalid');
    }

    session.chunks.set(chunkIndex, chunkBuffer);
    const isComplete = session.chunks.size === session.init.totalChunks;

    if (isComplete) {
      // Assemble the final file
      const sortedChunks: Buffer[] = [];
      for (let i = 0; i < session.init.totalChunks; i++) {
        const chunk = session.chunks.get(i);
        if (chunk) sortedChunks.push(chunk);
      }
      const fullBuffer = Buffer.concat(sortedChunks);

      // Save locally to storage disk path
      const safeName = session.init.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const targetFilePath = path.join(this.baseDir, `${Date.now()}_${safeName}`);
      fs.writeFileSync(targetFilePath, fullBuffer);

      const isEncrypted = !!session.init.isEncrypted;
      const fileId = `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      
      const newFile: FileItemModel = {
        id: fileId,
        name: session.init.fileName,
        originalName: session.init.fileName,
        folderId: session.init.folderId || null,
        mimeType: session.init.mimeType || 'application/octet-stream',
        sizeBytes: fullBuffer.length,
        diskPath: targetFilePath,
        isEncrypted,
        e2eeIv: session.init.e2eeIv,
        e2eeSalt: session.init.e2eeSalt,
        e2eeAuthTag: session.init.e2eeAuthTag,
        isFavorite: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Add basic media metadata if image
      if (newFile.mimeType.startsWith('image/')) {
        newFile.mediaMetadata = {
          width: 2560,
          height: 1440,
          cameraMake: 'Direct Upload',
          cameraModel: isEncrypted ? 'E2EE Encrypted Device' : 'Client Browser',
          takenAt: new Date().toISOString(),
          locationName: 'Local Mount',
        };
      }

      this.files.set(fileId, newFile);
      this.uploadSessions.delete(sessionId);

      return {
        uploadedChunks: session.chunks.size,
        totalChunks: session.init.totalChunks,
        isComplete: true,
        file: newFile,
      };
    }

    return {
      uploadedChunks: session.chunks.size,
      totalChunks: session.init.totalChunks,
      isComplete: false,
    };
  }

  // Storage Stats (500GB Mounted External Hard Disk)
  public getStorageStats(): StorageStatsModel {
    // 500GB Drive = 500 * 10^9 bytes (standard storage manufacturer calculation)
    const totalBytes = 500_000_000_000;
    
    // Calculate total used bytes from all files
    let photoBytes = 0;
    let photoCount = 0;
    let videoBytes = 0;
    let videoCount = 0;
    let docBytes = 0;
    let docCount = 0;
    let archiveBytes = 0;
    let archiveCount = 0;
    let otherBytes = 0;
    let otherCount = 0;

    for (const f of this.files.values()) {
      if (f.mimeType.startsWith('image/')) {
        photoBytes += f.sizeBytes;
        photoCount++;
      } else if (f.mimeType.startsWith('video/')) {
        videoBytes += f.sizeBytes;
        videoCount++;
      } else if (f.mimeType.includes('pdf') || f.mimeType.includes('text') || f.mimeType.includes('word') || f.mimeType.includes('sheet')) {
        docBytes += f.sizeBytes;
        docCount++;
      } else if (f.mimeType.includes('zip') || f.mimeType.includes('tar') || f.mimeType.includes('gzip')) {
        archiveBytes += f.sizeBytes;
        archiveCount++;
      } else {
        otherBytes += f.sizeBytes;
        otherCount++;
      }
    }

    // Base allocated external storage footprint (simulated real 500GB drive with partition table & media cache)
    const baseSystemAllocation = 14_200_000_000; // ~14.2 GB filesystem overhead & journal
    const totalMediaBytes = photoBytes + videoBytes + docBytes + archiveBytes + otherBytes;
    // Add realistic storage usage for a 500GB NAS (e.g. ~187 GB used)
    const simulatedHistoricalUsed = 168_400_000_000;
    const usedBytes = baseSystemAllocation + totalMediaBytes + simulatedHistoricalUsed;
    const freeBytes = Math.max(0, totalBytes - usedBytes);
    const usedPercentage = Math.round((usedBytes / totalBytes) * 1000) / 10;

    return {
      diskLabel: 'Western Digital Elements 500GB USB 3.2',
      mountPath: '/mnt/storage/500gb_ext',
      totalBytes,
      usedBytes,
      freeBytes,
      usedPercentage,
      health: 'HEALTHY',
      fileCount: this.files.size + 4820,
      categories: {
        photos: { bytes: photoBytes + 74_200_000_000, count: photoCount + 2840 },
        videos: { bytes: videoBytes + 68_500_000_000, count: videoCount + 312 },
        documents: { bytes: docBytes + 12_800_000_000, count: docCount + 1120 },
        archives: { bytes: archiveBytes + 12_900_000_000, count: archiveCount + 548 },
        system: { bytes: baseSystemAllocation, count: 1 },
      },
      smartInfo: {
        temperatureC: 34,
        powerOnHours: 4280,
        badSectors: 0,
        filesystem: 'ext4 (rw,relatime,stripe=64)',
        readSpeedMBs: 142.8,
        writeSpeedMBs: 128.4,
      },
      tailscale: {
        connected: true,
        magicDns: 'bytecloud.tailscale.net',
        tailscaleIp: '100.92.14.88',
        tlsCertExpiry: '2026-12-31T23:59:59Z (Let\'s Encrypt TLS)',
        directPeerTunnel: true,
      },
    };
  }
}

export const storageStore = new ByteStorageStore();
