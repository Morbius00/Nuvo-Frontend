import { createApi } from '@reduxjs/toolkit/query/react';
import { nuvoBaseQuery } from './baseQuery';

export const nuvoApi = createApi({
  reducerPath: 'nuvoApi',
  baseQuery: nuvoBaseQuery,
  tagTypes: ['Transaction', 'Budget', 'Goal', 'Insight', 'Subscription', 'Notification', 'HealthScore', 'User'],
  endpoints: () => ({}),
});
