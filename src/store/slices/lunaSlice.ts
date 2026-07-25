import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface LunaAttachment {
  id: string;
  kind: 'image' | 'file';
  uri: string;
  name?: string;
  size?: number;
  mimeType?: string;
}

export interface LunaVoiceNote {
  uri: string;
  durationMs: number;
}

interface LunaUiState {
  /** null = no thread yet; the next send creates one server-side ("New chat" state). */
  activeConversationId: string | null;
  /** Which message is currently being read aloud — Redux (not component state) so a global
   * stop control and the hands-free voice-mode loop can both observe/drive it. */
  speakingMessageId: string | null;
  voiceModeActive: boolean;
}

const initialState: LunaUiState = {
  activeConversationId: null,
  speakingMessageId: null,
  voiceModeActive: false,
};

const lunaSlice = createSlice({
  name: 'luna',
  initialState,
  reducers: {
    setActiveConversation(state, action: PayloadAction<string | null>) {
      state.activeConversationId = action.payload;
    },
    setSpeakingMessage(state, action: PayloadAction<string | null>) {
      state.speakingMessageId = action.payload;
    },
    setVoiceModeActive(state, action: PayloadAction<boolean>) {
      state.voiceModeActive = action.payload;
    },
  },
});

export const { setActiveConversation, setSpeakingMessage, setVoiceModeActive } = lunaSlice.actions;
export default lunaSlice.reducer;
