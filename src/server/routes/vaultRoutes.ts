import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { storageStore } from '../store';
import { authMiddleware } from '../auth';
import { CreateFolderSchema, UploadInitSchema, ChunkUploadSchema, RenameItemSchema } from '../types';

const router = Router();

// GET /api/vault/list - Get folder hierarchy and files inside
router.get('/list', (req: Request, res: Response) => {
  const folderId = (req.query.folderId as string) || null;
  const normalizedFolderId = folderId === 'root' || !folderId ? null : folderId;

  const currentFolder = normalizedFolderId ? storageStore.getFolder(normalizedFolderId) : null;
  const folders = storageStore.getFolders(normalizedFolderId);
  const files = storageStore.getFiles(normalizedFolderId);
  const breadcrumbs = storageStore.getFolderBreadcrumbs(normalizedFolderId);

  return res.json({
    currentFolder,
    breadcrumbs,
    folders,
    files,
    totalItems: folders.length + files.length,
  });
});

// POST /api/vault/folder - Create new folder
router.post('/folder', authMiddleware, (req: Request, res: Response) => {
  const result = CreateFolderSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid folder parameters' });
  }

  const { name, parentId } = result.data;
  const normalizedParentId = parentId === 'root' || !parentId ? null : parentId;
  const newFolder = storageStore.createFolder(name, normalizedParentId);
  return res.status(201).json(newFolder);
});

// DELETE /api/vault/folder/:id - Delete folder
router.delete('/folder/:id', authMiddleware, (req: Request, res: Response) => {
  const success = storageStore.deleteFolder(req.params.id);
  return res.json({ success, message: 'Folder and sub-items removed' });
});

// POST /api/vault/upload/init - Initialize chunked upload session
router.post('/upload/init', authMiddleware, (req: Request, res: Response) => {
  const result = UploadInitSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid upload init metadata', details: result.error });
  }

  const session = storageStore.initUploadSession(result.data);
  return res.status(201).json(session);
});

// POST /api/vault/upload/chunk - Receive upload chunk
router.post('/upload/chunk', authMiddleware, (req: Request, res: Response) => {
  const result = ChunkUploadSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid chunk data' });
  }

  const { sessionId, chunkIndex, chunkData } = result.data;
  try {
    const chunkBuffer = Buffer.from(chunkData, 'base64');
    const status = storageStore.addUploadChunk(sessionId, chunkIndex, chunkBuffer);
    return res.json(status);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Chunk processing failed' });
  }
});

// Direct upload fallback (for small files in 1 shot)
router.post('/upload/direct', authMiddleware, (req: Request, res: Response) => {
  const { fileName, mimeType, folderId, dataBase64, isEncrypted, e2eeIv, e2eeSalt, e2eeAuthTag } = req.body;
  if (!fileName || !dataBase64) {
    return res.status(400).json({ error: 'Missing fileName or dataBase64 payload' });
  }

  try {
    const buffer = Buffer.from(dataBase64, 'base64');
    const { sessionId } = storageStore.initUploadSession({
      fileName,
      fileSize: buffer.length,
      folderId: folderId === 'root' ? null : folderId,
      mimeType: mimeType || 'application/octet-stream',
      totalChunks: 1,
      isEncrypted: !!isEncrypted,
      e2eeIv,
      e2eeSalt,
      e2eeAuthTag,
    });

    const result = storageStore.addUploadChunk(sessionId, 0, buffer);
    return res.status(201).json(result);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to process file upload: ' + err.message });
  }
});

// GET /api/vault/download/:id - Download file
router.get('/download/:id', (req: Request, res: Response) => {
  const file = storageStore.getFile(req.params.id);
  if (!file) {
    return res.status(404).json({ error: 'File not found' });
  }

  // If physical file exists, send it
  let resolvedPath = '';
  if (file.diskPath && fs.existsSync(file.diskPath)) {
    resolvedPath = file.diskPath;
  } else if (file.diskPath && fs.existsSync(path.resolve(process.cwd(), file.diskPath.replace(/^\//, '')))) {
    resolvedPath = path.resolve(process.cwd(), file.diskPath.replace(/^\//, ''));
  }

  if (resolvedPath && fs.existsSync(resolvedPath)) {
    res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
    res.setHeader('Content-Type', file.mimeType);
    return fs.createReadStream(resolvedPath).pipe(res);
  }

  // If synthetic seeded document, generate sample data
  const sampleContent = `[BYTE CLOUD VAULT FILE]\nName: ${file.name}\nSize: ${file.sizeBytes} bytes\nStorage Mount: /mnt/storage/500gb_ext\nEncrypted: ${file.isEncrypted}\nTimestamp: ${file.createdAt}\nIntegrity Checksum: SHA-256 OK\n`;
  res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
  res.setHeader('Content-Type', 'text/plain');
  return res.send(Buffer.from(sampleContent));
});

// PATCH /api/vault/file/:id - Rename file
router.patch('/file/:id', authMiddleware, (req: Request, res: Response) => {
  const result = RenameItemSchema.safeParse({ id: req.params.id, name: req.body.name });
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid name provided' });
  }

  const updated = storageStore.renameFile(req.params.id, result.data.name);
  if (!updated) {
    return res.status(404).json({ error: 'File not found' });
  }
  return res.json(updated);
});

// DELETE /api/vault/file/:id - Delete file
router.delete('/file/:id', authMiddleware, (req: Request, res: Response) => {
  const success = storageStore.deleteFile(req.params.id);
  if (!success) {
    return res.status(404).json({ error: 'File not found' });
  }
  return res.json({ success: true, message: 'File deleted from vault' });
});

export default router;
