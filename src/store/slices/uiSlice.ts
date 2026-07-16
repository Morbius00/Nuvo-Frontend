import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UiState {
  theme: 'dark' | 'light';
  quietHoursEnabled: boolean;
  largeTransactionThreshold: number;
}

const initialState: UiState = {
  theme: 'dark',
  quietHoursEnabled: true,
  largeTransactionThreshold: 5000,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme(state, action: PayloadAction<'dark' | 'light'>) {
      state.theme = action.payload;
    },
    setQuietHoursEnabled(state, action: PayloadAction<boolean>) {
      state.quietHoursEnabled = action.payload;
    },
    setLargeTransactionThreshold(state, action: PayloadAction<number>) {
      state.largeTransactionThreshold = action.payload;
    },
  },
});

export const { setTheme, setQuietHoursEnabled, setLargeTransactionThreshold } = uiSlice.actions;
export default uiSlice.reducer;
