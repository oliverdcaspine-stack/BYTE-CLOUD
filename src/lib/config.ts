// BYTE CLOUD Client Configuration & Dynamic Base URL Manager
// Supports static hosting (GitHub Pages, Vercel) connecting to self-hosted Tailscale MagicDNS endpoints

const STORAGE_KEY_API_URL = 'bytecloud_api_base_url';
const STORAGE_KEY_AUTH_TOKEN = 'bytecloud_jwt_token';
const STORAGE_KEY_E2EE_PASSPHRASE = 'bytecloud_e2ee_passphrase';

export function getStoredApiUrl(): string {
  if (typeof window === 'undefined') return '/api';
  const stored = localStorage.getItem(STORAGE_KEY_API_URL);
  if (stored && stored.trim() !== '') {
    return stored.trim().replace(/\/+$/, '');
  }
  // Default to relative /api on same host (works with Express dev/prod)
  return '/api';
}

export function setStoredApiUrl(url: string): void {
  if (typeof window === 'undefined') return;
  const clean = url.trim().replace(/\/+$/, '');
  if (!clean) {
    localStorage.removeItem(STORAGE_KEY_API_URL);
  } else {
    localStorage.setItem(STORAGE_KEY_API_URL, clean);
  }
}

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEY_AUTH_TOKEN);
}

export function setStoredToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  if (!token) {
    localStorage.removeItem(STORAGE_KEY_AUTH_TOKEN);
  } else {
    localStorage.setItem(STORAGE_KEY_AUTH_TOKEN, token);
  }
}

export async function testServerConnection(targetUrl?: string): Promise<{
  success: boolean;
  latencyMs: number;
  data?: any;
  error?: string;
}> {
  const base = targetUrl ? targetUrl.trim().replace(/\/+$/, '') : getStoredApiUrl();
  const url = base.endsWith('/api') ? `${base}/health` : `${base}/api/health`;
  const start = performance.now();

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    const latencyMs = Math.round(performance.now() - start);

    if (!res.ok) {
      return {
        success: false,
        latencyMs,
        error: `Server responded with HTTP ${res.status}`,
      };
    }

    const data = await res.json();
    return {
      success: true,
      latencyMs,
      data,
    };
  } catch (err: any) {
    return {
      success: false,
      latencyMs: Math.round(performance.now() - start),
      error: err.message || 'Connection failed (Ensure Tailscale HTTPS certificate is trusted)',
    };
  }
}

export function apiUrl(endpoint: string): string {
  const base = getStoredApiUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  if (base.endsWith('/api') && cleanEndpoint.startsWith('/api/')) {
    // Prevent duplicate /api/api
    return `${base.replace(/\/api$/, '')}${cleanEndpoint}`;
  }
  if (!base.endsWith('/api') && !cleanEndpoint.startsWith('/api/')) {
    return `${base}/api${cleanEndpoint}`;
  }
  return `${base}${cleanEndpoint}`;
}

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = apiUrl(endpoint);
  return fetch(url, {
    ...options,
    headers,
  });
}
