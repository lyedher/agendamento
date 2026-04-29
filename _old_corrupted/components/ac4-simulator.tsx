import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { collection, getDocs, query, Timestamp, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Schedule } from '@/lib/types';
import { UserData, UserProfile } from '@/components/layout/user-profile';
import { getUserDataById, isAdmin, getUsersByIds, getScheduleSettings } from '@/lib/actions';
import { UserCalendar } from '@/components/dashboard/user-calendar';
import { addDays } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';


async function getSchedules(): Promise<Schedule[]> {
  try {
    const schedulesRef = collection(db, 'schedules');
    const q = query(schedulesRef, where('status', '==', 'active'));
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
                .map((userId: string) => volunteerMap.get(userId))
                .filter((user): user is UserData => !!user)
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

export default async function AgendamentoPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('user_id')?.value || '';
  
  if (!userId) {
    redirect('/');
  }

  const [
    userIsAdmin,
    userData,
    schedules,
    scheduleSettings
  ] = await Promise.all([
    isAdmin(userId),
    getUserDataById(userId),
    getSchedules(),
    getScheduleSettings()
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
       <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <Card className="w-full animate-in fade-in duration-500">
          <CardHeader>
            <CardTitle className="font-headline text-3xl">Agendamento de Escalas</CardTitle>
            <CardDescription>
              Visualize as escalas disponíveis e inscreva-se para os próximos serviços.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UserCalendar 
              schedules={schedules} 
              currentUserId={userId} 
              scheduleSettings={scheduleSettings}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}