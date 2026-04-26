import { useState } from 'react';
import {
  Alert,
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
import { useUser } from '../context/UserContext';
import { updateNameInAllGroups } from '../services/groups';
import { setUserName as persistUserName } from '../storage';
import { colors, fontFamily, fontSize, radius, spacing } from '../theme';
import type { RootStackScreenProps } from '../navigation/types';

export function SettingsScreen({ navigation }: RootStackScreenProps<'Settings'>) {
  const { uid, userName, username, email, authMethod, setUserName, signOut } = useUser();
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(userName);
  const [saving, setSaving] = useState(false);

  const trimmed = draftName.trim();
  const canSave = trimmed.length >= 2 && trimmed !== userName && !saving;

  const handleStartEdit = () => {
    setDraftName(userName);
    setEditing(true);
  };

  const handleCancel = () => {
    setDraftName(userName);
    setEditing(false);
  };

  const handleSaveName = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await persistUserName(trimmed);
      await updateNameInAllGroups(uid, trimmed);
      setUserName(trimmed);
      setEditing(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'שגיאה לא ידועה';
      Alert.alert('אופס', `לא הצלחנו לעדכן את השם.\n${message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = () => {
    const warning =
      authMethod === 'anonymous'
        ? 'אתה מחובר כאורח — אם תתנתק כעת תאבד את הקבוצות שלך.\n\nמומלץ להצמיד חשבון לפני שתתנתק.'
        : 'תוכל להיכנס שוב מכל מכשיר עם פרטי ההתחברות שלך.';
    Alert.alert(
      'התנתקות',
      warning,
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'התנתק',
          style: 'destructive',
          onPress: () => signOut(),
        },
      ],
    );
  };

  const authLabel =
    authMethod === 'google'
      ? `Google · ${email ?? ''}`
      : authMethod === 'username'
        ? `שם משתמש · ${username ?? ''}`
        : 'אורח (לא מוצמד)';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <ScreenHeader title="הגדרות" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>פרופיל</Text>

            <View style={styles.card}>
              <Text style={styles.fieldLabel}>השם שלי</Text>
              {editing ? (
                <>
                  <TextInput
                    value={draftName}
                    onChangeText={setDraftName}
                    style={styles.input}
                    autoFocus
                    maxLength={30}
                    textAlign="right"
                    returnKeyType="done"
                    onSubmitEditing={handleSaveName}
                  />
                  <Text style={styles.helper}>
                    השם יתעדכן גם אצל כל החברים בקבוצות שלך
                  </Text>
                  <View style={styles.editButtons}>
                    <View style={styles.buttonHalf}>
                      <PrimaryButton
                        label="ביטול"
                        variant="outline"
                        onPress={handleCancel}
                        disabled={saving}
                      />
                    </View>
                    <View style={styles.buttonHalf}>
                      <PrimaryButton
                        label="שמור"
                        onPress={handleSaveName}
                        disabled={!canSave}
                        loading={saving}
                      />
                    </View>
                  </View>
                </>
              ) : (
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldValue}>{userName}</Text>
                  <Pressable
                    onPress={handleStartEdit}
                    hitSlop={8}
                    style={({ pressed }) => [styles.editLink, { opacity: pressed ? 0.5 : 1 }]}
                  >
                    <Text style={styles.editLinkText}>שנה שם</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>חשבון</Text>
            <View style={styles.card}>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>סוג</Text>
                <Text style={styles.fieldMuted}>{authLabel}</Text>
              </View>
            </View>
            {authMethod === 'anonymous' && (
              <Pressable
                onPress={() => navigation.navigate('LinkAccount')}
                style={({ pressed }) => [styles.linkCard, { opacity: pressed ? 0.7 : 1 }]}
              >
                <Text style={styles.linkTitle}>📌 הצמד חשבון</Text>
                <Text style={styles.linkHelper}>
                  שמור את הזיהוי שלך לתמיד עם שם משתמש וסיסמה. תוכל להיכנס מכל מכשיר.
                </Text>
              </Pressable>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>פרטיות</Text>
            <Pressable
              onPress={handleSignOut}
              style={({ pressed }) => [styles.dangerCard, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Text style={styles.dangerTitle}>התנתק</Text>
              <Text style={styles.dangerHelper}>
                {authMethod === 'anonymous'
                  ? 'ימחק את החשבון האנונימי. הקבוצות יילכו לאיבוד.'
                  : 'יסיים את ההפעלה. תוכל להיכנס שוב עם הפרטים שלך.'}
              </Text>
            </Pressable>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>אודות</Text>
            <View style={styles.card}>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>גרסה</Text>
                <Text style={styles.fieldMuted}>1.0.0 (MVP)</Text>
              </View>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>שם</Text>
                <Text style={styles.fieldMuted}>🕯️ שולחן ערוך</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: colors.background },
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  section: {
    gap: spacing.sm,
  },
  sectionLabel: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.bold,
    color: colors.textMuted,
    textAlign: 'right',
    writingDirection: 'rtl',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  fieldLabel: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.medium,
    color: colors.textMuted,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  fieldValue: {
    flex: 1,
    fontSize: fontSize.lg,
    fontFamily: fontFamily.bold,
    color: colors.text,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  fieldMuted: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.regular,
    color: colors.text,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  editLink: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  editLinkText: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.bold,
    color: colors.primary,
    writingDirection: 'rtl',
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.lg,
    fontFamily: fontFamily.regular,
    color: colors.text,
    backgroundColor: colors.background,
    writingDirection: 'rtl',
  },
  helper: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  editButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  buttonHalf: {
    flex: 1,
  },
  linkCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    gap: spacing.xs,
  },
  linkTitle: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.bold,
    color: colors.primary,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  linkHelper: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 20,
  },
  dangerCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.warning,
    gap: spacing.xs,
  },
  dangerTitle: {
    fontSize: fontSize.lg,
    fontFamily: fontFamily.bold,
    color: colors.warning,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  dangerHelper: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
