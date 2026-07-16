import { nuvoApi } from './nuvoApi';
import { mockServer } from '@/mocks/mockServer';
import { AppNotification } from '@/types';

export const notificationsApi = nuvoApi.injectEndpoints({
  endpoints: (builder) => ({
    listNotifications: builder.query<AppNotification[], void>({
      query: () => ({ url: '/notifications', mock: () => mockServer.listNotifications() }),
      providesTags: (result) =>
        result
          ? [...result.map((n) => ({ type: 'Notification' as const, id: n._id })), { type: 'Notification', id: 'LIST' }]
          : [{ type: 'Notification', id: 'LIST' }],
    }),

    markNotificationRead: builder.mutation<null, string>({
      query: (id) => ({ url: `/notifications/${id}/read`, method: 'PATCH', mock: () => mockServer.markNotificationRead(id) }),
      invalidatesTags: [{ type: 'Notification', id: 'LIST' }],
    }),

    markAllNotificationsRead: builder.mutation<null, void>({
      query: () => ({ url: '/notifications/read-all', method: 'PATCH', mock: () => mockServer.markAllNotificationsRead() }),
      invalidatesTags: [{ type: 'Notification', id: 'LIST' }],
    }),
  }),
});

export const { useListNotificationsQuery, useMarkNotificationReadMutation, useMarkAllNotificationsReadMutation } =
  notificationsApi;
