
'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const SignupForm = dynamic(() => import('./signup-form').then(mod => mod.SignupForm), {
  ssr: false,
  loading: () => (
    <div className="space-y-4">
       <div className="flex flex-col items-center space-y-4">
            <Skeleton className="h-24 w-24 rounded-full" />
            <Skeleton className="h-4 w-20" />
        </div>
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
         <Skeleton className="h-10 w-full" />
    </div>
  ),
});

export function SignupFormLoader() {
    return <SignupForm />;
}
