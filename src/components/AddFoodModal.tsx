import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { PrimaryButton } from './PrimaryButton';
import { useUser } from '../context/UserContext';
import { createFood } from '../services/foods';
import { colors, fontFamily, fontSize, radius, spacing } from '../theme';
import type { CategoryInfo, FoodCategory } from '../types';

type Props = {
  visible: boolean;
  groupId: string;
  categories: CategoryInfo[];
  existingNames?: string[];
  onClose: () => void;
  onCreated?: (foodId: string) => void;
};

function normalizeName(s: string): string {
  return s.trim().replace(/\s+/g, ' ').toLowerCase();
}

export function AddFoodModal({
  visible,
  groupId,
  categories,
  existingNames = [],
  onClose,
  onCreated,
}: Props) {
  const { uid } = useUser();
  const [name, setName] = useState('');
  const [selected, setSelected] = useState<Set<FoodCategory>>(new Set());
  const [saving, setSaving] = useState(false);

  const trimmed = name.trim();
  const isDuplicate =
    trimmed.length >= 2 &&
    existingNames.some((n) => normalizeName(n) === normalizeName(trimmed));
  const canSubmit =
    trimmed.length >= 2 && selected.size > 0 && !saving && !isDuplicate;

  const reset = () => {
    setName('');
    setSelected(new Set());
    setSaving(false);
  };

  const handleClose = () => {
    if (saving) return;
    reset();
    onClose();
  };

  const toggleCategory = (cat: FoodCategory) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const handleSave = async () => {
    if (!canSubmit) return;
    setSaving(true);
    try {
      const newId = await createFood({
        groupId,
        name: trimmed,
        categories: Array.from(selected),
        uid,
      });
      reset();
      onClose();
      onCreated?.(newId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'שגיאה לא ידועה';
      Alert.alert('אופס', `לא הצלחנו להוסיף את המאכל.\n${message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.handle} />
            <Text style={styles.title}>הוסף מאכל חדש</Text>
            <Text style={styles.helper}>
              המאכל יישמר ברשימת המאכלים של הקבוצה ויהיה זמין לשיבוץ לארוחות
            </Text>

            <Text style={styles.label}>שם המאכל</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="לדוגמה: חמין, סלט ירקות, עוגת שוקולד"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              autoFocus
              maxLength={40}
              textAlign="right"
            />
            {isDuplicate && (
              <Text style={styles.errorText}>
                כבר קיים מאכל בשם הזה ברשימה — אי אפשר להוסיף את אותו מאכל פעמיים
              </Text>
            )}

            <Text style={styles.label}>
              קטגוריות{selected.size > 0 ? ` (${selected.size})` : ''}
            </Text>
            <Text style={styles.subHelper}>
              ניתן לבחור יותר מאחת — למשל אורז עם עוף שייך גם לבשר וגם לפחמימה
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chips}
            >
              {categories.map((cat) => {
                const isActive = selected.has(cat.key);
                return (
                  <Pressable
                    key={cat.key}
                    onPress={() => toggleCategory(cat.key)}
                    style={({ pressed }) => [
                      styles.chip,
                      isActive && styles.chipActive,
                      { opacity: pressed ? 0.7 : 1 },
                    ]}
                  >
                    <Text style={styles.chipEmoji}>{cat.emoji}</Text>
                    <Text style={[styles.chipLabel, isActive && styles.chipLabelActive]}>
                      {cat.label}
                    </Text>
                    {isActive && <Text style={styles.chipCheck}>✓</Text>}
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.actions}>
              <View style={styles.buttonHalf}>
                <PrimaryButton
                  label="ביטול"
                  variant="outline"
                  onPress={handleClose}
                  disabled={saving}
                />
              </View>
              <View style={styles.buttonHalf}>
                <PrimaryButton
                  label="הוסף"
                  onPress={handleSave}
                  disabled={!canSubmit}
                  loading={saving}
                />
              </View>
            </View>
          </KeyboardAvoidingView>
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
  },
  helper: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.bold,
    color: colors.textMuted,
    textAlign: 'right',
    writingDirection: 'rtl',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.sm,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.lg,
    fontFamily: fontFamily.regular,
    color: colors.text,
    backgroundColor: colors.surface,
    writingDirection: 'rtl',
  },
  chips: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.xs,
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: '#FBEFD9',
  },
  chipEmoji: {
    fontSize: fontSize.md,
  },
  chipLabel: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.medium,
    color: colors.text,
    writingDirection: 'rtl',
  },
  chipLabelActive: {
    color: colors.primaryDark,
    fontFamily: fontFamily.bold,
  },
  chipCheck: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.bold,
    color: colors.primary,
    marginRight: 2,
  },
  subHelper: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  buttonHalf: {
    flex: 1,
  },
  errorText: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.medium,
    color: colors.warning,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: spacing.xs,
  },
});
