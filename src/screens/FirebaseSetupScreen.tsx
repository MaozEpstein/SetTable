import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { colors, fontFamily, fontSize, radius, spacing } from '../theme';

export function FirebaseSetupScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.emoji}>🔧</Text>
        <Text style={styles.title}>הגדרת Firebase נדרשת</Text>
        <Text style={styles.subtitle}>
          כמעט מוכן! נותר רק לחבר את האפליקציה לפרויקט Firebase.
        </Text>

        <View style={styles.card}>
          <Text style={styles.step}>1. פתח את Firebase Console</Text>
          <Text style={styles.detail}>console.firebase.google.com</Text>

          <Text style={styles.step}>2. צור פרויקט חדש</Text>
          <Text style={styles.detail}>לחץ "Add project", תן לו שם כמו "shulchan-aruch".</Text>

          <Text style={styles.step}>3. הפעל Firestore</Text>
          <Text style={styles.detail}>
            בתפריט השמאלי → Build → Firestore Database → Create database → Start in test mode.
          </Text>

          <Text style={styles.step}>4. הפעל Anonymous Auth</Text>
          <Text style={styles.detail}>
            בתפריט → Build → Authentication → Get started → Anonymous → Enable.
          </Text>

          <Text style={styles.step}>5. קבל את הקונפיג</Text>
          <Text style={styles.detail}>
            Project settings (⚙️) → Your apps → Add app → Web (&lt;/&gt;) → תן שם → Register →
            העתק את האובייקט firebaseConfig.
          </Text>

          <Text style={styles.step}>6. הדבק ב-src/firebase.ts</Text>
          <Text style={styles.detail}>
            החלף את הערכים הרשומים שם (REPLACE_WITH_...) בערכים שקיבלת.
          </Text>
        </View>

        <View style={styles.tip}>
          <Text style={styles.tipText}>
            💡 אחרי השמירה, Expo יטען את האפליקציה מחדש אוטומטית והמסך הזה ייעלם.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  emoji: {
    fontSize: 64,
    textAlign: 'center',
  },
  title: {
    fontSize: fontSize.xxl,
    fontFamily: fontFamily.bold,
    color: colors.text,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  subtitle: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
    textAlign: 'center',
    writingDirection: 'rtl',
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.xl,
    gap: spacing.sm,
    shadowColor: colors.shadow,
    shadowOpacity: 1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  step: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.bold,
    color: colors.primary,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: spacing.sm,
  },
  detail: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: colors.text,
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 22,
  },
  tip: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    borderRightWidth: 4,
    borderRightColor: colors.secondary,
  },
  tipText: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.medium,
    color: colors.text,
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 22,
  },
});
