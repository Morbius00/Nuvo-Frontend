import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './baseQueryWithReauth';

export const nuvoApi = createApi({
  reducerPath: 'nuvoApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Transaction', 'Budget', 'Goal', 'Insight', 'Subscription', 'Notification', 'HealthScore', 'User', 'Conversation'],
  endpoints: () => ({}),
});
