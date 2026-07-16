import { nuvoApi } from './nuvoApi';
import { mockServer } from '@/mocks/mockServer';
import { Transaction } from '@/types';

interface ListTransactionsArgs {
  page?: number;
  limit?: number;
  category?: string;
  type?: Transaction['type'];
  search?: string;
  startDate?: string;
  endDate?: string;
}

interface ListTransactionsResponse {
  transactions: Transaction[];
  nextCursor: string | null;
  total: number;
}

export const transactionsApi = nuvoApi.injectEndpoints({
  endpoints: (builder) => ({
    listTransactions: builder.query<ListTransactionsResponse, ListTransactionsArgs | void>({
      query: (params) => ({
        url: '/transactions',
        params: params ? ({ ...params } as Record<string, unknown>) : undefined,
        mock: () => mockServer.listTransactions(params ?? {}),
      }),
      providesTags: (result) =>
        result
          ? [...result.transactions.map((t) => ({ type: 'Transaction' as const, id: t._id })), { type: 'Transaction', id: 'LIST' }]
          : [{ type: 'Transaction', id: 'LIST' }],
    }),

    getTransaction: builder.query<Transaction, string>({
      query: (id) => ({ url: `/transactions/${id}`, mock: () => mockServer.getTransaction(id) }),
      providesTags: (_r, _e, id) => [{ type: 'Transaction', id }],
    }),

    createTransaction: builder.mutation<Transaction, Partial<Transaction>>({
      query: (body) => ({ url: '/transactions', method: 'POST', body, mock: () => mockServer.createTransaction(body) }),
      invalidatesTags: [{ type: 'Transaction', id: 'LIST' }, 'Budget', 'HealthScore'],
    }),

    updateTransaction: builder.mutation<Transaction, { id: string; patch: Partial<Transaction> }>({
      query: ({ id, patch }) => ({
        url: `/transactions/${id}`,
        method: 'PATCH',
        body: patch,
        mock: () => mockServer.updateTransaction(id, patch),
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Transaction', id }, { type: 'Transaction', id: 'LIST' }, 'Budget'],
    }),

    deleteTransaction: builder.mutation<null, string>({
      query: (id) => ({ url: `/transactions/${id}`, method: 'DELETE', mock: () => mockServer.deleteTransaction(id) }),
      invalidatesTags: [{ type: 'Transaction', id: 'LIST' }, 'Budget'],
    }),

    scanReceipt: builder.mutation<Transaction, { uri: string }>({
      query: () => ({ url: '/transactions/scan', method: 'POST', mock: () => mockServer.scanReceipt() }),
      invalidatesTags: [{ type: 'Transaction', id: 'LIST' }],
    }),

    parseUpiScreenshot: builder.mutation<Transaction, { uri: string }>({
      query: () => ({ url: '/transactions/parse-upi', method: 'POST', mock: () => mockServer.parseUpiScreenshot() }),
      invalidatesTags: [{ type: 'Transaction', id: 'LIST' }],
    }),

    createVoiceTransaction: builder.mutation<Transaction, { transcript: string }>({
      query: (body) => ({
        url: '/transactions/voice',
        method: 'POST',
        body,
        mock: () => mockServer.createVoiceTransaction(body.transcript),
      }),
      invalidatesTags: [{ type: 'Transaction', id: 'LIST' }, 'Budget'],
    }),
  }),
});

export const {
  useListTransactionsQuery,
  useGetTransactionQuery,
  useCreateTransactionMutation,
  useUpdateTransactionMutation,
  useDeleteTransactionMutation,
  useScanReceiptMutation,
  useParseUpiScreenshotMutation,
  useCreateVoiceTransactionMutation,
} = transactionsApi;
