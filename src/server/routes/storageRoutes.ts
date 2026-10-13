import { Router, Request, Response } from 'express';
import { storageStore } from '../store';

const router = Router();

// GET /api/storage/stats - Detailed 500GB disk usage and Tailscale network metrics
router.get('/stats', (req: Request, res: Response) => {
  const stats = storageStore.getStorageStats();
  return res.json(stats);
});

// GET /api/health - Instant connection ping for static frontend & companion client
router.get('/health', (req: Request, res: Response) => {
  return res.json({
    status: 'ONLINE',
    service: 'BYTE CLOUD Node Engine',
    version: '2.4.0',
    tailscaleDirect: true,
    storageMounted: true,
    mountPath: '/mnt/storage/500gb_ext',
    timestamp: new Date().toISOString(),
  });
});

export default router;
