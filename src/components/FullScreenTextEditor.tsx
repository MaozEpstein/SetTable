import { useEffect, useState } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fontFamily, fontSize, radius, spacing } from '../theme';

type Props = {
  visible: boolean;
  title: string;
  initialValue: string;
  placeholder?: string;
  onSave: (value: string) => void;
  onClose: () => void;
};

export function FullScreenTextEditor({
  visible,
  title,
  initialValue,
  placeholder,
  onSave,
  onClose,
}: Props) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (visible) setValue(initialValue);
  }, [visible, initialValue]);

  const handleSave = () => {
    onSave(value);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="fullScreen"
    >
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable
            onPress={onClose}
            hitSlop={8}
            style={({ pressed }) => [styles.headerBtn, { opacity: pressed ? 0.5 : 1 }]}
          >
            <Text style={styles.cancelText}>ביטול</Text>
          </Pressable>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Pressable
            onPress={handleSave}
            hitSlop={8}
            style={({ pressed }) => [styles.headerBtn, { opacity: pressed ? 0.5 : 1 }]}
          >
            <Text style={styles.saveText}>שמור</Text>
          </Pressable>
        </View>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TextInput
            value={value}
            onChangeText={setValue}
            placeholder={placeholder}
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            multiline
            textAlignVertical="top"
            textAlign="right"
            autoFocus
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  headerBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  title: {
    flex: 1,
    fontSize: fontSize.md,
    fontFamily: fontFamily.bold,
    color: colors.text,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  cancelText: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.medium,
    color: colors.textMuted,
    writingDirection: 'rtl',
  },
  saveText: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.bold,
    color: colors.primary,
    writingDirection: 'rtl',
  },
  input: {
    flex: 1,
    padding: spacing.lg,
    fontSize: fontSize.lg,
    fontFamily: fontFamily.regular,
    color: colors.text,
    backgroundColor: colors.background,
    writingDirection: 'rtl',
    lineHeight: 28,
  },
});
