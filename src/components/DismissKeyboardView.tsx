import type { ReactNode } from 'react';
import { Keyboard, Platform, Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

// On web, a top-level Pressable swallows taps before they reach inner buttons
// (react-native-web responder system). Keep the dismiss-on-tap behavior only
// on native, where it works correctly and is actually useful.
export function DismissKeyboardView({ children, style }: Props) {
  if (Platform.OS === 'web') {
    return <View style={style}>{children}</View>;
  }
  return (
    <Pressable style={style} onPress={Keyboard.dismiss}>
      {children}
    </Pressable>
  );
}
