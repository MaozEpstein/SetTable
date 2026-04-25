import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, fontFamily, fontSize, radius, spacing } from '../theme';
import type { SlotInfo } from '../types';

export type MealSubTab = 'all' | string;

type Props = {
  slots: SlotInfo[];
  active: MealSubTab;
  onChange: (key: MealSubTab) => void;
  countsBySlot?: Record<string, number>;
  totalCount?: number;
  onAddSlot?: () => void;
  onLongPressSlot?: (slot: SlotInfo) => void;
};

export function MealSlotTabs({
  slots,
  active,
  onChange,
  countsBySlot,
  totalCount,
  onAddSlot,
  onLongPressSlot,
}: Props) {
  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        <SlotPill
          isActive={active === 'all'}
          onPress={() => onChange('all')}
          emoji="📅"
          label="הכל"
          count={totalCount ?? 0}
        />
        {slots.map((slot) => (
          <SlotPill
            key={slot.key}
            isActive={active === slot.key}
            onPress={() => onChange(slot.key)}
            onLongPress={
              slot.isCustom && onLongPressSlot ? () => onLongPressSlot(slot) : undefined
            }
            emoji={slot.emoji}
            label={slot.shortLabel}
            count={countsBySlot?.[slot.key] ?? 0}
          />
        ))}
        {onAddSlot && (
          <Pressable
            onPress={onAddSlot}
            style={({ pressed }) => [
              styles.addPill,
              { opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Text style={styles.addIcon}>+</Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

type PillProps = {
  isActive: boolean;
  onPress: () => void;
  onLongPress?: () => void;
  emoji: string;
  label: string;
  count: number;
};

function SlotPill({ isActive, onPress, onLongPress, emoji, label, count }: PillProps) {
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [
        styles.tab,
        isActive && styles.tabActive,
        { opacity: pressed && !isActive ? 0.6 : 1 },
      ]}
    >
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={[styles.label, isActive && styles.labelActive]}>{label}</Text>
      {count > 0 && (
        <View style={[styles.badge, isActive && styles.badgeActive]}>
          <Text style={[styles.badgeText, isActive && styles.badgeTextActive]}>
            {count}
          </Text>
        </View>
      )}
    </Pressable>
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
    alignItems: 'center',
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
  addPill: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIcon: {
    fontSize: fontSize.xl,
    color: colors.primary,
    fontFamily: fontFamily.bold,
    lineHeight: fontSize.xl + 2,
  },
});
