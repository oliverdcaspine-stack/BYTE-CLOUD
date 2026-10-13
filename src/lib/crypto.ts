// BYTE CLOUD Client-Side End-to-End Encryption (E2EE) Engine
// Powered by modern Web Crypto API (AES-GCM 256-bit + PBKDF2 SHA-256)

export interface EncryptedPayload {
  data: ArrayBuffer;
  iv: string; // Base64
  salt: string; // Base64
}

let sessionPassphrase: string | null = null;

export function setSessionPassphrase(passphrase: string | null): void {
  sessionPassphrase = passphrase;
}

export function getSessionPassphrase(): string | null {
  return sessionPassphrase;
}

export function isE2EEUnlocked(): boolean {
  return sessionPassphrase !== null && sessionPassphrase.length > 0;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Derive a 256-bit AES-GCM key from user passphrase using PBKDF2
async function deriveKey(passphrase: string, saltBuffer: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer as any,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Client-side Encrypt File before HTTPS transmission
export async function encryptFile(
  fileData: ArrayBuffer,
  passphrase: string
): Promise<EncryptedPayload> {
  // Generate cryptographically secure 16-byte salt and 12-byte IV
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const key = await deriveKey(passphrase, salt);

  const ciphertext = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as any,
    },
    key,
    fileData
  );

  return {
    data: ciphertext,
    iv: arrayBufferToBase64(iv.buffer),
    salt: arrayBufferToBase64(salt.buffer),
  };
}

// Client-side Decrypt File after download or for lightbox display
export async function decryptFile(
  encryptedData: ArrayBuffer,
  ivBase64: string,
  saltBase64: string,
  passphrase: string
): Promise<ArrayBuffer> {
  const iv = new Uint8Array(base64ToArrayBuffer(ivBase64));
  const salt = new Uint8Array(base64ToArrayBuffer(saltBase64));

  const key = await deriveKey(passphrase, salt);

  return window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv as any,
    },
    key,
    encryptedData
  );
}

// Generate random cryptographic recovery phrase
export function generateRecoveryKey(): string {
  const words = [
    'obsidian', 'tailscale', 'cipher', 'quantum', 'vault',
    'matrix', 'glacier', 'shibuya', 'granite', 'zenith',
    'nebula', 'protocol', 'monolith', 'apex', 'horizon',
    'photon', 'solaris', 'kinetic', 'vortex', 'titan'
  ];
  const selected: string[] = [];
  const randomIndices = new Uint8Array(8);
  window.crypto.getRandomValues(randomIndices);
  for (let i = 0; i < 8; i++) {
    selected.push(words[randomIndices[i] % words.length]);
  }
  return selected.join('-');
}
