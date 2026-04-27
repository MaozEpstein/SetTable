import { useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { crossAlert } from '../utils/crossAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenHeader } from '../components/ScreenHeader';
import { useUser } from '../context/UserContext';
import { createGroup, GroupLimitReachedError } from '../services/groups';
import { addGroupId } from '../storage';
import { colors, fontFamily, fontSize, radius, spacing } from '../theme';
import type { RootStackScreenProps } from '../navigation/types';

export function CreateGroupScreen({
  navigation,
}: RootStackScreenProps<'CreateGroup'>) {
  const { uid, userName } = useUser();
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);

  const trimmed = name.trim();
  const canSubmit = trimmed.length >= 2 && !creating;

  const handleCreate = async () => {
    if (!canSubmit) return;
    setCreating(true);
    try {
      const { id } = await createGroup({ name: trimmed, uid, userName });
      await addGroupId(id);
      navigation.replace('Group', { groupId: id });
    } catch (err) {
      if (err instanceof GroupLimitReachedError) {
        crossAlert('הגעת למגבלה', err.message);
      } else {
        const message = err instanceof Error ? err.message : 'שגיאה לא ידועה';
        crossAlert('אופס', `לא הצלחנו ליצור את הקבוצה.\n${message}`);
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <Pressable style={styles.flex} onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <StatusBar style="dark" />
        <ScreenHeader title="צור קבוצה חדשה" onBack={() => navigation.goBack()} />
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.container}>
            <View style={styles.card}>
              <Text style={styles.emoji}>👨‍👩‍👧</Text>
              <Text style={styles.prompt}>איך נקרא לקבוצה?</Text>
              <Text style={styles.helper}>
                לדוגמה: "משפחת כהן", "חברי הישיבה"
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="שם הקבוצה"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                autoFocus
                maxLength={40}
                returnKeyType="done"
                onSubmitEditing={handleCreate}
                textAlign="right"
              />
              <View style={styles.buttonWrap}>
                <PrimaryButton
                  label="צור קבוצה"
                  onPress={handleCreate}
                  disabled={!canSubmit}
                  loading={creating}
                />
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: colors.background },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.xl,
    shadowColor: colors.shadow,
    shadowOpacity: 1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    gap: spacing.sm,
    alignItems: 'stretch',
  },
  emoji: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  prompt: {
    fontSize: fontSize.lg,
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
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.lg,
    fontFamily: fontFamily.regular,
    color: colors.text,
    backgroundColor: colors.background,
    writingDirection: 'rtl',
  },
  buttonWrap: {
    marginTop: spacing.md,
  },
});
