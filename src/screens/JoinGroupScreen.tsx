import { useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenHeader } from '../components/ScreenHeader';
import { useUser } from '../context/UserContext';
import { joinGroupByCode } from '../services/groups';
import { addGroupId } from '../storage';
import { colors, fontFamily, fontSize, radius, spacing } from '../theme';
import type { RootStackScreenProps } from '../navigation/types';

const CODE_LENGTH = 6;

export function JoinGroupScreen({
  navigation,
}: RootStackScreenProps<'JoinGroup'>) {
  const { uid, userName } = useUser();
  const [code, setCode] = useState('');
  const [joining, setJoining] = useState(false);

  const normalizedCode = code.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  const canSubmit = normalizedCode.length === CODE_LENGTH && !joining;

  const handleJoin = async () => {
    if (!canSubmit) return;
    setJoining(true);
    try {
      const result = await joinGroupByCode({ code: normalizedCode, uid, userName });
      if (!result.ok) {
        if (result.reason === 'not_found') {
          Alert.alert('לא נמצאה קבוצה', 'לא נמצאה קבוצה עם הקוד הזה. בדוק את הקוד ונסה שוב.');
        } else {
          Alert.alert('כבר חבר', 'אתה כבר חבר בקבוצה הזו.');
        }
        return;
      }
      await addGroupId(result.id);
      navigation.replace('Group', { groupId: result.id });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'שגיאה לא ידועה';
      Alert.alert('אופס', `לא הצלחנו להצטרף לקבוצה.\n${message}`);
    } finally {
      setJoining(false);
    }
  };

  return (
    <Pressable style={styles.flex} onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <StatusBar style="dark" />
        <ScreenHeader title="הצטרף לקבוצה" onBack={() => navigation.goBack()} />
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.container}>
            <View style={styles.card}>
              <Text style={styles.emoji}>🔑</Text>
              <Text style={styles.prompt}>הזן את קוד הקבוצה</Text>
              <Text style={styles.helper}>
                קוד בן 6 תווים שקיבלת מחבר בקבוצה
              </Text>
              <TextInput
                value={code}
                onChangeText={(val) => setCode(val.toUpperCase())}
                placeholder="ABC123"
                placeholderTextColor={colors.border}
                style={styles.input}
                autoFocus
                maxLength={CODE_LENGTH}
                autoCapitalize="characters"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleJoin}
                textAlign="center"
              />
              <View style={styles.buttonWrap}>
                <PrimaryButton
                  label="הצטרף"
                  onPress={handleJoin}
                  disabled={!canSubmit}
                  loading={joining}
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
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.display,
    fontFamily: fontFamily.bold,
    color: colors.text,
    backgroundColor: colors.background,
    letterSpacing: 6,
  },
  buttonWrap: {
    marginTop: spacing.md,
  },
});
