import { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { PrimaryButton } from './PrimaryButton';
import { useUser } from '../context/UserContext';
import { useFoods } from '../hooks/useFoods';
import { createAssignment } from '../services/assignments';
import { colors, fontFamily, fontSize, radius, spacing } from '../theme';
import { FOOD_CATEGORIES, MEAL_SLOTS, type Assignment, type Food, type FoodCategory, type MealSlot } from '../types';

type Props = {
  visible: boolean;
  groupId: string;
  slot: MealSlot;
  existingAssignments: Assignment[];
  onClose: () => void;
};

export function AddFoodToSlotModal({
  visible,
  groupId,
  slot,
  existingAssignments,
  onClose,
}: Props) {
  const { uid } = useUser();
  const { foods, loading } = useFoods(groupId);
  const [savingId, setSavingId] = useState<string | null>(null);

  const slotMeta = MEAL_SLOTS.find((s) => s.key === slot);
  const usedFoodIds = useMemo(
    () => new Set(existingAssignments.map((a) => a.foodId)),
    [existingAssignments],
  );

  const grouped = useMemo(() => {
    const map = new Map<FoodCategory, Food[]>();
    for (const cat of FOOD_CATEGORIES) {
      map.set(cat.key, []);
    }
    for (const food of foods) {
      map.get(food.category)?.push(food);
    }
    return map;
  }, [foods]);

  const handlePick = async (food: Food) => {
    if (usedFoodIds.has(food.id) || savingId) return;
    setSavingId(food.id);
    try {
      await createAssignment({ groupId, foodId: food.id, slot, uid });
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'שגיאה לא ידועה';
      Alert.alert('אופס', `לא הצלחנו לשבץ.\n${message}`);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={styles.title}>
            הוסף ל{slotMeta?.emoji} {slotMeta?.label}
          </Text>
          <Text style={styles.helper}>
            בחר מאכל מרשימת המאכלים של הקבוצה
          </Text>

          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {loading ? (
              <Text style={styles.empty}>טוען...</Text>
            ) : foods.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyEmoji}>🍽️</Text>
                <Text style={styles.emptyTitle}>אין מאכלים בקבוצה</Text>
                <Text style={styles.emptyText}>
                  עבור לטאב "מאכלים" והוסף מאכלים, ואז חזור לכאן לשבץ אותם
                </Text>
              </View>
            ) : (
              FOOD_CATEGORIES.map((cat) => {
                const items = grouped.get(cat.key) ?? [];
                if (items.length === 0) return null;
                return (
                  <View key={cat.key} style={styles.section}>
                    <Text style={styles.sectionTitle}>
                      {cat.emoji} {cat.label}
                    </Text>
                    {items.map((food) => {
                      const used = usedFoodIds.has(food.id);
                      const saving = savingId === food.id;
                      return (
                        <Pressable
                          key={food.id}
                          onPress={() => handlePick(food)}
                          disabled={used || saving}
                          style={({ pressed }) => [
                            styles.foodRow,
                            used && styles.foodRowUsed,
                            { opacity: pressed && !used ? 0.6 : 1 },
                          ]}
                        >
                          <Text style={[styles.foodName, used && styles.foodNameUsed]}>
                            {food.name}
                          </Text>
                          {used ? (
                            <Text style={styles.usedTag}>כבר בסעודה</Text>
                          ) : saving ? (
                            <Text style={styles.savingTag}>מוסיף...</Text>
                          ) : (
                            <Text style={styles.addIcon}>+</Text>
                          )}
                        </Pressable>
                      );
                    })}
                  </View>
                );
              })
            )}
          </ScrollView>

          <PrimaryButton label="סגור" variant="outline" onPress={onClose} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(31, 42, 68, 0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
    maxHeight: '85%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.xl,
    fontFamily: fontFamily.bold,
    color: colors.text,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  helper: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: spacing.sm,
  },
  list: {
    flexGrow: 0,
  },
  listContent: {
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    fontFamily: fontFamily.regular,
    paddingVertical: spacing.xl,
  },
  emptyBox: {
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyEmoji: { fontSize: 40 },
  emptyTitle: {
    fontSize: fontSize.md,
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
  },
  section: {
    gap: spacing.xs,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.bold,
    color: colors.textMuted,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: spacing.xs,
  },
  foodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  foodRowUsed: {
    opacity: 0.5,
  },
  foodName: {
    flex: 1,
    fontSize: fontSize.md,
    fontFamily: fontFamily.medium,
    color: colors.text,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  foodNameUsed: {
    color: colors.textMuted,
  },
  usedTag: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.medium,
    color: colors.success,
  },
  savingTag: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.medium,
    color: colors.primary,
  },
  addIcon: {
    fontSize: fontSize.xxl,
    color: colors.primary,
    fontFamily: fontFamily.bold,
    width: 24,
    textAlign: 'center',
  },
});
