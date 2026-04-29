import { collection, getDocs, query, Timestamp, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Schedule } from '@/lib/types';
import { UserData } from '@/components/layout/user-profile';
import { getAllUsers } from '@/lib/actions';
import { Ac4ReportContent } from '@/components/admin/ac4-report-content';
import { startOfDay, endOfDay, addDays } from 'date-fns';

async function getSchedules(allUsers: UserData[], startDate: Date, endDate: Date): Promise<Schedule[]> {
  try {
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return [];
    }

    const schedulesRef = collection(db, 'schedules');
    const q = query(
      schedulesRef,
      where('startTime', '>=', Timestamp.fromDate(startOfDay(startDate))),
      where('startTime', '<=', Timestamp.fromDate(endOfDay(endDate)))
    );
    const querySnapshot = await getDocs(q);
    const userMap = new Map(allUsers.map(u => [u.id, u]));

    const schedules = querySnapshot.docs
      .map((scheduleDoc) => {
        try {
            if (!scheduleDoc.exists()) return null;
            const scheduleData = scheduleDoc.data();
            if (!scheduleData) return null;
            
            if (scheduleData.status !== 'active') {
                return null;
            }

            const volunteersData: UserData[] = Array.isArray(scheduleData.userIds)
                ? (scheduleData.userIds || [])
                    .map((userId: string) => userMap.get(userId))
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
      })
      .filter((s) => s !== null) as Schedule[];

    schedules.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    return schedules;
  } catch (error) {
    return [];
  }
}

export default async function ReportPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const searchParams = await props.searchParams;
    const fromValue = Array.isArray(searchParams?.from) ? searchParams?.from[0] : searchParams?.from;
    const toValue = Array.isArray(searchParams?.to) ? searchParams?.to[0] : searchParams?.to;
    
    const from = fromValue ? new Date(fromValue) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const to = toValue ? new Date(toValue) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

    const users = await getAllUsers();
    const schedules = await getSchedules(users, from, to);

    return <Ac4ReportContent schedules={schedules} initialDateRange={{ from, to }} />
}