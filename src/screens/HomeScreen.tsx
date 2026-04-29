import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { PlateIcon } from '../components/PlateIcon';
import { PrimaryButton } from '../components/PrimaryButton';
import { useUser } from '../context/UserContext';
import { useGroups } from '../hooks/useGroups';
import { colors, fontFamily, fontSize, radius, spacing } from '../theme';
import type { Group } from '../types';
import type { RootStackScreenProps } from '../navigation/types';

export function HomeScreen({ navigation }: RootStackScreenProps<'Home'>) {
  const { uid, userName } = useUser();
  const { groups, loading, error } = useGroups(uid);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Pressable
              onPress={() => navigation.navigate('Settings')}
              hitSlop={12}
              style={({ pressed }) => [styles.settingsButton, { opacity: pressed ? 0.5 : 1 }]}
            >
              <Text style={styles.settingsIcon}>⚙️</Text>
            </Pressable>
            <Text style={styles.logo}>🕯️ שולחן ערוך</Text>
          </View>
          <Text style={styles.greeting}>שלום, {userName} 👋</Text>
        </View>

        <View style={styles.groupsSection}>
          <Text style={styles.sectionTitle}>הקבוצות שלי</Text>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : error ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorTitle}>לא הצלחנו לטעון קבוצות</Text>
              <Text style={styles.errorText}>{error.message}</Text>
            </View>
          ) : groups.length === 0 ? (
            <View style={styles.emptyCard}>
              <PlateIcon size={88} state="empty" />
              <Text style={styles.emptyTitle}>עוד אין קבוצות</Text>
              <Text style={styles.emptyText}>
                צרו קבוצה חדשה והזמינו את המשפחה והחברים,
                {'\n'}
                או הצטרפו לקבוצה קיימת עם קוד
              </Text>
            </View>
          ) : (
            <View style={styles.groupsList}>
              {groups.map((group) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  onPress={() => navigation.navigate('Group', { groupId: group.id })}
                />
              ))}
            </View>
          )}
        </View>

        <View style={styles.actions}>
          <PrimaryButton
            label="צור קבוצה חדשה"
            icon="+"
            onPress={() => navigation.navigate('CreateGroup')}
          />
          <PrimaryButton
            label="הצטרף עם קוד"
            icon="🔑"
            variant="outline"
            onPress={() => navigation.navigate('JoinGroup')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function GroupCard({ group, onPress }: { group: Group; onPress: () => void }) {
  const memberCount = Object.keys(group.members ?? {}).length;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={styles.cardIcon}>
        <Text style={styles.cardIconText}>👨‍👩‍👧</Text>
      </View>
      <View style={styles.cardMain}>
        <Text style={styles.cardName} numberOfLines={1}>
          {group.name}
        </Text>
        <Text style={styles.cardMeta}>
          {memberCount} {memberCount === 1 ? 'חבר' : 'חברים'} · קוד: {group.code}
        </Text>
        <Text style={styles.cardCta}>פתח ←</Text>
      </View>
      <Text style={styles.chevron}>‹</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  header: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
  },
  settingsButton: {
    padding: spacing.xs,
  },
  settingsIcon: {
    fontSize: fontSize.xl,
  },
  logo: {
    fontSize: fontSize.xl,
    fontFamily: fontFamily.bold,
    color: colors.primary,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  greeting: {
    fontSize: fontSize.lg,
    fontFamily: fontFamily.medium,
    color: colors.text,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  groupsSection: {
    flex: 1,
    gap: spacing.md,
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
  loadingBox: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  groupsList: {
    gap: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
    gap: spacing.md,
    borderWidth: 2,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  cardPressed: {
    backgroundColor: '#FBEFD9',
    transform: [{ scale: 0.98 }],
    shadowOpacity: 0.4,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FBEFD9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconText: {
    fontSize: fontSize.xl,
  },
  cardMain: {
    flex: 1,
    gap: spacing.xs,
  },
  cardName: {
    fontSize: fontSize.lg,
    fontFamily: fontFamily.bold,
    color: colors.text,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  cardMeta: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  cardCta: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.bold,
    color: colors.primary,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: 2,
  },
  chevron: {
    fontSize: fontSize.xxl,
    color: colors.primary,
    fontFamily: fontFamily.bold,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    gap: spacing.sm,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontFamily: fontFamily.bold,
    color: colors.text,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  emptyText: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
    textAlign: 'center',
    writingDirection: 'rtl',
    lineHeight: 20,
  },
  errorCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.warning,
    gap: spacing.sm,
  },
  errorTitle: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.bold,
    color: colors.warning,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  errorText: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  actions: {
    gap: spacing.md,
  },
});
