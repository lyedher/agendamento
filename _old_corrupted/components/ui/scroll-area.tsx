'use client';

import { useState, useEffect, useMemo } from 'react';
import { format, isSameDay, isSameMonth, subMonths, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import type { Schedule, ScheduleSettings, Ac4Rates, Ac4Calculation } from '@/lib/types';
import { ScrollArea } from '../ui/scroll-area';
import { ScheduleSignUpButton } from './schedule-signup-button';
import { getLocalTime, calculateAc4 } from '@/lib/utils';
import type { DayContentProps } from 'react-day-picker';
import { ChevronLeft, ChevronRight, Hourglass } from 'lucide-react';
import { Button } from '../ui/button';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

type UserSchedulesProps = {
  schedules: Schedule[];
  currentUserId: string;
  scheduleSettings: ScheduleSettings;
  ac4Rates: Ac4Rates;
};

export function UserSchedules({ schedules, currentUserId, scheduleSettings, ac4Rates }: UserSchedulesProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isClient, setIsClient] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    setIsClient(true);
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const monthlyCalculations: Ac4Calculation[] = useMemo(() => {
    const monthSchedules = schedules.filter(s => {
        try {
            return isSameMonth(new Date(s.startTime), currentMonth);
        } catch {
            return false;
        }
    });
    return monthSchedules
        .map(schedule => calculateAc4(schedule, ac4Rates))
        .filter((calc): calc is Ac4Calculation => calc !== null);
  }, [schedules, currentMonth, ac4Rates]);

  const totalMonthlyValue = useMemo(() => {
    return monthlyCalculations.reduce((acc, calc) => acc + calc.totalValue, 0);
  }, [monthlyCalculations]);
  
  const totalMonthlyHours = useMemo(() => {
    return monthlyCalculations.reduce((total, calc) => {
        return total + calc.details.reduce((subTotal, detail) => subTotal + detail.hours, 0);
    }, 0);
  }, [monthlyCalculations]);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };


  const DayContent = (props: DayContentProps): JSX.Element | null => {
    try {
      const hasSchedule = schedules.some(schedule => 
        isSameDay(new Date(schedule.startTime), props.date)
      );
      return (
        <div className="relative flex items-center justify-center h-full w-full">
          <span>{format(props.date, 'd')}</span>
          {hasSchedule && <div className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-primary" />}
        </div>
      ) as any;
    } catch {
      return (
        <div className="relative flex items-center justify-center h-full w-full">
          <span>{format(props.date, 'd')}</span>
        </div>
      ) as any;
    }
  };
  
  const DayWithDetails = (day: Date): React.ReactNode => {
    const daySchedules = schedules.filter(schedule => {
        try {
            return isSameDay(new Date(schedule.startTime), day)
        } catch {
            return false;
        }
    });

    return (
      <div>
        <h3 className="mb-4 text-lg font-semibold text-center md:text-left">
          Escalas para {format(day, 'PPP', { locale: ptBR })}
        </h3>
        {daySchedules.length > 0 ? (
          <ScrollArea className='h-96 pr-4'>
            <ul className="space-y-4">
              {daySchedules.map(schedule => {
                const isCancelWindowActive = now < new Date(schedule.startTime);
                
                return (
                  <li key={schedule.id} className='rounded-md border p-4 text-sm transition-colors hover:bg-muted/50'>
                    <div className='flex justify-between items-start gap-4'>
                      <div>
                        <p className='font-semibold text-primary'>{schedule.scheduleName}</p>
                        <p className='text-lg font-bold text-foreground mt-1'>
                          {getLocalTime(schedule.startTime)} - {getLocalTime(schedule.endTime)}
                        </p>
                      </div>
                      <Badge variant="secondary" className="whitespace-nowrap">
                        Inscrito
                      </Badge>
                    </div>
                     <div className='mt-4 flex justify-end'>
                       <ScheduleSignUpButton 
                         scheduleId={schedule.id}
                         isSignedUp={true}
                         isFull={false}
                         hasConflict={false}
                         isWindowActive={true}
                         isCancelWindowActive={isCancelWindowActive}
                         isScheduleLimitReached={false}
                       />
                     </div>
                  </li>
                );
              })}
            </ul>
          </ScrollArea>
        ) : (
          <p className='text-sm text-muted-foreground text-center md:text-left'>Nenhuma escala.</p>
        )}
      </div>
    );
  };

  if (!isClient) {
    return null;
  }
  
  if (schedules.length === 0) {
     return (
        <div className="text-center text-muted-foreground py-10">
            <p>Nenhuma escala confirmada.</p>
            <Button asChild variant="link" className="mt-2 text-primary">
                <Link href="/agendamento">Ir para Agendamento</Link>
            </Button>
        </div>
    );
  }

  return (
    <div className='space-y-6'>
       <Card className="border-primary">
            <CardHeader>
                <CardTitle className="text-xl capitalize">Resumo de {format(currentMonth, 'MMMM', { locale: ptBR })}</CardTitle>
                <CardDescription>
                    Total acumulado no mês.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-4 rounded-lg border p-4">
                    <Hourglass className="h-8 w-8 text-muted-foreground" />
                    <div>
                        <p className="text-sm text-muted-foreground">Total de Horas</p>
                        <p className="text-2xl font-bold">{totalMonthlyHours}h</p>
                    </div>
                </div>
                 <div className="flex items-center gap-4 rounded-lg border p-4">
                     <span className="text-3xl font-bold text-muted-foreground">R$</span>
                    <div>
                        <p className="text-sm text-muted-foreground">Valor a Receber</p>
                        <p className="text-2xl font-bold">{formatCurrency(totalMonthlyValue)}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className='rounded-md border p-4'>
          <div className="flex items-center justify-center gap-4 mb-4">
              <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                  <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className='flex items-center gap-2'>
                  <h3 className="text-lg font-semibold w-48 text-center capitalize">
                  {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                  </h3>
                  <Button variant="outline" onClick={() => setCurrentMonth(new Date())}>Mês Atual</Button>
              </div>
              <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                  <ChevronRight className="h-4 w-4" />
              </Button>
          </div>
          <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              className="w-full"
              locale={ptBR}
              components={{
                DayContent: (props) => DayContent(props) as any,
              }}
          />
        </div>
        <div className="flex-1">
          {selectedDate ? DayWithDetails(selectedDate) : <p className='text-sm text-muted-foreground text-center md:text-left'>Selecione um dia.</p>}
        </div>
      </div>
    </div>
  );
}