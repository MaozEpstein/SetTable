import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, fontFamily, fontSize, radius, spacing } from '../theme';
import { MEAL_SLOTS, type MealSlot } from '../types';

export type MealSubTab = 'all' | MealSlot;

type Props = {
  active: MealSubTab;
  onChange: (key: MealSubTab) => void;
  countsBySlot?: Partial<Record<MealSlot, number>>;
  totalCount?: number;
};

const ALL_TAB = { key: 'all' as const, label: 'הכל', emoji: '📅' };

export function MealSlotTabs({ active, onChange, countsBySlot, totalCount }: Props) {
  const tabs: { key: MealSubTab; label: string; emoji: string; count: number }[] = [
    {
      key: ALL_TAB.key,
      label: ALL_TAB.label,
      emoji: ALL_TAB.emoji,
      count: totalCount ?? 0,
    },
    ...MEAL_SLOTS.map((s) => ({
      key: s.key,
      label: s.shortLabel,
      emoji: s.emoji,
      count: countsBySlot?.[s.key] ?? 0,
    })),
  ];

  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {tabs.map((tab) => {
          const isActive = tab.key === active;
          return (
            <Pressable
              key={tab.key}
              onPress={() => onChange(tab.key)}
              style={({ pressed }) => [
                styles.tab,
                isActive && styles.tabActive,
                { opacity: pressed && !isActive ? 0.6 : 1 },
              ]}
            >
              <Text style={styles.emoji}>{tab.emoji}</Text>
              <Text style={[styles.label, isActive && styles.labelActive]}>
                {tab.label}
              </Text>
              {tab.count > 0 && (
                <View style={[styles.badge, isActive && styles.badgeActive]}>
                  <Text style={[styles.badgeText, isActive && styles.badgeTextActive]}>
                    {tab.count}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: {
    gap: 4,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  emoji: {
    fontSize: fontSize.md,
  },
  label: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.medium,
    color: colors.textMuted,
    writingDirection: 'rtl',
  },
  labelActive: {
    color: '#FFFFFF',
    fontFamily: fontFamily.bold,
  },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.bold,
    color: colors.textMuted,
  },
  badgeTextActive: {
    color: '#FFFFFF',
  },
});
