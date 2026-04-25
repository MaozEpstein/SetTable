import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { PrimaryButton } from './PrimaryButton';
import { colors, fontFamily, fontSize, radius, spacing } from '../theme';
import type { SlotInfo } from '../types';

type Props = {
  visible: boolean;
  slots: SlotInfo[];
  onPick: (slot: SlotInfo) => void;
  onClose: () => void;
};

export function SlotPickerModal({ visible, slots, onPick, onClose }: Props) {
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
          <Text style={styles.title}>לאיזו ארוחה להוסיף?</Text>
          <Text style={styles.helper}>בחר ארוחה ואז תוכל לבחור מאכל מהקטלוג</Text>

          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {slots.map((slot) => (
              <Pressable
                key={slot.key}
                onPress={() => onPick(slot)}
                style={({ pressed }) => [
                  styles.row,
                  { opacity: pressed ? 0.6 : 1 },
                ]}
              >
                <Text style={styles.emoji}>{slot.emoji}</Text>
                <Text style={styles.label}>{slot.label}</Text>
                <Text style={styles.chevron}>‹</Text>
              </Pressable>
            ))}
          </ScrollView>

          <PrimaryButton label="ביטול" variant="outline" onPress={onClose} />
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
    maxHeight: '80%',
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
  list: { flexGrow: 0 },
  listContent: { gap: spacing.xs, paddingBottom: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emoji: { fontSize: 24 },
  label: {
    flex: 1,
    fontSize: fontSize.md,
    fontFamily: fontFamily.bold,
    color: colors.text,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  chevron: {
    fontSize: fontSize.xl,
    color: colors.textMuted,
    fontFamily: fontFamily.regular,
  },
});
