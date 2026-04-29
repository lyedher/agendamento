import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Schedule } from '@/lib/types';
import { UserData, UserProfile } from '@/components/layout/user-profile';
import { UserSchedules } from '@/components/dashboard/user-schedules';
import { getUserDataById, isAdmin, getUsersByIds, getScheduleSettings, getAc4Rates } from '@/lib/actions';
import { addDays } from 'date-fns';


async function getUserSchedules(userId: string): Promise<Schedule[]> {
  try {
    const schedulesRef = collection(db, 'schedules');
    const q = query(
        schedulesRef, 
        where('userIds', 'array-contains', userId),
        where('status', '==', 'active')
    );
    const querySnapshot = await getDocs(q);
    
    const allVolunteerIds = new Set<string>();
    querySnapshot.docs.forEach(doc => {
      const userIds = doc.data()?.userIds;
      if (Array.isArray(userIds)) {
        userIds.forEach((id: string) => allVolunteerIds.add(id));
      }
    });

    const volunteers = await getUsersByIds(Array.from(allVolunteerIds));
    const volunteerMap = new Map(volunteers.map(v => [v.id, v]));

    const schedules = querySnapshot.docs.map((scheduleDoc) => {
      try {
        if (!scheduleDoc.exists()) return null;
        const scheduleData = scheduleDoc.data();
        if (!scheduleData) return null;

        const volunteersData: UserData[] = Array.isArray(scheduleData.userIds)
          ? (scheduleData.userIds || [])
              .map((id: string) => volunteerMap.get(id))
              .filter((v): v is UserData => !!v)
          : [];
        
        const startTime = scheduleData.startTime instanceof Timestamp
          ? scheduleData.startTime.toDate()
          : new Date(String(scheduleData.startTime || ''));
        let endTime = scheduleData.endTime instanceof Timestamp
          ? scheduleData.endTime.toDate()
          : new Date(String(scheduleData.endTime || ''));

        if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
            return null;
        }

        if (endTime <= startTime) {
            endTime = addDays(endTime, 1);
        }

        return {
          id: scheduleDoc.id,
          scheduleName: scheduleData.scheduleName,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          capacity: scheduleData.capacity,
          userIds: scheduleData.userIds || [],
          volunteers: volunteersData,
          status: scheduleData.status,
        } as Schedule;
      } catch (innerError) {
          return null;
      }
    }).filter((s) => s !== null) as Schedule[];

    schedules.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    return schedules;
  } catch (error) {
    return [];
  }
}


export default async function DashboardPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('user_id')?.value || '';

  if (!userId) {
    redirect('/');
  }

  const [
    userIsAdmin,
    userData,
    schedules,
    scheduleSettings,
    ac4Rates,
  ] = await Promise.all([
    isAdmin(userId),
    getUserDataById(userId),
    getUserSchedules(userId),
    getScheduleSettings(),
    getAc4Rates(),
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
      <main className="flex flex-1 flex-col p-4 md:gap-8 md:p-8">
        <Card className="w-full animate-in fade-in duration-500">
            <CardHeader>
                <CardTitle className="font-headline text-3xl">Seu Painel de Escalas</CardTitle>
                <CardDescription>
                Bem-vindo, {userData.rank} {userData.nickname}!
                </CardDescription>
            </CardHeader>
            <CardContent>
                <UserSchedules 
                    schedules={schedules} 
                    currentUserId={userId}
                    scheduleSettings={scheduleSettings}
                    ac4Rates={ac4Rates}
                />
            </CardContent>
        </Card>
      </main>
    </div>
  );
}
