import type { BaseQueryFn } from '@reduxjs/toolkit/query';
import type { RootState } from '@/store';
import { mockServer } from '@/mocks/mockServer';
import { nuvoBaseQuery, NuvoQueryArgs, NuvoQueryError } from './baseQuery';
import { setTokens, logout } from '@/store/slices/authSlice';
import { showToast } from '@/store/slices/toastSlice';

/** Endpoints that must never trigger a reauth attempt on their own 401s. */
const SKIP_REAUTH_URLS = new Set(['/auth/login', '/auth/register', '/auth/google', '/auth/refresh']);

// Module-scoped single-flight guard — JS has no true concurrency, so a synchronous
// check-then-set on this variable is race-free: every 401 that arrives while a refresh
// is already in flight just awaits the same promise instead of starting a new one.
let refreshPromise: Promise<boolean> | null = null;

/**
 * Runs the refresh call and, on failure, the logout/toast side effects — called at most
 * once per refresh cycle (guarded by refreshPromise below), so these dispatches never
 * fire more than once even when several requests 401 at the same moment.
 */
async function performRefresh(api: Parameters<BaseQueryFn>[1]): Promise<boolean> {
  const state = api.getState() as RootState;
  const refreshToken = state.auth.refreshToken;

  const result = refreshToken
    ? await nuvoBaseQuery(
        {
          url: '/auth/refresh',
          method: 'POST',
          body: { refreshToken },
          mock: () => mockServer.refresh(),
        },
        api,
        {},
      )
    : { error: { message: 'No refresh token available' } };

  if (!result.error && result.data) {
    const tokens = result.data as { accessToken: string; refreshToken: string };
    api.dispatch(setTokens(tokens));
    return true;
  }

  api.dispatch(logout());
  api.dispatch({ type: 'nuvoApi/resetApiState' });
  api.dispatch(showToast({ variant: 'error', message: 'Your session has expired. Please sign in again.' }));
  return false;
}

/**
 * Wraps nuvoBaseQuery with automatic access-token refresh on a 401: refreshes once
 * (single-flight across concurrent requests), retries the original request, and logs
 * the user out with a toast if the refresh token itself is dead.
 */
export const baseQueryWithReauth: BaseQueryFn<NuvoQueryArgs, unknown, NuvoQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  const result = await nuvoBaseQuery(args, api, extraOptions);

  if (result.error?.status !== 401 || SKIP_REAUTH_URLS.has(args.url)) {
    return result;
  }

  if (!refreshPromise) {
    refreshPromise = performRefresh(api).finally(() => {
      refreshPromise = null;
    });
  }

  const refreshed = await refreshPromise;

  return refreshed ? nuvoBaseQuery(args, api, extraOptions) : result;
};
