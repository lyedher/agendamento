import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { collection, getDocs, query, Timestamp, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Schedule, VolunteerSchedule, UserData } from '@/lib/types';
import { getAllUsers, getUserDataById, isAdmin, getAc4Rates, getScheduleSettings, getAbsences } from '@/lib/actions';
import { AdminDashboard } from '@/components/admin/admin-dashboard';
import { UserProfile } from '@/components/layout/user-profile';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getTeamForDate, getLocalTime } from '@/lib/utils';

async function getSchedules(allUsers: UserData[]): Promise<Schedule[]> {
  try {
    const schedulesRef = collection(db, 'schedules');
    const q = query(schedulesRef, where('status', '==', 'active'));
    const querySnapshot = await getDocs(q);
    const userMap = new Map(allUsers.map(u => [u.id, u]));

    const schedulesDocs = querySnapshot.docs.map((scheduleDoc) => {
      try {
        if (!scheduleDoc.exists()) return null;
        const scheduleData = scheduleDoc.data();
        if (!scheduleData) return null;

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

        if (endTime <= startTime) endTime = addDays(endTime, 1);

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

    return schedulesDocs.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  } catch (error) {
    return [];
  }
}

async function getVolunteerSchedules(schedules: Schedule[]): Promise<VolunteerSchedule[]> {
    const volunteerSchedules: VolunteerSchedule[] = [];

    for (const schedule of schedules) {
        if (!schedule.startTime || !schedule.endTime || !schedule.volunteers || schedule.volunteers.length === 0) continue;
        
        const startTimeUtc = new Date(schedule.startTime);
        const endTimeUtc = new Date(schedule.endTime);

        if (isNaN(startTimeUtc.getTime()) || isNaN(endTimeUtc.getTime())) continue;

        for (const volunteer of schedule.volunteers) {
            if (volunteer && volunteer.id) {
                const team = getTeamForDate(volunteer.teamHistory, startTimeUtc);
                volunteerSchedules.push({
                    volunteerId: volunteer.id,
                    rg: volunteer.rg,
                    nickname: volunteer.nickname,
                    workTeam: team || 'N/A',
                    scheduleName: schedule.scheduleName,
                    scheduleDate: format(startTimeUtc, 'PPP', { locale: ptBR }),
                    scheduleTime: `${getLocalTime(schedule.startTime)} - ${getLocalTime(schedule.endTime)}`,
                    startTime: schedule.startTime,
                });
            }
        }
    }
    
    return volunteerSchedules.sort((a, b) => {
        const dateA = new Date(a.startTime).getTime();
        const dateB = new Date(b.startTime).getTime();
        if (dateA !== dateB) return dateA - dateB;
        return a.nickname.localeCompare(b.nickname);
    });
}

const rankOrder: { [key: string]: number } = {
  'Coronel': 1, 'Tenente-Coronel': 2, 'Major': 3, 'Capitão': 4, '1º Tenente': 5,
  '2º Tenente': 6, 'Aspirante': 7, 'Subtenente': 8, '1º Sargento': 9,
  '2º Sargento': 10, '3º Sargento': 11, 'Cabo': 12, 'Soldado': 13,
};

const getRankOrder = (rank: string) => rankOrder[rank] || 99;

export default async function AdminDashboardPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('user_id')?.value || '';
  if (!userId) redirect('/');
  if (!(await isAdmin(userId))) redirect('/dashboard');

  const [userData, users, ac4Rates, scheduleSettings, absences] = await Promise.all([
    getUserDataById(userId), getAllUsers(), getAc4Rates(), getScheduleSettings(), getAbsences()
  ]);
  
  const schedules = await getSchedules(users);
  const volunteerSchedules = await getVolunteerSchedules(schedules);

  const sortedUsers = [...users].sort((a, b) => {
    const oA = getRankOrder(a.rank);
    const oB = getRankOrder(b.rank);
    if (oA !== oB) return oA - oB;
    const sA = a.sortOrder || 999;
    const sB = b.sortOrder || 999;
    if (sA !== sB) return sA - sB;
    const rgA = parseInt(a.rg.replace(/\D/g, ''), 10) || 0;
    const rgB = parseInt(b.rg.replace(/\D/g, ''), 10) || 0;
    if (rgA !== rgB) return rgA - rgB;
    return a.fullName.localeCompare(b.fullName);
  });
  
  const today = new Date();
  const rotationOfficers = sortedUsers.filter(u => {
    const team = getTeamForDate(u.teamHistory, today);
    return team !== 'ADM' && team !== 'AFASTADO' && team !== 'N/A';
  });

  const admOfficers = sortedUsers.filter(u => getTeamForDate(u.teamHistory, today) === 'ADM');
  const awayOfficers = sortedUsers.filter(u => getTeamForDate(u.teamHistory, today) === 'AFASTADO');

  return (
    <div className="flex min-h-screen w-full flex-col">
       <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-50">
        <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
            <div className='ml-auto'>
                 {userData ? <UserProfile user={userData} isAdmin={true} /> : null}
            </div>
        </div>
      </header>
      <AdminDashboard 
        schedules={schedules} 
        users={sortedUsers} 
        userCount={users.length}
        volunteerSchedules={volunteerSchedules}
        battalionOfficers={rotationOfficers}
        admOfficers={admOfficers}
        awayOfficers={awayOfficers}
        absences={absences}
        ac4Rates={ac4Rates}
        scheduleSettings={scheduleSettings}
       />
    </div>
  );
}
