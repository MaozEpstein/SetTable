import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { PrimaryButton } from './PrimaryButton';
import { useUser } from '../context/UserContext';
import { addManualMember } from '../services/groups';
import { colors, fontFamily, fontSize, radius, spacing } from '../theme';

type Props = {
  visible: boolean;
  groupId: string;
  onClose: () => void;
};

export function AddManualMemberModal({ visible, groupId, onClose }: Props) {
  const { uid } = useUser();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const trimmed = name.trim();
  const canSubmit = trimmed.length >= 2 && !saving;

  const reset = () => {
    setName('');
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
      await addManualMember({ groupId, name: trimmed, uid });
      reset();
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'שגיאה לא ידועה';
      Alert.alert('אופס', `לא הצלחנו להוסיף משתתף.\n${message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.handle} />
            <Text style={styles.title}>הוסף משתתף ידנית</Text>
            <Text style={styles.helper}>
              לאדם שלא משתמש באפליקציה אבל אתה רוצה לשבץ לו מאכלים. הוא יופיע
              ברשימת מי שאפשר לשבץ, אבל לא יקבל התראות.
            </Text>

            <Text style={styles.label}>שם המשתתף</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="לדוגמה: סבתא רחל"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              autoFocus
              maxLength={30}
              textAlign="right"
              returnKeyType="done"
              onSubmitEditing={handleSave}
            />

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
    lineHeight: 20,
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
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  buttonHalf: { flex: 1 },
});
