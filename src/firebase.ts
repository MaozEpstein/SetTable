import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApps, initializeApp } from 'firebase/app';
import {
  // @ts-expect-error -- exported from firebase/auth only in React Native builds; Metro resolves it at runtime, TypeScript sees the web types.
  getReactNativePersistence,
  initializeAuth,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyBf62Oy6VzhPDDcb-xPCv2JLSXzYII_fZY',
  authDomain: 'settable-97985.firebaseapp.com',
  projectId: 'settable-97985',
  storageBucket: 'settable-97985.firebasestorage.app',
  messagingSenderId: '763233186707',
  appId: '1:763233186707:web:e2bfe3be9b15721aabae66',
  measurementId: 'G-E63SSJ32EZ',
};

export const isFirebaseConfigured =
  !firebaseConfig.apiKey.startsWith('REPLACE_') &&
  !firebaseConfig.projectId.startsWith('REPLACE_');

export const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);

export const storage = getStorage(app);
