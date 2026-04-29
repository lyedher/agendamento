
'use client';

import { useState, useMemo, useCallback } from 'react';
import { addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isToday } from 'date-fns';
import { UserCog } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Absence, UserData } from '@/lib/types';
import { getEquipeDoDia, getTeamForDate } from '@/lib/utils';
import { CalendarControls } from './battalion/battalion-calendar-controls';
import { BattalionDayRow } from './battalion/battalion-day-row';
import { Button } from '@/components/ui/button';
import { ManageAbsencesDialog } from './battalion/manage-absences-dialog';

type BattalionScheduleViewProps = {
  initialOfficers: UserData[];
  initialAbsences: Absence[];
};

export function BattalionScheduleView({ initialOfficers, initialAbsences }: BattalionScheduleViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [absences, setAbsences] = useState(initialAbsences);
  const [isManageAbsencesOpen, setManageAbsencesOpen] = useState(false);

  const handlePreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };
  
  const handleGoToCurrentMonth = () => {
    setCurrentDate(new Date());
  };

  const daysInMonth = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const handleAbsencesUpdated = useCallback((newAbsences: Absence[]) => {
      setAbsences(newAbsences);
      setManageAbsencesOpen(false);
  }, []);

  const officersForRotation = useMemo(() => {
    return initialOfficers.filter(o => {
        const team = getTeamForDate(o.teamHistory, new Date());
        return team !== 'ADM' && team !== 'AFASTADO';
    })
  }, [initialOfficers])

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div>
              <CardTitle>Escala Ordinária</CardTitle>
              <CardDescription>
                Visualize a escala de serviço diária das equipes do batalhão (regime 24/72).
              </CardDescription>
            </div>
             <Button variant="outline" onClick={() => setManageAbsencesOpen(true)}>
                <UserCog className="mr-2 h-4 w-4" />
                Gerenciar Afastamentos
            </Button>
          </div>
          <CalendarControls
            currentDate={currentDate}
            onPreviousMonth={handlePreviousMonth}
            onNextMonth={handleNextMonth}
            onGoToCurrentMonth={handleGoToCurrentMonth}
          />
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[70vh] pr-4">
            <div className="space-y-4">
              {daysInMonth.map((day) => {
                 const teamOnDuty = getEquipeDoDia(day);
                 const officersOnDuty = officersForRotation.filter(o => getTeamForDate(o.teamHistory, day) === teamOnDuty);
                return (
                  <BattalionDayRow
                    key={day.toISOString()}
                    date={day}
                    teamOnDuty={teamOnDuty}
                    officersOnDuty={officersOnDuty}
                    allAbsences={absences}
                    isToday={isToday(day)}
                  />
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
      <ManageAbsencesDialog 
        isOpen={isManageAbsencesOpen}
        onOpenChange={setManageAbsencesOpen}
        officers={officersForRotation}
        currentAbsences={absences}
        onAbsencesUpdated={handleAbsencesUpdated}
      />
    </>
  );
}
