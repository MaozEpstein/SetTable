import 'react-native-gesture-handler';
import { useEffect, useState } from 'react';
import { ActivityIndicator, I18nManager, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { onAuthStateChanged, type User } from 'firebase/auth';
import {
  Heebo_400Regular,
  Heebo_500Medium,
  Heebo_700Bold,
  useFonts,
} from '@expo-google-fonts/heebo';
import { ToastProvider } from './src/components/Toast';
import { WebFrame } from './src/components/WebFrame';
import { UserProvider, type AuthMethod } from './src/context/UserContext';
import { auth, isFirebaseConfigured } from './src/firebase';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AuthGate } from './src/screens/AuthGate';
import { FirebaseSetupScreen } from './src/screens/FirebaseSetupScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import {
  getUserProfile,
  signOutUser,
  updateDisplayName,
  type UserProfile,
} from './src/services/userAuth';
import { registerForPushNotifications } from './src/services/push';
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

  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Listen to Firebase auth state. This is the source of truth — survives
  // app restarts because Firebase persists the auth token in localStorage / AsyncStorage.
  useEffect(() => {
    if (!isFirebaseConfigured) {
      setAuthChecked(true);
      return;
    }
    const unsub = onAuthStateChanged(auth, (u) => {
      setAuthUser(u);
      setAuthChecked(true);
    });
    return unsub;
  }, []);

  // Load profile whenever the auth user changes.
  useEffect(() => {
    if (!authUser) {
      setProfile(null);
      return;
    }
    setProfileLoading(true);
    getUserProfile(authUser.uid)
      .then((p) => setProfile(p))
      .finally(() => setProfileLoading(false));
  }, [authUser]);

  // Register for push only when we have a real (non-anonymous) signed-in user.
  useEffect(() => {
    if (!authUser) return;
    if (authUser.isAnonymous) return;
    registerForPushNotifications(authUser.uid).catch(() => {});
  }, [authUser]);

  if (!fontsLoaded || !authChecked) {
    return loadingScreen();
  }

  if (!isFirebaseConfigured) {
    return wrapped(<FirebaseSetupScreen />);
  }

  // Not signed in — show auth gate (login + register + Google).
  if (!authUser) {
    return wrapped(<AuthGate />);
  }

  // Signed in but profile still loading.
  if (profileLoading) {
    return loadingScreen();
  }

  // Signed in but no display name yet (just registered, or first Google login
  // without a Google-provided name) — ask for one.
  const displayName = profile?.displayName?.trim();
  if (!displayName) {
    return wrapped(
      <OnboardingScreen
        onComplete={async (name) => {
          await updateDisplayName(authUser.uid, name);
          setProfile((prev) =>
            prev
              ? { ...prev, displayName: name }
              : {
                  uid: authUser.uid,
                  displayName: name,
                  authMethod: authUser.isAnonymous ? 'anonymous' : 'username',
                  createdAt: Date.now(),
                },
          );
        }}
      />,
    );
  }

  const authMethod: AuthMethod =
    profile?.authMethod ?? (authUser.isAnonymous ? 'anonymous' : 'username');

  const handleSetUserName = (name: string) => {
    updateDisplayName(authUser.uid, name).catch(() => {});
    setProfile((prev) => (prev ? { ...prev, displayName: name } : prev));
  };

  const handleSignOut = () => {
    signOutUser().catch(() => {});
  };

  return (
    <SafeAreaProvider>
      <WebFrame>
        <ToastProvider>
          <UserProvider
            uid={authUser.uid}
            userName={displayName}
            username={profile?.username}
            email={profile?.email}
            authMethod={authMethod}
            setUserName={handleSetUserName}
            signOut={handleSignOut}
          >
            <RootNavigator />
          </UserProvider>
        </ToastProvider>
      </WebFrame>
    </SafeAreaProvider>
  );
}

function wrapped(child: React.ReactNode) {
  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <WebFrame>{child}</WebFrame>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function loadingScreen() {
  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <WebFrame>
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        </WebFrame>
      </SafeAreaProvider>
    </GestureHandlerRootView>
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
