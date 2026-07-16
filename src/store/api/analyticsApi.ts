import { nuvoApi } from './nuvoApi';
import { mockServer } from '@/mocks/mockServer';
import { AnalyticsSummary, CategoryAnalytics, TrendPoint, HealthScore } from '@/types';

export const analyticsApi = nuvoApi.injectEndpoints({
  endpoints: (builder) => ({
    getAnalyticsSummary: builder.query<AnalyticsSummary, void>({
      query: () => ({ url: '/analytics/summary', mock: () => mockServer.analyticsSummary() }),
      providesTags: ['Budget'],
    }),

    getAnalyticsCategories: builder.query<CategoryAnalytics[], void>({
      query: () => ({ url: '/analytics/categories', mock: () => mockServer.analyticsCategories() }),
      providesTags: ['Budget'],
    }),

    getAnalyticsTrends: builder.query<TrendPoint[], { days?: number } | void>({
      query: (args) => ({
        url: '/analytics/trends',
        params: args ? ({ ...args } as Record<string, unknown>) : undefined,
        mock: () => mockServer.analyticsTrends(args?.days),
      }),
      providesTags: ['Budget'],
    }),

    getHealthScore: builder.query<{ current: HealthScore; history: HealthScore[] }, void>({
      query: () => ({ url: '/analytics/health-score', mock: () => mockServer.analyticsHealthScore() }),
      providesTags: ['HealthScore'],
    }),
  }),
});

export const {
  useGetAnalyticsSummaryQuery,
  useGetAnalyticsCategoriesQuery,
  useGetAnalyticsTrendsQuery,
  useGetHealthScoreQuery,
} = analyticsApi;
