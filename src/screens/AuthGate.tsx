import { useState } from 'react';
import { LoginScreen } from './LoginScreen';
import { RegisterScreen } from './RegisterScreen';

type Mode = 'login' | 'register';

export function AuthGate() {
  const [mode, setMode] = useState<Mode>('login');

  if (mode === 'login') {
    return <LoginScreen onSwitchToRegister={() => setMode('register')} />;
  }
  return <RegisterScreen onSwitchToLogin={() => setMode('login')} />;
}
