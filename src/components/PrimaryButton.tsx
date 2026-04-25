import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontFamily, fontSize, radius, spacing } from '../theme';

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
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor,
          borderColor,
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
          alignSelf: fullWidth ? 'stretch' : 'auto',
        },
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
