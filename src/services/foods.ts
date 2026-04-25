import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import {
  deleteObject,
  getDownloadURL,
  ref as storageRef,
  uploadBytes,
} from 'firebase/storage';
import { db, storage } from '../firebase';
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
  // Best-effort: also delete any uploaded images for this food
  try {
    const snap = await getDoc(foodDoc(groupId, foodId));
    if (snap.exists()) {
      const data = snap.data() as { images?: string[] };
      const images = data.images ?? [];
      await Promise.all(
        images.map((url) =>
          deleteImageByUrl(url).catch(() => {
            /* ignore individual delete failures */
          }),
        ),
      );
    }
  } catch {
    /* ignore */
  }
  await deleteDoc(foodDoc(groupId, foodId));
}

async function uriToBlob(uri: string): Promise<Blob> {
  // Use XHR for reliable blob conversion in React Native (fetch().blob()
  // is unreliable for local file:// URIs on some platforms).
  return new Promise<Blob>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => resolve(xhr.response as Blob);
    xhr.onerror = () => reject(new Error('Failed to read image file'));
    xhr.responseType = 'blob';
    xhr.open('GET', uri, true);
    xhr.send(null);
  });
}

function imagePath(groupId: string, foodId: string, fileName: string): string {
  return `groups/${groupId}/foods/${foodId}/${fileName}`;
}

export async function addImageToFood(
  groupId: string,
  foodId: string,
  localUri: string,
): Promise<string> {
  const fileName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`;
  const path = imagePath(groupId, foodId, fileName);
  const blob = await uriToBlob(localUri);
  const ref = storageRef(storage, path);
  await uploadBytes(ref, blob, { contentType: 'image/jpeg' });
  const url = await getDownloadURL(ref);
  await updateDoc(foodDoc(groupId, foodId), {
    images: arrayUnion(url),
    updatedAt: Date.now(),
  });
  return url;
}

async function deleteImageByUrl(url: string): Promise<void> {
  // Firebase download URLs include the storage path encoded; use refFromURL.
  const { ref: refFromURL } = await import('firebase/storage');
  // refFromURL was renamed to ref(storage, url) — ref accepts a gs:// or https:// URL
  const ref = storageRef(storage, url);
  await deleteObject(ref);
  void refFromURL; // avoid unused
}

export async function removeImageFromFood(
  groupId: string,
  foodId: string,
  url: string,
): Promise<void> {
  await updateDoc(foodDoc(groupId, foodId), {
    images: arrayRemove(url),
    updatedAt: Date.now(),
  });
  try {
    await deleteImageByUrl(url);
  } catch {
    /* if storage object is gone or path doesn't match, ignore */
  }
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
