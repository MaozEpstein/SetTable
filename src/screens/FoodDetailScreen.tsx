import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { FullScreenTextEditor } from '../components/FullScreenTextEditor';
import { ImageViewerModal } from '../components/ImageViewerModal';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenHeader } from '../components/ScreenHeader';
import { SlotPickerModal } from '../components/SlotPickerModal';
import { useUser } from '../context/UserContext';
import { useFood } from '../hooks/useFood';
import { useGroup } from '../hooks/useGroup';
import { createAssignment } from '../services/assignments';
import {
  addImageToFood,
  deleteFood,
  removeImageFromFood,
  updateFood,
} from '../services/foods';
import { deleteAssignmentsForFood } from '../services/assignments';
import { colors, fontFamily, fontSize, radius, spacing } from '../theme';
import {
  getAllCategories,
  getAllSlots,
  getCategoryInfo,
  getFoodCategories,
  type CategoryInfo,
  type FoodCategory,
  type SlotInfo,
} from '../types';
import type { RootStackScreenProps } from '../navigation/types';

export function FoodDetailScreen({
  route,
  navigation,
}: RootStackScreenProps<'FoodDetail'>) {
  const { groupId, foodId } = route.params;
  const { uid } = useUser();
  const { group } = useGroup(groupId);
  const { food, loading } = useFood(groupId, foodId);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [selectedCats, setSelectedCats] = useState<Set<FoodCategory>>(new Set());
  const [recipe, setRecipe] = useState('');
  const [notes, setNotes] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [slotPickerOpen, setSlotPickerOpen] = useState(false);
  const [addingToSlot, setAddingToSlot] = useState(false);
  const [recipeEditorOpen, setRecipeEditorOpen] = useState(false);
  const [notesEditorOpen, setNotesEditorOpen] = useState(false);

  // Sync local edit state when food loads or edit mode toggles on
  useEffect(() => {
    if (!food) return;
    setName(food.name);
    setSelectedCats(new Set(getFoodCategories(food)));
    setRecipe(food.recipe ?? '');
    setNotes(food.notes ?? '');
    setIsFavorite(!!food.isFavorite);
  }, [food, editing]);

  const categories: CategoryInfo[] = group ? getAllCategories(group) : [];
  const slots: SlotInfo[] = group ? getAllSlots(group) : [];
  const images = food?.images ?? [];

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ActivityIndicator color={colors.primary} size="large" style={styles.loading} />
      </SafeAreaView>
    );
  }

  if (!food) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScreenHeader title="מאכל לא נמצא" onBack={() => navigation.goBack()} />
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>המאכל לא נמצא או נמחק.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const trimmedName = name.trim();
  const canSave =
    trimmedName.length >= 2 && selectedCats.size > 0 && !saving;

  const toggleCategory = (key: FoodCategory) => {
    setSelectedCats((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await updateFood({
        groupId,
        foodId,
        name: trimmedName,
        categories: Array.from(selectedCats),
        recipe,
        notes,
        isFavorite,
      });
      setEditing(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'שגיאה לא ידועה';
      Alert.alert('אופס', `לא הצלחנו לשמור.\n${message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('הרשאה נדרשת', 'אפשר את הגישה לתמונות בהגדרות הטלפון.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.85,
    });
    if (result.canceled) return;

    setUploadingImage(true);
    try {
      const asset = result.assets[0];
      // Resize to max 1024 wide, JPEG quality 0.7
      const manipulated = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 1024 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG },
      );
      await addImageToFood(groupId, foodId, manipulated.uri);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      Alert.alert('אופס', `לא הצלחנו להעלות תמונה.\n${message}`);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteImage = (url: string) => {
    Alert.alert('מחיקת תמונה', 'למחוק את התמונה?', [
      { text: 'ביטול', style: 'cancel' },
      {
        text: 'מחק',
        style: 'destructive',
        onPress: () => removeImageFromFood(groupId, foodId, url).catch(() => {
          Alert.alert('אופס', 'לא הצלחנו למחוק את התמונה.');
        }),
      },
    ]);
  };

  const handleDeleteFood = () => {
    Alert.alert(
      'מחיקת מאכל',
      `האם אתה בטוח שברצונך למחוק את "${food.name}"?\n\nכל השיבוצים של המאכל לארוחות יימחקו, וגם כל התמונות שהועלו לו. פעולה זו לא ניתנת לביטול.`,
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'כן, מחק',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAssignmentsForFood(groupId, foodId);
              await deleteFood(groupId, foodId);
              navigation.goBack();
            } catch {
              Alert.alert('אופס', 'לא הצלחנו למחוק. נסה שוב.');
            }
          },
        },
      ],
    );
  };

  const handlePickSlot = async (slot: SlotInfo) => {
    setSlotPickerOpen(false);
    setAddingToSlot(true);
    try {
      await createAssignment({ groupId, foodId, slot: slot.key, uid });
      Alert.alert('שובץ ✓', `"${food.name}" נוסף ל${slot.label}.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'שגיאה לא ידועה';
      Alert.alert('אופס', `לא הצלחנו לשבץ.\n${message}`);
    } finally {
      setAddingToSlot(false);
    }
  };

  const handleShareFood = async () => {
    const lines: string[] = [];
    lines.push(`🍽️ ${food.name}`);
    lines.push('');
    if (food.recipe?.trim()) {
      lines.push('📝 מתכון:');
      lines.push(food.recipe.trim());
      lines.push('');
    }
    if (food.notes?.trim()) {
      lines.push('💭 הערות:');
      lines.push(food.notes.trim());
      lines.push('');
    }
    const firstImage = food.images?.[0];
    if (firstImage) {
      lines.push(`📷 תמונה: ${firstImage}`);
      lines.push('');
    }
    lines.push('— נשלח מ"שולחן ערוך" 🕯️');
    const text = lines.join('\n');
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    try {
      await Linking.openURL(url);
    } catch {
      await Clipboard.setStringAsync(text);
      Alert.alert('הועתק', 'הפרטים הועתקו ללוח. הדבק ב-WhatsApp.');
    }
  };

  const headerRight = editing ? (
    <Pressable
      onPress={handleSave}
      disabled={!canSave}
      hitSlop={8}
      style={({ pressed }) => [
        styles.headerAction,
        { opacity: !canSave ? 0.4 : pressed ? 0.5 : 1 },
      ]}
    >
      {saving ? (
        <ActivityIndicator color={colors.primary} size="small" />
      ) : (
        <Text style={styles.headerActionText} numberOfLines={1}>
          שמור
        </Text>
      )}
    </Pressable>
  ) : (
    <Pressable
      onPress={() => setEditing(true)}
      hitSlop={8}
      style={({ pressed }) => [
        styles.headerAction,
        { opacity: pressed ? 0.5 : 1 },
      ]}
    >
      <Text style={styles.headerActionText} numberOfLines={1}>
        ✏️ ערוך
      </Text>
    </Pressable>
  );

  const displayCategories = getFoodCategories(food)
    .map((c) => getCategoryInfo(group, c))
    .filter((info): info is NonNullable<typeof info> => info !== null);

  const displayTitle = editing
    ? 'עריכת מאכל'
    : food.isFavorite
      ? `⭐ ${food.name}`
      : food.name;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <ScreenHeader
        title={displayTitle}
        onBack={editing ? handleCancel : () => navigation.goBack()}
        right={headerRight}
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {editing ? (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>שם המאכל</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  style={styles.input}
                  maxLength={50}
                  textAlign="right"
                />
              </View>

              <Pressable
                onPress={() => setIsFavorite((v) => !v)}
                style={({ pressed }) => [
                  styles.favoriteRow,
                  isFavorite && styles.favoriteRowActive,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Text style={styles.favoriteStar}>{isFavorite ? '⭐' : '☆'}</Text>
                <View style={styles.favoriteTextWrap}>
                  <Text style={styles.favoriteTitle}>
                    {isFavorite ? 'במועדפים' : 'סמן כמועדף'}
                  </Text>
                  <Text style={styles.favoriteHint}>
                    מועדפים מופיעים בראש כל רשימה
                  </Text>
                </View>
              </Pressable>
            </>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              קטגוריות{editing ? ` (${selectedCats.size})` : ''}
            </Text>
            {editing ? (
              <View style={styles.chipsWrap}>
                {categories.map((cat) => {
                  const isActive = selectedCats.has(cat.key);
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
              </View>
            ) : (
              <View style={styles.chipsWrap}>
                {displayCategories.length === 0 ? (
                  <Text style={styles.emptyText}>אין קטגוריות</Text>
                ) : (
                  displayCategories.map((cat) => (
                    <View key={cat.key} style={[styles.chip, styles.chipActive]}>
                      <Text style={styles.chipEmoji}>{cat.emoji}</Text>
                      <Text style={[styles.chipLabel, styles.chipLabelActive]}>
                        {cat.label}
                      </Text>
                    </View>
                  ))
                )}
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>📷 תמונות</Text>
            {images.length === 0 && !editing ? (
              <Text style={styles.emptyText}>אין תמונות עדיין</Text>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.imagesRow}
              >
                {images.map((url, i) => (
                  <Pressable
                    key={url}
                    onPress={() => {
                      setViewerIndex(i);
                      setViewerOpen(true);
                    }}
                    onLongPress={editing ? () => handleDeleteImage(url) : undefined}
                    style={({ pressed }) => [
                      styles.thumbWrap,
                      { opacity: pressed ? 0.7 : 1 },
                    ]}
                  >
                    <Image source={{ uri: url }} style={styles.thumb} />
                    {editing && (
                      <View style={styles.thumbBadge}>
                        <Text style={styles.thumbBadgeText}>הקש ארוכות למחיקה</Text>
                      </View>
                    )}
                  </Pressable>
                ))}
                {editing && (
                  <Pressable
                    onPress={handlePickImage}
                    disabled={uploadingImage}
                    style={({ pressed }) => [
                      styles.addThumb,
                      { opacity: pressed ? 0.7 : 1 },
                    ]}
                  >
                    {uploadingImage ? (
                      <ActivityIndicator color={colors.primary} />
                    ) : (
                      <>
                        <Text style={styles.addThumbIcon}>+</Text>
                        <Text style={styles.addThumbText}>הוסף</Text>
                      </>
                    )}
                  </Pressable>
                )}
              </ScrollView>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>📝 מתכון</Text>
            {editing ? (
              <Pressable
                onPress={() => setRecipeEditorOpen(true)}
                style={({ pressed }) => [
                  styles.editableCard,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
              >
                {recipe.trim() ? (
                  <Text style={styles.bodyText} numberOfLines={6}>
                    {recipe}
                  </Text>
                ) : (
                  <Text style={styles.editableHint}>
                    הקש כדי לכתוב את המתכון במסך מלא ✎
                  </Text>
                )}
                {recipe.trim() ? (
                  <Text style={styles.editableEditLink}>הקש לעריכה ✎</Text>
                ) : null}
              </Pressable>
            ) : food.recipe?.trim() ? (
              <View style={styles.textCard}>
                <Text style={styles.bodyText}>{food.recipe}</Text>
              </View>
            ) : (
              <Text style={styles.emptyText}>אין מתכון עדיין</Text>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>💭 הערות נוספות</Text>
            {editing ? (
              <Pressable
                onPress={() => setNotesEditorOpen(true)}
                style={({ pressed }) => [
                  styles.editableCard,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
              >
                {notes.trim() ? (
                  <Text style={styles.bodyText} numberOfLines={6}>
                    {notes}
                  </Text>
                ) : (
                  <Text style={styles.editableHint}>
                    הקש כדי לכתוב הערות במסך מלא ✎
                  </Text>
                )}
                {notes.trim() ? (
                  <Text style={styles.editableEditLink}>הקש לעריכה ✎</Text>
                ) : null}
              </Pressable>
            ) : food.notes?.trim() ? (
              <View style={styles.textCard}>
                <Text style={styles.bodyText}>{food.notes}</Text>
              </View>
            ) : (
              <Text style={styles.emptyText}>אין הערות עדיין</Text>
            )}
          </View>

          {editing ? (
            <View style={styles.dangerZone}>
              <PrimaryButton
                label="🗑️ מחק מאכל"
                variant="outline"
                onPress={handleDeleteFood}
              />
              <Text style={styles.dangerHelper}>
                המחיקה תסיר את המאכל לצמיתות מהרשימה ומכל הארוחות
              </Text>
            </View>
          ) : (
            <View style={styles.actions}>
              <PrimaryButton
                label="הוסף לארוחה"
                icon="+"
                onPress={() => setSlotPickerOpen(true)}
                loading={addingToSlot}
              />
              <View style={{ height: 8 }} />
              <PrimaryButton
                label="שתף בוואטסאפ"
                icon="📤"
                variant="outline"
                onPress={handleShareFood}
              />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <ImageViewerModal
        visible={viewerOpen}
        images={images}
        initialIndex={viewerIndex}
        onClose={() => setViewerOpen(false)}
      />

      <SlotPickerModal
        visible={slotPickerOpen}
        slots={slots}
        onPick={handlePickSlot}
        onClose={() => setSlotPickerOpen(false)}
      />

      <FullScreenTextEditor
        visible={recipeEditorOpen}
        title="📝 מתכון"
        initialValue={recipe}
        placeholder="כתבו כאן את המתכון..."
        onSave={setRecipe}
        onClose={() => setRecipeEditorOpen(false)}
      />

      <FullScreenTextEditor
        visible={notesEditorOpen}
        title="💭 הערות נוספות"
        initialValue={notes}
        placeholder="הערות, רעיונות, תזכורות..."
        onSave={setNotes}
        onClose={() => setNotesEditorOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: colors.background },
  loading: { flex: 1 },
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  headerAction: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  headerActionText: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.bold,
    color: colors.primary,
    writingDirection: 'rtl',
  },
  section: { gap: spacing.sm },
  sectionLabel: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.bold,
    color: colors.textMuted,
    textAlign: 'right',
    writingDirection: 'rtl',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyText: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
    textAlign: 'right',
    writingDirection: 'rtl',
    fontStyle: 'italic',
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.md,
    fontFamily: fontFamily.regular,
    color: colors.text,
    backgroundColor: colors.surface,
    writingDirection: 'rtl',
  },
  inputMultiline: {
    minHeight: 120,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
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
  chipEmoji: { fontSize: fontSize.md },
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
  textCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  editableCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    minHeight: 80,
    gap: spacing.xs,
  },
  editableHint: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.medium,
    color: colors.primary,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  editableEditLink: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.medium,
    color: colors.primary,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  bodyText: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.regular,
    color: colors.text,
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 22,
  },
  imagesRow: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  thumbWrap: {
    width: 100,
    height: 100,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  thumbBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 2,
  },
  thumbBadgeText: {
    fontSize: 9,
    color: '#fff',
    fontFamily: fontFamily.medium,
    textAlign: 'center',
  },
  addThumb: {
    width: 100,
    height: 100,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addThumbIcon: {
    fontSize: 32,
    color: colors.primary,
    fontFamily: fontFamily.bold,
    lineHeight: 36,
  },
  addThumbText: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontFamily: fontFamily.medium,
  },
  actions: {
    marginTop: spacing.md,
  },
  dangerZone: {
    marginTop: spacing.xl,
    gap: spacing.sm,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  dangerHelper: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 18,
  },
  errorBox: {
    padding: spacing.lg,
  },
  errorText: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.medium,
    color: colors.warning,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  favoriteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.md,
  },
  favoriteRowActive: {
    borderColor: colors.primary,
    backgroundColor: '#FBEFD9',
  },
  favoriteStar: {
    fontSize: 28,
  },
  favoriteTextWrap: { flex: 1, gap: 2 },
  favoriteTitle: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.bold,
    color: colors.text,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  favoriteHint: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
