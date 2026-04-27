import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { crossAlert } from '../utils/crossAlert';
import { PrimaryButton } from './PrimaryButton';
import { useUser } from '../context/UserContext';
import { setAssignee } from '../services/assignments';
import { sendPushNotification } from '../services/push';
import { colors, fontFamily, fontSize, radius, spacing } from '../theme';
import type { AssigneeInfo } from '../types';

type Props = {
  visible: boolean;
  groupId: string;
  groupName: string;
  assignmentId: string;
  foodName: string;
  slotLabel: string;
  assignees: AssigneeInfo[];
  currentAssigneeId: string | null;
  onClose: () => void;
};

export function AssigneePickerModal({
  visible,
  groupId,
  groupName,
  assignmentId,
  foodName,
  slotLabel,
  assignees,
  currentAssigneeId,
  onClose,
}: Props) {
  const { uid, userName } = useUser();
  const [savingId, setSavingId] = useState<string | null>(null);

  const handlePick = async (newId: string | null, isManual: boolean) => {
    if (savingId) return;
    setSavingId(newId ?? '__none__');
    try {
      await setAssignee(groupId, assignmentId, newId);

      const isAssigningOther =
        newId !== null && newId !== uid && newId !== currentAssigneeId && !isManual;
      if (isAssigningOther) {
        sendPushNotification({
          toUid: newId,
          title: `🕯️ שובצת בקבוצה "${groupName}"`,
          body: `${userName} ביקש/ה ממך להכין ${foodName} ל${slotLabel}`,
          data: { groupId, assignmentId },
        }).catch(() => {});
      }

      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'שגיאה לא ידועה';
      crossAlert('אופס', `לא הצלחנו לעדכן.\n${message}`);
    } finally {
      setSavingId(null);
    }
  };

  // Sort: me first, then other real members, then manual members
  const sorted = [...assignees].sort((a, b) => {
    if (a.isMe) return -1;
    if (b.isMe) return 1;
    if (a.isManual && !b.isManual) return 1;
    if (!a.isManual && b.isManual) return -1;
    return a.name.localeCompare(b.name, 'he');
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={styles.title}>מי מכין את "{foodName}"?</Text>

          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            <Pressable
              onPress={() => handlePick(null, false)}
              style={({ pressed }) => [
                styles.row,
                currentAssigneeId === null && styles.rowSelected,
                { opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <View style={[styles.avatar, styles.avatarNone]}>
                <Text style={styles.avatarText}>?</Text>
              </View>
              <Text style={styles.rowText}>טרם שובץ</Text>
              {currentAssigneeId === null && <Text style={styles.checkmark}>✓</Text>}
            </Pressable>

            {sorted.map((a) => {
              const isSelected = currentAssigneeId === a.id;
              return (
                <Pressable
                  key={a.id}
                  onPress={() => handlePick(a.id, a.isManual)}
                  style={({ pressed }) => [
                    styles.row,
                    isSelected && styles.rowSelected,
                    { opacity: pressed ? 0.6 : 1 },
                  ]}
                >
                  <View
                    style={[
                      styles.avatar,
                      a.isMe && styles.avatarMe,
                      a.isManual && styles.avatarManual,
                    ]}
                  >
                    <Text style={styles.avatarText}>{a.name.charAt(0)}</Text>
                  </View>
                  <Text style={styles.rowText}>{a.name}</Text>
                  {a.isMe && <Text style={styles.youTag}>אני</Text>}
                  {a.isManual && <Text style={styles.manualTag}>ידני</Text>}
                  {isSelected && <Text style={styles.checkmark}>✓</Text>}
                </Pressable>
              );
            })}
          </ScrollView>

          <PrimaryButton label="סגור" variant="outline" onPress={onClose} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(31, 42, 68, 0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
    maxHeight: '80%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.xl,
    fontFamily: fontFamily.bold,
    color: colors.text,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: spacing.sm,
  },
  list: { flexGrow: 0 },
  listContent: { gap: spacing.xs, paddingBottom: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    gap: spacing.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  rowSelected: {
    borderColor: colors.primary,
    backgroundColor: '#FBEFD9',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarMe: { backgroundColor: colors.primary },
  avatarManual: { backgroundColor: colors.warning },
  avatarNone: { backgroundColor: colors.border },
  avatarText: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.bold,
    color: '#FFFFFF',
  },
  rowText: {
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
    backgroundColor: colors.surface,
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
  checkmark: {
    fontSize: fontSize.xl,
    color: colors.primary,
    fontFamily: fontFamily.bold,
  },
});
