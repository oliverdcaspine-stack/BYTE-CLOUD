# BYTE CLOUD — Self-Hosted Personal Cloud & Companion Client

BYTE CLOUD is an industrial-grade, high-performance personal cloud, media gallery, and encrypted companion client engineered for self-hosted external storage over modern encrypted HTTPS/TLS (Tailscale MagicDNS).

---

## 1. Architecture Overview

- **Frontend Companion Client**: Built with React, Tailwind CSS, and Vite. Designed for mobile-first touch ergonomics and high-resolution desktop viewports with PWA (Progressive Web App) offline capabilities. Can be hosted statically (GitHub Pages, Vercel) or served directly by the Node backend daemon.
- **Backend Core Engine**: Node.js with Express, modular service-oriented architecture, streaming range requests (HTTP 206 Partial Content), chunked file transfers, and dynamic CORS for companion clients.
- **Physical Storage Integration**: Direct mapping to a mounted 500GB external hard disk at `/mnt/storage/500gb_ext` (or configurable path via `STORAGE_MOUNT_PATH`).
- **Database & ORM**: PostgreSQL 16 schema managed via Prisma ORM (`prisma/schema.prisma`) for type-safe relational mappings of users, devices, folder trees, and cryptographic metadata.
- **Cache & Upload Queues**: Redis 7 for high-frequency query caching and session handling.
- **Security & Privacy**: Client-side End-to-End Encryption (E2EE) using Web Crypto API (AES-GCM 256-bit with PBKDF2 SHA-256), paired with Tailscale WireGuard and TLS HTTPS certificates.

---

## 2. Mounting the 500GB External Hard Disk

On your Linux host or NAS:

```bash
# 1. Identify your external hard disk (e.g. /dev/sdb1)
lsblk -f

# 2. Create the target mount directory
sudo mkdir -p /mnt/storage/500gb_ext

# 3. Mount the disk
sudo mount -o rw,relatime,stripe=64 /dev/sdb1 /mnt/storage/500gb_ext

# 4. Add to /etc/fstab for persistent auto-mount on reboot
# UUID=xxxx-xxxx /mnt/storage/500gb_ext ext4 defaults,nofail 0 2
```

---

## 3. Tailscale MagicDNS & Encrypted HTTPS Setup

Tailscale provides peer-to-peer WireGuard encrypted tunnels with automatic Let's Encrypt TLS certificates:

```bash
# 1. Install Tailscale
curl -fsSL https://tailscale.com/install.sh | sh

# 2. Authenticate node to your tailnet
sudo tailscale up --operator=$USER

# 3. Enable MagicDNS HTTPS certificate (e.g. bytecloud.your-tailnet.ts.net)
sudo tailscale cert bytecloud.your-tailnet.ts.net

# 4. Configure BYTE CLOUD Tailscale serve or reverse proxy
sudo tailscale serve --bg 3000
```

Once running, your BYTE CLOUD companion app can be accessed securely from anywhere on any phone, tablet, or laptop at:
`https://bytecloud.your-tailnet.ts.net`

---

## 4. Quickstart with Docker Compose

To spin up the complete production stack (PostgreSQL, Redis, and Byte Cloud):

```bash
# Clone and enter directory
cd byte-cloud

# Spin up containers
docker compose up -d

# View status
docker compose ps
docker compose logs -f byte-cloud
```

---

## 5. Environment Variables (`.env`)

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | HTTP service port |
| `NODE_ENV` | `production` | Environment mode |
| `STORAGE_MOUNT_PATH` | `/mnt/storage/500gb_ext` | Absolute path to mounted 500GB external drive |
| `DATABASE_URL` | `postgresql://bytecloud:...` | PostgreSQL connection URL |
| `REDIS_URL` | `redis://localhost:6379` | Redis caching connection string |
| `JWT_SECRET` | `secret` | Secret key for JWT token signing |

---

## 6. Client-Side End-to-End Encryption (E2EE)

When E2EE is enabled:
1. Files are encrypted inside the client browser prior to transmission using AES-GCM 256-bit.
2. The master cryptographic key is derived client-side via PBKDF2 (100,000 iterations, SHA-256) from your passphrase and unique salt.
3. The server and disk store only encrypted ciphertext envelopes.
4. Photos, videos, and documents are decrypted on-the-fly in browser memory when viewed or downloaded.
