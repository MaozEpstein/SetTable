import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { FoodsTab } from '../components/FoodsTab';
import { HistoryTab } from '../components/HistoryTab';
import { MealsTab } from '../components/MealsTab';
import { MembersTab } from '../components/MembersTab';
import { ScreenHeader } from '../components/ScreenHeader';
import { SegmentedTabs } from '../components/SegmentedTabs';
import { useGroup } from '../hooks/useGroup';
import { colors, fontFamily, fontSize, spacing } from '../theme';
import type { RootStackScreenProps } from '../navigation/types';

type TabKey = 'meals' | 'foods' | 'members' | 'history';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'meals', label: 'ארוחות' },
  { key: 'foods', label: 'מאכלים' },
  { key: 'members', label: 'חברים' },
  { key: 'history', label: 'ארכיון' },
];

export function GroupScreen({
  route,
  navigation,
}: RootStackScreenProps<'Group'>) {
  const { groupId } = route.params;
  const { group, loading, error } = useGroup(groupId);
  const [activeTab, setActiveTab] = useState<TabKey>('meals');

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

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <ScreenHeader title={group.name} onBack={() => navigation.goBack()} />

      <View style={styles.tabsWrap}>
        <SegmentedTabs tabs={TABS} active={activeTab} onChange={setActiveTab} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {activeTab === 'meals' && <MealsTab group={group} />}
        {activeTab === 'foods' && <FoodsTab group={group} />}
        {activeTab === 'members' && <MembersTab group={group} />}
        {activeTab === 'history' && <HistoryTab group={group} />}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  loading: { flex: 1 },
  tabsWrap: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
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
