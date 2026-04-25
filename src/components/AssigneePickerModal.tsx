import { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { PrimaryButton } from './PrimaryButton';
import { useUser } from '../context/UserContext';
import { setAssignee } from '../services/assignments';
import { colors, fontFamily, fontSize, radius, spacing } from '../theme';
import type { Member } from '../types';

type Props = {
  visible: boolean;
  groupId: string;
  assignmentId: string;
  foodName: string;
  members: Member[];
  currentAssigneeUid: string | null;
  onClose: () => void;
};

export function AssigneePickerModal({
  visible,
  groupId,
  assignmentId,
  foodName,
  members,
  currentAssigneeUid,
  onClose,
}: Props) {
  const { uid } = useUser();
  const [savingUid, setSavingUid] = useState<string | null>(null);

  const handlePick = async (newUid: string | null) => {
    if (savingUid) return;
    setSavingUid(newUid ?? '__none__');
    try {
      await setAssignee(groupId, assignmentId, newUid);
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'שגיאה לא ידועה';
      Alert.alert('אופס', `לא הצלחנו לעדכן.\n${message}`);
    } finally {
      setSavingUid(null);
    }
  };

  const sortedMembers = [...members].sort((a, b) => {
    if (a.uid === uid) return -1;
    if (b.uid === uid) return 1;
    return a.joinedAt - b.joinedAt;
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
              onPress={() => handlePick(null)}
              style={({ pressed }) => [
                styles.row,
                currentAssigneeUid === null && styles.rowSelected,
                { opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <View style={[styles.avatar, styles.avatarNone]}>
                <Text style={styles.avatarText}>?</Text>
              </View>
              <Text style={styles.rowText}>טרם שובץ</Text>
              {currentAssigneeUid === null && <Text style={styles.checkmark}>✓</Text>}
            </Pressable>

            {sortedMembers.map((m) => {
              const isMe = m.uid === uid;
              const isSelected = currentAssigneeUid === m.uid;
              return (
                <Pressable
                  key={m.uid}
                  onPress={() => handlePick(m.uid)}
                  style={({ pressed }) => [
                    styles.row,
                    isSelected && styles.rowSelected,
                    { opacity: pressed ? 0.6 : 1 },
                  ]}
                >
                  <View style={[styles.avatar, isMe && styles.avatarMe]}>
                    <Text style={styles.avatarText}>{m.name.charAt(0)}</Text>
                  </View>
                  <Text style={styles.rowText}>{m.name}</Text>
                  {isMe && <Text style={styles.youTag}>אני</Text>}
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
  list: {
    flexGrow: 0,
  },
  listContent: {
    gap: spacing.xs,
    paddingBottom: spacing.md,
  },
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
  avatarMe: {
    backgroundColor: colors.primary,
  },
  avatarNone: {
    backgroundColor: colors.border,
  },
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
  checkmark: {
    fontSize: fontSize.xl,
    color: colors.primary,
    fontFamily: fontFamily.bold,
  },
});
