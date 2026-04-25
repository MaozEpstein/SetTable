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
import type { ArchivedAssignment, ShabbatHistoryEntry } from '../types';

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
};

export async function archiveAndClearAssignments({
  groupId,
  archivedBy,
  archivedByName,
  assignments,
}: ArchiveAndClearInput): Promise<void> {
  // 1. Snapshot the current assignments into a history doc
  await addDoc(historyCol(groupId), {
    archivedAt: Date.now(),
    archivedBy,
    archivedByName,
    assignmentCount: assignments.length,
    assignments,
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
