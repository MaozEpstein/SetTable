export type FoodCategory =
  | 'meat'
  | 'carb'
  | 'salad'
  | 'dessert'
  | 'cake'
  | (string & {}); // allows custom IDs while keeping autocomplete on the defaults

export type MealSlot =
  | 'friday_night'
  | 'kiddush'
  | 'saturday_lunch'
  | 'third_meal'
  | 'general';

export type Member = {
  uid: string;
  name: string;
  joinedAt: number;
};

export type ManualMember = {
  id: string;
  name: string;
  addedBy: string;
  addedAt: number;
};

export type CustomMealSlot = {
  id: string;
  label: string;
  emoji: string;
  createdBy: string;
  createdAt: number;
};

export type CustomFoodCategory = {
  id: string;
  label: string;
  emoji: string;
  createdBy: string;
  createdAt: number;
};

export type Food = {
  id: string;
  name: string;
  categories: FoodCategory[];
  category?: FoodCategory; // legacy single field, kept for read-back compat
  recipe?: string;
  notes?: string;
  images?: string[]; // Firebase Storage download URLs
  createdBy: string;
  createdAt: number;
  updatedAt?: number;
};

export type Assignment = {
  id: string;
  foodId: string | null; // null when this is a category-only placeholder
  placeholderCategory?: FoodCategory; // set only when foodId is null
  slot: string;
  assignedTo: string | null; // a member uid OR a manualMember id OR null
  done: boolean;
  createdBy: string;
  createdAt: number;
};

export function isPlaceholderAssignment(a: Assignment): boolean {
  return !a.foodId;
}

export type Group = {
  id: string;
  name: string;
  code: string;
  createdBy: string;
  createdAt: number;
  members: Record<string, Member>;
  customSlots?: CustomMealSlot[];
  customCategories?: CustomFoodCategory[];
  manualMembers?: ManualMember[];
};

export const FOOD_CATEGORIES: { key: FoodCategory; label: string; emoji: string }[] = [
  { key: 'meat', label: 'מנת בשר', emoji: '🥩' },
  { key: 'carb', label: 'פחמימה', emoji: '🍚' },
  { key: 'salad', label: 'סלט', emoji: '🥗' },
  { key: 'dessert', label: 'מנה אחרונה', emoji: '🍰' },
  { key: 'cake', label: 'עוגות', emoji: '🎂' },
];

export const MEAL_SLOTS: { key: MealSlot; label: string; shortLabel: string; emoji: string }[] = [
  { key: 'friday_night', label: 'סעודת ערב שבת', shortLabel: 'ערב שבת', emoji: '🌙' },
  { key: 'kiddush', label: 'קידוש', shortLabel: 'קידוש', emoji: '🍷' },
  { key: 'saturday_lunch', label: 'סעודת צהריי שבת', shortLabel: 'צהריים', emoji: '☀️' },
  { key: 'third_meal', label: 'סעודה שלישית', shortLabel: 'שלישית', emoji: '🌅' },
  { key: 'general', label: 'כללי', shortLabel: 'כללי', emoji: '📋' },
];

export type SlotInfo = {
  key: string;
  label: string;
  shortLabel: string;
  emoji: string;
  isCustom: boolean;
};

export function getAllSlots(group: Pick<Group, 'customSlots'> | null): SlotInfo[] {
  const defaults: SlotInfo[] = MEAL_SLOTS.map((s) => ({
    key: s.key,
    label: s.label,
    shortLabel: s.shortLabel,
    emoji: s.emoji,
    isCustom: false,
  }));
  const custom: SlotInfo[] = (group?.customSlots ?? []).map((c) => ({
    key: c.id,
    label: c.label,
    shortLabel: c.label,
    emoji: c.emoji,
    isCustom: true,
  }));
  return [...defaults, ...custom];
}

export function getSlotInfo(
  group: Pick<Group, 'customSlots'> | null,
  slotKey: string,
): SlotInfo | null {
  return getAllSlots(group).find((s) => s.key === slotKey) ?? null;
}

export type CategoryInfo = {
  key: string;
  label: string;
  emoji: string;
  isCustom: boolean;
};

export function getAllCategories(
  group: Pick<Group, 'customCategories'> | null,
): CategoryInfo[] {
  const defaults: CategoryInfo[] = FOOD_CATEGORIES.map((c) => ({
    key: c.key as string,
    label: c.label,
    emoji: c.emoji,
    isCustom: false,
  }));
  const custom: CategoryInfo[] = (group?.customCategories ?? []).map((c) => ({
    key: c.id,
    label: c.label,
    emoji: c.emoji,
    isCustom: true,
  }));
  return [...defaults, ...custom];
}

export function getCategoryInfo(
  group: Pick<Group, 'customCategories'> | null,
  key: string,
): CategoryInfo | null {
  return getAllCategories(group).find((c) => c.key === key) ?? null;
}

export function getFoodCategories(food: Food): FoodCategory[] {
  if (food.categories?.length) return food.categories;
  if (food.category) return [food.category];
  return [];
}

export type AssigneeInfo = {
  id: string;
  name: string;
  isManual: boolean;
  isMe: boolean;
};

export function getAllAssignees(
  group: Pick<Group, 'members' | 'manualMembers'> | null,
  myUid: string | null,
): AssigneeInfo[] {
  if (!group) return [];
  const members: AssigneeInfo[] = Object.values(group.members ?? {}).map((m) => ({
    id: m.uid,
    name: m.name,
    isManual: false,
    isMe: m.uid === myUid,
  }));
  const manuals: AssigneeInfo[] = (group.manualMembers ?? []).map((m) => ({
    id: m.id,
    name: m.name,
    isManual: true,
    isMe: false,
  }));
  return [...members, ...manuals];
}

export function getAssigneeInfo(
  group: Pick<Group, 'members' | 'manualMembers'> | null,
  myUid: string | null,
  assigneeId: string | null,
): AssigneeInfo | null {
  if (!assigneeId || !group) return null;
  return getAllAssignees(group, myUid).find((a) => a.id === assigneeId) ?? null;
}
