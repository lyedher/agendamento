
'use client';

import { useEffect } from 'react';
import { useUserProfile } from '@/components/layout/user-profile-provider';
import { UserProfile } from '@/components/layout/user-profile';
import { usePathname } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

// This is a client component layout to fetch user data once
// and provide it to all child pages, avoiding refetching.
export default function PontuacaoLayout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, setUser, setIsAdmin } = useUserProfile();
  const pathname = usePathname();

  useEffect(() => {
    async function fetchUserData() {
      try {
        const res = await fetch('/api/user-profile');
        if (res.ok) {
          const { user, isAdmin } = await res.json();
          setUser(user);
          setIsAdmin(isAdmin);
        } else {
          setUser(null);
        }
      } catch (error) {
        setUser(null);
      }
    }
    // Only fetch if user data is not already in context
    if (!user) {
      fetchUserData();
    }
  }, [user, setUser, setIsAdmin, pathname]);

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-50">
        <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
          <div className="ml-auto">
            {user ? (
              <UserProfile user={user} isAdmin={isAdmin} />
            ) : (
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-24 rounded-md" />
                <Skeleton className="h-10 w-10 rounded-full" />
              </div>
            )}
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
