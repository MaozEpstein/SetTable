import {
  getCategoryInfo,
  getFoodCategories,
  getSlotInfo,
  isPlaceholderAssignment,
  type Assignment,
  type AssigneeInfo,
  type Food,
  type Group,
  type SlotInfo,
} from '../types';
import { getUpcomingEventContext } from './hebrewCalendar';

type BuildShareTextInput = {
  group: Group;
  assignments: Assignment[];
  foodsById: Map<string, Food>;
  slotByKey: Map<string, SlotInfo>;
  assigneeById: Map<string, AssigneeInfo>;
  slots: SlotInfo[];
};

// Builds a WhatsApp-friendly Hebrew text representation of the current
// Shabbat / חג plan. Designed to be copy-pasted into a chat — emojis,
// section per slot, ✓ for done, ○ for pending, "טרם שובץ" for unassigned.
export function buildShareText({
  group,
  assignments,
  foodsById,
  slotByKey,
  assigneeById,
  slots,
}: BuildShareTextInput): string {
  // Share text is always for the *upcoming* shabbat / חג — the one
  // people are planning for. If today is mid-week with a holiday two
  // days out, the snapshot still says "פסח", not "today's parsha".
  const upcoming = getUpcomingEventContext(new Date());
  const eventDate = upcoming?.date ?? new Date();
  const eventName = upcoming?.name ?? 'שבת';
  const gregorian = new Intl.DateTimeFormat('he-IL', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(eventDate);

  const lines: string[] = [];
  lines.push(`🕯️ שולחן ערוך — ${group.name}`);
  lines.push('');
  lines.push(`📅 ${eventName}`);
  lines.push(`${gregorian} · ${upcoming?.hebrewDate ?? ''}`);
  lines.push('');

  // Group assignments by slot, in the canonical slot order
  const bySlot = new Map<string, Assignment[]>();
  for (const slot of slots) bySlot.set(slot.key, []);
  for (const a of assignments) {
    if (!bySlot.has(a.slot)) bySlot.set(a.slot, []);
    bySlot.get(a.slot)!.push(a);
  }

  let totalDishes = 0;
  for (const slot of slots) {
    const items = bySlot.get(slot.key) ?? [];
    if (items.length === 0) continue;
    lines.push(`${slot.emoji} ${slot.label}`);
    for (const a of items) {
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
      const assigneeText = assignee?.name ?? 'טרם שובץ';
      const mark = a.done ? '✓' : '○';
      lines.push(`   ${mark} ${foodName} — ${assigneeText}`);
      totalDishes += 1;
    }
    lines.push('');
  }

  // Edge case: an assignment with an unknown slot — fall back gracefully
  for (const [slotKey, items] of bySlot) {
    if (slots.find((s) => s.key === slotKey)) continue;
    if (items.length === 0) continue;
    const fallback = getSlotInfo(group, slotKey);
    lines.push(`📋 ${fallback?.label ?? '(סעודה נמחקה)'}`);
    for (const a of items) {
      const food = a.foodId ? foodsById.get(a.foodId) : undefined;
      const foodName = food?.name ?? '(מאכל נמחק)';
      const assignee = a.assignedTo ? assigneeById.get(a.assignedTo) : null;
      const mark = a.done ? '✓' : '○';
      lines.push(`   ${mark} ${foodName} — ${assignee?.name ?? 'טרם שובץ'}`);
      totalDishes += 1;
    }
    lines.push('');
  }

  if (totalDishes === 0) {
    lines.push('עדיין אין מאכלים מתוכננים.');
    lines.push('');
  }

  lines.push('— נשלח מ"שולחן ערוך" 🕯️');
  return lines.join('\n');
}
