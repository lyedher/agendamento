
import type { UserData } from '@/components/layout/user-profile';
import { getAllUsers } from '@/lib/actions';
import { UsersReportContent } from '@/components/admin/users-report-content';
import { getTeamForDate } from '@/lib/utils';


const rankOrder: { [key: string]: number } = {
  'Coronel': 1, 'Tenente-Coronel': 2, 'Major': 3, 'Capitão': 4, '1º Tenente': 5,
  '2º Tenente': 6, 'Aspirante': 7, 'Aspirante a Oficial': 7, 'Subtenente': 8, '1º Sargento': 9,
  '2º Sargento': 10, '3º Sargento': 11, 'Cabo': 12, 'Soldado': 13,
};

const getRankOrder = (rank: string) => {
    return rankOrder[rank] || 99;
}


export default async function UsersReportPage() {
    const users = await getAllUsers();
    
    const sortedUsers = [...users].sort((a, b) => {
        const orderA = getRankOrder(a.rank);
        const orderB = getRankOrder(b.rank);
        if (orderA !== orderB) {
            return orderA - orderB;
        }

        const sortOrderA = a.sortOrder || 999;
        const sortOrderB = b.sortOrder || 999;
        if (sortOrderA !== sortOrderB) {
            return sortOrderA - sortOrderB;
        }
        
        const rgA = parseInt(a.rg.replace(/\D/g, ''), 10) || 0;
        const rgB = parseInt(b.rg.replace(/\D/g, ''), 10) || 0;
        if (rgA !== rgB) {
            return rgA - rgB;
        }
        
        return a.fullName.localeCompare(b.fullName);
    });

  return (
    <UsersReportContent users={sortedUsers} />
  );
}
