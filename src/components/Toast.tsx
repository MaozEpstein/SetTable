import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontFamily, fontSize, radius, spacing } from '../theme';

type ToastTone = 'success' | 'error' | 'info';

type Toast = {
  id: number;
  message: string;
  tone: ToastTone;
};

type ToastContextValue = {
  showToast: (message: string, tone?: ToastTone) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const idRef = useRef(0);
  const opacity = useRef(new Animated.Value(0)).current;
  const translate = useRef(new Animated.Value(20)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(translate, { toValue: 20, duration: 180, useNativeDriver: Platform.OS !== 'web' }),
    ]).start(() => setToast(null));
  }, [opacity, translate]);

  const showToast = useCallback(
    (message: string, tone: ToastTone = 'success') => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      idRef.current += 1;
      setToast({ id: idRef.current, message, tone });
      opacity.setValue(0);
      translate.setValue(20);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(translate, { toValue: 0, duration: 200, useNativeDriver: Platform.OS !== 'web' }),
      ]).start();
      hideTimer.current = setTimeout(dismiss, 3200);
    },
    [opacity, translate, dismiss],
  );

  useEffect(() => {
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <View pointerEvents="box-none" style={styles.layer}>
          <Animated.View
            style={[
              styles.toast,
              toneStyles[toast.tone],
              { opacity, transform: [{ translateY: translate }] },
            ]}
          >
            <Pressable onPress={dismiss} style={styles.pressable}>
              <Text style={styles.icon}>{toneIcon[toast.tone]}</Text>
              <Text style={styles.text}>{toast.message}</Text>
            </Pressable>
          </Animated.View>
        </View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Safe no-op fallback if used outside provider — never crashes the screen.
    return {
      showToast: (msg) => {
        if (typeof console !== 'undefined') console.log('[toast]', msg);
      },
    };
  }
  return ctx;
}

const toneIcon: Record<ToastTone, string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
};

const toneStyles: Record<ToastTone, { backgroundColor: string }> = {
  success: { backgroundColor: colors.success },
  error: { backgroundColor: colors.warning },
  info: { backgroundColor: colors.secondary },
};

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    bottom: spacing.xl,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
  },
  toast: {
    minWidth: 200,
    maxWidth: 460,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  pressable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  icon: {
    color: '#FFFFFF',
    fontSize: fontSize.lg,
    fontFamily: fontFamily.bold,
    lineHeight: fontSize.lg + 4,
  },
  text: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: fontSize.md,
    fontFamily: fontFamily.medium,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
