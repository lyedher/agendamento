
'use client';

import { EditUserFormLoader } from '@/components/admin/edit-user-form-loader';
import type { UserData } from '@/components/layout/user-profile';

type ProfileFormProps = {
  user: UserData;
};

export function ProfileForm({ user }: ProfileFormProps) {
  return <EditUserFormLoader user={user} isAdmin={false} />;
}

    