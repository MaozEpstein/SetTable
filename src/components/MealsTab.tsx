import { StyleSheet, Text, View } from 'react-native';
import { colors, fontFamily, fontSize, radius, spacing } from '../theme';
import { MEAL_SLOTS } from '../types';

export function MealsTab() {
  return (
    <View style={styles.container}>
      {MEAL_SLOTS.map((slot) => (
        <View key={slot.key} style={styles.section}>
          <Text style={styles.sectionTitle}>
            {slot.emoji} {slot.label}
          </Text>
          <View style={styles.placeholderRow}>
            <Text style={styles.placeholderText}>אין עדיין מאכלים ששובצו</Text>
          </View>
        </View>
      ))}
      <View style={styles.note}>
        <Text style={styles.noteText}>
          ⏳ שיבוץ מאכלים לארוחות יתווסף בשלב הבא של הפיתוח (שלב 4)
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
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
  placeholderRow: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  note: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderRightWidth: 4,
    borderRightColor: colors.secondary,
  },
  noteText: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.medium,
    color: colors.text,
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 22,
  },
});
