// Translate Firebase Auth + Firestore error codes/messages into friendly
// Hebrew text for the user. Falls back to a generic message for codes we
// haven't catalogued yet, but tries to extract the (auth/...) suffix so the
// user at least sees something less raw than the full Firebase string.

const HE: Record<string, string> = {
  // sign-in / register
  'auth/email-already-in-use': 'כתובת האימייל כבר רשומה. נסה להתחבר במקום.',
  'auth/invalid-email': 'כתובת אימייל לא תקינה.',
  'auth/weak-password': 'הסיסמה חלשה מדי. בחר לפחות 6 תווים.',
  'auth/user-not-found': 'המשתמש לא נמצא. בדוק את הפרטים או הירשם.',
  'auth/wrong-password': 'סיסמה שגויה.',
  'auth/invalid-credential': 'שם משתמש או סיסמה שגויים.',
  'auth/invalid-login-credentials': 'שם משתמש או סיסמה שגויים.',
  'auth/too-many-requests': 'יותר מדי ניסיונות. נסה שוב בעוד כמה דקות.',
  'auth/user-disabled': 'החשבון הזה הושבת. פנה למנהל.',
  'auth/operation-not-allowed': 'שיטת התחברות זו לא מופעלת.',
  'auth/popup-closed-by-user': 'סגרת את חלון ההתחברות לפני שהושלמה.',
  'auth/cancelled-popup-request': 'ביטלת את ההתחברות.',
  'auth/popup-blocked': 'הדפדפן חסם את חלון ההתחברות. אפשר חלונות קופצים ונסה שוב.',
  'auth/account-exists-with-different-credential':
    'יש לך כבר חשבון עם אימייל זה — התחבר בשיטה הקודמת.',

  // network / quota
  'auth/network-request-failed': 'אין חיבור לאינטרנט. בדוק את הרשת ונסה שוב.',
  'auth/timeout': 'התחברות נכשלה (timeout). נסה שוב.',
  'auth/quota-exceeded': 'יותר מדי בקשות. נסה שוב בעוד כמה דקות.',

  // password reset
  'auth/missing-email': 'הזן כתובת אימייל.',
  'auth/expired-action-code': 'פג תוקף הקישור. בקש קישור איפוס חדש.',
  'auth/invalid-action-code': 'הקישור שהשתמשת בו אינו תקף יותר.',

  // firestore
  'permission-denied': 'אין לך הרשאה לבצע פעולה זו.',
  'unavailable': 'השרת לא זמין כרגע. נסה שוב.',
  'deadline-exceeded': 'הפעולה לקחה יותר מדי זמן. נסה שוב.',
};

export function translateAuthError(err: unknown): string {
  if (!err) return 'שגיאה לא ידועה.';
  // Firebase errors have shape { code, message }. Plain Error objects only have message.
  const code = (err as { code?: string }).code;
  if (code && HE[code]) return HE[code];

  const message = err instanceof Error ? err.message : String(err);

  // Try to pull out a (auth/xyz) marker from the message and look it up
  const match = message.match(/\((auth\/[a-z-]+)\)/i);
  if (match) {
    const extracted = match[1].toLowerCase();
    if (HE[extracted]) return HE[extracted];
    return `שגיאה: ${extracted.replace('auth/', '').replace(/-/g, ' ')}`;
  }

  // Specific custom errors thrown by our own code (Hebrew-friendly already)
  if (message.includes('שם המשתמש תפוס')) return 'שם המשתמש תפוס. בחר שם אחר.';
  if (message.includes('שם משתמש לא נמצא')) return 'שם משתמש לא נמצא.';

  // Last resort
  return message.length < 80 ? message : 'משהו השתבש. נסה שוב.';
}
