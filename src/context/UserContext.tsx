import { createContext, useContext, type ReactNode } from 'react';

export type AuthMethod = 'username' | 'google' | 'anonymous';

type UserContextValue = {
  uid: string;
  userName: string; // display name
  username?: string; // login identifier (only for 'username' auth)
  email?: string;
  authMethod: AuthMethod;
  setUserName: (name: string) => void;
  signOut: () => void;
};

const UserContext = createContext<UserContextValue | null>(null);

type Props = UserContextValue & { children: ReactNode };

export function UserProvider({
  uid,
  userName,
  username,
  email,
  authMethod,
  setUserName,
  signOut,
  children,
}: Props) {
  return (
    <UserContext.Provider
      value={{ uid, userName, username, email, authMethod, setUserName, signOut }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within a UserProvider');
  return ctx;
}
