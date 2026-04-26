import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const REPO = 'MaozEpsein/SetTable';
const APK_FILE = 'SetTable.apk';
const DISMISSED_KEY = 'updateCheck.dismissedVersion';

export type UpdateInfo = {
  latestVersion: string;
  currentVersion: string;
  apkUrl: string;
  releaseNotes: string;
  publishedAt: string;
};

// Compares two semver-ish strings ("0.4.0" vs "0.5.1"). Returns positive if a>b.
function compareVersions(a: string, b: string): number {
  const parse = (v: string) =>
    v
      .replace(/^v/, '')
      .split('.')
      .map((n) => parseInt(n, 10) || 0);
  const pa = parse(a);
  const pb = parse(b);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

export function getCurrentVersion(): string {
  const v = Constants.expoConfig?.version;
  return v ?? '0.0.0';
}

// Returns update info if a newer release is available AND user hasn't already
// dismissed it. Returns null in all other cases (no update, on web, network error).
export async function checkForUpdate(): Promise<UpdateInfo | null> {
  // OTA-like update flow only makes sense on Android (the PWA refreshes itself
  // and iOS doesn't support sideloading anyway).
  if (Platform.OS !== 'android') return null;

  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
      headers: { Accept: 'application/vnd.github+json' },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      tag_name?: string;
      body?: string;
      published_at?: string;
      assets?: Array<{ name?: string; browser_download_url?: string }>;
    };

    const latestVersion = (json.tag_name ?? '').replace(/^v/, '');
    if (!latestVersion) return null;

    const currentVersion = getCurrentVersion();
    if (compareVersions(latestVersion, currentVersion) <= 0) return null;

    // User already dismissed this version — don't pester
    const dismissed = await AsyncStorage.getItem(DISMISSED_KEY);
    if (dismissed === latestVersion) return null;

    const apkAsset = json.assets?.find((a) => a.name === APK_FILE);
    const apkUrl =
      apkAsset?.browser_download_url ??
      `https://github.com/${REPO}/releases/latest/download/${APK_FILE}`;

    return {
      latestVersion,
      currentVersion,
      apkUrl,
      releaseNotes: (json.body ?? '').trim(),
      publishedAt: json.published_at ?? '',
    };
  } catch {
    return null;
  }
}

export async function dismissUpdate(version: string): Promise<void> {
  await AsyncStorage.setItem(DISMISSED_KEY, version);
}
