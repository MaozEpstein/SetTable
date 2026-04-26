import { useMemo, useState } from 'react';
import { Alert, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { AddFoodToSlotModal } from './AddFoodToSlotModal';
import { AddMealSlotModal } from './AddMealSlotModal';
import { AssigneePickerModal } from './AssigneePickerModal';
import { MealSlotTabs, type MealSubTab } from './MealSlotTabs';
import { ReplacePlaceholderModal } from './ReplacePlaceholderModal';
import { SlotPickerModal } from './SlotPickerModal';
import { useUser } from '../context/UserContext';
import { useAssignments } from '../hooks/useAssignments';
import { useFoods } from '../hooks/useFoods';
import { deleteAssignment, setDone } from '../services/assignments';
import { removeCustomSlot } from '../services/groups';
import { archiveAndClearAssignments } from '../services/history';
import { getHebrewContext } from '../utils/hebrewCalendar';
import { buildShareText } from '../utils/shareShabbatPlan';
import { buildMenuSnapshot, encodeSnapshot } from '../utils/buildMenuSnapshot';
import { PrimaryButton } from './PrimaryButton';
import { colors, fontFamily, fontSize, radius, spacing } from '../theme';
import {
  detectEventType,
  eventLabel,
  getAllAssignees,
  getAllCategories,
  getAllSlots,
  getCategoryInfo,
  getFoodCategories,
  isPlaceholderAssignment,
  type ArchivedAssignment,
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
  const { uid, userName } = useUser();
  const [endingShabbat, setEndingShabbat] = useState(false);
  const [sharing, setSharing] = useState(false);
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
  const [replacingPlaceholder, setReplacingPlaceholder] = useState<{
    id: string;
    categoryKey: string | null;
  } | null>(null);

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

  const buildArchivedSnapshot = (): ArchivedAssignment[] => {
    return assignments.map((a) => {
      const isPlaceholder = isPlaceholderAssignment(a);
      const food = a.foodId ? foodsById.get(a.foodId) : undefined;
      const placeholderCat = a.placeholderCategory
        ? getCategoryInfo(group, a.placeholderCategory)
        : null;
      const foodName = isPlaceholder
        ? placeholderCat
          ? `${placeholderCat.emoji} ${placeholderCat.label}`
          : 'קטגוריה לא ידועה'
        : (food?.name ?? '(מאכל נמחק)');
      const slotInfo = slotByKey.get(a.slot);
      const assignee = a.assignedTo ? assigneeById.get(a.assignedTo) : null;
      const categoryLabels = food
        ? getFoodCategories(food)
            .map((c) => getCategoryInfo(group, c))
            .filter((info): info is NonNullable<typeof info> => info !== null)
            .map((info) => `${info.emoji} ${info.label}`)
        : [];
      return {
        foodName,
        isPlaceholder,
        slot: a.slot,
        slotLabel: slotInfo?.label ?? '(סעודה נמחקה)',
        slotEmoji: slotInfo?.emoji ?? '📋',
        assigneeName: assignee?.name ?? null,
        done: !!a.done,
        categoryLabels,
      };
    });
  };

  const handleShare = async () => {
    if (sharing) return;
    if (assignments.length === 0) {
      Alert.alert(
        'אין תכנון לשתף',
        'הוסף מאכלים לארוחות לפני שתשתף את התכנון.',
      );
      return;
    }
    setSharing(true);
    try {
      const text = buildShareText({
        group,
        assignments,
        foodsById,
        slotByKey,
        assigneeById,
        slots,
      });
      await Share.share({
        message: text,
        title: `תכנון שבת — ${group.name}`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'שגיאה לא ידועה';
      Alert.alert('אופס', `לא הצלחנו לשתף.\n${message}`);
    } finally {
      setSharing(false);
    }
  };

  const handleShareLink = async () => {
    if (assignments.length === 0) {
      Alert.alert(
        'אין תכנון לשתף',
        'הוסף מאכלים לארוחות לפני שתשתף את התכנון.',
      );
      return;
    }
    try {
      const snap = buildMenuSnapshot({
        group,
        assignments,
        foodsById,
        slotByKey,
        assigneeById,
        slots,
      });
      const encoded = encodeSnapshot(snap);
      const url = `https://settable-97985.web.app/menu.html#${encoded}`;
      await Clipboard.setStringAsync(url);
      Alert.alert(
        'הקישור הועתק ✓',
        'הדבק ב-WhatsApp / אימייל / SMS. כל מי שיפתח את הקישור יראה את התפריט בעיצוב נקי, ללא צורך באפליקציה.',
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'שגיאה לא ידועה';
      Alert.alert('אופס', `לא הצלחנו ליצור קישור.\n${message}`);
    }
  };

  const handleEndShabbat = () => {
    if (assignments.length === 0) {
      Alert.alert(
        'אין מה לארכב',
        'אין שיבוצים פעילים. הוסף מאכלים לארוחות לפני סיום שבת/חג.',
      );
      return;
    }
    const now = Date.now();
    const detectedType = detectEventType(now);
    const baseLabel = eventLabel(detectedType); // "שבת" / "חג"
    const hebrew = getHebrewContext(new Date(now));
    // If it's a known holiday, prefer that specific name; otherwise use parsha for shabbat
    let detailLabel = baseLabel;
    const detailParts: string[] = [];
    if (hebrew.holiday) {
      detailLabel = hebrew.holiday;
      detailParts.push(`מזוהה כ-${detailLabel}`);
    } else if (detectedType === 'shabbat' && hebrew.parsha) {
      detailParts.push(`מזוהה כ-${baseLabel} (${hebrew.parsha})`);
    } else {
      detailParts.push(`מזוהה כ-${baseLabel} (לפי היום בשבוע)`);
    }
    detailParts.push(`תאריך עברי: ${hebrew.hebrewDate}`);
    Alert.alert(
      `🕯️ סיום ${detailLabel}`,
      `${detailParts.join('\n')}\n\n${assignments.length} השיבוצים הנוכחיים יישמרו בלשונית "היסטוריה" וכל הארוחות יתאפסו.\n\nהמאכלים בקטלוג, החברים, הקטגוריות והסעודות המותאמות יישארו ללא שינוי.`,
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: `כן, סיום ${baseLabel}`,
          style: 'destructive',
          onPress: async () => {
            setEndingShabbat(true);
            try {
              const snapshot = buildArchivedSnapshot();
              await archiveAndClearAssignments({
                groupId,
                archivedBy: uid,
                archivedByName: userName,
                assignments: snapshot,
              });
              Alert.alert(
                'נשמר בהצלחה ✓',
                `נשמרו ${snapshot.length} שיבוצים ב-${detailLabel} בהיסטוריה. ${baseLabel === 'שבת' ? 'שבת חדשה' : 'חג חדש'} — מתחילים מחדש.`,
              );
            } catch (err) {
              const message = err instanceof Error ? err.message : 'שגיאה לא ידועה';
              Alert.alert('אופס', `לא הצלחנו לנקות.\n${message}`);
            } finally {
              setEndingShabbat(false);
            }
          },
        },
      ],
    );
  };

  const handleRowPress = (a: Assignment, foodName: string) => {
    if (isPlaceholderAssignment(a)) {
      setReplacingPlaceholder({
        id: a.id,
        categoryKey: a.placeholderCategory ?? null,
      });
    } else {
      setEditingAssignment(buildEditingState(a, foodName));
    }
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
          onChangeAssignee={handleRowPress}
          onLongPress={handleDelete}
        />
      ) : (
        <SingleSlotView
          group={group}
          slot={slotByKey.get(activeSubTab) ?? null}
          assignments={bySlot.get(activeSubTab) ?? []}
          foodsById={foodsById}
          assigneeById={assigneeById}
          onAdd={() => {
            const slot = slotByKey.get(activeSubTab);
            if (slot) setAddingToSlot(slot);
          }}
          onToggleDone={handleToggleDone}
          onChangeAssignee={handleRowPress}
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

      {replacingPlaceholder && (
        <ReplacePlaceholderModal
          visible={replacingPlaceholder !== null}
          groupId={groupId}
          assignmentId={replacingPlaceholder.id}
          defaultCategoryKey={replacingPlaceholder.categoryKey}
          categories={categories}
          onClose={() => setReplacingPlaceholder(null)}
        />
      )}

      {assignments.length > 0 && (
        <>
          <View style={styles.shareSection}>
            <PrimaryButton
              label="📤 שתף תכנון לוואטסאפ"
              onPress={handleShare}
              loading={sharing}
            />
            <Text style={styles.endShabbatHint}>
              ייפתח חלון שיתוף — בחר WhatsApp או כל אפליקציה אחרת
            </Text>
          </View>
          <View style={styles.shareSection}>
            <PrimaryButton
              label="🔗 העתק קישור לתפריט"
              variant="outline"
              onPress={handleShareLink}
            />
            <Text style={styles.endShabbatHint}>
              קישור לדף-קריאה יפה לאלה שלא משתמשים באפליקציה
            </Text>
          </View>
          <View style={styles.endShabbatSection}>
            <PrimaryButton
              label="🕯️ סיום שבת/חג — נקה ארוחות"
              variant="outline"
              onPress={handleEndShabbat}
              loading={endingShabbat}
            />
            <Text style={styles.endShabbatHint}>
              השיבוצים הנוכחיים יישמרו בלשונית "היסטוריה" לפני הניקוי.
              הארכיון יתויג כשבת/חג לפי היום בשבוע.
            </Text>
          </View>
        </>
      )}
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
          const isPlaceholder = isPlaceholderAssignment(a);
          const food = a.foodId ? foodsById.get(a.foodId) : undefined;
          const placeholderCat = a.placeholderCategory
            ? getCategoryInfo(group, a.placeholderCategory)
            : null;
          const foodName = isPlaceholder
            ? placeholderCat
              ? `${placeholderCat.emoji} ${placeholderCat.label}`
              : 'קטגוריה לא ידועה'
            : (food?.name ?? '(מאכל נמחק)');
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
              isPlaceholder={isPlaceholder}
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
  group: Group;
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
  group,
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
          const isPlaceholder = isPlaceholderAssignment(a);
          const food = a.foodId ? foodsById.get(a.foodId) : undefined;
          const placeholderCat = a.placeholderCategory
            ? getCategoryInfo(group, a.placeholderCategory)
            : null;
          const assignee = a.assignedTo ? assigneeById.get(a.assignedTo) : null;
          const foodName = isPlaceholder
            ? placeholderCat
              ? `${placeholderCat.emoji} ${placeholderCat.label}`
              : 'קטגוריה לא ידועה'
            : (food?.name ?? '(מאכל נמחק)');
          return (
            <AssignmentRow
              key={a.id}
              assignment={a}
              isPlaceholder={isPlaceholder}
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
  isPlaceholder: boolean;
  assigneeName: string | null;
  onToggleDone: () => void;
  onChangeAssignee: () => void;
  onLongPress: () => void;
};

function AssignmentRow({
  assignment,
  foodName,
  isPlaceholder,
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
        isPlaceholder && styles.rowPlaceholder,
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
          {isPlaceholder && (
            <Text style={styles.placeholderHint}> · טרם נבחר</Text>
          )}
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
  isPlaceholder: boolean;
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
  isPlaceholder,
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
        isPlaceholder && styles.rowPlaceholder,
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
          {isPlaceholder && (
            <Text style={styles.placeholderHint}> · טרם נבחר</Text>
          )}
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
  rowPlaceholder: {
    borderStyle: 'dashed',
    borderColor: colors.warning,
  },
  placeholderHint: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.regular,
    color: colors.warning,
    fontStyle: 'italic',
  },
  shareSection: {
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.xs,
  },
  endShabbatSection: {
    marginTop: spacing.lg,
    gap: spacing.xs,
  },
  endShabbatHint: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
    textAlign: 'center',
    writingDirection: 'rtl',
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
