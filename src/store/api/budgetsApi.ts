import { nuvoApi } from './nuvoApi';
import { mockServer } from '@/mocks/mockServer';
import { Budget } from '@/types';

export const budgetsApi = nuvoApi.injectEndpoints({
  endpoints: (builder) => ({
    getCurrentBudget: builder.query<Budget, void>({
      query: () => ({ url: '/budgets/current', mock: () => mockServer.getCurrentBudget() }),
      providesTags: ['Budget'],
    }),

    updateBudgetSettings: builder.mutation<Budget, { monthlyBudget?: number }>({
      query: (body) => ({ url: '/budgets/current', method: 'PATCH', body, mock: () => mockServer.updateBudgetSettings(body) }),
      invalidatesTags: ['Budget'],
    }),

    updateStopLoss: builder.mutation<Budget, Partial<Budget['stopLoss']>>({
      query: (body) => ({
        url: '/budgets/current/stop-loss',
        method: 'PATCH',
        body,
        mock: () => mockServer.updateStopLoss(body),
      }),
      invalidatesTags: ['Budget'],
    }),
  }),
});

export const { useGetCurrentBudgetQuery, useUpdateBudgetSettingsMutation, useUpdateStopLossMutation } = budgetsApi;
