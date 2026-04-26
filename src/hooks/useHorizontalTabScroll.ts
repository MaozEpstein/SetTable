import { useEffect, useRef } from 'react';
import { Platform, type ScrollView } from 'react-native';

// Provides web-only enhancements for a horizontal ScrollView:
// 1. mouse-wheel vertical scroll → horizontal scroll (so the trackpad works
//    naturally on desktop, just like swipe on touch)
// 2. a `scrollBy(delta)` helper to wire up explicit ‹ › arrow buttons
//
// Returns the ref to attach to the ScrollView and a `scrollBy` function.
// `isWeb` is exposed as a convenience for conditional rendering of arrows.
export function useHorizontalTabScroll() {
  const scrollRef = useRef<ScrollView>(null);

  const scrollBy = (delta: number) => {
    const node = (scrollRef.current as unknown as {
      getScrollableNode?: () => HTMLElement;
    } | null)?.getScrollableNode?.();
    if (node && typeof node.scrollBy === 'function') {
      node.scrollBy({ left: delta, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const node = (scrollRef.current as unknown as {
      getScrollableNode?: () => HTMLElement;
    } | null)?.getScrollableNode?.();
    if (!node) return;
    const handler = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      e.preventDefault();
      node.scrollBy({ left: e.deltaY, behavior: 'auto' });
    };
    node.addEventListener('wheel', handler, { passive: false });
    return () => node.removeEventListener('wheel', handler);
  }, []);

  return {
    scrollRef,
    scrollBy,
    isWeb: Platform.OS === 'web',
  };
}
