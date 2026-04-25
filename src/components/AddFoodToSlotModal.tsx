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
import { CategoryTabs, type CategorySubTab } from './CategoryTabs';
import { PrimaryButton } from './PrimaryButton';
import { useUser } from '../context/UserContext';
import { useFoods } from '../hooks/useFoods';
import { createAssignment } from '../services/assignments';
import { colors, fontFamily, fontSize, radius, spacing } from '../theme';
import { getFoodCategories, type Assignment, type CategoryInfo, type Food } from '../types';

type Props = {
  visible: boolean;
  groupId: string;
  slot: string;
  slotLabel: string;
  slotEmoji: string;
  categories: CategoryInfo[];
  existingAssignments: Assignment[];
  onClose: () => void;
};

export function AddFoodToSlotModal({
  visible,
  groupId,
  slot,
  slotLabel,
  slotEmoji,
  categories,
  existingAssignments,
  onClose,
}: Props) {
  const { uid } = useUser();
  const { foods, loading } = useFoods(groupId);
  const [activeCategory, setActiveCategory] = useState<CategorySubTab>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const usedFoodIds = useMemo(
    () => new Set(existingAssignments.map((a) => a.foodId)),
    [existingAssignments],
  );

  const grouped = useMemo(() => {
    const map = new Map<string, Food[]>();
    for (const cat of categories) {
      map.set(cat.key, []);
    }
    for (const food of foods) {
      for (const c of getFoodCategories(food)) {
        map.get(c)?.push(food);
      }
    }
    return map;
  }, [foods, categories]);

  const countsByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const cat of categories) {
      counts[cat.key] = grouped.get(cat.key)?.length ?? 0;
    }
    return counts;
  }, [grouped, categories]);

  const sectionsToShow =
    activeCategory === 'all'
      ? categories
      : categories.filter((c) => c.key === activeCategory);

  const handleClose = () => {
    if (saving) return;
    setSelectedIds(new Set());
    setActiveCategory('all');
    onClose();
  };

  const toggleFood = (food: Food) => {
    if (usedFoodIds.has(food.id) || saving) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(food.id)) next.delete(food.id);
      else next.add(food.id);
      return next;
    });
  };

  const handleSave = async () => {
    if (selectedIds.size === 0 || saving) return;
    setSaving(true);
    try {
      await Promise.all(
        Array.from(selectedIds).map((foodId) =>
          createAssignment({ groupId, foodId, slot, uid }),
        ),
      );
      setSelectedIds(new Set());
      setActiveCategory('all');
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'שגיאה לא ידועה';
      Alert.alert('אופס', `לא הצלחנו לשבץ.\n${message}`);
    } finally {
      setSaving(false);
    }
  };

  const selectionCount = selectedIds.size;
  const addLabel =
    selectionCount === 0
      ? 'בחר מאכלים להוספה'
      : selectionCount === 1
        ? 'הוסף מאכל אחד'
        : `הוסף ${selectionCount} מאכלים`;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={styles.title}>
            הוסף ל{slotEmoji} {slotLabel}
          </Text>
          <Text style={styles.helper}>
            סנן לפי קטגוריה ובחר מאכל אחד או יותר
          </Text>

          <View style={styles.tabsWrap}>
            <CategoryTabs
              categories={categories}
              active={activeCategory}
              onChange={setActiveCategory}
              countsByCategory={countsByCategory}
              totalCount={foods.length}
            />
          </View>

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
              sectionsToShow.map((cat) => {
                const items = grouped.get(cat.key) ?? [];
                if (items.length === 0) return null;
                return (
                  <View key={cat.key} style={styles.section}>
                    {activeCategory === 'all' && (
                      <Text style={styles.sectionTitle}>
                        {cat.emoji} {cat.label}
                      </Text>
                    )}
                    {items.map((food) => {
                      const used = usedFoodIds.has(food.id);
                      const selected = selectedIds.has(food.id);
                      return (
                        <Pressable
                          key={`${cat.key}-${food.id}`}
                          onPress={() => toggleFood(food)}
                          disabled={used}
                          style={({ pressed }) => [
                            styles.foodRow,
                            selected && styles.foodRowSelected,
                            used && styles.foodRowUsed,
                            { opacity: pressed && !used ? 0.7 : 1 },
                          ]}
                        >
                          <View
                            style={[
                              styles.checkbox,
                              selected && styles.checkboxSelected,
                              used && styles.checkboxUsed,
                            ]}
                          >
                            {(selected || used) && (
                              <Text style={styles.checkboxMark}>✓</Text>
                            )}
                          </View>
                          <Text
                            style={[
                              styles.foodName,
                              used && styles.foodNameUsed,
                              selected && styles.foodNameSelected,
                            ]}
                          >
                            {food.name}
                          </Text>
                          {used && <Text style={styles.usedTag}>כבר בסעודה</Text>}
                        </Pressable>
                      );
                    })}
                  </View>
                );
              })
            )}
          </ScrollView>

          <View style={styles.footer}>
            <View style={styles.footerHalf}>
              <PrimaryButton
                label="ביטול"
                variant="outline"
                onPress={handleClose}
                disabled={saving}
              />
            </View>
            <View style={styles.footerHalf}>
              <PrimaryButton
                label={addLabel}
                onPress={handleSave}
                disabled={selectionCount === 0 || saving}
                loading={saving}
              />
            </View>
          </View>
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
    maxHeight: '90%',
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
  tabsWrap: {
    marginBottom: spacing.sm,
  },
  list: { flexGrow: 0 },
  listContent: { gap: spacing.md, paddingBottom: spacing.md },
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
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    gap: spacing.md,
  },
  foodRowSelected: {
    borderColor: colors.primary,
    backgroundColor: '#FBEFD9',
  },
  foodRowUsed: {
    opacity: 0.55,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxUsed: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  checkboxMark: {
    color: '#FFFFFF',
    fontSize: fontSize.sm,
    fontFamily: fontFamily.bold,
    lineHeight: fontSize.sm + 2,
  },
  foodName: {
    flex: 1,
    fontSize: fontSize.md,
    fontFamily: fontFamily.medium,
    color: colors.text,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  foodNameSelected: {
    fontFamily: fontFamily.bold,
    color: colors.primaryDark,
  },
  foodNameUsed: {
    color: colors.textMuted,
  },
  usedTag: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.medium,
    color: colors.success,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  footerHalf: { flex: 1 },
});
