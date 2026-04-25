export type FoodCategory =
  | 'meat'
  | 'carb'
  | 'salad'
  | 'dessert'
  | 'cake';

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

export type CustomMealSlot = {
  id: string;
  label: string;
  emoji: string;
  createdBy: string;
  createdAt: number;
};

export type Food = {
  id: string;
  name: string;
  category: FoodCategory;
  createdBy: string;
  createdAt: number;
};

export type Assignment = {
  id: string;
  foodId: string;
  slot: string; // a default MealSlot key OR a custom slot id
  assignedTo: string | null;
  done: boolean;
  createdBy: string;
  createdAt: number;
};

export type Group = {
  id: string;
  name: string;
  code: string;
  createdBy: string;
  createdAt: number;
  members: Record<string, Member>;
  customSlots?: CustomMealSlot[];
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

export function getCategoryInfo(category: FoodCategory) {
  return FOOD_CATEGORIES.find((c) => c.key === category) ?? null;
}
