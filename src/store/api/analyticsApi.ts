import { nuvoApi } from './nuvoApi';
import { mockServer } from '@/mocks/mockServer';
import { budgetsApi } from './budgetsApi';
import { AnalyticsSummary, CategoryAnalytics, TrendPoint, HealthScore } from '@/types';
import { formatMonthYear } from '@/utils/format';

interface RawSummary {
  income: number;
  expense: number;
  savings: number;
  deltaVsPriorPeriodPct?: number;
}

interface RawCategory {
  category: string;
  amount: number;
  count: number;
  pctOfTotal: number;
  budgeted?: number;
}

interface RawTrendPoint {
  date: string;
  total?: number;
  amount?: number;
  priorPeriodAmount?: number;
}

export interface MonthlyHistoryPoint {
  year: number;
  month: number;
  label: string;
  income: number;
  expense: number;
  savings: number;
}

const DAY_MS = 86_400_000;

/** Same UTC-day window trends already uses, shared so Week/Month/Year means the same thing everywhere. */
function computeRangeDates(days: number): { startDate: string; endDate: string } {
  const now = new Date();
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const startUtc = todayUtc - (days - 1) * DAY_MS;
  return { startDate: new Date(startUtc).toISOString(), endDate: new Date(todayUtc).toISOString() };
}

function labelForDays(days: number): string {
  if (days <= 7) return 'This week';
  if (days <= 31) return formatMonthYear(new Date());
  return 'This year';
}

export const analyticsApi = nuvoApi.injectEndpoints({
  endpoints: (builder) => ({
    getAnalyticsSummary: builder.query<AnalyticsSummary, { days?: number } | void>({
      query: (arg) => {
        const { startDate, endDate } = computeRangeDates(arg?.days ?? 30);
        return { url: '/analytics/summary', params: { startDate, endDate }, mock: () => mockServer.analyticsSummary() };
      },
      // The real backend only computes a single expense-vs-prior-period delta
      // (deltaVsPriorPeriodPct); the mock already returns the richer FE shape as-is.
      transformResponse: (raw: RawSummary & Partial<AnalyticsSummary>, _meta, arg): AnalyticsSummary => ({
        income: raw.income,
        expense: raw.expense,
        savings: raw.savings,
        incomeDelta: raw.incomeDelta,
        expenseDelta: raw.expenseDelta ?? raw.deltaVsPriorPeriodPct ?? 0,
        savingsDelta: raw.savingsDelta,
        periodLabel: raw.periodLabel ?? labelForDays(arg?.days ?? 30),
      }),
      providesTags: ['Budget'],
    }),

    getAnalyticsCategories: builder.query<CategoryAnalytics[], { days?: number } | void>({
      // Real backend doesn't return a `budgeted` figure per category — join it client-side
      // against the already-cached current budget. The mock already includes it directly.
      queryFn: async (arg, api, _extraOptions, baseQuery) => {
        const { startDate, endDate } = computeRangeDates(arg?.days ?? 30);
        const result = await baseQuery({
          url: '/analytics/categories',
          params: { startDate, endDate },
          mock: () => mockServer.analyticsCategories(),
        });
        if (result.error) return { error: result.error };

        const rows = result.data as RawCategory[];
        const needsBudgetJoin = rows.some((r) => r.budgeted === undefined);
        const budget = needsBudgetJoin
          ? await api.dispatch(budgetsApi.endpoints.getCurrentBudget.initiate()).unwrap().catch(() => null)
          : null;

        const categories: CategoryAnalytics[] = rows.map((row) => ({
          category: row.category,
          amount: row.amount,
          count: row.count,
          pctOfTotal: row.pctOfTotal,
          budgeted: row.budgeted ?? budget?.categoryBreakdown.find((b) => b.category === row.category)?.budget ?? 0,
        }));

        return { data: categories };
      },
      providesTags: ['Budget'],
    }),

    getAnalyticsTrends: builder.query<TrendPoint[], { days?: number } | void>({
      // Real backend only emits days that have transactions and has no prior-period
      // comparison built in; the chart needs both zero-filled and zipped by day-offset.
      // The mock already returns the full comparison series in one call.
      //
      // Date-key arithmetic below is deliberately UTC-only (Date.UTC / getUTC*), never
      // local-time Date methods (setDate/setHours) — the backend groups transactions by
      // day with Mongo's $dateToString, which defaults to UTC. Building keys from local
      // midnight and converting to ISO shifts the day boundary by the device's UTC offset,
      // so every lookup misses and the whole line silently computes to zero.
      queryFn: async (arg, _api, _extraOptions, baseQuery) => {
        const days = arg?.days ?? 30;
        const DAY_MS = 86_400_000;
        const now = new Date();
        const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
        const currentStartUtc = todayUtc - (days - 1) * DAY_MS;
        const dateKey = (ms: number) => new Date(ms).toISOString().slice(0, 10);

        const currentResult = await baseQuery({
          url: '/analytics/trends',
          params: { startDate: new Date(currentStartUtc).toISOString(), endDate: new Date(todayUtc).toISOString() },
          mock: () => mockServer.analyticsTrends(days),
        });
        if (currentResult.error) return { error: currentResult.error };

        const currentRows = currentResult.data as RawTrendPoint[];
        if (currentRows.length > 0 && currentRows[0].priorPeriodAmount !== undefined) {
          return { data: currentRows as TrendPoint[] };
        }

        const priorStartUtc = currentStartUtc - days * DAY_MS;
        const priorEndUtc = currentStartUtc - DAY_MS;

        const priorResult = await baseQuery({
          url: '/analytics/trends',
          params: { startDate: new Date(priorStartUtc).toISOString(), endDate: new Date(priorEndUtc).toISOString() },
          mock: () => mockServer.analyticsTrends(days),
        });
        if (priorResult.error) return { error: priorResult.error };

        const currentByDate = new Map(currentRows.map((r) => [r.date.slice(0, 10), r.total ?? 0]));
        const priorByDate = new Map((priorResult.data as RawTrendPoint[]).map((r) => [r.date.slice(0, 10), r.total ?? 0]));

        const points: TrendPoint[] = [];
        let cumulative = 0;
        let priorCumulative = 0;
        for (let i = 0; i < days; i++) {
          const dMs = currentStartUtc + i * DAY_MS;
          const priorDMs = priorStartUtc + i * DAY_MS;

          cumulative += currentByDate.get(dateKey(dMs)) ?? 0;
          priorCumulative += priorByDate.get(dateKey(priorDMs)) ?? 0;
          points.push({ date: new Date(dMs).toISOString(), amount: cumulative, priorPeriodAmount: priorCumulative });
        }

        return { data: points };
      },
      providesTags: ['Budget'],
    }),

    getHealthScore: builder.query<{ current: HealthScore; history: HealthScore[] }, void>({
      query: () => ({ url: '/analytics/health-score', mock: () => mockServer.analyticsHealthScore() }),
      providesTags: ['HealthScore'],
    }),

    getMonthlyHistory: builder.query<MonthlyHistoryPoint[], { months?: number } | void>({
      query: (arg) => ({
        url: '/analytics/monthly-history',
        params: { months: arg?.months ?? 6 },
        mock: () => mockServer.analyticsMonthlyHistory(arg?.months ?? 6),
      }),
      providesTags: ['Budget'],
    }),
  }),
});

export const {
  useGetAnalyticsSummaryQuery,
  useGetAnalyticsCategoriesQuery,
  useGetAnalyticsTrendsQuery,
  useGetHealthScoreQuery,
  useGetMonthlyHistoryQuery,
} = analyticsApi;
