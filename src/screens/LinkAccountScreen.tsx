import { useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenHeader } from '../components/ScreenHeader';
import { isUsernameAvailable, linkAnonymousAccount } from '../services/userAuth';
import {
  validateEmail,
  validatePassword,
  validateUsername,
} from '../utils/usernameValidation';
import { colors, fontFamily, fontSize, radius, spacing } from '../theme';

type Props = {
  onDone: () => void;
  onCancel: () => void;
};

export function LinkAccountScreen({ onDone, onCancel }: Props) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const handleLink = async () => {
    const uCheck = validateUsername(username);
    if (!uCheck.ok) return Alert.alert('שם משתמש', uCheck.reason);
    const eCheck = validateEmail(email);
    if (!eCheck.ok) return Alert.alert('אימייל', eCheck.reason);
    const pCheck = validatePassword(password);
    if (!pCheck.ok) return Alert.alert('סיסמה', pCheck.reason);

    setBusy(true);
    try {
      const available = await isUsernameAvailable(username);
      if (!available) {
        Alert.alert('שם משתמש תפוס', 'בחר שם אחר.');
        return;
      }
      await linkAnonymousAccount({ username, email, password });
      Alert.alert('הצמדה הושלמה ✓', 'מעתה תוכל להיכנס מכל מכשיר עם שם המשתמש והסיסמה.');
      onDone();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'הצמדה נכשלה';
      Alert.alert('אופס', msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Pressable style={styles.flex} onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <StatusBar style="dark" />
        <ScreenHeader title="הצמדת חשבון" onBack={onCancel} />
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.intro}>
              <Text style={styles.introText}>
                כרגע אתה מחובר כאורח. אם תמחק את האפליקציה — תאבד את הקבוצות שלך.
                {'\n\n'}
                הצמדת חשבון = שמירת הזיהוי שלך לתמיד. תוכל להיכנס מכל מכשיר, וכל הקבוצות יישמרו.
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.fieldLabel}>שם משתמש</Text>
              <TextInput
                value={username}
                onChangeText={setUsername}
                placeholder="dana_levi"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                autoCapitalize="none"
                autoCorrect={false}
                textAlign="left"
              />

              <Text style={styles.fieldLabel}>אימייל (לשחזור)</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="dana@gmail.com"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textAlign="left"
              />

              <Text style={styles.fieldLabel}>סיסמה</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                secureTextEntry
                autoCapitalize="none"
                textAlign="left"
              />
              <Text style={styles.helper}>לפחות 6 תווים.</Text>

              <View style={styles.btnWrap}>
                <PrimaryButton
                  label="הצמד חשבון"
                  onPress={handleLink}
                  loading={busy}
                  disabled={busy}
                />
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  intro: {
    backgroundColor: '#FBEFD9',
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  introText: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: colors.text,
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 21,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  fieldLabel: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.bold,
    color: colors.textMuted,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: spacing.sm,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.md,
    fontSize: fontSize.md,
    fontFamily: fontFamily.regular,
    color: colors.text,
  },
  helper: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontFamily: fontFamily.regular,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: 2,
  },
  btnWrap: { marginTop: spacing.md },
});
