
'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import type { UserData } from './user-profile';

type UserProfileContextType = {
  user: UserData | null;
  isAdmin: boolean;
  setUser: (user: UserData | null) => void;
  setIsAdmin: (isAdmin: boolean) => void;
};

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

export function UserProfileProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  return (
    <UserProfileContext.Provider value={{ user, isAdmin, setUser, setIsAdmin }}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  const context = useContext(UserProfileContext);
  if (context === undefined) {
    throw new Error('useUserProfile must be used within a UserProfileProvider');
  }
  return context;
}
