import { useEffect, useState } from 'react';
import { ActivityIndicator, I18nManager, StyleSheet, View } from 'react-native';
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

  if (!fontsLoaded || !nameChecked) {
    return (
      <SafeAreaProvider>
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </SafeAreaProvider>
    );
  }

  if (!isFirebaseConfigured) {
    return (
      <SafeAreaProvider>
        <FirebaseSetupScreen />
      </SafeAreaProvider>
    );
  }

  if (!userName) {
    return (
      <SafeAreaProvider>
        <OnboardingScreen onComplete={(name) => setUserName(name)} />
      </SafeAreaProvider>
    );
  }

  if (authError) {
    return (
      <SafeAreaProvider>
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </SafeAreaProvider>
    );
  }

  if (!uid) {
    return (
      <SafeAreaProvider>
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </SafeAreaProvider>
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
  loading: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
