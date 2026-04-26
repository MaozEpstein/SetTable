import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, fontFamily, radius } from '../theme';

type Props = {
  onPrev: () => void;
  onNext: () => void;
};

// Two side-anchored chevron buttons for horizontal tab strips on web.
// Render as siblings of the ScrollView inside a `position: relative` parent.
export function ScrollArrows({ onPrev, onNext }: Props) {
  return (
    <>
      <Pressable
        onPress={onPrev}
        style={({ pressed }) => [styles.arrow, styles.left, { opacity: pressed ? 0.6 : 0.95 }]}
        hitSlop={6}
      >
        <Text style={styles.text}>‹</Text>
      </Pressable>
      <Pressable
        onPress={onNext}
        style={({ pressed }) => [styles.arrow, styles.right, { opacity: pressed ? 0.6 : 0.95 }]}
        hitSlop={6}
      >
        <Text style={styles.text}>›</Text>
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  arrow: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 30,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  left: {
    left: 0,
    borderTopLeftRadius: radius.pill,
    borderBottomLeftRadius: radius.pill,
  },
  right: {
    right: 0,
    borderTopRightRadius: radius.pill,
    borderBottomRightRadius: radius.pill,
  },
  text: {
    fontSize: 22,
    fontFamily: fontFamily.bold,
    color: colors.primary,
    lineHeight: 24,
  },
});
