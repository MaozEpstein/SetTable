import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Assignment, MealSlot } from '../types';

function assignmentsCol(groupId: string) {
  return collection(db, 'groups', groupId, 'assignments');
}

type CreateAssignmentInput = {
  groupId: string;
  foodId: string;
  slot: MealSlot;
  uid: string;
};

export async function createAssignment({
  groupId,
  foodId,
  slot,
  uid,
}: CreateAssignmentInput): Promise<string> {
  const ref = await addDoc(assignmentsCol(groupId), {
    foodId,
    slot,
    assignedTo: null,
    done: false,
    createdBy: uid,
    createdAt: Date.now(),
  });
  return ref.id;
}

export async function setAssignee(
  groupId: string,
  assignmentId: string,
  uid: string | null,
): Promise<void> {
  await updateDoc(doc(db, 'groups', groupId, 'assignments', assignmentId), {
    assignedTo: uid,
  });
}

export async function setDone(
  groupId: string,
  assignmentId: string,
  done: boolean,
): Promise<void> {
  await updateDoc(doc(db, 'groups', groupId, 'assignments', assignmentId), {
    done,
  });
}

export async function deleteAssignment(
  groupId: string,
  assignmentId: string,
): Promise<void> {
  await deleteDoc(doc(db, 'groups', groupId, 'assignments', assignmentId));
}

export async function deleteAssignmentsForFood(
  groupId: string,
  foodId: string,
): Promise<void> {
  const snap = await getDocs(
    query(assignmentsCol(groupId), where('foodId', '==', foodId)),
  );
  if (snap.empty) return;
  const batch = writeBatch(db);
  snap.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}

export function subscribeAssignments(
  groupId: string,
  onChange: (assignments: Assignment[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  const q = query(assignmentsCol(groupId), orderBy('createdAt', 'asc'));
  return onSnapshot(
    q,
    (snap) => {
      const assignments: Assignment[] = snap.docs.map((d) => {
        const data = d.data() as Omit<Assignment, 'id'>;
        return { id: d.id, ...data };
      });
      onChange(assignments);
    },
    (err) => {
      if (onError) onError(err);
    },
  );
}
