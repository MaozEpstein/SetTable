import {
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  runTransaction,
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

// Marker doc keyed by normalized name — gives us atomic uniqueness
// in a Firestore transaction (transactions can't run queries).
function foodNameMarker(groupId: string, normalizedName: string) {
  return doc(db, 'groups', groupId, 'foodNames', normalizedName);
}

function normalizeFoodName(name: string): string {
  // Doc IDs can't contain '/', and shouldn't be '.' / '..'. Replace those
  // and collapse whitespace so "חמין" and " חמין " collide.
  return name
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/[\/.]/g, '_')
    .slice(0, 200);
}

export class DuplicateFoodNameError extends Error {
  constructor(name: string) {
    super(`כבר קיים מאכל בשם "${name}" בקבוצה`);
    this.name = 'DuplicateFoodNameError';
  }
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
  const trimmed = name.trim();
  const normalized = normalizeFoodName(trimmed);
  const newFoodRef = doc(foodsCol(groupId));
  const markerRef = foodNameMarker(groupId, normalized);

  await runTransaction(db, async (tx) => {
    const existing = await tx.get(markerRef);
    if (existing.exists()) {
      throw new DuplicateFoodNameError(trimmed);
    }
    tx.set(newFoodRef, {
      name: trimmed,
      categories,
      images: [],
      isFavorite: false,
      createdBy: uid,
      createdAt: Date.now(),
    });
    tx.set(markerRef, {
      foodId: newFoodRef.id,
      name: trimmed,
    });
  });
  return newFoodRef.id;
}

type UpdateFoodInput = {
  groupId: string;
  foodId: string;
  name?: string;
  categories?: FoodCategory[];
  recipe?: string | null;
  notes?: string | null;
  isFavorite?: boolean;
};

export async function updateFood({
  groupId,
  foodId,
  name,
  categories,
  recipe,
  notes,
  isFavorite,
}: UpdateFoodInput): Promise<void> {
  const update: Record<string, unknown> = { updatedAt: Date.now() };
  if (name !== undefined) update.name = name.trim();
  if (categories !== undefined) update.categories = categories;
  if (recipe !== undefined) update.recipe = recipe?.trim() ?? '';
  if (notes !== undefined) update.notes = notes?.trim() ?? '';
  if (isFavorite !== undefined) update.isFavorite = isFavorite;
  await updateDoc(foodDoc(groupId, foodId), update);
}

export async function deleteFood(groupId: string, foodId: string): Promise<void> {
  // Note: images are hosted on Cloudinary and not deleted from there
  // (deletion needs a signed request that requires our API secret).
  // Orphaned assets stay in Cloudinary; for a family-scale app the
  // 25 GB free tier absorbs this comfortably.
  const ref = foodDoc(groupId, foodId);
  const snap = await getDoc(ref);
  const name = snap.exists() ? (snap.data() as Food).name : null;
  await deleteDoc(ref);
  if (name) {
    // Release the uniqueness marker so the name can be reused.
    await deleteDoc(foodNameMarker(groupId, normalizeFoodName(name))).catch(() => {});
  }
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
  // Sorting is done client-side (sortFoods) to honor favorites + Hebrew
  // alphabetical order, so we don't impose an orderBy here.
  const q = query(foodsCol(groupId));
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
