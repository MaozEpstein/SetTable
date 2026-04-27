import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { crossAlert } from '../utils/crossAlert';
import { PrimaryButton } from './PrimaryButton';
import { useUser } from '../context/UserContext';
import { addCustomSlot } from '../services/groups';
import { colors, fontFamily, fontSize, radius, spacing } from '../theme';

const EMOJI_OPTIONS = ['🍽️', '🥐', '☕', '🥗', '🍲', '🎉', '🍰', '🌟'];

type Props = {
  visible: boolean;
  groupId: string;
  onClose: () => void;
};

export function AddMealSlotModal({ visible, groupId, onClose }: Props) {
  const { uid } = useUser();
  const [label, setLabel] = useState('');
  const [emoji, setEmoji] = useState(EMOJI_OPTIONS[0]);
  const [saving, setSaving] = useState(false);

  const trimmed = label.trim();
  const canSubmit = trimmed.length >= 2 && !saving;

  const reset = () => {
    setLabel('');
    setEmoji(EMOJI_OPTIONS[0]);
    setSaving(false);
  };

  const handleClose = () => {
    if (saving) return;
    reset();
    onClose();
  };

  const handleSave = async () => {
    if (!canSubmit) return;
    setSaving(true);
    try {
      await addCustomSlot({ groupId, label: trimmed, emoji, uid });
      reset();
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'שגיאה לא ידועה';
      crossAlert('אופס', `לא הצלחנו להוסיף את הארוחה.\n${message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.handle} />
            <Text style={styles.title}>הוסף ארוחה חדשה</Text>
            <Text style={styles.helper}>
              לדוגמה: ארוחת בוקר, סיום צום, אסיפת המשפחה
            </Text>

            <Text style={styles.label}>שם הארוחה</Text>
            <TextInput
              value={label}
              onChangeText={setLabel}
              placeholder="שם הארוחה"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              autoFocus
              maxLength={30}
              textAlign="right"
              returnKeyType="done"
              onSubmitEditing={handleSave}
            />

            <Text style={styles.label}>אייקון</Text>
            <View style={styles.emojiRow}>
              {EMOJI_OPTIONS.map((opt) => {
                const isActive = emoji === opt;
                return (
                  <Pressable
                    key={opt}
                    onPress={() => setEmoji(opt)}
                    style={({ pressed }) => [
                      styles.emojiOption,
                      isActive && styles.emojiOptionActive,
                      { opacity: pressed && !isActive ? 0.6 : 1 },
                    ]}
                  >
                    <Text style={styles.emojiText}>{opt}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.actions}>
              <View style={styles.buttonHalf}>
                <PrimaryButton
                  label="ביטול"
                  variant="outline"
                  onPress={handleClose}
                  disabled={saving}
                />
              </View>
              <View style={styles.buttonHalf}>
                <PrimaryButton
                  label="הוסף"
                  onPress={handleSave}
                  disabled={!canSubmit}
                  loading={saving}
                />
              </View>
            </View>
          </KeyboardAvoidingView>
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
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.bold,
    color: colors.textMuted,
    textAlign: 'right',
    writingDirection: 'rtl',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.sm,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.lg,
    fontFamily: fontFamily.regular,
    color: colors.text,
    backgroundColor: colors.surface,
    writingDirection: 'rtl',
  },
  emojiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  emojiOption: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiOptionActive: {
    borderColor: colors.primary,
    backgroundColor: '#FBEFD9',
  },
  emojiText: {
    fontSize: 24,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  buttonHalf: {
    flex: 1,
  },
});
