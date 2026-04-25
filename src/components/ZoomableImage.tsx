import { useRef, useState } from 'react';
import {
  Animated,
  Image,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import {
  PanGestureHandler,
  PinchGestureHandler,
  State,
  type PanGestureHandlerStateChangeEvent,
  type PinchGestureHandlerStateChangeEvent,
} from 'react-native-gesture-handler';

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const ZOOM_THRESHOLD = 1.01;

type Props = {
  uri: string;
  style?: StyleProp<ViewStyle>;
  onZoomStateChange?: (zoomed: boolean) => void;
};

// Built on the legacy PinchGestureHandler / PanGestureHandler APIs from
// react-native-gesture-handler 2.x. We avoid the new Gesture API because
// it requires react-native-reanimated, which has native-binding problems
// in Expo Go SDK 54 today. The old API works with React Native's built-in
// Animated and runs on the UI thread via useNativeDriver.
export function ZoomableImage({ uri, style, onZoomStateChange }: Props) {
  // Animated.multiply / Animated.add lets us combine "committed" base values
  // with the live gesture value without manually doing math each frame.
  const baseScale = useRef(new Animated.Value(1)).current;
  const pinchScale = useRef(new Animated.Value(1)).current;
  const scale = Animated.multiply(baseScale, pinchScale);

  const baseX = useRef(new Animated.Value(0)).current;
  const panX = useRef(new Animated.Value(0)).current;
  const translateX = Animated.add(baseX, panX);

  const baseY = useRef(new Animated.Value(0)).current;
  const panY = useRef(new Animated.Value(0)).current;
  const translateY = Animated.add(baseY, panY);

  const lastScale = useRef(1);
  const lastX = useRef(0);
  const lastY = useRef(0);
  const [isZoomed, setIsZoomed] = useState(false);

  const setZoomed = (zoomed: boolean) => {
    if (zoomed !== isZoomed) {
      setIsZoomed(zoomed);
      onZoomStateChange?.(zoomed);
    }
  };

  const reset = () => {
    Animated.parallel([
      Animated.spring(baseScale, { toValue: 1, useNativeDriver: true }),
      Animated.spring(baseX, { toValue: 0, useNativeDriver: true }),
      Animated.spring(baseY, { toValue: 0, useNativeDriver: true }),
    ]).start();
    pinchScale.setValue(1);
    panX.setValue(0);
    panY.setValue(0);
    lastScale.current = 1;
    lastX.current = 0;
    lastY.current = 0;
    setZoomed(false);
  };

  const onPinchGestureEvent = Animated.event(
    [{ nativeEvent: { scale: pinchScale } }],
    { useNativeDriver: true },
  );

  const onPinchHandlerStateChange = (event: PinchGestureHandlerStateChangeEvent) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      let next = lastScale.current * event.nativeEvent.scale;
      next = Math.max(MIN_SCALE, Math.min(MAX_SCALE, next));

      if (next <= ZOOM_THRESHOLD) {
        reset();
        return;
      }

      lastScale.current = next;
      baseScale.setValue(next);
      pinchScale.setValue(1);
      setZoomed(true);
    }
  };

  const onPanGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: panX, translationY: panY } }],
    { useNativeDriver: true },
  );

  const onPanHandlerStateChange = (event: PanGestureHandlerStateChangeEvent) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      // Only commit pan when zoomed in
      if (lastScale.current <= ZOOM_THRESHOLD) {
        panX.setValue(0);
        panY.setValue(0);
        return;
      }
      lastX.current += event.nativeEvent.translationX;
      lastY.current += event.nativeEvent.translationY;
      baseX.setValue(lastX.current);
      baseY.setValue(lastY.current);
      panX.setValue(0);
      panY.setValue(0);
    }
  };

  return (
    <PanGestureHandler
      onGestureEvent={onPanGestureEvent}
      onHandlerStateChange={onPanHandlerStateChange}
      enabled={isZoomed}
      minPointers={1}
      maxPointers={2}
    >
      <Animated.View style={[styles.container, style]}>
        <PinchGestureHandler
          onGestureEvent={onPinchGestureEvent}
          onHandlerStateChange={onPinchHandlerStateChange}
        >
          <Animated.View style={styles.fill}>
            <Animated.View
              style={[
                styles.fill,
                {
                  transform: [
                    { translateX },
                    { translateY },
                    { scale },
                  ],
                },
              ]}
            >
              <Image source={{ uri }} style={styles.image} resizeMode="contain" />
            </Animated.View>
          </Animated.View>
        </PinchGestureHandler>
      </Animated.View>
    </PanGestureHandler>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fill: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
