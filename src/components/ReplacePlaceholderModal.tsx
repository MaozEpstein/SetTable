import { useEffect, useMemo, useState } from 'react';
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
import { useFoods } from '../hooks/useFoods';
import { resolvePlaceholder } from '../services/assignments';
import { colors, fontFamily, fontSize, radius, spacing } from '../theme';
import {
  getFoodCategories,
  sortFoods,
  type CategoryInfo,
  type Food,
} from '../types';

type Props = {
  visible: boolean;
  groupId: string;
  assignmentId: string;
  defaultCategoryKey: string | null; // pre-select this category tab
  categories: CategoryInfo[];
  onClose: () => void;
};

export function ReplacePlaceholderModal({
  visible,
  groupId,
  assignmentId,
  defaultCategoryKey,
  categories,
  onClose,
}: Props) {
  const { foods, loading } = useFoods(groupId);
  const [activeCategory, setActiveCategory] = useState<CategorySubTab>(
    defaultCategoryKey ?? 'all',
  );
  const [savingId, setSavingId] = useState<string | null>(null);

  // When the modal opens, default the filter to the placeholder's category
  useEffect(() => {
    if (visible) {
      setActiveCategory(defaultCategoryKey ?? 'all');
    }
  }, [visible, defaultCategoryKey]);

  const grouped = useMemo(() => {
    const sorted = sortFoods(foods);
    const map = new Map<string, Food[]>();
    for (const cat of categories) map.set(cat.key, []);
    for (const food of sorted) {
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

  const favorites = useMemo(
    () => sortFoods(foods.filter((f) => f.isFavorite)),
    [foods],
  );

  const sectionsToShow =
    activeCategory === 'all' || activeCategory === 'favorites'
      ? categories
      : categories.filter((c) => c.key === activeCategory);

  const handlePick = async (food: Food) => {
    if (savingId) return;
    setSavingId(food.id);
    try {
      await resolvePlaceholder(groupId, assignmentId, food.id);
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'שגיאה לא ידועה';
      Alert.alert('אופס', `לא הצלחנו להחליף.\n${message}`);
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
          <Text style={styles.title}>בחר מאכל ספציפי</Text>
          <Text style={styles.helper}>
            בחירת מאכל תחליף את ה"שיריון" הנוכחי במאכל מהקטלוג של הקבוצה.
          </Text>

          <View style={styles.tabsWrap}>
            <CategoryTabs
              categories={categories}
              active={activeCategory}
              onChange={setActiveCategory}
              countsByCategory={countsByCategory}
              totalCount={foods.length}
              favoritesCount={favorites.length}
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
                  עבור לטאב "מאכלים" והוסף מאכלים, ואז חזור לכאן
                </Text>
              </View>
            ) : activeCategory === 'favorites' ? (
              favorites.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyEmoji}>⭐</Text>
                  <Text style={styles.emptyTitle}>אין עדיין מועדפים</Text>
                </View>
              ) : (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>⭐ מועדפים</Text>
                  {favorites.map((food) => {
                    const isSaving = savingId === food.id;
                    return (
                      <Pressable
                        key={`fav-${food.id}`}
                        onPress={() => handlePick(food)}
                        disabled={!!savingId}
                        style={({ pressed }) => [
                          styles.foodRow,
                          { opacity: pressed ? 0.7 : 1 },
                        ]}
                      >
                        <Text style={styles.foodName}>⭐ {food.name}</Text>
                        {isSaving ? (
                          <Text style={styles.savingTag}>מחליף...</Text>
                        ) : (
                          <Text style={styles.chevron}>›</Text>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              )
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
                      const isSaving = savingId === food.id;
                      return (
                        <Pressable
                          key={`${cat.key}-${food.id}`}
                          onPress={() => handlePick(food)}
                          disabled={!!savingId}
                          style={({ pressed }) => [
                            styles.foodRow,
                            { opacity: pressed ? 0.7 : 1 },
                          ]}
                        >
                          <Text style={styles.foodName}>
                            {food.isFavorite ? '⭐ ' : ''}
                            {food.name}
                          </Text>
                          {isSaving ? (
                            <Text style={styles.savingTag}>מחליף...</Text>
                          ) : (
                            <Text style={styles.chevron}>›</Text>
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
  tabsWrap: { marginBottom: spacing.sm },
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
  section: { gap: spacing.xs },
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
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  foodName: {
    flex: 1,
    fontSize: fontSize.md,
    fontFamily: fontFamily.medium,
    color: colors.text,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  savingTag: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.medium,
    color: colors.primary,
  },
  chevron: {
    fontSize: fontSize.xl,
    color: colors.textMuted,
    fontFamily: fontFamily.regular,
  },
});
