import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import { PrimaryButton } from './PrimaryButton';
import { useUser } from '../context/UserContext';
import { leaveGroup } from '../services/groups';
import { removeGroupId } from '../storage';
import { colors, fontFamily, fontSize, radius, spacing } from '../theme';
import type { Group } from '../types';

type Props = {
  group: Group;
};

export function MembersTab({ group }: Props) {
  const { uid } = useUser();
  const navigation = useNavigation();
  const [leaving, setLeaving] = useState(false);
  const members = Object.values(group.members ?? {}).sort(
    (a, b) => a.joinedAt - b.joinedAt,
  );

  const handleCopyCode = async () => {
    await Clipboard.setStringAsync(group.code);
    Alert.alert('הועתק ✓', `הקוד ${group.code} הועתק ללוח.`);
  };

  const handleLeave = () => {
    Alert.alert(
      `עזיבת "${group.name}"`,
      'תוסר מרשימת חברי הקבוצה ולא תראה יותר את המאכלים והשיבוצים שלה. תוכל להצטרף שוב בעתיד עם הקוד.',
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'עזוב קבוצה',
          style: 'destructive',
          onPress: async () => {
            setLeaving(true);
            try {
              await leaveGroup(group.id, uid);
              await removeGroupId(group.id);
              navigation.goBack();
            } catch {
              Alert.alert('אופס', 'לא הצלחנו לעזוב את הקבוצה. נסה שוב.');
              setLeaving(false);
            }
          },
        },
      ],
    );
  };

  const handleShareCode = async () => {
    const message = `הוזמנת לקבוצה "${group.name}" ב"שולחן ערוך" 🕯️\n\nקוד הצטרפות: ${group.code}`;
    const available = await Sharing.isAvailableAsync();
    if (available) {
      try {
        await Clipboard.setStringAsync(message);
        Alert.alert(
          'ההזמנה הועתקה ללוח',
          'ההזמנה הועתקה. הדבק ב-WhatsApp או בכל אפליקציה אחרת.',
        );
      } catch {
        Alert.alert('שיתוף', message);
      }
    } else {
      Alert.alert('הזמנה', message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.codeCard}>
        <Text style={styles.codeLabel}>קוד הזמנה לקבוצה</Text>
        <Text style={styles.code}>{group.code}</Text>
        <View style={styles.codeButtons}>
          <View style={styles.buttonHalf}>
            <PrimaryButton
              label="העתק"
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
            <View style={[styles.avatar, m.uid === uid && styles.avatarMe]}>
              <Text style={styles.avatarText}>{m.name.charAt(0)}</Text>
            </View>
            <Text style={styles.memberName}>{m.name}</Text>
            {m.uid === uid && <Text style={styles.youTag}>אני</Text>}
          </View>
        ))}
      </View>

      <View style={styles.dangerSection}>
        <PrimaryButton
          label="עזוב קבוצה"
          variant="outline"
          onPress={handleLeave}
          loading={leaving}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  avatarMe: {
    backgroundColor: colors.primary,
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
  youTag: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.bold,
    color: colors.primary,
    backgroundColor: '#FBEFD9',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  dangerSection: {
    marginTop: spacing.md,
  },
});
