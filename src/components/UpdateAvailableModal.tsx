import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from './PrimaryButton';
import { colors, fontFamily, fontSize, radius, spacing } from '../theme';
import type { UpdateInfo } from '../services/updateCheck';

type Props = {
  info: UpdateInfo;
  onDismiss: () => void;
};

export function UpdateAvailableModal({ info, onDismiss }: Props) {
  const handleDownload = async () => {
    try {
      await Linking.openURL(info.apkUrl);
    } catch {
      // ignore — user can retry
    }
  };

  // Show release notes if any (filter out empty lines / markdown headers heuristically)
  const cleanedNotes = info.releaseNotes
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .slice(0, 6)
    .join('\n');

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.icon}>🆕</Text>
          <Text style={styles.title}>גרסה חדשה זמינה</Text>
          <Text style={styles.versionLine}>
            גרסה {info.latestVersion} שוחררה
            {info.currentVersion ? ` · אצלך ${info.currentVersion}` : ''}
          </Text>

          {cleanedNotes ? (
            <ScrollView style={styles.notesBox} contentContainerStyle={styles.notesContent}>
              <Text style={styles.notesText}>{cleanedNotes}</Text>
            </ScrollView>
          ) : (
            <Text style={styles.helper}>שיפורים ותיקונים.</Text>
          )}

          <View style={styles.btnWrap}>
            <PrimaryButton label="הורד עכשיו" icon="📥" onPress={handleDownload} />
          </View>

          <Pressable onPress={onDismiss} hitSlop={8}>
            <Text style={styles.later}>לא עכשיו</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    gap: spacing.sm,
  },
  icon: { fontSize: 40 },
  title: {
    fontSize: fontSize.xl,
    fontFamily: fontFamily.bold,
    color: colors.text,
    textAlign: 'center',
  },
  versionLine: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.medium,
    color: colors.textMuted,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  helper: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
    writingDirection: 'rtl',
    paddingVertical: spacing.sm,
  },
  notesBox: {
    width: '100%',
    maxHeight: 160,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginVertical: spacing.sm,
  },
  notesContent: {
    paddingBottom: spacing.xs,
  },
  notesText: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontFamily: fontFamily.regular,
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 21,
  },
  btnWrap: { width: '100%', marginTop: spacing.sm },
  later: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.medium,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.sm,
    writingDirection: 'rtl',
  },
});
