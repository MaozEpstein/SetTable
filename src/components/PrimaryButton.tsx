import { useRef } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontFamily, fontSize, radius, spacing } from '../theme';

const DOUBLE_TAP_GUARD_MS = 500;

type Variant = 'primary' | 'secondary' | 'outline';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  fullWidth?: boolean;
};

export function PrimaryButton({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  icon,
  fullWidth = true,
}: Props) {
  const isDisabled = disabled || loading;
  const lastTapRef = useRef(0);

  // Even when callers forget to disable the button while their async
  // handler runs, two presses within 500ms are coalesced into one.
  const guardedPress = () => {
    const now = Date.now();
    if (now - lastTapRef.current < DOUBLE_TAP_GUARD_MS) return;
    lastTapRef.current = now;
    onPress();
  };
  const backgroundColor =
    variant === 'primary'
      ? colors.primary
      : variant === 'secondary'
        ? colors.secondary
        : 'transparent';
  const textColor = variant === 'outline' ? colors.primary : '#FFFFFF';
  const borderColor = variant === 'outline' ? colors.primary : backgroundColor;

  return (
    <Pressable
      onPress={guardedPress}
      disabled={isDisabled}
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
        styles.button,
        {
          backgroundColor,
          borderColor,
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : hovered ? 0.92 : 1,
          alignSelf: fullWidth ? 'stretch' : 'auto',
        },
        hovered && !isDisabled && styles.hovered,
      ]}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={textColor} />
        ) : (
          <>
            {icon && <Text style={[styles.icon, { color: textColor }]}>{icon}</Text>}
            <Text style={[styles.label, { color: textColor }]}>{label}</Text>
          </>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 2,
    ...(({
      cursor: 'pointer',
      transitionProperty: 'opacity, box-shadow, transform',
      transitionDuration: '120ms',
    } as object) as Record<string, never>),
  },
  hovered: {
    ...(({
      boxShadow: '0 4px 14px rgba(0,0,0,0.10)',
    } as object) as Record<string, never>),
    transform: [{ translateY: -1 }],
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  icon: {
    fontSize: fontSize.lg,
  },
  label: {
    fontSize: fontSize.lg,
    fontFamily: fontFamily.bold,
    writingDirection: 'rtl',
  },
});
