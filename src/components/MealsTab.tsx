import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { AddFoodToSlotModal } from './AddFoodToSlotModal';
import { AssigneePickerModal } from './AssigneePickerModal';
import { useAssignments } from '../hooks/useAssignments';
import { useFoods } from '../hooks/useFoods';
import { deleteAssignment, setDone } from '../services/assignments';
import { colors, fontFamily, fontSize, radius, spacing } from '../theme';
import { MEAL_SLOTS, type Assignment, type Food, type Group, type MealSlot, type Member } from '../types';

type Props = {
  group: Group;
};

export function MealsTab({ group }: Props) {
  const groupId = group.id;
  const { assignments, loading: loadingAssignments } = useAssignments(groupId);
  const { foods } = useFoods(groupId);

  const [addingToSlot, setAddingToSlot] = useState<MealSlot | null>(null);
  const [editingAssignment, setEditingAssignment] = useState<{
    id: string;
    foodName: string;
    assignedTo: string | null;
  } | null>(null);

  const foodsById = useMemo(() => {
    const map = new Map<string, Food>();
    for (const food of foods) map.set(food.id, food);
    return map;
  }, [foods]);

  const bySlot = useMemo(() => {
    const map = new Map<MealSlot, Assignment[]>();
    for (const slot of MEAL_SLOTS) map.set(slot.key, []);
    for (const a of assignments) {
      map.get(a.slot)?.push(a);
    }
    return map;
  }, [assignments]);

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

  const editingMembers = members;

  return (
    <View style={styles.container}>
      {MEAL_SLOTS.map((slot) => {
        const items = bySlot.get(slot.key) ?? [];
        return (
          <View key={slot.key} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {slot.emoji} {slot.label}
                {items.length > 0 && (
                  <Text style={styles.count}> · {items.length}</Text>
                )}
              </Text>
            </View>

            {items.length === 0 ? (
              <Text style={styles.emptyText}>אין עדיין מאכלים ששובצו</Text>
            ) : (
              items.map((a) => {
                const food = foodsById.get(a.foodId);
                const assignee = a.assignedTo ? memberByUid.get(a.assignedTo) : null;
                const foodName = food?.name ?? '(מאכל נמחק)';
                return (
                  <AssignmentRow
                    key={a.id}
                    assignment={a}
                    foodName={foodName}
                    assigneeName={assignee?.name ?? null}
                    onToggleDone={() => handleToggleDone(a)}
                    onChangeAssignee={() =>
                      setEditingAssignment({
                        id: a.id,
                        foodName,
                        assignedTo: a.assignedTo,
                      })
                    }
                    onLongPress={() => handleDelete(a, foodName)}
                  />
                );
              })
            )}

            <Pressable
              onPress={() => setAddingToSlot(slot.key)}
              style={({ pressed }) => [
                styles.addRow,
                { opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <Text style={styles.addIcon}>+</Text>
              <Text style={styles.addText}>הוסף מאכל</Text>
            </Pressable>
          </View>
        );
      })}

      {loadingAssignments && (
        <Text style={styles.loadingText}>טוען שיבוצים...</Text>
      )}

      {addingToSlot && (
        <AddFoodToSlotModal
          visible={addingToSlot !== null}
          groupId={groupId}
          slot={addingToSlot}
          existingAssignments={bySlot.get(addingToSlot) ?? []}
          onClose={() => setAddingToSlot(null)}
        />
      )}

      {editingAssignment && (
        <AssigneePickerModal
          visible={editingAssignment !== null}
          groupId={groupId}
          assignmentId={editingAssignment.id}
          foodName={editingAssignment.foodName}
          members={editingMembers}
          currentAssigneeUid={editingAssignment.assignedTo}
          onClose={() => setEditingAssignment(null)}
        />
      )}
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
        <View
          style={[
            styles.checkboxBox,
            assignment.done && styles.checkboxBoxChecked,
          ]}
        >
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
            style={[
              styles.assigneeText,
              !assigneeName && styles.assigneeTextEmpty,
            ]}
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
    gap: spacing.lg,
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
  loadingText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    fontFamily: fontFamily.regular,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
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
    gap: 2,
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
