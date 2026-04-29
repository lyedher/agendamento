
'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import type { UserData } from '../layout/user-profile';

const EditUserForm = dynamic(() => import('./edit-user-form').then(mod => mod.EditUserForm), {
  ssr: false,
  loading: () => (
     <div className="space-y-4">
        <div className="flex flex-col items-center space-y-4">
          <Skeleton className="h-24 w-24 rounded-full" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="md:col-span-2 space-y-4 mt-6 md:mt-0">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-10 w-full" />
          <div className="hidden md:block pt-4">
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
  )
});

type EditUserFormLoaderProps = {
    user: UserData;
    onFinished?: () => void;
    isAdmin?: boolean;
}

export function EditUserFormLoader({ user, onFinished, isAdmin }: EditUserFormLoaderProps) {
    return <EditUserForm user={user} onFinished={onFinished} isAdmin={isAdmin} />;
}
