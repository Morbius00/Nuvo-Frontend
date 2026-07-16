import { nuvoApi } from './nuvoApi';
import { mockServer } from '@/mocks/mockServer';
import { User, AuthTokens } from '@/types';
import { setCredentials, setTokens, completeOnboarding, logout as logoutAction } from '@/store/slices/authSlice';

interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export const authApi = nuvoApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, { email: string; password: string; deviceId?: string; deviceName?: string }>({
      query: (body) => ({
        url: '/auth/login',
        method: 'POST',
        body,
        mock: async () => {
          const { user, tokens } = await mockServer.login(body.email, body.password);
          return { user, ...tokens };
        },
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled;
        dispatch(setCredentials({ user: data.user, tokens: { accessToken: data.accessToken, refreshToken: data.refreshToken } }));
        // Logging in implies an existing, already-onboarded account.
        dispatch(completeOnboarding());
      },
    }),

    register: builder.mutation<AuthResponse, { name: string; email: string; phone?: string; password: string; currency?: string }>({
      query: (body) => ({
        url: '/auth/register',
        method: 'POST',
        body,
        mock: async () => {
          const { user, tokens } = await mockServer.register(body);
          return { user, ...tokens };
        },
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled;
        dispatch(setCredentials({ user: data.user, tokens: { accessToken: data.accessToken, refreshToken: data.refreshToken } }));
      },
    }),

    refreshToken: builder.mutation<AuthTokens, { refreshToken: string }>({
      query: (body) => ({
        url: '/auth/refresh',
        method: 'POST',
        body,
        mock: () => mockServer.refresh(),
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled;
        dispatch(setTokens(data));
      },
    }),

    logout: builder.mutation<null, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
        mock: async () => null,
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        await queryFulfilled.catch(() => undefined);
        dispatch(logoutAction());
        dispatch(nuvoApi.util.resetApiState());
      },
    }),

    changePassword: builder.mutation<null, { currentPassword: string; newPassword: string }>({
      query: (body) => ({
        url: '/auth/change-password',
        method: 'PATCH',
        body,
        mock: () => mockServer.changePassword(),
      }),
    }),

    forgotPassword: builder.mutation<null, { email: string }>({
      query: (body) => ({
        url: '/auth/forgot-password',
        method: 'POST',
        body,
        mock: async () => null,
      }),
    }),

    updateProfile: builder.mutation<User, Partial<User>>({
      query: (body) => ({
        url: '/users/me',
        method: 'PATCH',
        body,
        mock: () => mockServer.updateProfile(body),
      }),
      invalidatesTags: ['User'],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useRefreshTokenMutation,
  useLogoutMutation,
  useChangePasswordMutation,
  useForgotPasswordMutation,
  useUpdateProfileMutation,
} = authApi;
