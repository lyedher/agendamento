import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getUserDataById, isAdmin } from '@/lib/actions';
import { UserProfile } from '@/components/layout/user-profile';
import { ProfileForm } from '@/components/profile/profile-form';

export default async function ProfilePage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('user_id')?.value;

  if (!userId) {
    redirect('/');
  }

  const [userIsAdmin, userData] = await Promise.all([
    isAdmin(userId),
    getUserDataById(userId)
  ]);

  if (!userData) {
    redirect('/');
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
       <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-50">
        <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
            <div className='ml-auto'>
                 {userData ? <UserProfile user={userData} isAdmin={userIsAdmin} /> : null}
            </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-start p-4 md:p-8">
        <Card className="w-full max-w-2xl animate-in fade-in duration-500">
          <CardHeader>
            <CardTitle className="font-headline text-3xl">Meu Perfil</CardTitle>
            <CardDescription>
              Atualize suas informações cadastrais. Use os botões para selecionar Posto e Função.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm user={userData} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
