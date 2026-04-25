import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontFamily, fontSize, spacing } from '../theme';

type Props = {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
};

export function ScreenHeader({ title, onBack, right }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.sideStart}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            hitSlop={12}
            style={({ pressed }) => [styles.back, { opacity: pressed ? 0.5 : 1 }]}
          >
            <Text style={styles.backLabel}>→</Text>
          </Pressable>
        ) : null}
      </View>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.sideEnd}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  sideStart: {
    minWidth: 40,
    alignItems: 'flex-start',
  },
  sideEnd: {
    minWidth: 40,
    alignItems: 'flex-end',
  },
  back: {
    padding: spacing.xs,
  },
  backLabel: {
    fontSize: fontSize.xxl,
    color: colors.text,
    lineHeight: fontSize.xxl + 2,
  },
  title: {
    flex: 1,
    fontSize: fontSize.xl,
    fontFamily: fontFamily.bold,
    color: colors.text,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
});
