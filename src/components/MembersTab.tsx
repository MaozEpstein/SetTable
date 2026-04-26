import { useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { useToast } from './Toast';
import { AddManualMemberModal } from './AddManualMemberModal';
import { PrimaryButton } from './PrimaryButton';
import { useUser } from '../context/UserContext';
import {
  kickMember,
  leaveGroup,
  promoteToAdmin,
  regenerateInviteCode,
  removeManualMember,
} from '../services/groups';
import { removeGroupId } from '../storage';
import { colors, fontFamily, fontSize, radius, spacing } from '../theme';
import { isGroupAdmin, type Group, type ManualMember, type Member } from '../types';

type Props = {
  group: Group;
};

export function MembersTab({ group }: Props) {
  const { uid } = useUser();
  const navigation = useNavigation();
  const { showToast } = useToast();
  const [leaving, setLeaving] = useState(false);
  const [addManualVisible, setAddManualVisible] = useState(false);

  const members = Object.values(group.members ?? {}).sort(
    (a, b) => a.joinedAt - b.joinedAt,
  );
  const iAmAdmin = isGroupAdmin(group, uid);

  const handleMemberLongPress = (member: Member) => {
    if (!iAmAdmin) return;
    if (member.uid === uid) return;
    const targetIsAdmin = isGroupAdmin(group, member.uid);
    const buttons: { text: string; style?: 'destructive' | 'cancel'; onPress?: () => void }[] = [];
    if (!targetIsAdmin) {
      buttons.push({
        text: 'הפוך למנהל',
        onPress: async () => {
          try {
            await promoteToAdmin(group.id, member.uid);
          } catch {
            Alert.alert('אופס', 'לא הצלחנו לעדכן הרשאות. נסה שוב.');
          }
        },
      });
    }
    buttons.push({
      text: 'הוצא מהקבוצה',
      style: 'destructive',
      onPress: () => confirmKick(member),
    });
    buttons.push({ text: 'ביטול', style: 'cancel' });
    Alert.alert(member.name, targetIsAdmin ? 'משתתף זה כבר מנהל.' : 'בחר פעולה:', buttons);
  };

  const confirmKick = (member: Member) => {
    Alert.alert(
      `הוצאת ${member.name}`,
      'האם אתה בטוח שאתה רוצה להוציא את המשתתף מהקבוצה?',
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'הוצא',
          style: 'destructive',
          onPress: async () => {
            try {
              await kickMember(group.id, member.uid);
            } catch {
              Alert.alert('אופס', 'לא הצלחנו להוציא את המשתתף. נסה שוב.');
            }
          },
        },
      ],
    );
  };
  const manualMembers = (group.manualMembers ?? []).slice().sort(
    (a, b) => a.addedAt - b.addedAt,
  );

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

  const handleRemoveManual = (member: ManualMember) => {
    Alert.alert(
      `הסרת "${member.name}"`,
      'המשתתף יוסר מהקבוצה. שיבוצים שהוקצו לו יחזרו ל"טרם שובץ".',
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'הסר',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeManualMember(group.id, member.id);
            } catch {
              Alert.alert('אופס', 'לא הצלחנו להסיר. נסה שוב.');
            }
          },
        },
      ],
    );
  };

  const handleCopyCode = async () => {
    await Clipboard.setStringAsync(group.code);
    showToast(`הקוד ${group.code} הועתק`);
  };

  const handleRegenerateCode = () => {
    Alert.alert(
      'החלפת קוד הזמנה',
      'הקוד הנוכחי יבוטל ויונפק קוד חדש. מי שעוד לא הצטרף יצטרך לקבל את הקוד החדש.',
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'החלף קוד',
          style: 'destructive',
          onPress: async () => {
            try {
              const next = await regenerateInviteCode(group.id);
              showToast(`קוד חדש: ${next}`);
            } catch {
              showToast('לא הצלחנו להחליף קוד', 'error');
            }
          },
        },
      ],
    );
  };

  const handleShareCode = async () => {
    const message = `הוזמנת לקבוצה "${group.name}" ב"שולחן ערוך" 🕯️\n\nקוד הצטרפות: ${group.code}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    try {
      await Linking.openURL(whatsappUrl);
    } catch {
      // Fallback if WhatsApp / browser can't open the URL
      await Clipboard.setStringAsync(message);
      showToast('ההזמנה הועתקה ללוח', 'info');
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
        {iAmAdmin && (
          <Pressable onPress={handleRegenerateCode} hitSlop={6}>
            <Text style={styles.regenLink}>🔄 החלף קוד הזמנה</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.membersSection}>
        <Text style={styles.sectionTitle}>חברי הקבוצה ({members.length})</Text>
        {members.map((m) => {
          const memberIsAdmin = isGroupAdmin(group, m.uid);
          const canLongPress = iAmAdmin && m.uid !== uid;
          return (
            <Pressable
              key={m.uid}
              onLongPress={canLongPress ? () => handleMemberLongPress(m) : undefined}
              style={({ pressed }) => [
                styles.memberRow,
                canLongPress && pressed ? { opacity: 0.7 } : null,
              ]}
            >
              <View style={[styles.avatar, m.uid === uid && styles.avatarMe]}>
                <Text style={styles.avatarText}>{m.name.charAt(0)}</Text>
              </View>
              <Text style={styles.memberName}>{m.name}</Text>
              {memberIsAdmin && <Text style={styles.adminTag}>מנהל</Text>}
              {m.uid === uid && <Text style={styles.youTag}>אני</Text>}
            </Pressable>
          );
        })}
        {iAmAdmin && members.length > 1 && (
          <Text style={styles.helperText}>
            לחיצה ארוכה על משתתף → הוצאה מהקבוצה / הפיכה למנהל
          </Text>
        )}
      </View>

      <View style={styles.membersSection}>
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>
            משתתפים ידניים ({manualMembers.length})
          </Text>
          <Pressable
            onPress={() => setAddManualVisible(true)}
            hitSlop={8}
            style={({ pressed }) => [
              styles.addManualBtn,
              { opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Text style={styles.addManualBtnText}>+ הוסף</Text>
          </Pressable>
        </View>
        <Text style={styles.helperText}>
          אנשים שלא משתמשים באפליקציה אבל אתה רוצה לשבץ להם מאכלים.
          {'\n'}
          לחיצה ארוכה על שם להסרה.
        </Text>
        {manualMembers.length === 0 ? (
          <View style={styles.emptyManual}>
            <Text style={styles.emptyManualText}>
              אין עדיין משתתפים ידניים. לחץ "+ הוסף" כדי להוסיף.
            </Text>
          </View>
        ) : (
          manualMembers.map((m) => (
            <Pressable
              key={m.id}
              onLongPress={() => handleRemoveManual(m)}
              style={({ pressed }) => [
                styles.memberRow,
                styles.manualRow,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <View style={[styles.avatar, styles.avatarManual]}>
                <Text style={styles.avatarText}>{m.name.charAt(0)}</Text>
              </View>
              <Text style={styles.memberName}>{m.name}</Text>
              <Text style={styles.manualTag}>ידני</Text>
            </Pressable>
          ))
        )}
      </View>

      <View style={styles.dangerSection}>
        <PrimaryButton
          label="עזוב קבוצה"
          variant="outline"
          onPress={handleLeave}
          loading={leaving}
        />
      </View>

      <AddManualMemberModal
        visible={addManualVisible}
        groupId={group.id}
        onClose={() => setAddManualVisible(false)}
      />
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
  buttonHalf: { flex: 1 },
  membersSection: { gap: spacing.sm },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  addManualBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  addManualBtnText: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.bold,
    color: colors.primary,
    writingDirection: 'rtl',
  },
  helperText: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 18,
  },
  emptyManual: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  emptyManualText: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    gap: spacing.md,
  },
  manualRow: {
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarMe: { backgroundColor: colors.primary },
  avatarManual: { backgroundColor: colors.warning },
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
  regenLink: {
    textAlign: 'center',
    fontSize: fontSize.sm,
    fontFamily: fontFamily.bold,
    color: colors.primary,
    paddingVertical: spacing.xs,
    writingDirection: 'rtl',
  },
  adminTag: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.bold,
    color: colors.secondary,
    backgroundColor: '#DEEAEE',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  manualTag: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.bold,
    color: colors.warning,
    backgroundColor: '#FBE6DC',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  dangerSection: { marginTop: spacing.md },
});
