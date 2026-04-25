import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../firebase';
import { uploadImageToCloudinary } from './cloudinary';
import type { Food, FoodCategory } from '../types';

function foodsCol(groupId: string) {
  return collection(db, 'groups', groupId, 'foods');
}

function foodDoc(groupId: string, foodId: string) {
  return doc(db, 'groups', groupId, 'foods', foodId);
}

type CreateFoodInput = {
  groupId: string;
  name: string;
  categories: FoodCategory[];
  uid: string;
};

export async function createFood({
  groupId,
  name,
  categories,
  uid,
}: CreateFoodInput): Promise<string> {
  const ref = await addDoc(foodsCol(groupId), {
    name: name.trim(),
    categories,
    images: [],
    createdBy: uid,
    createdAt: Date.now(),
  });
  return ref.id;
}

type UpdateFoodInput = {
  groupId: string;
  foodId: string;
  name?: string;
  categories?: FoodCategory[];
  recipe?: string | null;
  notes?: string | null;
};

export async function updateFood({
  groupId,
  foodId,
  name,
  categories,
  recipe,
  notes,
}: UpdateFoodInput): Promise<void> {
  const update: Record<string, unknown> = { updatedAt: Date.now() };
  if (name !== undefined) update.name = name.trim();
  if (categories !== undefined) update.categories = categories;
  if (recipe !== undefined) update.recipe = recipe?.trim() ?? '';
  if (notes !== undefined) update.notes = notes?.trim() ?? '';
  await updateDoc(foodDoc(groupId, foodId), update);
}

export async function deleteFood(groupId: string, foodId: string): Promise<void> {
  // Note: images are hosted on Cloudinary and not deleted from there
  // (deletion needs a signed request that requires our API secret).
  // Orphaned assets stay in Cloudinary; for a family-scale app the
  // 25 GB free tier absorbs this comfortably.
  await deleteDoc(foodDoc(groupId, foodId));
}

export async function addImageToFood(
  groupId: string,
  foodId: string,
  localUri: string,
): Promise<string> {
  const url = await uploadImageToCloudinary(localUri);
  await updateDoc(foodDoc(groupId, foodId), {
    images: arrayUnion(url),
    updatedAt: Date.now(),
  });
  return url;
}

export async function removeImageFromFood(
  groupId: string,
  foodId: string,
  url: string,
): Promise<void> {
  // We only drop the URL from Firestore; the Cloudinary asset stays
  // orphaned. See note in deleteFood / cloudinary.ts.
  await updateDoc(foodDoc(groupId, foodId), {
    images: arrayRemove(url),
    updatedAt: Date.now(),
  });
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

export function subscribeFood(
  groupId: string,
  foodId: string,
  onChange: (food: Food | null) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  return onSnapshot(
    foodDoc(groupId, foodId),
    (snap) => {
      if (!snap.exists()) {
        onChange(null);
        return;
      }
      const data = snap.data() as Omit<Food, 'id'>;
      onChange({ id: snap.id, ...data });
    },
    (err) => {
      if (onError) onError(err);
    },
  );
}
