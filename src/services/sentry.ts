import Constants from 'expo-constants';
import * as Sentry from '@sentry/react-native';

// Sentry DSN is read from app.json → expo.extra.sentryDsn so it can be
// updated without code changes. If unset (e.g. during local development
// or before the user has created a Sentry project), init is a no-op
// and the rest of the app behaves normally.
export function initSentry(): void {
  const dsn = (Constants.expoConfig?.extra as { sentryDsn?: string } | undefined)?.sentryDsn;
  if (!dsn) {
    if (__DEV__) {
      console.log('[Sentry] no DSN configured — error tracking disabled');
    }
    return;
  }
  Sentry.init({
    dsn,
    // Only sample 10% of normal traces in production to stay under quota.
    // Errors are always sent regardless of this setting.
    tracesSampleRate: __DEV__ ? 1.0 : 0.1,
    // Send errors from dev too — helpful while still iterating, the user
    // can tighten this once the app is stable in stores.
    enabled: true,
    environment: __DEV__ ? 'development' : 'production',
    release: Constants.expoConfig?.version ?? 'unknown',
  });
}

// Wrap the root component so Sentry can capture render errors.
export const wrapWithSentry = Sentry.wrap;

// Manual capture for caught errors that we still want to know about.
export function captureException(err: unknown, context?: Record<string, unknown>): void {
  Sentry.captureException(err, context ? { extra: context } : undefined);
}
