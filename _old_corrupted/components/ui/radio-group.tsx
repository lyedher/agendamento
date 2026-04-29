'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { startOfMonth, endOfMonth, addMonths, subMonths, parseISO } from 'date-fns';
import { format as formatTZ, toZonedTime } from 'date-fns-tz';
import { ptBR } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import type { Schedule, ScheduleSettings } from '@/lib/types';
import { ScrollArea } from '../ui/scroll-area';
import { ScheduleSignUpButton } from './schedule-signup-button';
import { getLocalTime, isSameDayInTz, TIME_ZONE } from '@/lib/utils';
import type { DayContentProps } from 'react-day-picker';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';

export function UserCalendar({ schedules, currentUserId, scheduleSettings }: { schedules: Schedule[]; currentUserId: string; scheduleSettings: ScheduleSettings; }) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isClient, setIsClient] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    setIsClient(true);
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const isWindowActive = useMemo(() => {
    if (!scheduleSettings) return true;
    const start = scheduleSettings.schedulingStartDate ? parseISO(scheduleSettings.schedulingStartDate) : null;
    const end = scheduleSettings.schedulingEndDate ? parseISO(scheduleSettings.schedulingEndDate) : null;
    if (!start && !end) return true;
    if (start && !end) return now >= start;
    if (!start && end) return now <= end;
    return now >= start! && now <= end!;
  }, [scheduleSettings, now]);
  
  const getUserSchedulesCountForMonth = useCallback((date: Date) => {
    const start = startOfMonth(toZonedTime(date, TIME_ZONE));
    const end = endOfMonth(toZonedTime(date, TIME_ZONE));
    return schedules.filter(s => {
        if (!s.userIds.includes(currentUserId)) return false;
        const sTime = new Date(s.startTime);
        return sTime >= start && sTime <= end && s.status !== 'canceled';
    }).length;
  }, [schedules, currentUserId]);

  const DayContentWithIndicator = (props: DayContentProps): JSX.Element | null => {
    const hasAvailable = schedules.some(s => isSameDayInTz(s.startTime, props.date) && s.userIds.length < s.capacity && s.status !== 'canceled');
    return (
      <div className="relative flex items-center justify-center h-full w-full">
        <span>{formatTZ(props.date, 'd', { timeZone: TIME_ZONE })}</span>
        {hasAvailable && <div className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-primary" />}
      </div>
    ) as any;
  };
  
  const DayWithDetails = (day: Date): React.ReactNode => {
    const daySchedules = schedules.filter(s => isSameDayInTz(s.startTime, day));
    const userSchedulesForDay = daySchedules.filter(s => s.userIds.includes(currentUserId));
    
    const hasConflict = (sCheck: Schedule): boolean => {
        if (sCheck.userIds.includes(currentUserId)) return false;
        const checkStart = new Date(sCheck.startTime).getTime();
        const checkEnd = new Date(sCheck.endTime).getTime();
        return userSchedulesForDay.some(us => {
            const uStart = new Date(us.startTime).getTime();
            const uEnd = new Date(us.endTime).getTime();
            return Math.max(checkStart, uStart) < Math.min(checkEnd, uEnd);
        });
    };
    
    const max = scheduleSettings.maxSchedulesPerUser;
    const currentCount = getUserSchedulesCountForMonth(day);

    return (
      <div className="animate-in fade-in slide-in-from-right-4 duration-300">
        <h3 className="mb-4 text-lg font-semibold text-center md:text-left capitalize">
          {formatTZ(day, "EEEE, dd 'de' MMMM", { timeZone: TIME_ZONE, locale: ptBR })}
        </h3>
        {max != null && max > 0 && (
          <Alert className="mb-4 bg-muted/50">
            <Info className="h-4 w-4" />
            <AlertTitle>Limite Mensal</AlertTitle>
            <AlertDescription>Você já possui {currentCount} de {max} escalas extras confirmadas neste mês.</AlertDescription>
          </Alert>
        )}
        {daySchedules.length > 0 ? (
          <ScrollArea className='h-96 pr-4'>
            <ul className="space-y-4">
              {daySchedules.map(schedule => {
                const isSignedUp = schedule.userIds.includes(currentUserId);
                const isFull = schedule.userIds.length >= schedule.capacity;
                const conflict = hasConflict(schedule);
                const isCancelActive = now < new Date(schedule.startTime);
                const limitReached = max != null && max > 0 && currentCount >= max;

                return (
                  <li key={schedule.id} className='rounded-md border p-4 text-sm transition-colors hover:bg-muted/50 bg-card shadow-sm'>
                    <div className='flex justify-between items-start gap-4'>
                      <div>
                        <p className='font-semibold text-primary'>{schedule.scheduleName}</p>
                        <p className='text-lg font-bold text-foreground mt-1'>
                          {getLocalTime(schedule.startTime)} - {getLocalTime(schedule.endTime)}
                        </p>
                      </div>
                      <Badge variant={isFull ? "destructive" : "secondary"}>{schedule.userIds.length}/{schedule.capacity} Vagas</Badge>
                    </div>
                     <div className='mt-4 flex justify-end'>
                       <ScheduleSignUpButton 
                         scheduleId={schedule.id}
                         isSignedUp={isSignedUp}
                         isFull={isFull}
                         hasConflict={conflict}
                         isWindowActive={isWindowActive}
                         isCancelWindowActive={isCancelActive}
                         isScheduleLimitReached={limitReached && !isSignedUp}
                       />
                     </div>
                  </li>
                );
              })}
            </ul>
          </ScrollArea>
        ) : (<p className='text-sm text-muted-foreground text-center md:text-left py-8'>Nenhuma escala disponível.</p>)}
      </div>
    );
  };

  if (!isClient) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className='rounded-md border p-4 bg-card shadow-sm'>
         <div className="flex items-center justify-center gap-4 mb-4">
            <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}><ChevronLeft className="h-4 w-4" /></Button>
            <h3 className="text-lg font-semibold w-48 text-center capitalize">{formatTZ(currentMonth, 'MMMM yyyy', { timeZone: TIME_ZONE, locale: ptBR })}</h3>
            <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}><ChevronRight className="h-4 w-4" /></Button>
        </div>
        <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} month={currentMonth} onMonthChange={setCurrentMonth} locale={ptBR} components={{ DayContent: (props) => DayContentWithIndicator(props) as any }} className="rounded-md" />
      </div>
      <div className="flex-1">{selectedDate ? DayWithDetails(selectedDate) : (<div className="flex flex-col items-center justify-center h-full py-12 border-2 border-dashed rounded-lg text-muted-foreground"><p>Selecione um dia.</p></div>)}</div>
    </div>
  );
}
