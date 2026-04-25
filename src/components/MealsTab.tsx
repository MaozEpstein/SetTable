import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { AddFoodToSlotModal } from './AddFoodToSlotModal';
import { AddMealSlotModal } from './AddMealSlotModal';
import { AssigneePickerModal } from './AssigneePickerModal';
import { MealSlotTabs, type MealSubTab } from './MealSlotTabs';
import { SlotPickerModal } from './SlotPickerModal';
import { useUser } from '../context/UserContext';
import { useAssignments } from '../hooks/useAssignments';
import { useFoods } from '../hooks/useFoods';
import { deleteAssignment, setDone } from '../services/assignments';
import { removeCustomSlot } from '../services/groups';
import { colors, fontFamily, fontSize, radius, spacing } from '../theme';
import {
  getAllAssignees,
  getAllCategories,
  getAllSlots,
  getCategoryInfo,
  getFoodCategories,
  type Assignment,
  type AssigneeInfo,
  type Food,
  type Group,
  type SlotInfo,
} from '../types';

type Props = {
  group: Group;
};

export function MealsTab({ group }: Props) {
  const groupId = group.id;
  const { uid } = useUser();
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
  const [slotPickerVisible, setSlotPickerVisible] = useState(false);

  const slots = useMemo(() => getAllSlots(group), [group]);
  const slotByKey = useMemo(() => {
    const map = new Map<string, SlotInfo>();
    for (const s of slots) map.set(s.key, s);
    return map;
  }, [slots]);

  const categories = useMemo(() => getAllCategories(group), [group]);

  const assignees = useMemo(() => getAllAssignees(group, uid), [group, uid]);
  const assigneeById = useMemo(() => {
    const map = new Map<string, AssigneeInfo>();
    for (const a of assignees) map.set(a.id, a);
    return map;
  }, [assignees]);

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

  const handleToggleDone = (assignment: Assignment) => {
    setDone(groupId, assignment.id, !assignment.done).catch(() => {
      Alert.alert('אופס', 'לא הצלחנו לעדכן. נסה שוב.');
    });
  };

  const handleDelete = (assignment: Assignment, foodName: string) => {
    Alert.alert('הסר שיבוץ', `להסיר את "${foodName}" מהסעודה?`, [
      { text: 'ביטול', style: 'cancel' },
      {
        text: 'הסר',
        style: 'destructive',
        onPress: () => deleteAssignment(groupId, assignment.id).catch(() => {
          Alert.alert('אופס', 'לא הצלחנו להסיר. נסה שוב.');
        }),
      },
    ]);
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
          group={group}
          assignments={assignments}
          loading={loadingAssignments}
          foodsById={foodsById}
          slotByKey={slotByKey}
          assigneeById={assigneeById}
          onAdd={() => setSlotPickerVisible(true)}
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
          assigneeById={assigneeById}
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
          categories={categories}
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
          assignees={assignees}
          currentAssigneeId={editingAssignment.assignedTo}
          onClose={() => setEditingAssignment(null)}
        />
      )}

      <AddMealSlotModal
        visible={addSlotModalVisible}
        groupId={groupId}
        onClose={() => setAddSlotModalVisible(false)}
      />

      <SlotPickerModal
        visible={slotPickerVisible}
        slots={slots}
        onPick={(slot) => {
          setSlotPickerVisible(false);
          setAddingToSlot(slot);
        }}
        onClose={() => setSlotPickerVisible(false)}
      />
    </View>
  );
}

type AllViewProps = {
  group: Group;
  assignments: Assignment[];
  loading: boolean;
  foodsById: Map<string, Food>;
  slotByKey: Map<string, SlotInfo>;
  assigneeById: Map<string, AssigneeInfo>;
  onAdd: () => void;
  onToggleDone: (a: Assignment) => void;
  onChangeAssignee: (a: Assignment, foodName: string) => void;
  onLongPress: (a: Assignment, foodName: string) => void;
};

function AllAssignmentsView({
  group,
  assignments,
  loading,
  foodsById,
  slotByKey,
  assigneeById,
  onAdd,
  onToggleDone,
  onChangeAssignee,
  onLongPress,
}: AllViewProps) {
  if (loading) {
    return <Text style={styles.loadingText}>טוען שיבוצים...</Text>;
  }

  return (
    <View style={styles.flatList}>
      {assignments.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyEmoji}>🍽️</Text>
          <Text style={styles.emptyTitle}>אין עדיין מאכלים ששובצו</Text>
          <Text style={styles.emptyTextCard}>
            הוסיפו את המאכל הראשון לכל אחת מהארוחות
          </Text>
        </View>
      ) : (
        assignments.map((a) => {
          const food = foodsById.get(a.foodId);
          const foodName = food?.name ?? '(מאכל נמחק)';
          const slotInfo = slotByKey.get(a.slot);
          const categoryLabels = food
            ? getFoodCategories(food)
                .map((c) => getCategoryInfo(group, c))
                .filter((info): info is NonNullable<typeof info> => info !== null)
                .map((info) => `${info.emoji} ${info.label}`)
            : [];
          const assignee = a.assignedTo ? assigneeById.get(a.assignedTo) : null;
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

type SingleViewProps = {
  slot: SlotInfo | null;
  assignments: Assignment[];
  foodsById: Map<string, Food>;
  assigneeById: Map<string, AssigneeInfo>;
  onAdd: () => void;
  onToggleDone: (a: Assignment) => void;
  onChangeAssignee: (a: Assignment, foodName: string) => void;
  onLongPress: (a: Assignment, foodName: string) => void;
};

function SingleSlotView({
  slot,
  assignments,
  foodsById,
  assigneeById,
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
          const assignee = a.assignedTo ? assigneeById.get(a.assignedTo) : null;
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
  const isAssignedNotDone = !!assignment.assignedTo && !assignment.done;
  return (
    <View
      style={[
        styles.row,
        isAssignedNotDone && styles.rowAssigned,
        assignment.done && styles.rowDone,
      ]}
    >
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
  const isAssignedNotDone = !!assignment.assignedTo && !assignment.done;
  return (
    <View
      style={[
        styles.row,
        isAssignedNotDone && styles.rowAssigned,
        assignment.done && styles.rowDone,
      ]}
    >
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
  container: { gap: spacing.md },
  flatList: { gap: spacing.sm },
  section: { gap: spacing.xs },
  sectionHeader: { marginBottom: spacing.xs },
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
  rowAssigned: {
    backgroundColor: '#FBEDE3',
    borderColor: colors.warning,
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
