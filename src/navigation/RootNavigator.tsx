import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CreateGroupScreen } from '../screens/CreateGroupScreen';
import { GroupScreen } from '../screens/GroupScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { JoinGroupScreen } from '../screens/JoinGroupScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { colors } from '../theme';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_left',
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="CreateGroup" component={CreateGroupScreen} />
        <Stack.Screen name="JoinGroup" component={JoinGroupScreen} />
        <Stack.Screen name="Group" component={GroupScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
