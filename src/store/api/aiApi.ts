import { nuvoApi } from './nuvoApi';
import { mockServer } from '@/mocks/mockServer';
import { AiInsight, Goal, Subscription, ConversationSummary, ChatMessage } from '@/types';

export interface ChatTurnResult {
  conversationId: string;
  userMessageId: string;
  assistantMessageId: string;
  reply: string;
}

export interface VoiceTurnResult extends ChatTurnResult {
  transcript: string;
}

function toAudioFormData(uri: string, conversationId?: string): FormData {
  const form = new FormData();
  const filename = uri.split('/').pop() || 'voice.m4a';
  const ext = filename.split('.').pop()?.toLowerCase();
  const type = ext === 'wav' ? 'audio/wav' : ext === 'mp4' ? 'audio/mp4' : 'audio/m4a';
  // React Native's fetch accepts this {uri,name,type} shape in place of a real Blob.
  form.append('audio', { uri, name: filename, type } as unknown as Blob);
  if (conversationId) form.append('conversationId', conversationId);
  return form;
}

export const aiApi = nuvoApi.injectEndpoints({
  endpoints: (builder) => ({
    getLunaConversations: builder.query<ConversationSummary[], void>({
      query: () => ({ url: '/ai/luna/conversations', mock: () => mockServer.lunaConversations() }),
      providesTags: (result) =>
        result
          ? [...result.map((c) => ({ type: 'Conversation' as const, id: c._id })), { type: 'Conversation', id: 'LIST' }]
          : [{ type: 'Conversation', id: 'LIST' }],
    }),

    getLunaMessages: builder.query<ChatMessage[], string>({
      query: (conversationId) => ({
        url: `/ai/luna/conversations/${conversationId}/messages`,
        mock: () => mockServer.lunaMessages(conversationId),
      }),
      providesTags: (_result, _error, conversationId) => [{ type: 'Conversation', id: `messages-${conversationId}` }],
    }),

    sendLunaMessage: builder.mutation<ChatTurnResult, { conversationId?: string; message: string }>({
      query: (body) => ({
        url: '/ai/luna/chat',
        method: 'POST',
        body,
        mock: () => mockServer.lunaChat(body),
      }),
      invalidatesTags: (result) =>
        result
          ? [{ type: 'Conversation', id: 'LIST' }, { type: 'Conversation', id: `messages-${result.conversationId}` }]
          : [],
    }),

    sendLunaVoiceMessage: builder.mutation<VoiceTurnResult, { conversationId?: string; uri: string }>({
      query: ({ conversationId, uri }) => ({
        url: '/ai/luna/voice',
        method: 'POST',
        body: toAudioFormData(uri, conversationId),
        mock: () => mockServer.lunaVoice({ conversationId, uri }),
      }),
      invalidatesTags: (result) =>
        result
          ? [{ type: 'Conversation', id: 'LIST' }, { type: 'Conversation', id: `messages-${result.conversationId}` }]
          : [],
    }),

    regenerateLunaReply: builder.mutation<{ assistantMessageId: string; reply: string }, string>({
      query: (conversationId) => ({
        url: `/ai/luna/conversations/${conversationId}/regenerate`,
        method: 'POST',
        mock: () => mockServer.lunaRegenerate(conversationId),
      }),
      invalidatesTags: (_result, _error, conversationId) => [{ type: 'Conversation', id: `messages-${conversationId}` }],
    }),

    editLunaMessage: builder.mutation<
      { assistantMessageId: string; reply: string },
      { conversationId: string; messageId: string; body: string }
    >({
      query: ({ conversationId, messageId, body }) => ({
        url: `/ai/luna/conversations/${conversationId}/messages/${messageId}`,
        method: 'PATCH',
        body: { body },
        mock: () => mockServer.lunaEditMessage({ conversationId, messageId, body }),
      }),
      invalidatesTags: (_result, _error, { conversationId }) => [{ type: 'Conversation', id: `messages-${conversationId}` }],
    }),

    deleteLunaConversation: builder.mutation<null, string>({
      query: (id) => ({
        url: `/ai/luna/conversations/${id}`,
        method: 'DELETE',
        mock: () => mockServer.lunaDeleteConversation(id),
      }),
      invalidatesTags: [{ type: 'Conversation', id: 'LIST' }],
    }),

    getLunaInsights: builder.query<AiInsight[], void>({
      query: () => ({ url: '/ai/luna/insights', mock: () => mockServer.lunaInsights() }),
      providesTags: ['Insight'],
    }),

    getLunaOpportunities: builder.query<AiInsight[], void>({
      query: () => ({ url: '/ai/luna/opportunities', mock: () => mockServer.lunaOpportunities() }),
      providesTags: ['Insight'],
    }),

    createGoal: builder.mutation<Goal, Partial<Goal>>({
      query: (body) => ({ url: '/ai/goals', method: 'POST', body, mock: () => mockServer.createGoal(body) }),
      invalidatesTags: ['Goal'],
    }),

    listGoals: builder.query<Goal[], void>({
      query: () => ({ url: '/ai/goals', mock: () => mockServer.listGoals() }),
      providesTags: ['Goal'],
    }),

    getSubscriptionAudit: builder.query<{ subscriptions: Subscription[]; monthlyTotal: number; annualTotal: number }, void>({
      query: () => ({ url: '/ai/subscriptions', mock: () => mockServer.subscriptionAudit() }),
      // Real backend only returns { subscriptions, annualTotal } — derive monthlyTotal the
      // same way the backend derives annualTotal (a straight /12), rather than re-deriving
      // it from raw per-subscription frequencies in two different places.
      transformResponse: (raw: { subscriptions: Subscription[]; monthlyTotal?: number; annualTotal: number }) => ({
        subscriptions: raw.subscriptions,
        annualTotal: raw.annualTotal,
        monthlyTotal: raw.monthlyTotal ?? Math.round(raw.annualTotal / 12),
      }),
      providesTags: ['Subscription'],
    }),
  }),
});

export const {
  useGetLunaConversationsQuery,
  useGetLunaMessagesQuery,
  useSendLunaMessageMutation,
  useSendLunaVoiceMessageMutation,
  useRegenerateLunaReplyMutation,
  useEditLunaMessageMutation,
  useDeleteLunaConversationMutation,
  useGetLunaInsightsQuery,
  useGetLunaOpportunitiesQuery,
  useCreateGoalMutation,
  useListGoalsQuery,
  useGetSubscriptionAuditQuery,
} = aiApi;
