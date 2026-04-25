import { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ZoomableImage } from './ZoomableImage';
import { colors, fontFamily, fontSize, spacing } from '../theme';

type Props = {
  visible: boolean;
  images: string[];
  initialIndex: number;
  onClose: () => void;
};

export function ImageViewerModal({ visible, images, initialIndex, onClose }: Props) {
  const [index, setIndex] = useState(initialIndex);
  const [pageZoomed, setPageZoomed] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const { width, height } = Dimensions.get('window');

  // Modal stays mounted between opens, so we have to manually sync the
  // visible page each time the parent passes a new initialIndex.
  useEffect(() => {
    if (!visible) return;
    setIndex(initialIndex);
    setPageZoomed(false);
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
      <GestureHandlerRootView style={styles.backdrop}>
        <Pressable style={styles.closeButton} onPress={onClose} hitSlop={12}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>

        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          // When the current image is zoomed in, lock horizontal swiping
          // so panning the zoomed image doesn't switch pages.
          scrollEnabled={!pageZoomed}
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const i = Math.round(e.nativeEvent.contentOffset.x / width);
            setIndex(i);
            // New page starts at zoom 1
            setPageZoomed(false);
          }}
        >
          {images.map((uri, i) => (
            <View key={i} style={[styles.page, { width, height }]}>
              <ZoomableImage
                uri={uri}
                style={{ width, height }}
                onZoomStateChange={(zoomed) => {
                  // Only the active page should affect the pager lock
                  if (i === index) setPageZoomed(zoomed);
                }}
              />
            </View>
          ))}
        </ScrollView>

        {images.length > 1 && (
          <View style={styles.counter}>
            <Text style={styles.counterText}>
              {index + 1} / {images.length}
            </Text>
          </View>
        )}
      </GestureHandlerRootView>
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
