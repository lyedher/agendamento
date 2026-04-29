
'use client';

import { useState, useMemo, useEffect } from 'react';
import { addDays, eachDayOfInterval, isToday, format, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';
import { ArrowLeft, Calendar as CalendarIcon } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { ReportPrintButton } from '@/components/admin/report-print-button';
import type { Absence, UserData } from '@/lib/types';
import { getEquipeDoDia, getTeamForDate } from '@/lib/utils';
import { BattalionDayRow } from './battalion/battalion-day-row';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { cn } from '@/lib/utils';

type BattalionReportContentProps = {
  officers: UserData[];
  absences: Absence[];
};

export function BattalionReportContent({ officers, absences }: BattalionReportContentProps) {
  const [isClient, setIsClient] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  useEffect(() => {
    setIsClient(true);
    setDateRange({
      from: new Date(),
      to: addDays(new Date(), 29),
    });
  }, []);

  const daysInPeriod = useMemo(() => {
    if (!dateRange || !dateRange.from) return [];
    const end = dateRange.to || dateRange.from;
    return eachDayOfInterval({ start: dateRange.from, end });
  }, [dateRange]);
  
  const getPeriodString = () => {
    if (!isClient || !dateRange || !dateRange.from) return '';
    const start = format(dateRange.from, 'dd/MM/yyyy');
    const end = dateRange.to ? format(dateRange.to, 'dd/MM/yyyy') : start;
    if (start === end) return start;
    return `${start} a ${end}`;
  }

  return (
    <div className="bg-background text-foreground min-h-screen">
      <main className="container mx-auto p-4 md:p-8 print:p-0">
         <div className="text-center mb-8 print:mb-4">
            <h1 className="text-2xl font-bold uppercase tracking-wider">Estado de Goiás</h1>
            <h2 className="text-xl font-semibold uppercase tracking-wide">Polícia Militar</h2>
            <h2 className="text-xl font-semibold uppercase tracking-wide">39º BPM</h2>
        </div>

        <div className="hidden print:block text-center mb-4">
            <h3 className="text-lg font-bold">ESCALA DE SERVIÇO ORDINÁRIO</h3>
             <p className="text-sm font-medium">
                Período: {getPeriodString()}
             </p>
        </div>
        
        <div className="flex justify-between items-center mb-4 print:hidden">
            <Button asChild variant="outline">
                <Link href="/admin/dashboard">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar ao Painel
                </Link>
            </Button>
             <div className="flex items-center gap-4">
                 <Popover>
                    <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                        "w-[300px] justify-start text-left font-normal",
                        !dateRange && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {getPeriodString() ? getPeriodString() : <span>Selecione o período</span>}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={setDateRange}
                        numberOfMonths={2}
                        locale={ptBR}
                    />
                    </PopoverContent>
                </Popover>
                <ReportPrintButton />
             </div>
        </div>


        <div className="space-y-4 mt-8">
            {daysInPeriod.map((day) => {
                const teamOnDuty = getEquipeDoDia(day);
                const officersOnDuty = officers.filter(o => 
                    getTeamForDate(o.teamHistory, day) === teamOnDuty &&
                    (!o.presentationDate || startOfDay(new Date(o.presentationDate)) <= startOfDay(day))
                );
                return (
                    <div key={day.toISOString()} className="break-inside-avoid">
                        <BattalionDayRow
                            date={day}
                            teamOnDuty={teamOnDuty}
                            officersOnDuty={officersOnDuty}
                            allAbsences={absences}
                            isToday={isToday(day)}
                        />
                    </div>
                );
            })}
        </div>
      </main>
    </div>
  );
}
