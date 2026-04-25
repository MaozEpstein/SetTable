import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { AddFoodModal } from './AddFoodModal';
import { PrimaryButton } from './PrimaryButton';
import { useFoods } from '../hooks/useFoods';
import { deleteAssignmentsForFood } from '../services/assignments';
import { deleteFood } from '../services/foods';
import { colors, fontFamily, fontSize, radius, spacing } from '../theme';
import { FOOD_CATEGORIES, type Food, type FoodCategory } from '../types';

type Props = {
  groupId: string;
};

export function FoodsTab({ groupId }: Props) {
  const { foods, loading, error } = useFoods(groupId);
  const [modalVisible, setModalVisible] = useState(false);

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

  return (
    <View style={styles.container}>
      <View style={styles.addButton}>
        <PrimaryButton
          label="הוסף מאכל חדש"
          icon="+"
          onPress={() => setModalVisible(true)}
        />
      </View>

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
        FOOD_CATEGORIES.map((cat) => {
          const items = grouped.get(cat.key) ?? [];
          if (items.length === 0) return null;
          return (
            <View key={cat.key} style={styles.section}>
              <Text style={styles.sectionTitle}>
                {cat.emoji} {cat.label}
                <Text style={styles.count}> · {items.length}</Text>
              </Text>
              {items.map((food) => (
                <FoodRow
                  key={food.id}
                  food={food}
                  onLongPress={() => handleDelete(food)}
                />
              ))}
            </View>
          );
        })
      )}

      <AddFoodModal
        visible={modalVisible}
        groupId={groupId}
        onClose={() => setModalVisible(false)}
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
  container: {
    gap: spacing.md,
  },
  addButton: {
    marginBottom: spacing.sm,
  },
  empty: {
    padding: spacing.xl,
    alignItems: 'center',
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
  emptyEmoji: {
    fontSize: 48,
  },
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
    fontFamily: fontFamily.regular,
    color: colors.warning,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  section: {
    gap: spacing.xs,
  },
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
