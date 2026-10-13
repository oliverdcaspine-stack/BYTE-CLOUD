import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(['ADMIN', 'USER', 'GUEST']),
});

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4),
});

export const CreateFolderSchema = z.object({
  name: z.string().min(1).max(128),
  parentId: z.string().nullable().optional(),
});

export const RenameItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(256),
});

export const UploadInitSchema = z.object({
  fileName: z.string().min(1),
  fileSize: z.number().int().positive(),
  folderId: z.string().nullable().optional(),
  mimeType: z.string().default('application/octet-stream'),
  totalChunks: z.number().int().min(1),
  isEncrypted: z.boolean().default(false),
  e2eeIv: z.string().optional(),
  e2eeSalt: z.string().optional(),
  e2eeAuthTag: z.string().optional(),
});

export const ChunkUploadSchema = z.object({
  sessionId: z.string(),
  chunkIndex: z.number().int().min(0),
  totalChunks: z.number().int().min(1),
  chunkData: z.string(), // base64 encoded chunk
});

export interface FileItemModel {
  id: string;
  name: string;
  originalName: string;
  folderId: string | null;
  mimeType: string;
  sizeBytes: number;
  diskPath: string;
  isEncrypted: boolean;
  e2eeIv?: string;
  e2eeSalt?: string;
  e2eeAuthTag?: string;
  sha256?: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
  mediaMetadata?: MediaMetadataModel;
}

export interface MediaMetadataModel {
  width?: number;
  height?: number;
  durationSeconds?: number;
  cameraMake?: string;
  cameraModel?: string;
  lens?: string;
  iso?: number;
  shutterSpeed?: string;
  focalLength?: string;
  aperture?: string;
  takenAt?: string;
  locationName?: string;
}

export interface FolderModel {
  id: string;
  name: string;
  parentId: string | null;
  path: string;
  createdAt: string;
  updatedAt: string;
  itemCount?: number;
}

export interface StorageStatsModel {
  diskLabel: string;
  mountPath: string;
  totalBytes: number;
  usedBytes: number;
  freeBytes: number;
  usedPercentage: number;
  health: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  fileCount: number;
  categories: {
    photos: { bytes: number; count: number };
    videos: { bytes: number; count: number };
    documents: { bytes: number; count: number };
    archives: { bytes: number; count: number };
    system: { bytes: number; count: number };
  };
  smartInfo: {
    temperatureC: number;
    powerOnHours: number;
    badSectors: number;
    filesystem: string;
    readSpeedMBs: number;
    writeSpeedMBs: number;
  };
  tailscale: {
    connected: boolean;
    magicDns: string;
    tailscaleIp: string;
    tlsCertExpiry: string;
    directPeerTunnel: boolean;
  };
}
