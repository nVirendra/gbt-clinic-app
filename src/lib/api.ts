import { realApi } from './realApi';

let isBackendConnected = false;

export async function checkBackendHealth(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
  const healthUrl = baseUrl.replace(/\/api\/v1\/?$/, '/health');

  try {
    const res = await fetch(healthUrl, { credentials: 'include' });
    if (res.ok) {
      isBackendConnected = true;
      return true;
    }
  } catch (e) {
    console.warn('Backend API connection check failed:', e);
  }

  isBackendConnected = false;
  return false;
}

export function isUsingRealApi(): boolean {
  return isBackendConnected;
}

export const api: Window['api'] = realApi;

if (typeof window !== 'undefined') {
  (window as any).api = realApi;
}

