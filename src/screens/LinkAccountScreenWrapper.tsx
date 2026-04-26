import { LinkAccountScreen } from './LinkAccountScreen';
import type { RootStackScreenProps } from '../navigation/types';

export function LinkAccountScreenWrapper({
  navigation,
}: RootStackScreenProps<'LinkAccount'>) {
  return (
    <LinkAccountScreen
      onDone={() => navigation.goBack()}
      onCancel={() => navigation.goBack()}
    />
  );
}
