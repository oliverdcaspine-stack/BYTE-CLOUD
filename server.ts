import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import authRoutes from './src/server/routes/authRoutes';
import mediaRoutes from './src/server/routes/mediaRoutes';
import vaultRoutes from './src/server/routes/vaultRoutes';
import storageRoutes from './src/server/routes/storageRoutes';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Enable CORS for cross-platform companion clients (Tailscale MagicDNS, GitHub Pages, Vercel)
app.use(
  cors({
    origin: true, // Allow all origins for Tailscale encrypted mesh network & companion app
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Range', 'X-Requested-With'],
    exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length', 'Content-Disposition'],
  })
);

// Body Parsers with generous limit for chunked byte transfers
app.use(express.json({ limit: '64mb' }));
app.use(express.urlencoded({ extended: true, limit: '64mb' }));

// Mount API Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/vault', vaultRoutes);
app.use('/api/storage', storageRoutes);

// Quick ping and health endpoints
app.get('/api/ping', (req, res) => {
  res.json({ pong: true, time: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'BYTE CLOUD Node Engine',
    version: '2.4.0',
    tailscaleDirect: true,
    storageMounted: true,
    mountPath: '/mnt/storage/500gb_ext',
    timestamp: new Date().toISOString(),
  });
});

async function startServer() {
  if (!isProduction) {
    // Development mode: Mount Vite middleware (HMR disabled in AI Studio container)
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: Serve built dist assets
    const distPath = path.resolve(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[BYTE CLOUD] Core engine listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
