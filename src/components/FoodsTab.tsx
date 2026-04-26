import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AddCategoryModal } from './AddCategoryModal';
import { AddFoodModal } from './AddFoodModal';
import { CategoryTabs, type CategorySubTab } from './CategoryTabs';
import { PrimaryButton } from './PrimaryButton';
import { FoodCardSkeleton } from './Skeleton';
import { useFoods } from '../hooks/useFoods';
import { removeCustomCategory } from '../services/groups';
import { colors, fontFamily, fontSize, radius, spacing } from '../theme';
import {
  getAllCategories,
  getFoodCategories,
  sortFoods,
  type CategoryInfo,
  type Food,
  type Group,
} from '../types';
import type { RootStackParamList } from '../navigation/types';

type Props = {
  group: Group;
};

export function FoodsTab({ group }: Props) {
  const groupId = group.id;
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { foods, loading, error } = useFoods(groupId);
  const [foodModalVisible, setFoodModalVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<CategorySubTab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = useMemo(() => getAllCategories(group), [group]);

  const filteredFoods = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return foods;
    return foods.filter((f) => f.name.includes(q));
  }, [foods, searchQuery]);

  const grouped = useMemo(() => {
    const sorted = sortFoods(filteredFoods);
    const map = new Map<string, Food[]>();
    for (const cat of categories) map.set(cat.key, []);
    for (const food of sorted) {
      for (const c of getFoodCategories(food)) {
        map.get(c)?.push(food);
      }
    }
    return map;
  }, [filteredFoods, categories]);

  const countsByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const cat of categories) {
      counts[cat.key] = grouped.get(cat.key)?.length ?? 0;
    }
    return counts;
  }, [grouped, categories]);

  const favorites = useMemo(
    () => sortFoods(filteredFoods.filter((f) => f.isFavorite)),
    [filteredFoods],
  );

  const handleOpenFood = (food: Food) => {
    navigation.navigate('FoodDetail', { groupId, foodId: food.id });
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
      <View>
        <FoodCardSkeleton />
        <FoodCardSkeleton />
        <FoodCardSkeleton />
        <FoodCardSkeleton />
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

      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="חיפוש מאכל..."
          placeholderTextColor={colors.textMuted}
          style={styles.searchInput}
          textAlign="right"
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <Pressable
            onPress={() => setSearchQuery('')}
            hitSlop={8}
            style={styles.clearBtn}
          >
            <Text style={styles.clearBtnText}>✕</Text>
          </Pressable>
        )}
      </View>

      <CategoryTabs
        categories={categories}
        active={activeTab}
        onChange={setActiveTab}
        countsByCategory={countsByCategory}
        totalCount={foods.length}
        favoritesCount={favorites.length}
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
      ) : filteredFoods.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyEmoji}>🔍</Text>
          <Text style={styles.emptyTitle}>אין תוצאות לחיפוש</Text>
          <Text style={styles.emptyText}>
            לא נמצאו מאכלים שמכילים "{searchQuery}"
          </Text>
        </View>
      ) : activeTab === 'favorites' ? (
        favorites.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>⭐</Text>
            <Text style={styles.emptyTitle}>אין עדיין מועדפים</Text>
            <Text style={styles.emptyText}>
              פתחו מאכל → ✏️ ערוך → סמנו כמועדף.{'\n'}
              המועדפים יופיעו כאן ובראש כל רשימה.
            </Text>
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              ⭐ מועדפים
              <Text style={styles.count}> · {favorites.length}</Text>
            </Text>
            {favorites.map((food) => (
              <FoodRow
                key={food.id}
                food={food}
                onPress={() => handleOpenFood(food)}
              />
            ))}
          </View>
        )
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
                    onPress={() => handleOpenFood(food)}
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
        existingNames={foods.map((f) => f.name)}
        onClose={() => setFoodModalVisible(false)}
        onCreated={(newFoodId) =>
          navigation.navigate('FoodDetail', { groupId, foodId: newFoodId })
        }
      />

      <AddCategoryModal
        visible={categoryModalVisible}
        groupId={groupId}
        onClose={() => setCategoryModalVisible(false)}
      />
    </View>
  );
}

function FoodRow({ food, onPress }: { food: Food; onPress: () => void }) {
  const hasDetails =
    !!food.recipe?.trim() ||
    !!food.notes?.trim() ||
    (food.images?.length ?? 0) > 0;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
    >
      <Text style={styles.foodName}>
        {food.isFavorite ? '⭐ ' : ''}
        {food.name}
      </Text>
      <View style={styles.rowRight}>
        {hasDetails && (
          <View style={styles.detailsBadge}>
            <Text style={styles.detailsBadgeText}>
              {(food.images?.length ?? 0) > 0 ? '📷 ' : ''}
              {food.recipe?.trim() ? '📝 ' : ''}
              {food.notes?.trim() ? '💭' : ''}
            </Text>
          </View>
        )}
        <Text style={styles.chevron}>‹</Text>
      </View>
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
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  detailsBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: '#FBEFD9',
  },
  detailsBadgeText: {
    fontSize: fontSize.xs,
  },
  chevron: {
    fontSize: fontSize.xl,
    color: colors.textMuted,
    fontFamily: fontFamily.regular,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  searchIcon: {
    fontSize: fontSize.md,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    fontFamily: fontFamily.regular,
    color: colors.text,
    writingDirection: 'rtl',
  },
  clearBtn: {
    paddingHorizontal: spacing.xs,
  },
  clearBtnText: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    fontFamily: fontFamily.bold,
  },
});
