import { realApi } from './realApi';
import { mockApi } from './mockApi';

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
    console.warn('Backend API connection check failed, using fallback mock API:', e);
  }

  isBackendConnected = false;
  return false;
}

export function isUsingRealApi(): boolean {
  return isBackendConnected;
}

export const api: Window['api'] = new Proxy({} as Window['api'], {
  get(_target, prop: keyof Window['api']) {
    return async (...args: any[]) => {
      if (isBackendConnected) {
        return await (realApi[prop] as any)(...args);
      } else {
        if (typeof mockApi[prop] === 'function') {
          return await (mockApi[prop] as any)(...args);
        }
        throw new Error(`API method ${String(prop)} is not implemented.`);
      }
    };
  },
});
