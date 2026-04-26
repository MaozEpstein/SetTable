// Google OAuth Client IDs (created via Google Cloud Console for project settable-97985).
// These are public identifiers — safe to commit. The corresponding client *secrets*
// must never be checked in (we only use the public-flow PKCE for Web/Android).
export const GOOGLE_OAUTH = {
  webClientId:
    '763233186707-1jobq6e1stiiradd36bt00pd90n8g2gc.apps.googleusercontent.com',
  androidClientId:
    '763233186707-dcarmmpiadf2nbg7agmg31qh9gqfb2d1.apps.googleusercontent.com',
  // iOS client not provisioned (we ship iOS via PWA, which uses webClientId via redirect).
  iosClientId: undefined as string | undefined,
} as const;

// Project metadata (mirrors app.json → extra.eas.projectId).
export const EAS_PROJECT_ID = '52f847e8-aeef-4e43-97c2-77924d8377b8';
