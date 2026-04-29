'use client';

import { useState, useEffect } from 'react';
import type { DateRange } from 'react-day-picker';
import { format as formatTZ } from 'date-fns-tz';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';
import { ArrowLeft, Calendar as CalendarIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

import type { Schedule } from '@/lib/types';
import type { UserData } from '@/components/layout/user-profile';
import { cn, getLocalTime, getTeamForDate } from '@/lib/utils';
import { maskFunctions } from '@/lib/schemas';

import { ReportPrintButton } from '@/components/admin/report-print-button';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

type GroupedSchedules = {
    [date: string]: {
        [scheduleName: string]: {
            scheduleTime: string;
            volunteers: UserData[];
            startTime: string;
        }
    }
}

type Ac4ReportContentProps = {
    schedules: Schedule[];
    initialDateRange: { from: Date, to: Date };
}

export function Ac4ReportContent({ schedules, initialDateRange }: Ac4ReportContentProps) {
    const router = useRouter();
    const [isClient, setIsClient] = useState(false);
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
      from: initialDateRange.from,
      to: initialDateRange.to,
    });

    const timeZone = 'America/Sao_Paulo';

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (dateRange?.from && dateRange?.to) {
            const fromISO = dateRange.from.toISOString().split('T')[0];
            const toISO = dateRange.to.toISOString().split('T')[0];
            const currentPath = window.location.pathname;
            const newUrl = `${currentPath}?from=${fromISO}&to=${toISO}`;
            if (window.location.search !== `?from=${fromISO}&to=${toISO}`) {
                 router.push(newUrl, { scroll: false });
            }
        }
    }, [dateRange, router]);

    
    function groupSchedules(schedules: Schedule[]): GroupedSchedules {
        const grouped: GroupedSchedules = {};

        const rankOrder: { [key: string]: number } = {
            'Coronel': 1, 'Tenente-Coronel': 2, 'Major': 3, 'Capitão': 4, '1º Tenente': 5,
            '2º Tenente': 6, 'Aspirante': 7, 'Aspirante a Oficial': 7, 'Subtenente': 8, '1º Sargento': 9,
            '2º Sargento': 10, '3º Sargento': 11, 'Cabo': 12, 'Soldado': 13,
        };
        const getRankOrder = (rank: string) => rankOrder[rank] || 99;

        schedules.forEach(schedule => {
            if (!schedule.volunteers || schedule.volunteers.length === 0) {
                return;
            }

            try {
                const scheduleDate = formatTZ(new Date(schedule.startTime), 'EEEE, dd \'de\' MMMM \'de\' yyyy', { timeZone, locale: ptBR });
                const scheduleTime = `${getLocalTime(schedule.startTime)} - ${getLocalTime(schedule.endTime)}`;

                if (!grouped[scheduleDate]) {
                    grouped[scheduleDate] = {};
                }
                if (!grouped[scheduleDate][schedule.scheduleName]) {
                    grouped[scheduleDate][schedule.scheduleName] = {
                        scheduleTime: scheduleTime,
                        volunteers: [],
                        startTime: schedule.startTime,
                    };
                }

                const sortedVolunteers = [...schedule.volunteers].sort((a, b) => {
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
                
                grouped[scheduleDate][schedule.scheduleName].volunteers.push(...sortedVolunteers);
                const uniqueVolunteers = Array.from(new Map(grouped[scheduleDate][schedule.scheduleName].volunteers.map(v => [v.id, v])).values());
                grouped[scheduleDate][schedule.scheduleName].volunteers = uniqueVolunteers;

            } catch (e) {
                console.error('Error processing schedule for report:', e);
            }
        });

        for (const date in grouped) {
            const sortedSchedules = Object.entries(grouped[date]).sort(([, a], [, b]) => {
                const timeA = a.scheduleTime.split(' - ')[0];
                const timeB = b.scheduleTime.split(' - ')[0];
                return timeA.localeCompare(timeB);
            });
            grouped[date] = Object.fromEntries(sortedSchedules);
        }
        
        return grouped;
    }

    const groupedSchedules = groupSchedules(schedules);
    const sortedDates = Object.keys(groupedSchedules).sort((a, b) => {
        // Obter uma string ISO para sort confiável a partir do primeiro volunteer de cada dia
        const firstScheduleA = Object.values(groupedSchedules[a])[0];
        const firstScheduleB = Object.values(groupedSchedules[b])[0];
        return new Date(firstScheduleA.startTime).getTime() - new Date(firstScheduleB.startTime).getTime();
    });

    const getPeriodString = () => {
        if (!isClient || !dateRange || !dateRange.from) return '';
        const start = formatTZ(dateRange.from, 'dd/MM/yyyy', { timeZone });
        const end = dateRange.to ? formatTZ(dateRange.to, 'dd/MM/yyyy', { timeZone }) : start;
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
            <h3 className="text-lg font-bold">ESCALA DE SERVIÇO EXTRAORDINÁRIO (AC-4)</h3>
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

        <div className="space-y-8">
            {sortedDates.map(date => (
                <div key={date} className="border-t-2 border-foreground pt-4 first:border-t-0 break-inside-avoid">
                    <h3 className="text-xl font-bold capitalize mb-4 text-center">{date}</h3>
                    {Object.entries(groupedSchedules[date]).map(([scheduleName, data]) => (
                        <div key={scheduleName} className="mb-6 last:mb-0">
                            <h4 className="text-lg font-semibold bg-muted px-2 py-1 rounded-md">{scheduleName} - {data.scheduleTime}</h4>
                            <div className="overflow-x-auto">
                                <table className="w-full mt-2 text-sm print:text-xs">
                                    <thead className="border-b">
                                        <tr>
                                            <th className="px-2 py-1 text-left font-semibold w-[12%]">Posto/Grad</th>
                                            <th className="px-2 py-1 text-left font-semibold w-[10%]">RG</th>
                                            <th className="px-2 py-1 text-left font-semibold w-[28%]">Nome Completo</th>
                                            <th className="px-2 py-1 text-left font-semibold w-[12%]">CPF</th>
                                            <th className="px-2 py-1 text-left font-semibold w-[13%]">Equipe</th>
                                            <th className="px-2 py-1 text-left font-semibold w-[12%]">Nº VTR</th>
                                            <th className="px-2 py-1 text-left font-semibold w-[13%]">Nº RAI</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.volunteers.map((volunteer, index) => (
                                            <tr key={volunteer.id} className={cn("border-b border-muted whitespace-nowrap", index % 2 !== 0 && "bg-muted/50 print-bg-muted")}>
                                                <td className="px-2 py-1">{volunteer.rank}</td>
                                                <td className="px-2 py-1">{maskFunctions.rg(volunteer.rg)}</td>
                                                <td className="px-2 py-1">{volunteer.fullName}</td>
                                                <td className="px-2 py-1">{maskFunctions.taxId(volunteer.taxId)}</td>
                                                <td className="px-2 py-1">{getTeamForDate(volunteer.teamHistory, new Date(data.startTime))}</td>
                                                <td className="px-2 py-1 border-b"></td>
                                                <td className="px-2 py-1 border-b"></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                </div>
            ))}
             {schedules.length === 0 && (
                <div className="text-center text-muted-foreground py-10">
                    <p>Nenhuma escala AC-4 encontrada para o período selecionado.</p>
                </div>
            )}
        </div>
      </main>
    </div>
  );
}