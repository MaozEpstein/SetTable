import 'react-native-gesture-handler';
import { useEffect, useState } from 'react';
import { ActivityIndicator, I18nManager, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  Heebo_400Regular,
  Heebo_500Medium,
  Heebo_700Bold,
  useFonts,
} from '@expo-google-fonts/heebo';
import { UserProvider } from './src/context/UserContext';
import { isFirebaseConfigured } from './src/firebase';
import { RootNavigator } from './src/navigation/RootNavigator';
import { FirebaseSetupScreen } from './src/screens/FirebaseSetupScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { ensureAnonymousAuth } from './src/services/auth';
import { registerForPushNotifications } from './src/services/push';
import { clearUserName, getUserName, setUserName as persistUserName } from './src/storage';
import { colors } from './src/theme';

if (!I18nManager.isRTL) {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Heebo_400Regular,
    Heebo_500Medium,
    Heebo_700Bold,
  });

  const [userName, setUserName] = useState<string | null>(null);
  const [nameChecked, setNameChecked] = useState(false);
  const [uid, setUid] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    getUserName().then((name) => {
      setUserName(name);
      setNameChecked(true);
    });
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    if (!userName) return;
    if (uid) return;

    ensureAnonymousAuth()
      .then((user) => setUid(user.uid))
      .catch((err) => {
        setAuthError(err instanceof Error ? err.message : String(err));
      });
  }, [userName, uid]);

  useEffect(() => {
    if (!uid) return;
    registerForPushNotifications(uid).catch(() => {});
  }, [uid]);

  if (!fontsLoaded || !nameChecked) {
    return (
      <GestureHandlerRootView style={styles.flex}>
        <SafeAreaProvider>
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  if (!isFirebaseConfigured) {
    return (
      <GestureHandlerRootView style={styles.flex}>
        <SafeAreaProvider>
        <FirebaseSetupScreen />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  if (!userName) {
    return (
      <GestureHandlerRootView style={styles.flex}>
        <SafeAreaProvider>
        <OnboardingScreen onComplete={(name) => setUserName(name)} />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  if (authError) {
    return (
      <GestureHandlerRootView style={styles.flex}>
        <SafeAreaProvider>
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  if (!uid) {
    return (
      <GestureHandlerRootView style={styles.flex}>
        <SafeAreaProvider>
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  const handleSetUserName = (name: string) => {
    persistUserName(name).catch(() => {});
    setUserName(name);
  };

  const handleSignOut = () => {
    clearUserName().catch(() => {});
    setUserName(null);
  };

  return (
    <SafeAreaProvider>
      <UserProvider
        uid={uid}
        userName={userName}
        setUserName={handleSetUserName}
        signOut={handleSignOut}
      >
        <RootNavigator />
      </UserProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loading: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
