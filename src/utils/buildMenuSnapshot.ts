import {
  getCategoryInfo,
  getSlotInfo,
  isPlaceholderAssignment,
  type Assignment,
  type AssigneeInfo,
  type Food,
  type Group,
  type SlotInfo,
} from '../types';
import { getUpcomingEventContext } from './hebrewCalendar';

// Compact JSON shape for the public menu page. Kept short on purpose
// because it ends up base64-encoded inside a URL.
export type MenuSnapshot = {
  v: 1;
  g: string; // group name
  e: string; // event name (parsha / holiday)
  hd: string; // hebrew date
  gd: string; // gregorian date
  s: Array<{
    e: string; // slot emoji
    l: string; // slot label
    items: Array<{
      n: string; // food name
      a: string | null; // assignee name (null = "טרם שובץ")
      d: 0 | 1; // done
    }>;
  }>;
};

type Input = {
  group: Group;
  assignments: Assignment[];
  foodsById: Map<string, Food>;
  slotByKey: Map<string, SlotInfo>;
  assigneeById: Map<string, AssigneeInfo>;
  slots: SlotInfo[];
};

export function buildMenuSnapshot({
  group,
  assignments,
  foodsById,
  slotByKey: _slotByKey,
  assigneeById,
  slots,
}: Input): MenuSnapshot {
  // The link snapshot describes the *upcoming* event — same logic as
  // the WhatsApp share text. See getUpcomingEventContext() for details.
  const upcoming = getUpcomingEventContext(new Date());
  const eventDate = upcoming?.date ?? new Date();
  const eventName = upcoming?.name ?? 'שבת';
  const gregorian = new Intl.DateTimeFormat('he-IL', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(eventDate);

  const bySlot = new Map<string, Assignment[]>();
  for (const slot of slots) bySlot.set(slot.key, []);
  for (const a of assignments) {
    if (!bySlot.has(a.slot)) bySlot.set(a.slot, []);
    bySlot.get(a.slot)!.push(a);
  }

  const sectionList: MenuSnapshot['s'] = [];

  for (const slot of slots) {
    const items = bySlot.get(slot.key) ?? [];
    if (items.length === 0) continue;
    sectionList.push({
      e: slot.emoji,
      l: slot.label,
      items: items.map((a) => buildItem(a, group, foodsById, assigneeById)),
    });
  }

  for (const [slotKey, items] of bySlot) {
    if (slots.find((s) => s.key === slotKey)) continue;
    if (items.length === 0) continue;
    const fallback = getSlotInfo(group, slotKey);
    sectionList.push({
      e: '📋',
      l: fallback?.label ?? '(סעודה נמחקה)',
      items: items.map((a) => buildItem(a, group, foodsById, assigneeById)),
    });
  }

  return {
    v: 1,
    g: group.name,
    e: eventName,
    hd: upcoming?.hebrewDate ?? '',
    gd: gregorian,
    s: sectionList,
  };
}

function buildItem(
  a: Assignment,
  group: Group,
  foodsById: Map<string, Food>,
  assigneeById: Map<string, AssigneeInfo>,
) {
  const isPlaceholder = isPlaceholderAssignment(a);
  const food = a.foodId ? foodsById.get(a.foodId) : undefined;
  const placeholderCat = a.placeholderCategory
    ? getCategoryInfo(group, a.placeholderCategory)
    : null;
  const foodName = isPlaceholder
    ? placeholderCat
      ? `${placeholderCat.emoji} ${placeholderCat.label} (לבחירה)`
      : 'קטגוריה לא ידועה'
    : (food?.name ?? '(מאכל נמחק)');
  const assignee = a.assignedTo ? assigneeById.get(a.assignedTo) : null;
  return {
    n: foodName,
    a: assignee?.name ?? null,
    d: (a.done ? 1 : 0) as 0 | 1,
  };
}

// Encodes the snapshot as a URL-safe base64 string (without padding).
export function encodeSnapshot(s: MenuSnapshot): string {
  const json = JSON.stringify(s);
  // Use unicode-safe base64
  const b64 =
    typeof btoa !== 'undefined'
      ? btoa(unescape(encodeURIComponent(json)))
      : Buffer.from(json, 'utf8').toString('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
