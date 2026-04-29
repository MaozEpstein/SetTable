import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

// On iOS Safari / mobile browsers the soft keyboard shrinks the visual
// viewport without resizing the layout viewport. A bottom-anchored modal
// stays where it was and ends up underneath the keyboard, so users type
// blind. `visualViewport.resize` lets us compute the keyboard height and
// pad the sheet so the input stays visible.
//
// On native the standard KeyboardAvoidingView already shifts content
// above the keyboard — this hook returns 0 there.
export function useKeyboardOffset(): number {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const vv = window.visualViewport;
    const update = () => {
      // window.innerHeight is the layout viewport. vv.height is the visual
      // viewport (shrinks when keyboard opens). The difference is the
      // keyboard height. Tiny diffs (<60px) are noise from URL bar etc.
      const diff = window.innerHeight - vv.height - vv.offsetTop;
      setOffset(diff > 60 ? diff : 0);
    };

    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  return offset;
}
