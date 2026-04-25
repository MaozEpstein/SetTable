import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Group, Member } from '../types';

const GROUPS = 'groups';
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I confusion
const CODE_LENGTH = 6;

function generateCode(): string {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_CHARS.charAt(Math.floor(Math.random() * CODE_CHARS.length));
  }
  return code;
}

async function generateUniqueCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateCode();
    const snap = await getDocs(
      query(collection(db, GROUPS), where('code', '==', code), limit(1)),
    );
    if (snap.empty) return code;
  }
  throw new Error('כשל ביצירת קוד ייחודי. נסה שוב.');
}

type CreateGroupInput = {
  name: string;
  uid: string;
  userName: string;
};

export async function createGroup({
  name,
  uid,
  userName,
}: CreateGroupInput): Promise<{ id: string; code: string }> {
  const code = await generateUniqueCode();
  const now = Date.now();

  const member: Member = {
    uid,
    name: userName,
    joinedAt: now,
  };

  const ref = await addDoc(collection(db, GROUPS), {
    name: name.trim(),
    code,
    createdBy: uid,
    createdAt: now,
    createdAtServer: serverTimestamp(),
    members: { [uid]: member },
    memberUids: [uid],
  });

  return { id: ref.id, code };
}

type JoinGroupResult =
  | { ok: true; id: string; name: string }
  | { ok: false; reason: 'not_found' | 'already_member' };

type JoinGroupInput = {
  code: string;
  uid: string;
  userName: string;
};

export async function joinGroupByCode({
  code,
  uid,
  userName,
}: JoinGroupInput): Promise<JoinGroupResult> {
  const normalizedCode = code.trim().toUpperCase();
  const snap = await getDocs(
    query(collection(db, GROUPS), where('code', '==', normalizedCode), limit(1)),
  );

  if (snap.empty) return { ok: false, reason: 'not_found' };

  const docSnap = snap.docs[0];
  const data = docSnap.data() as {
    name: string;
    memberUids?: string[];
  };

  if (data.memberUids?.includes(uid)) {
    return { ok: false, reason: 'already_member' };
  }

  const member: Member = {
    uid,
    name: userName,
    joinedAt: Date.now(),
  };

  await updateDoc(doc(db, GROUPS, docSnap.id), {
    [`members.${uid}`]: member,
    memberUids: arrayUnion(uid),
  });

  return { ok: true, id: docSnap.id, name: data.name };
}

export function subscribeToMyGroups(
  uid: string,
  onChange: (groups: Group[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  const q = query(collection(db, GROUPS), where('memberUids', 'array-contains', uid));
  return onSnapshot(
    q,
    (snap) => {
      const groups: Group[] = snap.docs.map((d) => {
        const data = d.data() as Omit<Group, 'id'>;
        return { id: d.id, ...data };
      });
      groups.sort((a, b) => b.createdAt - a.createdAt);
      onChange(groups);
    },
    (err) => {
      if (onError) onError(err);
    },
  );
}
