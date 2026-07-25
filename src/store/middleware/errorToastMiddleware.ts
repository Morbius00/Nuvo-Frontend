import { isRejectedWithValue, Middleware } from '@reduxjs/toolkit';
import { showToast } from '@/store/slices/toastSlice';
import { NuvoQueryError } from '@/store/api/baseQuery';

/** Already have dedicated inline error UI (formError / a chat bubble) — a toast on top would double up. */
const SILENT_ENDPOINTS = new Set(['login', 'register', 'googleAuth', 'lunaChat']);

/**
 * Central "superb error handling" chokepoint: every rejected nuvoApi call lands here so
 * no screen has to remember to surface a failure. 401s are owned entirely by
 * baseQueryWithReauth (silent here — it already toasts once on final logout); 422s stay
 * inline as field errors, never auto-toasted.
 */
export const errorToastMiddleware: Middleware = (store) => (next) => (action) => {
  if (isRejectedWithValue(action) && typeof action.type === 'string' && action.type.startsWith('nuvoApi/')) {
    const endpointName = (action.meta as { arg?: { endpointName?: string } } | undefined)?.arg?.endpointName;
    const error = action.payload as NuvoQueryError | undefined;

    if (!endpointName || !SILENT_ENDPOINTS.has(endpointName)) {
      const message = toastMessageFor(error);
      if (message) {
        store.dispatch(showToast({ variant: 'error', message }));
      }
    }
  }

  return next(action);
};

function toastMessageFor(error: NuvoQueryError | undefined): string | null {
  if (!error) return 'Something went wrong. Please try again.';

  switch (error.status) {
    case undefined:
      return "Couldn't reach the server — check your connection.";
    case 401:
      return null; // owned by baseQueryWithReauth
    case 403:
    case 429:
      return error.message;
    case 422:
      return null; // field-level, surfaced inline by the screen itself
    default:
      return error.status && error.status >= 500 ? 'Something went wrong. Please try again.' : error.message;
  }
}
