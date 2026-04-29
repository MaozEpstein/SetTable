import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../firebase';
import { createAssignment } from './assignments';
import {
  detectEventType,
  type ArchivedAssignment,
  type Assignment,
  type Food,
  type ShabbatHistoryEntry,
} from '../types';

function historyCol(groupId: string) {
  return collection(db, 'groups', groupId, 'history');
}

function assignmentsCol(groupId: string) {
  return collection(db, 'groups', groupId, 'assignments');
}

type ArchiveAndClearInput = {
  groupId: string;
  archivedBy: string;
  archivedByName: string;
  assignments: ArchivedAssignment[];
  eventName?: string;
  eventType?: 'shabbat' | 'holiday';
};

export async function archiveAndClearAssignments({
  groupId,
  archivedBy,
  archivedByName,
  assignments,
  eventName,
  eventType,
}: ArchiveAndClearInput): Promise<void> {
  // 1. Snapshot the current assignments into a history doc
  const archivedAt = Date.now();
  await addDoc(historyCol(groupId), {
    archivedAt,
    archivedBy,
    archivedByName,
    assignmentCount: assignments.length,
    assignments,
    eventType: eventType ?? detectEventType(archivedAt),
    ...(eventName ? { eventName } : {}),
  });

  // 2. Delete the live assignments in a single batch
  const snap = await getDocs(assignmentsCol(groupId));
  if (snap.empty) return;
  const batch = writeBatch(db);
  snap.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}

export async function deleteHistoryEntry(
  groupId: string,
  historyId: string,
): Promise<void> {
  await deleteDoc(doc(db, 'groups', groupId, 'history', historyId));
}

export type RestoreResult = {
  restored: number;
  skippedPlaceholders: number;
  skippedMissingFood: number;
  skippedDuplicates: number;
};

type RestoreInput = {
  groupId: string;
  uid: string;
  archivedAssignments: ArchivedAssignment[];
  availableFoods: Food[];
  existingAssignments: Assignment[];
};

// Copies the dishes from a history entry back into the current Meals
// view. Per-dish assignee + done state are intentionally NOT restored —
// the user picks who's making what for the new event.
export async function restoreFromHistory({
  groupId,
  uid,
  archivedAssignments,
  availableFoods,
  existingAssignments,
}: RestoreInput): Promise<RestoreResult> {
  const result: RestoreResult = {
    restored: 0,
    skippedPlaceholders: 0,
    skippedMissingFood: 0,
    skippedDuplicates: 0,
  };

  const foodByName = new Map<string, Food>();
  for (const f of availableFoods) foodByName.set(f.name, f);

  const existingPairs = new Set<string>();
  for (const a of existingAssignments) {
    if (a.foodId) existingPairs.add(`${a.foodId}|${a.slot}`);
  }

  const ops: Promise<unknown>[] = [];
  for (const arch of archivedAssignments) {
    if (arch.isPlaceholder) {
      result.skippedPlaceholders += 1;
      continue;
    }
    const food = foodByName.get(arch.foodName);
    if (!food) {
      result.skippedMissingFood += 1;
      continue;
    }
    const pair = `${food.id}|${arch.slot}`;
    if (existingPairs.has(pair)) {
      result.skippedDuplicates += 1;
      continue;
    }
    existingPairs.add(pair); // prevent same dish being restored twice
    ops.push(
      createAssignment({ groupId, foodId: food.id, slot: arch.slot, uid }),
    );
    result.restored += 1;
  }
  await Promise.all(ops);
  return result;
}

export function subscribeHistory(
  groupId: string,
  onChange: (entries: ShabbatHistoryEntry[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  const q = query(historyCol(groupId), orderBy('archivedAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      const entries: ShabbatHistoryEntry[] = snap.docs.map((d) => {
        const data = d.data() as Omit<ShabbatHistoryEntry, 'id'>;
        return { id: d.id, ...data };
      });
      onChange(entries);
    },
    (err) => {
      if (onError) onError(err);
    },
  );
}
