import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../firebase';
import { deleteAssignmentsForSlot } from './assignments';
import type {
  CustomFoodCategory,
  CustomMealSlot,
  Food,
  Group,
  ManualMember,
  Member,
} from '../types';

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

function generateSlotId(): string {
  return `slot_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

type AddCustomSlotInput = {
  groupId: string;
  label: string;
  emoji: string;
  uid: string;
};

export async function addCustomSlot({
  groupId,
  label,
  emoji,
  uid,
}: AddCustomSlotInput): Promise<string> {
  const slot: CustomMealSlot = {
    id: generateSlotId(),
    label: label.trim(),
    emoji,
    createdBy: uid,
    createdAt: Date.now(),
  };
  await updateDoc(doc(db, GROUPS, groupId), {
    customSlots: arrayUnion(slot),
  });
  return slot.id;
}

export async function removeCustomSlot(
  groupId: string,
  slotId: string,
): Promise<void> {
  const ref = doc(db, GROUPS, groupId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data() as { customSlots?: CustomMealSlot[] };
  const filtered = (data.customSlots ?? []).filter((s) => s.id !== slotId);
  await updateDoc(ref, { customSlots: filtered });
  await deleteAssignmentsForSlot(groupId, slotId);
}

function generateCategoryId(): string {
  return `cat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function generateManualMemberId(): string {
  return `mm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

type AddCustomCategoryInput = {
  groupId: string;
  label: string;
  emoji: string;
  uid: string;
};

export async function addCustomCategory({
  groupId,
  label,
  emoji,
  uid,
}: AddCustomCategoryInput): Promise<string> {
  const cat: CustomFoodCategory = {
    id: generateCategoryId(),
    label: label.trim(),
    emoji,
    createdBy: uid,
    createdAt: Date.now(),
  };
  await updateDoc(doc(db, GROUPS, groupId), {
    customCategories: arrayUnion(cat),
  });
  return cat.id;
}

export async function removeCustomCategory(
  groupId: string,
  categoryId: string,
): Promise<void> {
  // 1. Strip the category off every food that uses it
  const foodsSnap = await getDocs(collection(db, GROUPS, groupId, 'foods'));
  if (!foodsSnap.empty) {
    const batch = writeBatch(db);
    let touched = 0;
    foodsSnap.forEach((d) => {
      const data = d.data() as Pick<Food, 'categories' | 'category'>;
      const current =
        data.categories ?? (data.category ? [data.category] : []);
      if (current.includes(categoryId)) {
        const next = current.filter((c) => c !== categoryId);
        batch.update(d.ref, { categories: next });
        touched += 1;
      }
    });
    if (touched > 0) await batch.commit();
  }

  // 2. Remove the category from the group
  const ref = doc(db, GROUPS, groupId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data() as { customCategories?: CustomFoodCategory[] };
  const filtered = (data.customCategories ?? []).filter(
    (c) => c.id !== categoryId,
  );
  await updateDoc(ref, { customCategories: filtered });
}

type AddManualMemberInput = {
  groupId: string;
  name: string;
  uid: string;
};

export async function addManualMember({
  groupId,
  name,
  uid,
}: AddManualMemberInput): Promise<string> {
  const member: ManualMember = {
    id: generateManualMemberId(),
    name: name.trim(),
    addedBy: uid,
    addedAt: Date.now(),
  };
  await updateDoc(doc(db, GROUPS, groupId), {
    manualMembers: arrayUnion(member),
  });
  return member.id;
}

export async function removeManualMember(
  groupId: string,
  manualMemberId: string,
): Promise<void> {
  // 1. Unassign any assignment pointing to this manual member
  const assignmentsSnap = await getDocs(
    query(
      collection(db, GROUPS, groupId, 'assignments'),
      where('assignedTo', '==', manualMemberId),
    ),
  );
  if (!assignmentsSnap.empty) {
    const batch = writeBatch(db);
    assignmentsSnap.forEach((d) => batch.update(d.ref, { assignedTo: null }));
    await batch.commit();
  }

  // 2. Remove from group
  const ref = doc(db, GROUPS, groupId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data() as { manualMembers?: ManualMember[] };
  const filtered = (data.manualMembers ?? []).filter(
    (m) => m.id !== manualMemberId,
  );
  await updateDoc(ref, { manualMembers: filtered });
}

export async function leaveGroup(groupId: string, uid: string): Promise<void> {
  await updateDoc(doc(db, GROUPS, groupId), {
    [`members.${uid}`]: deleteField(),
    memberUids: arrayRemove(uid),
  });
}

export async function updateNameInAllGroups(
  uid: string,
  newName: string,
): Promise<void> {
  const trimmed = newName.trim();
  if (!trimmed) return;
  const snap = await getDocs(
    query(collection(db, GROUPS), where('memberUids', 'array-contains', uid)),
  );
  if (snap.empty) return;
  const batch = writeBatch(db);
  snap.forEach((d) => {
    batch.update(d.ref, { [`members.${uid}.name`]: trimmed });
  });
  await batch.commit();
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
