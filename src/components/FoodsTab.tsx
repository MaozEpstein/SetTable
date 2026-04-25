import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { AddCategoryModal } from './AddCategoryModal';
import { AddFoodModal } from './AddFoodModal';
import { CategoryTabs, type CategorySubTab } from './CategoryTabs';
import { PrimaryButton } from './PrimaryButton';
import { useFoods } from '../hooks/useFoods';
import { deleteAssignmentsForFood } from '../services/assignments';
import { deleteFood } from '../services/foods';
import { removeCustomCategory } from '../services/groups';
import { colors, fontFamily, fontSize, radius, spacing } from '../theme';
import {
  getAllCategories,
  getFoodCategories,
  type CategoryInfo,
  type Food,
  type Group,
} from '../types';

type Props = {
  group: Group;
};

export function FoodsTab({ group }: Props) {
  const groupId = group.id;
  const { foods, loading, error } = useFoods(groupId);
  const [foodModalVisible, setFoodModalVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<CategorySubTab>('all');

  const categories = useMemo(() => getAllCategories(group), [group]);

  const grouped = useMemo(() => {
    const map = new Map<string, Food[]>();
    for (const cat of categories) map.set(cat.key, []);
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

  const handleDelete = (food: Food) => {
    Alert.alert(
      'מחיקת מאכל',
      `למחוק את "${food.name}"?\nכל השיבוצים שלו לארוחות יימחקו גם.`,
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'מחק',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAssignmentsForFood(groupId, food.id);
              await deleteFood(groupId, food.id);
            } catch {
              Alert.alert('אופס', 'לא הצלחנו למחוק. נסה שוב.');
            }
          },
        },
      ],
    );
  };

  const handleLongPressCategory = (cat: CategoryInfo) => {
    if (!cat.isCustom) return;
    Alert.alert(
      'מחיקת קטגוריה',
      `למחוק את "${cat.label}"?\nהקטגוריה תוסר מכל המאכלים שמשתמשים בה (המאכלים עצמם יישארו).`,
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'מחק',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeCustomCategory(groupId, cat.key);
              if (activeTab === cat.key) setActiveTab('all');
            } catch {
              Alert.alert('אופס', 'לא הצלחנו למחוק. נסה שוב.');
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>טוען מאכלים...</Text>
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

  const sectionsToShow =
    activeTab === 'all' ? categories : categories.filter((c) => c.key === activeTab);

  return (
    <View style={styles.container}>
      <View style={styles.addButton}>
        <PrimaryButton
          label="הוסף מאכל חדש"
          icon="+"
          onPress={() => setFoodModalVisible(true)}
        />
      </View>

      <CategoryTabs
        categories={categories}
        active={activeTab}
        onChange={setActiveTab}
        countsByCategory={countsByCategory}
        totalCount={foods.length}
        onAddCategory={() => setCategoryModalVisible(true)}
        onLongPressCategory={handleLongPressCategory}
      />

      {foods.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyEmoji}>🍽️</Text>
          <Text style={styles.emptyTitle}>אין עדיין מאכלים</Text>
          <Text style={styles.emptyText}>
            הוסיפו מאכלים שהקבוצה עשויה להכין לשבת{'\n'}
            (למשל "חמין", "סלט ירקות", "קוגל")
          </Text>
        </View>
      ) : (
        sectionsToShow.map((cat) => {
          const items = grouped.get(cat.key) ?? [];
          if (activeTab === 'all' && items.length === 0) return null;
          return (
            <View key={cat.key} style={styles.section}>
              <Text style={styles.sectionTitle}>
                {cat.emoji} {cat.label}
                {items.length > 0 && (
                  <Text style={styles.count}> · {items.length}</Text>
                )}
              </Text>
              {items.length === 0 ? (
                <Text style={styles.emptyInline}>אין מאכלים בקטגוריה זו</Text>
              ) : (
                items.map((food) => (
                  <FoodRow
                    key={food.id}
                    food={food}
                    onLongPress={() => handleDelete(food)}
                  />
                ))
              )}
            </View>
          );
        })
      )}

      <AddFoodModal
        visible={foodModalVisible}
        groupId={groupId}
        categories={categories}
        onClose={() => setFoodModalVisible(false)}
      />

      <AddCategoryModal
        visible={categoryModalVisible}
        groupId={groupId}
        onClose={() => setCategoryModalVisible(false)}
      />
    </View>
  );
}

function FoodRow({ food, onLongPress }: { food: Food; onLongPress: () => void }) {
  return (
    <Pressable
      onLongPress={onLongPress}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
    >
      <Text style={styles.foodName}>{food.name}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  addButton: { marginBottom: spacing.xs },
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
  emptyInline: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
    textAlign: 'right',
    writingDirection: 'rtl',
    paddingVertical: spacing.sm,
  },
  errorText: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: colors.warning,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  section: { gap: spacing.xs },
  sectionTitle: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.bold,
    color: colors.text,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: spacing.xs,
  },
  count: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
  },
  row: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  foodName: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.medium,
    color: colors.text,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
