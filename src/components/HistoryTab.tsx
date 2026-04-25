import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from './PrimaryButton';
import { useUser } from '../context/UserContext';
import { useAssignments } from '../hooks/useAssignments';
import { useFoods } from '../hooks/useFoods';
import { useHistory } from '../hooks/useHistory';
import { deleteHistoryEntry, restoreFromHistory } from '../services/history';
import { colors, fontFamily, fontSize, radius, spacing } from '../theme';
import {
  eventLabel,
  eventTypeOf,
  type ArchivedAssignment,
  type Group,
  type ShabbatHistoryEntry,
} from '../types';

type Props = {
  group: Group;
};

export function HistoryTab({ group }: Props) {
  const { uid } = useUser();
  const { entries, loading, error } = useHistory(group.id);
  const { foods } = useFoods(group.id);
  const { assignments } = useAssignments(group.id);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const handleRestore = (entry: ShabbatHistoryEntry) => {
    const dishCount = entry.assignments.filter((a) => !a.isPlaceholder).length;
    if (dishCount === 0) {
      Alert.alert(
        'אין מאכלים לשחזור',
        'בארכיון הזה כל השיבוצים היו "שריון לפי קטגוריה" שלא ניתנים לשחזור אוטומטי.',
      );
      return;
    }
    Alert.alert(
      'שחזור הארוחה',
      `${dishCount} מאכלים מהארכיון הזה יוסיפו לארוחות הנוכחיות (לפי הסעודה המקורית).\n\nשיבוצי האנשים וסימוני "הוכן" לא יועתקו — תוכל לשבץ מחדש.`,
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'שחזר',
          onPress: async () => {
            setRestoringId(entry.id);
            try {
              const result = await restoreFromHistory({
                groupId: group.id,
                uid,
                archivedAssignments: entry.assignments,
                availableFoods: foods,
                existingAssignments: assignments,
              });
              const parts: string[] = [`נוספו ${result.restored} מאכלים`];
              if (result.skippedDuplicates > 0) {
                parts.push(`${result.skippedDuplicates} כבר היו בארוחות`);
              }
              if (result.skippedMissingFood > 0) {
                parts.push(
                  `${result.skippedMissingFood} מאכלים לא קיימים יותר בקטלוג`,
                );
              }
              if (result.skippedPlaceholders > 0) {
                parts.push(`${result.skippedPlaceholders} שיריונים דולגו`);
              }
              Alert.alert('שוחזר ✓', parts.join('\n'));
            } catch {
              Alert.alert('אופס', 'לא הצלחנו לשחזר. נסה שוב.');
            } finally {
              setRestoringId(null);
            }
          },
        },
      ],
    );
  };

  const handleDelete = (entry: ShabbatHistoryEntry) => {
    Alert.alert(
      'מחיקת ארכיון',
      `למחוק את הארכיון מ-${formatTitle(entry)}?\nפעולה זו לא ניתנת לביטול.`,
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'מחק',
          style: 'destructive',
          onPress: () => deleteHistoryEntry(group.id, entry.id).catch(() => {
            Alert.alert('אופס', 'לא הצלחנו למחוק.');
          }),
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>טוען היסטוריה...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.empty}>
        <Text style={styles.errorText}>שגיאה: {error.message}</Text>
      </View>
    );
  }

  if (entries.length === 0) {
    return (
      <View style={styles.emptyCard}>
        <Text style={styles.emptyEmoji}>📜</Text>
        <Text style={styles.emptyTitle}>אין עדיין היסטוריה</Text>
        <Text style={styles.emptyText}>
          בסיום שבת לחץ על "שבת הסתיימה" בלשונית הארוחות —{'\n'}
          השיבוצים יישמרו כאן לצפייה.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {entries.map((entry) => (
        <HistoryCard
          key={entry.id}
          entry={entry}
          expanded={expandedId === entry.id}
          restoring={restoringId === entry.id}
          onToggle={() =>
            setExpandedId((curr) => (curr === entry.id ? null : entry.id))
          }
          onRestore={() => handleRestore(entry)}
          onLongPress={() => handleDelete(entry)}
        />
      ))}
    </View>
  );
}

type CardProps = {
  entry: ShabbatHistoryEntry;
  expanded: boolean;
  restoring: boolean;
  onToggle: () => void;
  onRestore: () => void;
  onLongPress: () => void;
};

function HistoryCard({
  entry,
  expanded,
  restoring,
  onToggle,
  onRestore,
  onLongPress,
}: CardProps) {
  const grouped = useMemo(() => groupBySlot(entry.assignments), [entry.assignments]);
  const slotKeys = Array.from(grouped.keys());

  return (
    <View style={styles.card}>
      <Pressable
        onPress={onToggle}
        onLongPress={onLongPress}
        style={({ pressed }) => [
          styles.cardHeader,
          { opacity: pressed ? 0.7 : 1 },
        ]}
      >
        <View style={styles.cardHeaderMain}>
          <Text style={styles.cardTitle}>{formatTitle(entry)}</Text>
          <Text style={styles.cardSubtitle}>
            {entry.assignmentCount}{' '}
            {entry.assignmentCount === 1 ? 'מאכל' : 'מאכלים'}
            {' · '}
            ארכיון: {entry.archivedByName}
          </Text>
        </View>
        <Text style={styles.chevron}>{expanded ? '▾' : '◂'}</Text>
      </Pressable>

      {expanded && (
        <View style={styles.cardBody}>
          {slotKeys.length === 0 ? (
            <Text style={styles.emptySection}>הארכיון ריק</Text>
          ) : (
            slotKeys.map((slotKey) => {
              const items = grouped.get(slotKey) ?? [];
              const first = items[0];
              return (
                <View key={slotKey} style={styles.slotSection}>
                  <Text style={styles.slotTitle}>
                    {first.slotEmoji} {first.slotLabel}
                  </Text>
                  {items.map((item, i) => (
                    <View key={i} style={styles.itemRow}>
                      <Text
                        style={[
                          styles.itemMark,
                          item.done && styles.itemMarkDone,
                        ]}
                      >
                        {item.done ? '✓' : '○'}
                      </Text>
                      <View style={styles.itemMain}>
                        <Text
                          style={[
                            styles.itemName,
                            item.done && styles.itemNameDone,
                          ]}
                        >
                          {item.foodName}
                          {item.isPlaceholder && (
                            <Text style={styles.placeholderHint}> · טרם נבחר</Text>
                          )}
                        </Text>
                        <Text style={styles.itemAssignee}>
                          {item.assigneeName
                            ? `הוכן ע"י: ${item.assigneeName}`
                            : 'לא שובץ'}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              );
            })
          )}
          <View style={styles.restoreSection}>
            <PrimaryButton
              label="🔄 שחזר את הארוחה לארוחות הנוכחיות"
              variant="outline"
              onPress={onRestore}
              loading={restoring}
            />
            <Text style={styles.restoreHint}>
              המאכלים יועתקו ללא שיבוץ אדם וללא סימוני "הוכן"
            </Text>
          </View>
          <Text style={styles.deleteHint}>
            לחיצה ארוכה על הכרטיסייה למחיקת הארכיון
          </Text>
        </View>
      )}
    </View>
  );
}

function groupBySlot(items: ArchivedAssignment[]): Map<string, ArchivedAssignment[]> {
  const map = new Map<string, ArchivedAssignment[]>();
  for (const item of items) {
    const key = item.slot;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  return map;
}

function formatTitle(entry: Pick<ShabbatHistoryEntry, 'eventType' | 'archivedAt'>): string {
  const d = new Date(entry.archivedAt);
  const formatter = new Intl.DateTimeFormat('he-IL', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  return `${eventLabel(eventTypeOf(entry))} ${formatter.format(d)}`;
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  empty: { padding: spacing.xl, alignItems: 'center' },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    gap: spacing.sm,
  },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontFamily: fontFamily.bold,
    color: colors.text,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  emptyText: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
    textAlign: 'center',
    writingDirection: 'rtl',
    lineHeight: 22,
  },
  errorText: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.medium,
    color: colors.warning,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardHeaderMain: { flex: 1, gap: 2 },
  cardTitle: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.bold,
    color: colors.text,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  cardSubtitle: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  chevron: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    fontFamily: fontFamily.bold,
  },
  cardBody: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  slotSection: {
    gap: spacing.xs,
    paddingTop: spacing.sm,
  },
  slotTitle: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.bold,
    color: colors.text,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  itemRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    alignItems: 'flex-start',
  },
  itemMark: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.bold,
    color: colors.textMuted,
    width: 18,
    textAlign: 'center',
  },
  itemMarkDone: {
    color: colors.success,
  },
  itemMain: { flex: 1, gap: 2 },
  itemName: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.medium,
    color: colors.text,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  itemNameDone: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
  },
  itemAssignee: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.regular,
    color: colors.secondary,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  placeholderHint: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.regular,
    color: colors.warning,
    fontStyle: 'italic',
  },
  emptySection: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
    textAlign: 'right',
    writingDirection: 'rtl',
    paddingTop: spacing.sm,
  },
  deleteHint: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
    textAlign: 'center',
    writingDirection: 'rtl',
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
  restoreSection: {
    gap: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  restoreHint: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
});
