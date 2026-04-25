import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Food, FoodCategory } from '../types';

function foodsCol(groupId: string) {
  return collection(db, 'groups', groupId, 'foods');
}

type CreateFoodInput = {
  groupId: string;
  name: string;
  category: FoodCategory;
  uid: string;
};

export async function createFood({
  groupId,
  name,
  category,
  uid,
}: CreateFoodInput): Promise<string> {
  const ref = await addDoc(foodsCol(groupId), {
    name: name.trim(),
    category,
    createdBy: uid,
    createdAt: Date.now(),
  });
  return ref.id;
}

export async function deleteFood(groupId: string, foodId: string): Promise<void> {
  await deleteDoc(doc(db, 'groups', groupId, 'foods', foodId));
}

export function subscribeFoods(
  groupId: string,
  onChange: (foods: Food[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  const q = query(foodsCol(groupId), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      const foods: Food[] = snap.docs.map((d) => {
        const data = d.data() as Omit<Food, 'id'>;
        return { id: d.id, ...data };
      });
      onChange(foods);
    },
    (err) => {
      if (onError) onError(err);
    },
  );
}
