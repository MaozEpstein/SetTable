import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const TOKENS = 'pushTokens';

function getProjectId(): string | undefined {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ??
    (Constants.easConfig as { projectId?: string } | undefined)?.projectId
  );
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'default',
    importance: Notifications.AndroidImportance.DEFAULT,
    lightColor: '#C9943B',
  });
}

export async function registerForPushNotifications(
  uid: string,
): Promise<string | null> {
  if (!Device.isDevice) {
    console.log('[push] Not a physical device — skipping push registration');
    return null;
  }

  await ensureAndroidChannel();

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    console.log('[push] Notification permission not granted');
    return null;
  }

  try {
    const projectId = getProjectId();
    const tokenResult = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    const token = tokenResult.data;

    await setDoc(doc(db, TOKENS, uid), {
      token,
      platform: Platform.OS,
      updatedAt: Date.now(),
    });

    return token;
  } catch (err) {
    console.warn('[push] Failed to get/save push token:', err);
    return null;
  }
}

export async function getPushTokenFor(uid: string): Promise<string | null> {
  try {
    const snap = await getDoc(doc(db, TOKENS, uid));
    if (!snap.exists()) return null;
    const data = snap.data() as { token?: string };
    return data.token ?? null;
  } catch (err) {
    console.warn('[push] Failed to read token:', err);
    return null;
  }
}

type SendPushInput = {
  toUid: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
};

export async function sendPushNotification({
  toUid,
  title,
  body,
  data,
}: SendPushInput): Promise<void> {
  const token = await getPushTokenFor(toUid);
  if (!token) {
    console.log('[push] No push token for uid', toUid, '— skipping');
    return;
  }

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: token,
        title,
        body,
        sound: 'default',
        data: data ?? {},
      }),
    });
    if (!response.ok) {
      const text = await response.text();
      console.warn('[push] Push API responded', response.status, text);
    }
  } catch (err) {
    console.warn('[push] Failed to send push:', err);
  }
}
