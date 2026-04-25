import { createContext, useContext, type ReactNode } from 'react';

type UserContextValue = {
  uid: string;
  userName: string;
  setUserName: (name: string) => void;
  signOut: () => void;
};

const UserContext = createContext<UserContextValue | null>(null);

type Props = UserContextValue & { children: ReactNode };

export function UserProvider({ uid, userName, setUserName, signOut, children }: Props) {
  return (
    <UserContext.Provider value={{ uid, userName, setUserName, signOut }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within a UserProvider');
  return ctx;
}
