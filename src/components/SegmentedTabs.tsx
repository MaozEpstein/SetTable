import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontFamily, fontSize, radius, spacing } from '../theme';

type Tab<T extends string> = {
  key: T;
  label: string;
};

type Props<T extends string> = {
  tabs: Tab<T>[];
  active: T;
  onChange: (key: T) => void;
};

export function SegmentedTabs<T extends string>({ tabs, active, onChange }: Props<T>) {
  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            style={({ pressed }) => [
              styles.tab,
              isActive && styles.activeTab,
              { opacity: pressed && !isActive ? 0.6 : 1 },
            ]}
          >
            <Text style={[styles.label, isActive && styles.activeLabel]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    padding: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  label: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.medium,
    color: colors.textMuted,
    writingDirection: 'rtl',
  },
  activeLabel: {
    color: '#FFFFFF',
    fontFamily: fontFamily.bold,
  },
});
