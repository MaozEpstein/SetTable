import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { AddFoodToSlotModal } from './AddFoodToSlotModal';
import { AddMealSlotModal } from './AddMealSlotModal';
import { AssigneePickerModal } from './AssigneePickerModal';
import { MealSlotTabs, type MealSubTab } from './MealSlotTabs';
import { useAssignments } from '../hooks/useAssignments';
import { useFoods } from '../hooks/useFoods';
import { deleteAssignment, setDone } from '../services/assignments';
import { removeCustomSlot } from '../services/groups';
import { colors, fontFamily, fontSize, radius, spacing } from '../theme';
import {
  getAllSlots,
  getCategoryInfo,
  getFoodCategories,
  type Assignment,
  type Food,
  type Group,
  type Member,
  type SlotInfo,
} from '../types';

type Props = {
  group: Group;
};

export function MealsTab({ group }: Props) {
  const groupId = group.id;
  const { assignments, loading: loadingAssignments } = useAssignments(groupId);
  const { foods } = useFoods(groupId);

  const [activeSubTab, setActiveSubTab] = useState<MealSubTab>('all');
  const [addingToSlot, setAddingToSlot] = useState<SlotInfo | null>(null);
  const [editingAssignment, setEditingAssignment] = useState<{
    id: string;
    foodName: string;
    slotLabel: string;
    assignedTo: string | null;
  } | null>(null);
  const [addSlotModalVisible, setAddSlotModalVisible] = useState(false);

  const slots = useMemo(() => getAllSlots(group), [group]);
  const slotByKey = useMemo(() => {
    const map = new Map<string, SlotInfo>();
    for (const s of slots) map.set(s.key, s);
    return map;
  }, [slots]);

  const foodsById = useMemo(() => {
    const map = new Map<string, Food>();
    for (const food of foods) map.set(food.id, food);
    return map;
  }, [foods]);

  const bySlot = useMemo(() => {
    const map = new Map<string, Assignment[]>();
    for (const slot of slots) map.set(slot.key, []);
    for (const a of assignments) {
      if (!map.has(a.slot)) map.set(a.slot, []);
      map.get(a.slot)!.push(a);
    }
    return map;
  }, [assignments, slots]);

  const countsBySlot = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const slot of slots) {
      counts[slot.key] = bySlot.get(slot.key)?.length ?? 0;
    }
    return counts;
  }, [bySlot, slots]);

  const members = Object.values(group.members ?? {});
  const memberByUid = useMemo(() => {
    const map = new Map<string, Member>();
    for (const m of members) map.set(m.uid, m);
    return map;
  }, [members]);

  const handleToggleDone = (assignment: Assignment) => {
    setDone(groupId, assignment.id, !assignment.done).catch(() => {
      Alert.alert('אופס', 'לא הצלחנו לעדכן. נסה שוב.');
    });
  };

  const handleDelete = (assignment: Assignment, foodName: string) => {
    Alert.alert(
      'הסר שיבוץ',
      `להסיר את "${foodName}" מהסעודה?`,
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'הסר',
          style: 'destructive',
          onPress: () => deleteAssignment(groupId, assignment.id).catch(() => {
            Alert.alert('אופס', 'לא הצלחנו להסיר. נסה שוב.');
          }),
        },
      ],
    );
  };

  const handleLongPressSlot = (slot: SlotInfo) => {
    if (!slot.isCustom) return;
    Alert.alert(
      `מחיקת ארוחה`,
      `למחוק את "${slot.label}"?\nכל השיבוצים בסעודה הזו יימחקו גם.`,
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'מחק',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeCustomSlot(groupId, slot.key);
              if (activeSubTab === slot.key) setActiveSubTab('all');
            } catch {
              Alert.alert('אופס', 'לא הצלחנו למחוק. נסה שוב.');
            }
          },
        },
      ],
    );
  };

  const buildEditingState = (a: Assignment, foodName: string) => {
    const slotInfo = slotByKey.get(a.slot);
    return {
      id: a.id,
      foodName,
      slotLabel: slotInfo?.label ?? '(סעודה נמחקה)',
      assignedTo: a.assignedTo,
    };
  };

  return (
    <View style={styles.container}>
      <MealSlotTabs
        slots={slots}
        active={activeSubTab}
        onChange={setActiveSubTab}
        countsBySlot={countsBySlot}
        totalCount={assignments.length}
        onAddSlot={() => setAddSlotModalVisible(true)}
        onLongPressSlot={handleLongPressSlot}
      />

      {activeSubTab === 'all' ? (
        <AllAssignmentsView
          assignments={assignments}
          loading={loadingAssignments}
          foodsById={foodsById}
          slotByKey={slotByKey}
          memberByUid={memberByUid}
          onToggleDone={handleToggleDone}
          onChangeAssignee={(a, foodName) =>
            setEditingAssignment(buildEditingState(a, foodName))
          }
          onLongPress={handleDelete}
        />
      ) : (
        <SingleSlotView
          slot={slotByKey.get(activeSubTab) ?? null}
          assignments={bySlot.get(activeSubTab) ?? []}
          foodsById={foodsById}
          memberByUid={memberByUid}
          onAdd={() => {
            const slot = slotByKey.get(activeSubTab);
            if (slot) setAddingToSlot(slot);
          }}
          onToggleDone={handleToggleDone}
          onChangeAssignee={(a, foodName) =>
            setEditingAssignment(buildEditingState(a, foodName))
          }
          onLongPress={handleDelete}
        />
      )}

      {addingToSlot && (
        <AddFoodToSlotModal
          visible={addingToSlot !== null}
          groupId={groupId}
          slot={addingToSlot.key}
          slotLabel={addingToSlot.label}
          slotEmoji={addingToSlot.emoji}
          existingAssignments={bySlot.get(addingToSlot.key) ?? []}
          onClose={() => setAddingToSlot(null)}
        />
      )}

      {editingAssignment && (
        <AssigneePickerModal
          visible={editingAssignment !== null}
          groupId={groupId}
          groupName={group.name}
          assignmentId={editingAssignment.id}
          foodName={editingAssignment.foodName}
          slotLabel={editingAssignment.slotLabel}
          members={members}
          currentAssigneeUid={editingAssignment.assignedTo}
          onClose={() => setEditingAssignment(null)}
        />
      )}

      <AddMealSlotModal
        visible={addSlotModalVisible}
        groupId={groupId}
        onClose={() => setAddSlotModalVisible(false)}
      />
    </View>
  );
}

type AllViewProps = {
  assignments: Assignment[];
  loading: boolean;
  foodsById: Map<string, Food>;
  slotByKey: Map<string, SlotInfo>;
  memberByUid: Map<string, Member>;
  onToggleDone: (a: Assignment) => void;
  onChangeAssignee: (a: Assignment, foodName: string) => void;
  onLongPress: (a: Assignment, foodName: string) => void;
};

function AllAssignmentsView({
  assignments,
  loading,
  foodsById,
  slotByKey,
  memberByUid,
  onToggleDone,
  onChangeAssignee,
  onLongPress,
}: AllViewProps) {
  if (loading) {
    return <Text style={styles.loadingText}>טוען שיבוצים...</Text>;
  }

  if (assignments.length === 0) {
    return (
      <View style={styles.emptyCard}>
        <Text style={styles.emptyEmoji}>🍽️</Text>
        <Text style={styles.emptyTitle}>אין עדיין מאכלים ששובצו</Text>
        <Text style={styles.emptyTextCard}>
          בחרו ארוחה ספציפית מהטאבים למעלה והוסיפו לה מאכלים
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.flatList}>
      {assignments.map((a) => {
        const food = foodsById.get(a.foodId);
        const foodName = food?.name ?? '(מאכל נמחק)';
        const slotInfo = slotByKey.get(a.slot);
        const categoryLabels = food
          ? getFoodCategories(food)
              .map((c) => getCategoryInfo(c))
              .filter((info): info is NonNullable<typeof info> => info !== null)
              .map((info) => `${info.emoji} ${info.label}`)
          : [];
        const assignee = a.assignedTo ? memberByUid.get(a.assignedTo) : null;
        return (
          <FlatAssignmentRow
            key={a.id}
            assignment={a}
            foodName={foodName}
            categoryLabels={categoryLabels}
            slotLabel={
              slotInfo ? `${slotInfo.emoji} ${slotInfo.shortLabel}` : '(סעודה נמחקה)'
            }
            assigneeName={assignee?.name ?? null}
            onToggleDone={() => onToggleDone(a)}
            onChangeAssignee={() => onChangeAssignee(a, foodName)}
            onLongPress={() => onLongPress(a, foodName)}
          />
        );
      })}
    </View>
  );
}

type SingleViewProps = {
  slot: SlotInfo | null;
  assignments: Assignment[];
  foodsById: Map<string, Food>;
  memberByUid: Map<string, Member>;
  onAdd: () => void;
  onToggleDone: (a: Assignment) => void;
  onChangeAssignee: (a: Assignment, foodName: string) => void;
  onLongPress: (a: Assignment, foodName: string) => void;
};

function SingleSlotView({
  slot,
  assignments,
  foodsById,
  memberByUid,
  onAdd,
  onToggleDone,
  onChangeAssignee,
  onLongPress,
}: SingleViewProps) {
  if (!slot) {
    return <Text style={styles.loadingText}>סעודה לא נמצאה</Text>;
  }
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {slot.emoji} {slot.label}
          {assignments.length > 0 && (
            <Text style={styles.count}> · {assignments.length}</Text>
          )}
        </Text>
      </View>

      {assignments.length === 0 ? (
        <Text style={styles.emptyText}>אין עדיין מאכלים ששובצו</Text>
      ) : (
        assignments.map((a) => {
          const food = foodsById.get(a.foodId);
          const assignee = a.assignedTo ? memberByUid.get(a.assignedTo) : null;
          const foodName = food?.name ?? '(מאכל נמחק)';
          return (
            <AssignmentRow
              key={a.id}
              assignment={a}
              foodName={foodName}
              assigneeName={assignee?.name ?? null}
              onToggleDone={() => onToggleDone(a)}
              onChangeAssignee={() => onChangeAssignee(a, foodName)}
              onLongPress={() => onLongPress(a, foodName)}
            />
          );
        })
      )}

      <Pressable
        onPress={onAdd}
        style={({ pressed }) => [styles.addRow, { opacity: pressed ? 0.6 : 1 }]}
      >
        <Text style={styles.addIcon}>+</Text>
        <Text style={styles.addText}>הוסף מאכל</Text>
      </Pressable>
    </View>
  );
}

type AssignmentRowProps = {
  assignment: Assignment;
  foodName: string;
  assigneeName: string | null;
  onToggleDone: () => void;
  onChangeAssignee: () => void;
  onLongPress: () => void;
};

function AssignmentRow({
  assignment,
  foodName,
  assigneeName,
  onToggleDone,
  onChangeAssignee,
  onLongPress,
}: AssignmentRowProps) {
  return (
    <View style={[styles.row, assignment.done && styles.rowDone]}>
      <Pressable
        onPress={onToggleDone}
        hitSlop={8}
        style={({ pressed }) => [styles.checkbox, { opacity: pressed ? 0.5 : 1 }]}
      >
        <View style={[styles.checkboxBox, assignment.done && styles.checkboxBoxChecked]}>
          {assignment.done && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </Pressable>

      <Pressable
        onPress={onChangeAssignee}
        onLongPress={onLongPress}
        style={({ pressed }) => [styles.rowMain, { opacity: pressed ? 0.6 : 1 }]}
      >
        <Text style={[styles.foodName, assignment.done && styles.foodNameDone]}>
          {foodName}
        </Text>
        <View style={styles.assigneeWrap}>
          <Text
            style={[styles.assigneeText, !assigneeName && styles.assigneeTextEmpty]}
          >
            {assigneeName ? `להכנה: ${assigneeName}` : 'טרם שובץ'}
          </Text>
          <Text style={styles.chevron}>›</Text>
        </View>
      </Pressable>
    </View>
  );
}

type FlatRowProps = {
  assignment: Assignment;
  foodName: string;
  categoryLabels: string[];
  slotLabel: string;
  assigneeName: string | null;
  onToggleDone: () => void;
  onChangeAssignee: () => void;
  onLongPress: () => void;
};

function FlatAssignmentRow({
  assignment,
  foodName,
  categoryLabels,
  slotLabel,
  assigneeName,
  onToggleDone,
  onChangeAssignee,
  onLongPress,
}: FlatRowProps) {
  return (
    <View style={[styles.row, assignment.done && styles.rowDone]}>
      <Pressable
        onPress={onToggleDone}
        hitSlop={8}
        style={({ pressed }) => [styles.checkbox, { opacity: pressed ? 0.5 : 1 }]}
      >
        <View style={[styles.checkboxBox, assignment.done && styles.checkboxBoxChecked]}>
          {assignment.done && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </Pressable>

      <Pressable
        onPress={onChangeAssignee}
        onLongPress={onLongPress}
        style={({ pressed }) => [styles.rowMain, { opacity: pressed ? 0.6 : 1 }]}
      >
        <Text style={[styles.foodName, assignment.done && styles.foodNameDone]}>
          {foodName}
        </Text>
        <View style={styles.tagsRow}>
          {categoryLabels.map((label) => (
            <View key={label} style={[styles.tag, styles.tagCategory]}>
              <Text style={styles.tagCategoryText}>{label}</Text>
            </View>
          ))}
          <View style={[styles.tag, styles.tagSlot]}>
            <Text style={styles.tagSlotText}>{slotLabel}</Text>
          </View>
        </View>
        <View style={styles.assigneeWrap}>
          <Text
            style={[styles.assigneeText, !assigneeName && styles.assigneeTextEmpty]}
          >
            {assigneeName ? `להכנה: ${assigneeName}` : 'טרם שובץ'}
          </Text>
          <Text style={styles.chevron}>›</Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  flatList: {
    gap: spacing.sm,
  },
  section: {
    gap: spacing.xs,
  },
  sectionHeader: {
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.bold,
    color: colors.text,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  count: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
  },
  emptyText: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
    textAlign: 'right',
    writingDirection: 'rtl',
    paddingVertical: spacing.sm,
  },
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
  emptyTextCard: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
    textAlign: 'center',
    writingDirection: 'rtl',
    lineHeight: 20,
  },
  loadingText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    fontFamily: fontFamily.regular,
    paddingVertical: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  rowDone: {
    backgroundColor: '#F1F5EC',
    borderColor: colors.success,
  },
  checkbox: {
    padding: spacing.xs,
    paddingTop: spacing.sm,
  },
  checkboxBox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  checkboxBoxChecked: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: fontSize.md,
    fontFamily: fontFamily.bold,
    lineHeight: fontSize.md + 2,
  },
  rowMain: {
    flex: 1,
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  foodName: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.bold,
    color: colors.text,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  foodNameDone: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  tagCategory: {
    backgroundColor: '#FBEFD9',
    borderColor: '#E8C97A',
  },
  tagCategoryText: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.medium,
    color: colors.primaryDark,
    writingDirection: 'rtl',
  },
  tagSlot: {
    backgroundColor: '#E5EEF1',
    borderColor: '#A8C5CD',
  },
  tagSlotText: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.medium,
    color: colors.secondary,
    writingDirection: 'rtl',
  },
  assigneeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: spacing.xs,
  },
  assigneeText: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: colors.secondary,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  assigneeTextEmpty: {
    color: colors.warning,
    fontFamily: fontFamily.medium,
  },
  chevron: {
    fontSize: fontSize.lg,
    color: colors.textMuted,
    fontFamily: fontFamily.regular,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  addIcon: {
    fontSize: fontSize.xl,
    color: colors.primary,
    fontFamily: fontFamily.bold,
  },
  addText: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.medium,
    color: colors.primary,
    writingDirection: 'rtl',
  },
});
