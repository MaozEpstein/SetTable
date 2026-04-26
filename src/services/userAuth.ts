import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  GoogleAuthProvider,
  linkWithCredential,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { normalizeUsername } from '../utils/usernameValidation';

const USERNAMES = 'usernames';
const USER_PROFILES = 'userProfiles';

export type UserProfile = {
  uid: string;
  username?: string;
  displayName: string;
  email?: string;
  authMethod: 'username' | 'google' | 'anonymous';
  createdAt: number;
};

// ----- Username helpers -----

async function getUsernameDoc(username: string): Promise<{ uid: string; email: string } | null> {
  const ref = doc(db, USERNAMES, normalizeUsername(username));
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as { uid: string; email: string };
}

export async function isUsernameAvailable(username: string): Promise<boolean> {
  const existing = await getUsernameDoc(username);
  return existing === null;
}

// ----- Registration with username -----

export type RegisterInput = {
  username: string;
  email: string;
  password: string;
  displayName: string;
};

export async function registerWithUsername({
  username,
  email,
  password,
  displayName,
}: RegisterInput): Promise<User> {
  const normalizedUsername = normalizeUsername(username);
  const trimmedEmail = email.trim();
  const trimmedDisplay = displayName.trim();

  // Reserve the username inside a transaction so two registrations can't claim
  // the same name simultaneously.
  await runTransaction(db, async (tx) => {
    const ref = doc(db, USERNAMES, normalizedUsername);
    const snap = await tx.get(ref);
    if (snap.exists()) throw new Error('שם המשתמש תפוס. בחר שם אחר.');
    // Reserve with placeholder; real uid filled in after Firebase Auth creates the user.
    tx.set(ref, { reserved: true, reservedAt: serverTimestamp() });
  });

  let cred;
  try {
    cred = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
  } catch (err) {
    // Roll back the username reservation if auth creation fails.
    try {
      await setDoc(doc(db, USERNAMES, normalizedUsername), { reserved: false });
    } catch {
      // best-effort cleanup
    }
    throw err;
  }

  const uid = cred.user.uid;

  // Finalize the username record + write the user profile.
  await setDoc(doc(db, USERNAMES, normalizedUsername), {
    uid,
    email: trimmedEmail,
    createdAt: Date.now(),
  });
  await setDoc(doc(db, USER_PROFILES, uid), {
    uid,
    username: normalizedUsername,
    displayName: trimmedDisplay,
    email: trimmedEmail,
    authMethod: 'username',
    createdAt: Date.now(),
  } satisfies UserProfile);

  return cred.user;
}

// ----- Sign in with username -----

export async function signInWithUsername(
  username: string,
  password: string,
): Promise<User> {
  const record = await getUsernameDoc(username);
  if (!record) throw new Error('שם משתמש לא נמצא');
  const cred = await signInWithEmailAndPassword(auth, record.email, password);
  return cred.user;
}

// ----- Password recovery -----

export async function sendPasswordResetByUsername(username: string): Promise<string> {
  const record = await getUsernameDoc(username);
  if (!record) throw new Error('שם משתמש לא נמצא');
  await sendPasswordResetEmail(auth, record.email);
  // Return the (masked) email so the UI can confirm "sent to d***@gmail.com".
  return maskEmail(record.email);
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${'*'.repeat(Math.max(local.length - 2, 1))}@${domain}`;
}

// ----- Google Sign-In -----
// Implementation differs between native and web. Web uses signInWithPopup
// (or signInWithRedirect on iOS Safari/PWA). Native uses expo-auth-session.
// This function delegates to a platform-specific helper that returns an
// idToken + accessToken.

type GoogleTokens = { idToken: string; accessToken?: string | null };

export async function signInWithGoogleTokens(
  tokens: GoogleTokens,
  preferredDisplayName?: string,
): Promise<User> {
  const credential = GoogleAuthProvider.credential(tokens.idToken, tokens.accessToken ?? undefined);
  const result = await signInWithCredential(auth, credential);
  const uid = result.user.uid;

  // Ensure a userProfile exists (first-time Google login or returning user).
  const profileRef = doc(db, USER_PROFILES, uid);
  const existing = await getDoc(profileRef);
  if (!existing.exists()) {
    await setDoc(profileRef, {
      uid,
      displayName:
        preferredDisplayName?.trim() ||
        result.user.displayName?.trim() ||
        result.user.email?.split('@')[0] ||
        'משתמש',
      email: result.user.email ?? undefined,
      authMethod: 'google',
      createdAt: Date.now(),
    } satisfies UserProfile);
  }

  return result.user;
}

// ----- Link an anonymous account to email/password (migration flow) -----

export type LinkAnonymousInput = {
  username: string;
  email: string;
  password: string;
};

export async function linkAnonymousAccount({
  username,
  email,
  password,
}: LinkAnonymousInput): Promise<User> {
  if (!auth.currentUser) throw new Error('אין משתמש פעיל');
  if (!auth.currentUser.isAnonymous) throw new Error('המשתמש כבר רשום');

  const normalizedUsername = normalizeUsername(username);
  const trimmedEmail = email.trim();

  // Reserve username (same as register flow)
  await runTransaction(db, async (tx) => {
    const ref = doc(db, USERNAMES, normalizedUsername);
    const snap = await tx.get(ref);
    if (snap.exists()) throw new Error('שם המשתמש תפוס. בחר שם אחר.');
    tx.set(ref, { reserved: true, reservedAt: serverTimestamp() });
  });

  const credential = EmailAuthProvider.credential(trimmedEmail, password);
  const result = await linkWithCredential(auth.currentUser, credential);
  const uid = result.user.uid;

  await setDoc(doc(db, USERNAMES, normalizedUsername), {
    uid,
    email: trimmedEmail,
    createdAt: Date.now(),
  });
  // Update or create the profile, preserving existing displayName if present.
  const profileRef = doc(db, USER_PROFILES, uid);
  const existing = await getDoc(profileRef);
  const existingDisplayName = (existing.data() as UserProfile | undefined)?.displayName;
  await setDoc(profileRef, {
    uid,
    username: normalizedUsername,
    displayName: existingDisplayName ?? 'משתמש',
    email: trimmedEmail,
    authMethod: 'username',
    createdAt: existing.exists() ? (existing.data() as UserProfile).createdAt : Date.now(),
  } satisfies UserProfile);

  return result.user;
}

// ----- Profile updates -----

export async function updateDisplayName(uid: string, displayName: string): Promise<void> {
  const trimmed = displayName.trim();
  if (!trimmed) return;
  await updateDoc(doc(db, USER_PROFILES, uid), { displayName: trimmed });
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, USER_PROFILES, uid));
  if (!snap.exists()) return null;
  return snap.data() as UserProfile;
}

// ----- Sign out -----

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}
