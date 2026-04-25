import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  userName: '@shulchan/userName',
  groupIds: '@shulchan/groupIds',
} as const;

export async function getUserName(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.userName);
}

export async function setUserName(name: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.userName, name);
}

export async function clearUserName(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.userName);
}

export async function getGroupIds(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(KEYS.groupIds);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export async function setGroupIds(ids: string[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.groupIds, JSON.stringify(ids));
}

export async function addGroupId(id: string): Promise<void> {
  const current = await getGroupIds();
  if (!current.includes(id)) {
    await setGroupIds([...current, id]);
  }
}

export async function removeGroupId(id: string): Promise<void> {
  const current = await getGroupIds();
  await setGroupIds(current.filter((x) => x !== id));
}
