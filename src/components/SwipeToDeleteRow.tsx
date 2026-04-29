import { useRef, type ReactNode } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { colors, fontFamily, fontSize, radius, spacing } from '../theme';

type Props = {
  children: ReactNode;
  onDelete: () => void;
};

// Swipe the row to the right (in any reading direction) to reveal a red
// delete button on the trailing edge. Tapping the button confirms the
// delete; the parent handles the actual destructive action.
export function SwipeToDeleteRow({ children, onDelete }: Props) {
  const swipeRef = useRef<Swipeable>(null);

  const renderLeftActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    drag: Animated.AnimatedInterpolation<number>,
  ) => {
    const scale = drag.interpolate({
      inputRange: [0, 80],
      outputRange: [0.6, 1],
      extrapolate: 'clamp',
    });
    return (
      <Pressable
        onPress={() => {
          swipeRef.current?.close();
          onDelete();
        }}
        style={styles.action}
      >
        <Animated.Text style={[styles.actionLabel, { transform: [{ scale }] }]}>
          🗑️ מחק
        </Animated.Text>
      </Pressable>
    );
  };

  return (
    <Swipeable
      ref={swipeRef}
      renderLeftActions={renderLeftActions}
      leftThreshold={40}
      friction={2}
      overshootLeft={false}
      containerStyle={styles.container}
    >
      {children}
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.md,
  },
  action: {
    backgroundColor: colors.warning,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    minWidth: 96,
    borderRadius: radius.md,
    marginRight: spacing.xs,
  },
  actionLabel: {
    color: '#FFFFFF',
    fontSize: fontSize.md,
    fontFamily: fontFamily.bold,
    writingDirection: 'rtl',
  },
});
