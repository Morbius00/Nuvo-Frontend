import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface LunaMessage {
  id: string;
  role: 'user' | 'assistant';
  body: string;
  createdAt: string;
}

interface LunaState {
  messages: LunaMessage[];
}

const initialState: LunaState = {
  messages: [
    {
      id: 'welcome',
      role: 'assistant',
      body: "Hi, I'm LUNA — your financial intelligence. Ask me about your spending, goals, or subscriptions anytime.",
      createdAt: new Date(0).toISOString(),
    },
  ],
};

const lunaSlice = createSlice({
  name: 'luna',
  initialState,
  reducers: {
    addMessage(state, action: PayloadAction<LunaMessage>) {
      state.messages.push(action.payload);
    },
    clearHistory(state) {
      state.messages = initialState.messages;
    },
  },
});

export const { addMessage, clearHistory } = lunaSlice.actions;
export default lunaSlice.reducer;
