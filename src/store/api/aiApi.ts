import { nuvoApi } from './nuvoApi';
import { mockServer } from '@/mocks/mockServer';
import { AiInsight, Goal, Subscription } from '@/types';

export interface LunaChatResponse {
  conversationId: string | null;
  reply: string;
}

export const aiApi = nuvoApi.injectEndpoints({
  endpoints: (builder) => ({
    lunaChat: builder.mutation<LunaChatResponse, { message: string; conversationId?: string }>({
      query: (body) => ({
        url: '/ai/luna/chat',
        method: 'POST',
        body,
        mock: () => mockServer.lunaChat(body.message, body.conversationId),
      }),
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
  useLunaChatMutation,
  useGetLunaInsightsQuery,
  useGetLunaOpportunitiesQuery,
  useCreateGoalMutation,
  useListGoalsQuery,
  useGetSubscriptionAuditQuery,
} = aiApi;
