import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import type { User } from 'firebase/auth';
import { GOOGLE_OAUTH } from '../config/authConfig';
import { signInWithGoogleTokens } from './userAuth';

// Required by expo-auth-session to dismiss the in-app browser cleanly on return.
WebBrowser.maybeCompleteAuthSession();

// Usage in a component:
//   const { promptAsync, signInResult, error, loading, request } = useGoogleSignIn();
//   <Button disabled={!request || loading} onPress={() => promptAsync()} />
//
// Flow:
//   1. promptAsync() opens Google's consent screen (popup on web, in-app browser native)
//   2. Google returns an idToken via the auth-session callback
//   3. The hook exchanges it with Firebase (signInWithGoogleTokens)
//   4. signInWithGoogleTokens creates a userProfile doc in Firestore on first login
export function useGoogleSignIn() {
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: GOOGLE_OAUTH.webClientId,
    androidClientId: GOOGLE_OAUTH.androidClientId,
    iosClientId: GOOGLE_OAUTH.iosClientId,
    selectAccount: true,
  });

  const [signInResult, setSignInResult] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!response) return;
    if (response.type !== 'success') {
      if (response.type === 'error') {
        setError(response.error?.message ?? 'התחברות נכשלה');
      }
      return;
    }
    const idToken = (response.params as { id_token?: string } | undefined)?.id_token;
    if (!idToken) {
      setError('לא התקבל מזהה מ-Google');
      return;
    }
    setLoading(true);
    setError(null);
    signInWithGoogleTokens({ idToken })
      .then((u) => setSignInResult(u))
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'התחברות נכשלה';
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, [response]);

  return {
    request,
    promptAsync,
    signInResult,
    error,
    loading,
    isSupported:
      Platform.OS === 'web' ||
      Platform.OS === 'android' ||
      (Platform.OS === 'ios' && !!GOOGLE_OAUTH.iosClientId),
  };
}
