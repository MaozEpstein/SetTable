import { onAuthStateChanged, signInAnonymously, type User } from 'firebase/auth';
import { auth } from '../firebase';

export function getCurrentUid(): string | null {
  return auth.currentUser?.uid ?? null;
}

export async function ensureAnonymousAuth(): Promise<User> {
  if (auth.currentUser) return auth.currentUser;

  const existing = await new Promise<User | null>((resolve) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      unsub();
      resolve(user);
    });
  });

  if (existing) return existing;

  const credential = await signInAnonymously(auth);
  return credential.user;
}
