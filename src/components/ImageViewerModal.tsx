import { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors, fontFamily, fontSize, spacing } from '../theme';

type Props = {
  visible: boolean;
  images: string[];
  initialIndex: number;
  onClose: () => void;
};

export function ImageViewerModal({ visible, images, initialIndex, onClose }: Props) {
  const [index, setIndex] = useState(initialIndex);
  const scrollRef = useRef<ScrollView>(null);
  const { width, height } = Dimensions.get('window');

  // Modal stays mounted between opens, so we have to manually sync the
  // visible page each time the parent passes a new initialIndex.
  useEffect(() => {
    if (!visible) return;
    setIndex(initialIndex);
    // Defer scroll until after layout — without this the ScrollView
    // hasn't measured yet on the first frame after visible flips on.
    const handle = requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        x: initialIndex * width,
        y: 0,
        animated: false,
      });
    });
    return () => cancelAnimationFrame(handle);
  }, [visible, initialIndex, width]);

  if (images.length === 0) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.closeButton} onPress={onClose} hitSlop={12}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>

        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const i = Math.round(e.nativeEvent.contentOffset.x / width);
            setIndex(i);
          }}
        >
          {images.map((uri, i) => (
            <ScrollView
              key={i}
              style={{ width, height }}
              contentContainerStyle={[styles.page, { width, height }]}
              maximumZoomScale={4}
              minimumZoomScale={1}
              bouncesZoom
              pinchGestureEnabled
              centerContent
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
            >
              <Image source={{ uri }} style={styles.image} resizeMode="contain" />
            </ScrollView>
          ))}
        </ScrollView>

        {images.length > 1 && (
          <View style={styles.counter}>
            <Text style={styles.counterText}>
              {index + 1} / {images.length}
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: '#000',
  },
  page: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: spacing.xl + 12,
    left: spacing.lg,
    zIndex: 2,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: '#fff',
    fontSize: fontSize.xl,
    fontFamily: fontFamily.bold,
    lineHeight: fontSize.xl + 2,
  },
  counter: {
    position: 'absolute',
    bottom: spacing.xl,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
  },
  counterText: {
    color: colors.background,
    fontSize: fontSize.sm,
    fontFamily: fontFamily.medium,
  },
});
