'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { DateRange } from 'react-day-picker';
import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Ac4Summary } from '@/components/ac4/ac4-summary';
import { Ac4Simulator } from '@/components/ac4/ac4-simulator';
import { ExternalScheduleManager } from '@/components/ac4/external-schedule-manager';
import { calculateAc4, cn } from '@/lib/utils';
import type { Schedule, Ac4Rates, Ac4Calculation } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Button } from '../ui/button';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';

type Ac4PageContentProps = {
    schedules: Schedule[];
    ac4Rates: Ac4Rates;
    initialDateRange: { from: Date; to: Date };
}

const LOCAL_STORAGE_KEY = 'external_schedules';

export function Ac4PageContent({ schedules, ac4Rates, initialDateRange }: Ac4PageContentProps) {
    const router = useRouter();
    const [isClient, setIsClient] = useState(false);
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
      from: initialDateRange.from,
      to: initialDateRange.to,
    });
    const [externalSchedules, setExternalSchedules] = useState<(Schedule & { isExternal?: boolean })[]>([]);

    useEffect(() => {
        setIsClient(true);
        try {
            const savedSchedules = localStorage.getItem(LOCAL_STORAGE_KEY);
            // Verificação robusta para evitar "Unexpected end of JSON input"
            if (savedSchedules && savedSchedules.trim() !== "" && savedSchedules !== "undefined") {
                const parsed = JSON.parse(savedSchedules);
                if (Array.isArray(parsed)) {
                    setExternalSchedules(parsed);
                }
            }
        } catch (error) {
            console.error("Erro ao carregar escalas externas do localStorage:", error);
            localStorage.removeItem(LOCAL_STORAGE_KEY);
        }
    }, []);

    useEffect(() => {
        if (isClient) {
            try {
                // Salva apenas se for um array válido
                if (Array.isArray(externalSchedules)) {
                    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(externalSchedules));
                }
            } catch (error) {
                console.error("Erro ao salvar escalas externas no localStorage:", error);
            }
        }
    }, [externalSchedules, isClient]);
    
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

    const handleAddExternalSchedule = (newScheduleData: Omit<Schedule, 'id' | 'capacity' | 'userIds' | 'volunteers'>) => {
        const newSchedule: Schedule & { isExternal: boolean } = {
            ...newScheduleData,
            id: `external-${Date.now()}`,
            capacity: 0,
            userIds: [],
            volunteers: [],
            isExternal: true,
        };
        setExternalSchedules(prev => [...prev, newSchedule]);
    };

    const handleRemoveExternalSchedule = (id: string) => {
        setExternalSchedules(prev => prev.filter(s => s.id !== id));
    };

    const allSchedules = useMemo(() => {
        const officialSchedules = schedules || [];
        if (!dateRange?.from) {
            return officialSchedules;
        }
        const interval = {
            start: startOfDay(dateRange.from),
            end: endOfDay(dateRange.to || dateRange.from),
        };
        const filteredExternal = externalSchedules.filter(extSchedule => {
            try {
                return isWithinInterval(new Date(extSchedule.startTime), interval)
            } catch {
                return false;
            }
        });
        return [...officialSchedules, ...filteredExternal];
    }, [schedules, externalSchedules, dateRange]);


    const calculations: Ac4Calculation[] = useMemo(() => {
        return allSchedules
            .map(schedule => calculateAc4(schedule, ac4Rates))
            .filter((calc): calc is Ac4Calculation => calc !== null)
            .sort((a,b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    }, [allSchedules, ac4Rates]);
    
    const getPeriodString = () => {
        if (!isClient || !dateRange || !dateRange.from) return '';
        const start = format(dateRange.from, 'dd/MM/yyyy');
        const end = dateRange.to ? format(dateRange.to, 'dd/MM/yyyy') : start;
        if (start === end) return start;
        return `${start} a ${end}`;
    }

    return (
        <div className='grid gap-8'>
          <Card className="w-full animate-in fade-in duration-500">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <CardTitle className="font-headline text-3xl">Cálculo de AC-4</CardTitle>
                    <CardDescription className="mt-2">
                        Visualize o detalhamento dos valores a receber por cada serviço extraordinário realizado.
                    </CardDescription>
                </div>
                 <Popover>
                    <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                        "w-full sm:w-[300px] justify-start text-left font-normal",
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
              </div>
            </CardHeader>
            <CardContent>
              <Ac4Summary calculations={calculations} />
            </CardContent>
          </Card>
          <ExternalScheduleManager 
            externalSchedules={externalSchedules}
            onAddSchedule={handleAddExternalSchedule}
            onRemoveSchedule={handleRemoveExternalSchedule}
           />
           <Card className="w-full animate-in fade-in-0 duration-500 delay-100">
            <CardHeader>
              <CardTitle className="font-headline text-2xl">Simulador de Cálculo</CardTitle>
              <CardDescription>
                Calcule o valor de uma escala fictícia inserindo a data e os horários.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Ac4Simulator rates={ac4Rates} />
            </CardContent>
          </Card>
        </div>
    )
}