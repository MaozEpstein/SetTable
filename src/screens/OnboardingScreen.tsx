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
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { PrimaryButton } from '../components/PrimaryButton';
import { setUserName } from '../storage';
import { colors, fontFamily, fontSize, radius, spacing } from '../theme';

type Props = {
  onComplete: (name: string) => void;
};

export function OnboardingScreen({ onComplete }: Props) {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const trimmed = name.trim();
  const canSubmit = trimmed.length >= 2 && !saving;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    try {
      await setUserName(trimmed);
      onComplete(trimmed);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Pressable style={styles.flex} onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <StatusBar style="dark" />
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.container}>
            <View style={styles.header}>
              <Text style={styles.candle}>🕯️</Text>
              <Text style={styles.title}>שולחן ערוך</Text>
              <Text style={styles.subtitle}>תכנון ארוחות שבת משותפות</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.welcome}>ברוכים הבאים 👋</Text>
              <Text style={styles.prompt}>איך קוראים לך?</Text>
              <Text style={styles.helper}>
                השם שתזין יוצג לחברי הקבוצה שלך
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="לדוגמה: דנה"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                autoFocus
                maxLength={30}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
                textAlign="right"
              />
              <View style={styles.buttonWrap}>
                <PrimaryButton
                  label="המשך"
                  icon="←"
                  onPress={handleSubmit}
                  disabled={!canSubmit}
                  loading={saving}
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
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    gap: spacing.xl,
  },
  header: {
    alignItems: 'center',
  },
  candle: {
    fontSize: 56,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: fontSize.display,
    fontFamily: fontFamily.bold,
    color: colors.text,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  subtitle: {
    marginTop: spacing.xs,
    fontSize: fontSize.md,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
    textAlign: 'center',
    writingDirection: 'rtl',
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
  welcome: {
    fontSize: fontSize.xl,
    fontFamily: fontFamily.bold,
    color: colors.text,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  prompt: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.medium,
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
