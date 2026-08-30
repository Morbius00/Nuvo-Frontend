import { nuvoApi } from './nuvoApi';
import { mockServer } from '@/mocks/mockServer';
import { Transaction } from '@/types';
import { tierForUtilisation } from '@/theme/tokens';
import { showToast } from '@/store/slices/toastSlice';

function toVoiceFormData(uri: string): FormData {
  const form = new FormData();
  const filename = uri.split('/').pop() || 'voice.m4a';
  const ext = filename.split('.').pop()?.toLowerCase();
  const type = ext === 'wav' ? 'audio/wav' : ext === 'mp4' ? 'audio/mp4' : 'audio/m4a';
  // React Native's fetch accepts this {uri,name,type} shape in place of a real Blob.
  form.append('audio', { uri, name: filename, type } as unknown as Blob);
  return form;
}

interface ListTransactionsArgs {
  page?: number;
  limit?: number;
  category?: string;
  type?: Transaction['type'];
  search?: string;
  startDate?: string;
  endDate?: string;
  sort?: string;
}

interface ListTransactionsResponse {
  items: Transaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface StopLossEvaluation {
  tier: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED' | 'HARD_STOP';
  utilisationPct: number;
  blocksTransaction: boolean;
}

interface TransactionWriteResponse {
  transaction: Transaction;
  stopLoss?: StopLossEvaluation;
}

interface ScanJobResponse {
  transactionId: string;
  jobId: string;
}

interface ScanJobStatus {
  state: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed';
  result?: unknown;
}

function toFormData(uri: string, fieldName = 'image'): FormData {
  const form = new FormData();
  const filename = uri.split('/').pop() || `${fieldName}.jpg`;
  const ext = filename.split('.').pop()?.toLowerCase();
  const type = ext === 'png' ? 'image/png' : 'image/jpeg';
  // React Native's fetch accepts this {uri,name,type} shape in place of a real Blob.
  form.append(fieldName, { uri, name: filename, type } as unknown as Blob);
  return form;
}

/** Surfaces a non-blocking stop-loss warning that a successful write can carry (not an RTK Query error). */
function announceStopLoss(dispatch: (action: unknown) => void, stopLoss?: StopLossEvaluation) {
  if (!stopLoss) return;
  const tier = tierForUtilisation(stopLoss.utilisationPct);
  const variant = tier.key === 'hard' ? 'error' : tier.key === 'red' || tier.key === 'orange' ? 'warning' : 'info';
  dispatch(
    showToast({
      variant,
      message: `You're at ${Math.round(stopLoss.utilisationPct)}% of your budget (${tier.label}).`,
    }),
  );
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
          ? [...result.items.map((t) => ({ type: 'Transaction' as const, id: t._id })), { type: 'Transaction', id: 'LIST' }]
          : [{ type: 'Transaction', id: 'LIST' }],
    }),

    getTransaction: builder.query<Transaction, string>({
      query: (id) => ({ url: `/transactions/${id}`, mock: () => mockServer.getTransaction(id) }),
      providesTags: (_r, _e, id) => [{ type: 'Transaction', id }],
    }),

    createTransaction: builder.mutation<TransactionWriteResponse, Partial<Transaction>>({
      query: (body) => ({ url: '/transactions', method: 'POST', body, mock: () => mockServer.createTransaction(body) }),
      invalidatesTags: [{ type: 'Transaction', id: 'LIST' }, 'Budget', 'HealthScore'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled.catch(() => ({ data: undefined }));
        announceStopLoss(dispatch, data?.stopLoss);
      },
    }),

    updateTransaction: builder.mutation<TransactionWriteResponse, { id: string; patch: Partial<Transaction> }>({
      query: ({ id, patch }) => ({
        url: `/transactions/${id}`,
        method: 'PATCH',
        body: patch,
        mock: () => mockServer.updateTransaction(id, patch),
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Transaction', id }, { type: 'Transaction', id: 'LIST' }, 'Budget'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled.catch(() => ({ data: undefined }));
        announceStopLoss(dispatch, data?.stopLoss);
      },
    }),

    deleteTransaction: builder.mutation<null, string>({
      query: (id) => ({ url: `/transactions/${id}`, method: 'DELETE', mock: () => mockServer.deleteTransaction(id) }),
      invalidatesTags: [{ type: 'Transaction', id: 'LIST' }, 'Budget'],
    }),

    scanReceipt: builder.mutation<ScanJobResponse, { uri: string }>({
      query: ({ uri }) => ({
        url: '/transactions/scan',
        method: 'POST',
        body: toFormData(uri),
        mock: () => mockServer.scanReceipt(),
      }),
      invalidatesTags: [{ type: 'Transaction', id: 'LIST' }],
    }),

    parseUpiScreenshot: builder.mutation<ScanJobResponse, { uri: string }>({
      query: ({ uri }) => ({
        url: '/transactions/parse-upi',
        method: 'POST',
        body: toFormData(uri),
        mock: () => mockServer.parseUpiScreenshot(),
      }),
      invalidatesTags: [{ type: 'Transaction', id: 'LIST' }],
    }),

    getScanJobStatus: builder.query<ScanJobStatus, string>({
      query: (jobId) => ({ url: `/transactions/scan/${jobId}`, mock: () => mockServer.getScanJobStatus(jobId) }),
    }),

    createVoiceTransaction: builder.mutation<TransactionWriteResponse, { uri: string }>({
      query: ({ uri }) => ({
        url: '/transactions/voice',
        method: 'POST',
        body: toVoiceFormData(uri),
        mock: () => mockServer.createVoiceTransaction(uri),
      }),
      invalidatesTags: [{ type: 'Transaction', id: 'LIST' }, 'Budget'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled.catch(() => ({ data: undefined }));
        announceStopLoss(dispatch, data?.stopLoss);
      },
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
  useGetScanJobStatusQuery,
  useCreateVoiceTransactionMutation,
} = transactionsApi;
