import type { BaseQueryFn } from '@reduxjs/toolkit/query';
import type { RootState } from '@/store';
import { delay } from '@/mocks/mockServer';

const API_MODE = process.env.EXPO_PUBLIC_API_MODE === 'live' ? 'live' : 'mock';
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api/v1';

export interface NuvoQueryArgs {
  /** Real REST path, e.g. '/transactions' — used only in live mode. */
  url: string;
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  params?: Record<string, unknown>;
  /** Executed against the in-memory mock server when EXPO_PUBLIC_API_MODE=mock. */
  mock: () => Promise<unknown>;
}

/**
 * Switches transparently between the local mock server and the real NUVO
 * backend based on EXPO_PUBLIC_API_MODE. Every injected endpoint provides both
 * a `url`/`method` (matching Nuvo-Backend's actual routes) and a `mock` thunk,
 * so flipping this one env var is the entire "go live" step.
 */
export const nuvoBaseQuery: BaseQueryFn<NuvoQueryArgs, unknown, { status?: number; message: string }> = async (
  args,
  api,
) => {
  if (API_MODE === 'mock') {
    await delay(280 + Math.random() * 380);
    try {
      const data = await args.mock();
      return { data };
    } catch (err) {
      return { error: { message: err instanceof Error ? err.message : 'Mock request failed' } };
    }
  }

  const state = api.getState() as RootState;
  const token = state.auth.accessToken;
  const query = args.params
    ? '?' +
      Object.entries(args.params)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&')
    : '';

  try {
    const res = await fetch(`${API_BASE_URL}${args.url}${query}`, {
      method: args.method ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: args.body ? JSON.stringify(args.body) : undefined,
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      return { error: { status: res.status, message: json?.message ?? res.statusText } };
    }
    return { data: json?.data ?? json };
  } catch (err) {
    return { error: { message: err instanceof Error ? err.message : 'Network request failed' } };
  }
};
