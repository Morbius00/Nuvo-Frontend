import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type ToastVariant = 'error' | 'warning' | 'info' | 'success';

export interface ToastItem {
  id: string;
  variant: ToastVariant;
  message: string;
  durationMs?: number;
}

interface ToastState {
  queue: ToastItem[];
}

const initialState: ToastState = { queue: [] };

let seq = 0;

const toastSlice = createSlice({
  name: 'toast',
  initialState,
  reducers: {
    showToast: {
      reducer(state, action: PayloadAction<ToastItem>) {
        state.queue.push(action.payload);
      },
      prepare(payload: { variant: ToastVariant; message: string; durationMs?: number }) {
        seq += 1;
        return { payload: { id: `toast_${seq}`, ...payload } };
      },
    },
    dismissToast(state, action: PayloadAction<string>) {
      state.queue = state.queue.filter((t) => t.id !== action.payload);
    },
  },
});

export const { showToast, dismissToast } = toastSlice.actions;
export default toastSlice.reducer;
