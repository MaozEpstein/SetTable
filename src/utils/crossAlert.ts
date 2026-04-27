import { Alert, Platform, type AlertButton } from 'react-native';

// Cross-platform replacement for Alert.alert.
// React-native-web's Alert.alert does not render multi-button dialogs,
// so on web we fall back to window.confirm/alert and route the result
// to the matching button's onPress.
export function crossAlert(
  title: string,
  message?: string,
  buttons?: AlertButton[],
): void {
  if (Platform.OS !== 'web') {
    Alert.alert(title, message, buttons);
    return;
  }

  const text = [title, message].filter(Boolean).join('\n\n');
  const btns = buttons && buttons.length > 0 ? buttons : [{ text: 'אישור' }];

  if (btns.length === 1) {
    if (typeof window !== 'undefined') window.alert(text);
    btns[0].onPress?.();
    return;
  }

  // Two-or-more buttons: treat the cancel-styled (or first) button as
  // the "cancel" path and the last non-cancel button as the confirm path.
  const cancelBtn =
    btns.find((b) => b.style === 'cancel') ?? btns[0];
  const confirmBtn =
    [...btns].reverse().find((b) => b.style !== 'cancel') ?? btns[btns.length - 1];

  const ok = typeof window !== 'undefined' ? window.confirm(text) : true;
  if (ok) confirmBtn.onPress?.();
  else cancelBtn.onPress?.();
}
