import type { RootState } from '@/store';
import { nuvoApi } from './nuvoApi';
import { mockServer } from '@/mocks/mockServer';
import { User, AuthTokens } from '@/types';
import { setCredentials, setTokens, updateUser, completeOnboarding, logout as logoutAction } from '@/store/slices/authSlice';

interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

function toImageFormData(uri: string): FormData {
  const form = new FormData();
  const filename = uri.split('/').pop() || 'image.jpg';
  const ext = filename.split('.').pop()?.toLowerCase();
  const type = ext === 'png' ? 'image/png' : 'image/jpeg';
  // React Native's fetch accepts this {uri,name,type} shape in place of a real Blob.
  form.append('image', { uri, name: filename, type } as unknown as Blob);
  return form;
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

    googleAuth: builder.mutation<AuthResponse, { idToken: string; deviceId?: string; deviceName?: string }>({
      query: (body) => ({
        url: '/auth/google',
        method: 'POST',
        body,
        mock: async () => {
          const { user, tokens } = await mockServer.loginWithGoogle();
          return { user, ...tokens };
        },
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled;
        dispatch(setCredentials({ user: data.user, tokens: { accessToken: data.accessToken, refreshToken: data.refreshToken } }));
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
      // Needs the refreshToken from Redux state (the backend's /auth/logout requires it in
      // the body to revoke it) — `query` callbacks don't get state, so this uses `queryFn`.
      queryFn: async (_arg, api, _extraOptions, baseQuery) => {
        const refreshToken = (api.getState() as RootState).auth.refreshToken;
        const result = await baseQuery({
          url: '/auth/logout',
          method: 'POST',
          body: refreshToken ? { refreshToken } : undefined,
          mock: async () => null,
        });
        return result.error ? { error: result.error } : { data: null };
      },
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

    resetPassword: builder.mutation<null, { email: string; otp: string; newPassword: string }>({
      query: (body) => ({
        url: '/auth/reset-password',
        method: 'POST',
        body,
        mock: () => mockServer.resetPassword(body),
      }),
    }),

    getMe: builder.query<User, void>({
      query: () => ({ url: '/users/me', mock: () => mockServer.getMe() }),
      providesTags: ['User'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled.catch(() => ({ data: undefined }));
        if (data) dispatch(updateUser(data));
      },
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

    uploadAvatar: builder.mutation<User, { uri: string }>({
      query: ({ uri }) => ({
        url: '/users/me/avatar',
        method: 'POST',
        body: toImageFormData(uri),
        mock: () => mockServer.uploadAvatar(uri),
      }),
      invalidatesTags: ['User'],
    }),
  }),
});

export const {
  useLoginMutation,
  useGoogleAuthMutation,
  useRegisterMutation,
  useRefreshTokenMutation,
  useLogoutMutation,
  useChangePasswordMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useGetMeQuery,
  useUpdateProfileMutation,
  useUploadAvatarMutation,
} = authApi;
