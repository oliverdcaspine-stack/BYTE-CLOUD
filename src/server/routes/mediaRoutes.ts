import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { storageStore } from '../store';
import { authMiddleware } from '../auth';

const router = Router();

// GET /api/media - Get all media items with filtering
router.get('/', (req: Request, res: Response) => {
  const type = req.query.type as string | undefined;
  const favorite = req.query.favorite === 'true';

  let media = storageStore.getMediaGallery();

  if (type === 'photos') {
    media = media.filter((m) => m.mimeType.startsWith('image/'));
  } else if (type === 'videos') {
    media = media.filter((m) => m.mimeType.startsWith('video/'));
  }

  if (favorite) {
    media = media.filter((m) => m.isFavorite);
  }

  return res.json({
    items: media,
    total: media.length,
  });
});

// GET /api/media/:id - Get specific media detail
router.get('/:id', (req: Request, res: Response) => {
  const file = storageStore.getFile(req.params.id);
  if (!file) {
    return res.status(404).json({ error: 'Media file not found' });
  }
  return res.json(file);
});

// GET /api/media/:id/stream - Stream media file with range requests (for video/photos)
router.get('/:id/stream', (req: Request, res: Response) => {
  const file = storageStore.getFile(req.params.id);
  if (!file) {
    return res.status(404).json({ error: 'Media file not found' });
  }

  // Resolve physical disk file
  let resolvedPath = '';
  if (file.diskPath && fs.existsSync(file.diskPath)) {
    resolvedPath = file.diskPath;
  } else if (file.diskPath && fs.existsSync(path.resolve(process.cwd(), file.diskPath.replace(/^\//, '')))) {
    resolvedPath = path.resolve(process.cwd(), file.diskPath.replace(/^\//, ''));
  }

  if (!resolvedPath || !fs.existsSync(resolvedPath)) {
    // If physical file not on disk, return 404 or placeholder
    return res.status(404).json({ error: 'Storage block not accessible on external disk' });
  }

  const stat = fs.statSync(resolvedPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  // Handle HTTP Range header for smooth video seeking & chunked playback
  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if (start >= fileSize) {
      res.status(416).send(`Requested range not satisfiable\n${start} >= ${fileSize}`);
      return;
    }

    const chunksize = end - start + 1;
    const fileStream = fs.createReadStream(resolvedPath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': file.mimeType,
    };

    res.writeHead(206, head);
    fileStream.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': file.mimeType,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=31536000, immutable',
    };
    res.writeHead(200, head);
    fs.createReadStream(resolvedPath).pipe(res);
  }
});

// POST /api/media/:id/favorite - Toggle favorite
router.post('/:id/favorite', authMiddleware, (req: Request, res: Response) => {
  const updated = storageStore.toggleFavorite(req.params.id);
  if (!updated) {
    return res.status(404).json({ error: 'File not found' });
  }
  return res.json(updated);
});

// DELETE /api/media/:id - Delete media
router.delete('/:id', authMiddleware, (req: Request, res: Response) => {
  const success = storageStore.deleteFile(req.params.id);
  if (!success) {
    return res.status(404).json({ error: 'File not found' });
  }
  return res.json({ success: true, message: 'Media removed from 500GB storage' });
});

export default router;
