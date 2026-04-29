import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Schedule, UserData } from '@/lib/types';
import { UserProfile } from '@/components/layout/user-profile';
import { getUserDataById, isAdmin, getUsersByIds, getAc4Rates } from '@/lib/actions';
import { Ac4PageContent } from '@/components/ac4/ac4-page-content';
import { startOfMonth, endOfMonth, startOfDay, endOfDay, addDays } from 'date-fns';


async function getUserSchedules(userId: string, startDate: Date, endDate: Date): Promise<Schedule[]> {
  try {
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return [];
    }

    const schedulesRef = collection(db, 'schedules');
    const q = query(
        schedulesRef, 
        where('userIds', 'array-contains', userId)
    );
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
        return [];
    }
    
    const allVolunteerIds = new Set<string>();
    querySnapshot.docs.forEach(doc => {
      const userIds = doc.data()?.userIds;
      if (Array.isArray(userIds)) {
        userIds.forEach((id: string) => allVolunteerIds.add(id));
      }
    });

    const volunteers = await getUsersByIds(Array.from(allVolunteerIds));
    const volunteerMap = new Map(volunteers.map(v => [v.id, v]));

    const schedules = querySnapshot.docs
      .map((scheduleDoc) => {
        try {
            if (!scheduleDoc.exists()) return null;
            const scheduleData = scheduleDoc.data();
            if (!scheduleData) return null;
            
            if (scheduleData.status !== 'active') {
                return null;
            }

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
            
            if (startTime < startOfDay(startDate) || startTime > endOfDay(endDate)) {
                return null;
            }

            const volunteersData: UserData[] = Array.isArray(scheduleData.userIds)
              ? scheduleData.userIds
                  .map((id: string) => volunteerMap.get(id))
                  .filter((v): v is UserData => !!v)
              : [];

            return {
              id: scheduleDoc.id,
              scheduleName: scheduleData.scheduleName,
              startTime: startTime.toISOString(),
              endTime: endTime.toISOString(),
              capacity: scheduleData.capacity,
              userIds: scheduleData.userIds || [],
              volunteers: volunteersData,
              status: scheduleData.status,
            };
        } catch (innerError) {
            return null;
        }
      })
      .filter((s) => s !== null) as Schedule[];

    schedules.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    return schedules;
  } catch (error) {
    return [];
  }
}


export default async function AC4Page(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const cookieStore = await cookies();
  const userId = cookieStore.get('user_id')?.value || '';

  if (!userId) {
    redirect('/');
  }
  
  const fromValue = Array.isArray(searchParams?.from) ? searchParams?.from[0] : searchParams?.from;
  const toValue = Array.isArray(searchParams?.to) ? searchParams?.to[0] : searchParams?.to;
  
  const from = fromValue ? new Date(fromValue) : startOfMonth(new Date());
  const to = toValue ? new Date(toValue) : endOfMonth(new Date());

  const [
    userIsAdmin,
    userData,
    schedules,
    ac4Rates
  ] = await Promise.all([
    isAdmin(userId),
    getUserDataById(userId),
    getUserSchedules(userId, from, to),
    getAc4Rates()
  ]);
  
  if (!userData) {
    redirect('/');
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-50">
        <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
          <div className="ml-auto">
            {userData ? <UserProfile user={userData} isAdmin={userIsAdmin} /> : null}
          </div>
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <Ac4PageContent 
            schedules={schedules} 
            ac4Rates={ac4Rates} 
            initialDateRange={{ from, to }}
        />
      </main>
    </div>
  );
}
