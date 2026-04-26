export type FoodCategory =
  | 'meat'
  | 'fish'
  | 'carb'
  | 'salad'
  | 'dips'
  | 'dessert'
  | 'cake'
  | 'dairy'
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
  isFavorite?: boolean;
  createdBy: string;
  createdAt: number;
  updatedAt?: number;
};

// Favorites first, then alphabetical (Hebrew-aware).
export function sortFoods(foods: Food[]): Food[] {
  return [...foods].sort((a, b) => {
    const aFav = a.isFavorite ? 1 : 0;
    const bFav = b.isFavorite ? 1 : 0;
    if (aFav !== bFav) return bFav - aFav;
    return a.name.localeCompare(b.name, 'he');
  });
}

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

// Snapshot stored in the history collection. All names are denormalized
// so the entry stays readable even if foods/categories/slots/members are
// later renamed or deleted.
export type ArchivedAssignment = {
  foodName: string;
  isPlaceholder: boolean;
  slot: string;
  slotLabel: string;
  slotEmoji: string;
  assigneeName: string | null;
  done: boolean;
  categoryLabels: string[];
};

export type EventType = 'shabbat' | 'holiday';

export type ShabbatHistoryEntry = {
  id: string;
  archivedAt: number;
  archivedBy: string;
  archivedByName: string;
  assignmentCount: number;
  assignments: ArchivedAssignment[];
  eventType?: EventType; // older entries may not have this — fall back to date heuristic
};

// Friday/Saturday/Sunday → assume the user is wrapping up Shabbat
// (Friday afternoon, Saturday night, or Sunday morning).
// Mon–Thu → assume it's a חג (holiday) that just ended.
export function detectEventType(ts: number): EventType {
  const day = new Date(ts).getDay(); // 0=Sun, 5=Fri, 6=Sat
  return day === 0 || day === 5 || day === 6 ? 'shabbat' : 'holiday';
}

export function eventTypeOf(entry: Pick<ShabbatHistoryEntry, 'eventType' | 'archivedAt'>): EventType {
  return entry.eventType ?? detectEventType(entry.archivedAt);
}

export function eventLabel(type: EventType): string {
  return type === 'shabbat' ? 'שבת' : 'חג';
}

export type Group = {
  id: string;
  name: string;
  code: string;
  createdBy: string;
  createdAt: number;
  members: Record<string, Member>;
  admins?: string[];
  customSlots?: CustomMealSlot[];
  customCategories?: CustomFoodCategory[];
  manualMembers?: ManualMember[];
};

// True if `uid` is an admin of the group. Falls back to `createdBy` for older
// groups that predate the `admins` field — the creator is always admin.
export function isGroupAdmin(group: Group, uid: string): boolean {
  if (!uid) return false;
  if (group.admins?.includes(uid)) return true;
  if (!group.admins || group.admins.length === 0) {
    return group.createdBy === uid;
  }
  return false;
}

export const FOOD_CATEGORIES: { key: FoodCategory; label: string; emoji: string }[] = [
  { key: 'meat', label: 'מנת בשר', emoji: '🥩' },
  { key: 'fish', label: 'דגים', emoji: '🐟' },
  { key: 'carb', label: 'פחמימה', emoji: '🍚' },
  { key: 'salad', label: 'סלט', emoji: '🥗' },
  { key: 'dips', label: 'מטבלים', emoji: '🥣' },
  { key: 'dessert', label: 'מנה אחרונה', emoji: '🍰' },
  { key: 'cake', label: 'עוגות', emoji: '🎂' },
  { key: 'dairy', label: 'חלבי', emoji: '🧀' },
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
