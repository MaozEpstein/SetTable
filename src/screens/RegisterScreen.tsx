import { useState } from 'react';
import {
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
import { crossAlert } from '../utils/crossAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { PlateIcon } from '../components/PlateIcon';
import { PrimaryButton } from '../components/PrimaryButton';
import { isUsernameAvailable, registerWithUsername } from '../services/userAuth';
import { translateAuthError } from '../utils/authErrors';
import {
  validateEmail,
  validatePassword,
  validateUsername,
} from '../utils/usernameValidation';
import { colors, fontFamily, fontSize, radius, spacing } from '../theme';

type Props = {
  onSwitchToLogin: () => void;
};

export function RegisterScreen({ onSwitchToLogin }: Props) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [busy, setBusy] = useState(false);

  const handleRegister = async () => {
    const uCheck = validateUsername(username);
    if (!uCheck.ok) {
      crossAlert('שם משתמש', uCheck.reason);
      return;
    }
    const eCheck = validateEmail(email);
    if (!eCheck.ok) {
      crossAlert('אימייל', eCheck.reason);
      return;
    }
    const pCheck = validatePassword(password);
    if (!pCheck.ok) {
      crossAlert('סיסמה', pCheck.reason);
      return;
    }
    if (displayName.trim().length < 2) {
      crossAlert('שם תצוגה', 'הזן שם תצוגה (לפחות 2 תווים)');
      return;
    }

    setBusy(true);
    try {
      const available = await isUsernameAvailable(username);
      if (!available) {
        crossAlert('שם משתמש תפוס', 'שם המשתמש תפוס. בחר שם אחר.');
        return;
      }
      await registerWithUsername({
        username,
        email,
        password,
        displayName,
      });
      // onAuthStateChanged elsewhere will pick up the new user.
    } catch (err) {
      crossAlert('אופס', translateAuthError(err));
    } finally {
      setBusy(false);
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
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.header}>
              <PlateIcon size={88} />
              <Text style={styles.title}>יצירת חשבון</Text>
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
              <Text style={styles.helper}>אותיות אנגליות, ספרות, _ . 3-20 תווים.</Text>

              <Text style={styles.fieldLabel}>אימייל (לשחזור סיסמה)</Text>
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
              <Text style={styles.helper}>נשלח לכאן קישור לאיפוס אם תשכח את הסיסמה.</Text>

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

              <Text style={styles.fieldLabel}>שם תצוגה (איך יקראו לך בקבוצה)</Text>
              <TextInput
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="דנה"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                maxLength={30}
                textAlign="right"
              />
              <Text style={styles.helper}>השם שיופיע לחברי הקבוצה.</Text>

              <View style={styles.btnWrap}>
                <PrimaryButton
                  label="צור חשבון"
                  onPress={handleRegister}
                  loading={busy}
                  disabled={busy}
                />
              </View>

              <Pressable onPress={onSwitchToLogin} hitSlop={8}>
                <Text style={styles.switch}>
                  כבר יש לך חשבון? <Text style={styles.switchAction}>התחבר</Text>
                </Text>
              </Pressable>
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
  },
  header: {
    alignItems: 'center',
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.xl,
    fontFamily: fontFamily.bold,
    color: colors.text,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.xs,
    shadowColor: colors.shadow,
    shadowOpacity: 1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
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
  switch: {
    textAlign: 'center',
    color: colors.textMuted,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    marginTop: spacing.md,
  },
  switchAction: {
    color: colors.primary,
    fontFamily: fontFamily.bold,
  },
});
