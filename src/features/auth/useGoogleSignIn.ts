import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

WebBrowser.maybeCompleteAuthSession();

const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS;
const ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID;
const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB;

/**
 * Runs Google's OIDC implicit flow and hands back a raw Google ID token.
 * Verification and account creation happen server-side in POST /auth/google —
 * this hook never talks to the NUVO backend directly.
 */
export function useGoogleSignIn() {
  const isConfigured = Boolean(IOS_CLIENT_ID || ANDROID_CLIENT_ID || WEB_CLIENT_ID);

  const [request, , promptAsync] = Google.useAuthRequest({
    iosClientId: IOS_CLIENT_ID,
    androidClientId: ANDROID_CLIENT_ID,
    webClientId: WEB_CLIENT_ID,
    responseType: 'id_token',
    scopes: ['openid', 'profile', 'email'],
  });

  const signIn = async (): Promise<string> => {
    if (!isConfigured) {
      throw new Error('Google sign-in is not configured — set EXPO_PUBLIC_GOOGLE_CLIENT_ID_* in .env');
    }
    const result = await promptAsync();
    if (result.type !== 'success') {
      throw new Error(
        result.type === 'error' ? result.error?.message ?? 'Google sign-in failed' : 'Google sign-in was cancelled',
      );
    }
    const idToken = result.authentication?.idToken ?? (result.params as Record<string, string>)?.id_token;
    if (!idToken) {
      throw new Error('Google did not return an ID token');
    }
    return idToken;
  };

  return { signIn, isConfigured, isReady: Boolean(request) };
}
