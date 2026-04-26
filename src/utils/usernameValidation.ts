// Username rules: 3-20 chars, lowercase letters / digits / underscore.
// Stored lowercase in Firestore (usernames/{username}) so lookup is case-insensitive.
const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

export function validateUsername(raw: string): { ok: true } | { ok: false; reason: string } {
  const u = normalizeUsername(raw);
  if (u.length === 0) return { ok: false, reason: 'הזן שם משתמש' };
  if (u.length < 3) return { ok: false, reason: 'שם משתמש חייב להכיל לפחות 3 תווים' };
  if (u.length > 20) return { ok: false, reason: 'שם משתמש מוגבל ל-20 תווים' };
  if (!USERNAME_RE.test(u)) {
    return {
      ok: false,
      reason: 'שם משתמש יכול להכיל רק אותיות אנגליות, ספרות וקו תחתון (_)',
    };
  }
  return { ok: true };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(raw: string): { ok: true } | { ok: false; reason: string } {
  const e = raw.trim();
  if (e.length === 0) return { ok: false, reason: 'הזן אימייל' };
  if (!EMAIL_RE.test(e)) return { ok: false, reason: 'כתובת אימייל לא תקינה' };
  return { ok: true };
}

export function validatePassword(raw: string): { ok: true } | { ok: false; reason: string } {
  if (raw.length < 6) return { ok: false, reason: 'סיסמה חייבת להכיל לפחות 6 תווים' };
  return { ok: true };
}
