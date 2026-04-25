import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenHeader } from '../components/ScreenHeader';
import { useGroup } from '../hooks/useGroup';
import { colors, fontFamily, fontSize, radius, spacing } from '../theme';
import type { RootStackScreenProps } from '../navigation/types';

export function GroupScreen({
  route,
  navigation,
}: RootStackScreenProps<'Group'>) {
  const { groupId } = route.params;
  const { group, loading, error } = useGroup(groupId);

  const handleCopyCode = async () => {
    if (!group) return;
    await Clipboard.setStringAsync(group.code);
    Alert.alert('הועתק ✓', `הקוד ${group.code} הועתק ללוח.`);
  };

  const handleShareCode = async () => {
    if (!group) return;
    const message = `הוזמנת לקבוצה "${group.name}" ב"שולחן ערוך" 🕯️\n\nקוד הצטרפות: ${group.code}`;

    const available = await Sharing.isAvailableAsync();
    if (available) {
      try {
        await Clipboard.setStringAsync(message);
        Alert.alert(
          'ההזמנה הועתקה ללוח',
          'הקוד וההזמנה הועתקו. הדבק ב-WhatsApp או בכל אפליקציה אחרת.',
        );
      } catch {
        Alert.alert('שיתוף', message);
      }
    } else {
      Alert.alert('הזמנה', message);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ActivityIndicator color={colors.primary} size="large" style={styles.loading} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScreenHeader title="שגיאה" onBack={() => navigation.goBack()} />
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>שגיאה בטעינת הקבוצה:</Text>
          <Text style={styles.errorDetail}>{error.message}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!group) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScreenHeader title="קבוצה לא נמצאה" onBack={() => navigation.goBack()} />
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>הקבוצה לא נמצאה או נמחקה.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const members = Object.values(group.members ?? {}).sort(
    (a, b) => a.joinedAt - b.joinedAt,
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <ScreenHeader title={group.name} onBack={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>קוד הזמנה לקבוצה</Text>
          <Text style={styles.code}>{group.code}</Text>
          <View style={styles.codeButtons}>
            <View style={styles.buttonHalf}>
              <PrimaryButton
                label="העתק קוד"
                icon="📋"
                variant="outline"
                onPress={handleCopyCode}
              />
            </View>
            <View style={styles.buttonHalf}>
              <PrimaryButton
                label="שתף"
                icon="🔗"
                onPress={handleShareCode}
              />
            </View>
          </View>
        </View>

        <View style={styles.membersSection}>
          <Text style={styles.sectionTitle}>חברי הקבוצה ({members.length})</Text>
          {members.map((m) => (
            <View key={m.uid} style={styles.memberRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{m.name.charAt(0)}</Text>
              </View>
              <Text style={styles.memberName}>{m.name}</Text>
            </View>
          ))}
        </View>

        <View style={styles.placeholderCard}>
          <Text style={styles.placeholderEmoji}>🍽️</Text>
          <Text style={styles.placeholderTitle}>מאכלים וארוחות</Text>
          <Text style={styles.placeholderText}>
            ניהול המאכלים והשיבוץ לארוחות יבוא בשלב 3
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  loading: { flex: 1 },
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  codeCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.xl,
    alignItems: 'center',
    gap: spacing.md,
    shadowColor: colors.shadow,
    shadowOpacity: 1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  codeLabel: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.medium,
    color: colors.textMuted,
    textAlign: 'center',
    writingDirection: 'rtl',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  code: {
    fontSize: 44,
    fontFamily: fontFamily.bold,
    color: colors.primary,
    letterSpacing: 8,
    textAlign: 'center',
  },
  codeButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignSelf: 'stretch',
  },
  buttonHalf: {
    flex: 1,
  },
  membersSection: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.bold,
    color: colors.textMuted,
    textAlign: 'right',
    writingDirection: 'rtl',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    gap: spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: fontSize.lg,
    fontFamily: fontFamily.bold,
    color: '#FFFFFF',
  },
  memberName: {
    flex: 1,
    fontSize: fontSize.md,
    fontFamily: fontFamily.medium,
    color: colors.text,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  placeholderCard: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderRadius: radius.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    gap: spacing.sm,
  },
  placeholderEmoji: {
    fontSize: 48,
  },
  placeholderTitle: {
    fontSize: fontSize.lg,
    fontFamily: fontFamily.bold,
    color: colors.text,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  placeholderText: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  errorBox: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  errorText: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.medium,
    color: colors.warning,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  errorDetail: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
