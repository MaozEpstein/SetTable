import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { useGoogleSignIn } from '../services/googleSignIn';
import {
  sendPasswordResetByUsername,
  signInWithUsername,
} from '../services/userAuth';
import { translateAuthError } from '../utils/authErrors';
import { colors, fontFamily, fontSize, radius, spacing } from '../theme';

type Mode = 'choose' | 'username';

type Props = {
  onSwitchToRegister: () => void;
};

export function LoginScreen({ onSwitchToRegister }: Props) {
  const [mode, setMode] = useState<Mode>('choose');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const google = useGoogleSignIn();

  useEffect(() => {
    if (google.error) {
      crossAlert('Google Sign-In', google.error);
    }
  }, [google.error]);

  const handleGoogle = async () => {
    if (!google.request) return;
    try {
      await google.promptAsync();
    } catch (err) {
      crossAlert('Google Sign-In', translateAuthError(err));
    }
  };

  const handleUsernameLogin = async () => {
    const u = username.trim();
    if (!u || !password) {
      crossAlert('חסרים פרטים', 'הזן שם משתמש וסיסמה');
      return;
    }
    setBusy(true);
    try {
      await signInWithUsername(u, password);
      // onAuthStateChanged elsewhere will pick this up.
    } catch (err) {
      crossAlert('אופס', translateAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleForgot = async () => {
    const u = username.trim();
    if (!u) {
      crossAlert('שם משתמש', 'הזן את שם המשתמש כדי שנשלח קישור לאיפוס');
      return;
    }
    try {
      const masked = await sendPasswordResetByUsername(u);
      crossAlert(
        'נשלח קישור איפוס',
        `שלחנו קישור לאיפוס סיסמה לכתובת ${masked}.\nבדוק את תיבת הדואר.`,
      );
    } catch (err) {
      crossAlert('אופס', translateAuthError(err));
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
              <PlateIcon size={110} />
              <Text style={styles.title}>שולחן ערוך</Text>
              <Text style={styles.subtitle}>תכנון ארוחות שבת משותפות</Text>
            </View>

            {mode === 'choose' && (
              <View style={styles.card}>
                <Text style={styles.welcome}>ברוכים הבאים 👋</Text>
                <Text style={styles.prompt}>בחר איך להתחבר</Text>

                <View style={styles.btnWrap}>
                  <PrimaryButton
                    label="התחבר עם Google"
                    icon="🟢"
                    onPress={handleGoogle}
                    disabled={!google.request || google.loading}
                    loading={google.loading}
                  />
                </View>

                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>או</Text>
                  <View style={styles.dividerLine} />
                </View>

                <View style={styles.btnWrap}>
                  <PrimaryButton
                    label="התחבר עם שם משתמש"
                    icon="👤"
                    variant="outline"
                    onPress={() => setMode('username')}
                  />
                </View>

                <Pressable onPress={onSwitchToRegister} hitSlop={8}>
                  <Text style={styles.switch}>
                    אין לך חשבון? <Text style={styles.switchAction}>הירשם כאן</Text>
                  </Text>
                </Pressable>
              </View>
            )}

            {mode === 'username' && (
              <View style={styles.card}>
                <Text style={styles.welcome}>התחברות</Text>
                <Text style={styles.prompt}>שם משתמש</Text>
                <TextInput
                  value={username}
                  onChangeText={setUsername}
                  placeholder="לדוגמה: dana_levi"
                  placeholderTextColor={colors.textMuted}
                  style={styles.input}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textAlign="right"
                />
                <Text style={styles.prompt}>סיסמה</Text>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••"
                  placeholderTextColor={colors.textMuted}
                  style={styles.input}
                  secureTextEntry
                  autoCapitalize="none"
                  textAlign="right"
                  onSubmitEditing={handleUsernameLogin}
                />
                <View style={styles.btnWrap}>
                  <PrimaryButton
                    label="התחבר"
                    onPress={handleUsernameLogin}
                    loading={busy}
                    disabled={busy}
                  />
                </View>
                <Pressable onPress={handleForgot} hitSlop={8}>
                  <Text style={styles.forgot}>שכחתי סיסמה</Text>
                </Pressable>
                <Pressable onPress={() => setMode('choose')} hitSlop={8}>
                  <Text style={styles.back}>← חזור</Text>
                </Pressable>
              </View>
            )}

            {google.loading && (
              <View style={styles.overlay}>
                <ActivityIndicator color={colors.primary} size="large" />
              </View>
            )}
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
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.xxl,
    fontFamily: fontFamily.bold,
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.sm,
    shadowColor: colors.shadow,
    shadowOpacity: 1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  welcome: {
    fontSize: fontSize.lg,
    fontFamily: fontFamily.bold,
    color: colors.text,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  prompt: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.medium,
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
  btnWrap: { marginTop: spacing.md },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: spacing.md,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontFamily: fontFamily.medium,
  },
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
  forgot: {
    textAlign: 'center',
    color: colors.primary,
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    marginTop: spacing.sm,
  },
  back: {
    textAlign: 'center',
    color: colors.textMuted,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    marginTop: spacing.sm,
  },
  overlay: {
    position: 'absolute',
    top: 0, bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
