import { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, View, type ViewStyle } from 'react-native';
import { colors, radius, spacing } from '../theme';

type Props = {
  height?: number;
  width?: number | string;
  borderRadius?: number;
  style?: ViewStyle;
};

// A subtle shimmer block. Tile multiple of these to outline the layout
// before the real content arrives.
export function Skeleton({ height = 16, width = '100%', borderRadius = 8, style }: Props) {
  const opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(opacity, {
          toValue: 0.6,
          duration: 800,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.base,
        { height, width: width as ViewStyle['width'], borderRadius, opacity },
        style,
      ]}
    />
  );
}

// Common compositions

export function FoodCardSkeleton() {
  return (
    <View style={styles.foodCard}>
      <Skeleton height={56} width={56} borderRadius={radius.md} />
      <View style={styles.foodCardBody}>
        <Skeleton height={16} width="65%" />
        <View style={{ height: spacing.xs }} />
        <Skeleton height={12} width="40%" />
      </View>
    </View>
  );
}

export function MealRowSkeleton() {
  return (
    <View style={styles.mealRow}>
      <Skeleton height={20} width={120} />
      <View style={{ height: spacing.sm }} />
      <Skeleton height={48} width="100%" borderRadius={radius.md} />
      <View style={{ height: spacing.xs }} />
      <Skeleton height={48} width="100%" borderRadius={radius.md} />
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: '#E8E2D4',
  },
  foodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  foodCardBody: {
    flex: 1,
  },
  mealRow: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
});
