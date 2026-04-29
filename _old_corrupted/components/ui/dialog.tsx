'use client';

import { useState, useMemo, useEffect } from 'react';
import { isSameMonth } from 'date-fns';
import { format as formatTZ } from 'date-fns-tz';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import type { VolunteerSchedule } from '@/lib/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { maskFunctions } from '@/lib/schemas';
import { Skeleton } from '../ui/skeleton';
import { CalendarControls } from './battalion/battalion-calendar-controls';

type VolunteerScheduleListProps = {
  volunteerSchedules: VolunteerSchedule[];
};

type GroupedSchedules = {
    [volunteerId: string]: {
        nickname: string;
        rg: string;
        workTeam: string;
        schedules: {
            scheduleName: string;
            scheduleDate: string;
            scheduleTime: string;
            startTime: string;
        }[];
    }
}

export function VolunteerScheduleList({ volunteerSchedules }: VolunteerScheduleListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const timeZone = 'America/Sao_Paulo';

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const monthlySchedules = useMemo(() => {
    return volunteerSchedules.filter(schedule => {
        try {
            const date = new Date(schedule.startTime);
            return isSameMonth(date, currentMonth);
        } catch {
            return false;
        }
    });
  }, [volunteerSchedules, currentMonth]);

  const groupedSchedules: GroupedSchedules = useMemo(() => {
     const grouped: GroupedSchedules = monthlySchedules.reduce((acc, item) => {
        const key = item.volunteerId;
        if (!acc[key]) {
            acc[key] = {
                nickname: item.nickname,
                rg: item.rg,
                workTeam: item.workTeam,
                schedules: [],
            };
        }
        acc[key].schedules.push({
            scheduleName: item.scheduleName,
            scheduleDate: item.scheduleDate,
            scheduleTime: item.scheduleTime,
            startTime: item.startTime,
        });
        return acc;
    }, {} as GroupedSchedules);

    // Ordenar as escalas dentro de cada voluntário por data
    Object.keys(grouped).forEach(vId => {
        grouped[vId].schedules.sort((a,b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    });

    return grouped;
  }, [monthlySchedules])

 const filteredSchedules = useMemo(() => {
    if (!searchTerm) return groupedSchedules;
    
    const lowercasedFilter = searchTerm.toLowerCase();
    
    return Object.entries(groupedSchedules).reduce((acc, [volunteerId, data]) => {
        if (
            data.rg.toLowerCase().includes(lowercasedFilter) ||
            data.nickname.toLowerCase().includes(lowercasedFilter) ||
            data.workTeam.toLowerCase().includes(lowercasedFilter)
        ) {
            acc[volunteerId] = data;
        }
        return acc;
    }, {} as GroupedSchedules);
 }, [searchTerm, groupedSchedules]);
  
  const sortedVolunteerIds = useMemo(() => Object.keys(filteredSchedules).sort((a,b) => filteredSchedules[a].nickname.localeCompare(filteredSchedules[b].nickname)), [filteredSchedules]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
                <CardTitle>Lista de Agendamento por Policial</CardTitle>
                <CardDescription className='mt-2'>
                Visualize todos os agendamentos de escalas para cada policial individualmente.
                </CardDescription>
            </div>
             {isClient && <Badge variant="secondary">Total de Policiais: {Object.keys(filteredSchedules).length}</Badge>}
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4">
            <Input
            placeholder="Pesquisar por nome de guerra, RG ou equipe..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
            />
             <CalendarControls 
                currentDate={currentMonth}
                onPreviousMonth={() => setCurrentMonth(prev => new Date(prev.setMonth(prev.getMonth() - 1)))}
                onNextMonth={() => setCurrentMonth(prev => new Date(prev.setMonth(prev.getMonth() + 1)))}
                onGoToCurrentMonth={() => setCurrentMonth(new Date())}
            />
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[800px]">
            {!isClient ? (
                <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            ) : sortedVolunteerIds.length > 0 ? (
                 <Accordion type="multiple" className="w-full">
                    {sortedVolunteerIds.map((volunteerId) => {
                        const volunteer = filteredSchedules[volunteerId];
                        return (
                             <AccordionItem value={volunteerId} key={volunteerId}>
                                <AccordionTrigger>
                                    <div className="flex flex-col items-start text-left md:flex-row md:items-center md:gap-4">
                                        <div className='font-semibold text-primary'>
                                           <span>{volunteer.nickname}</span>
                                           <span className='ml-2 text-sm font-medium text-muted-foreground'>(RG: {maskFunctions.rg(volunteer.rg)})</span>
                                        </div>
                                        <Badge variant="outline">Equipe: {volunteer.workTeam}</Badge>
                                        <Badge variant="secondary">Escalas: {volunteer.schedules.length}</Badge>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Escala</TableHead>
                                                <TableHead>Data</TableHead>
                                                <TableHead>Horário</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {volunteer.schedules.map((schedule, index) => (
                                                <TableRow key={`${volunteerId}-${schedule.scheduleName}-${index}`}>
                                                    <TableCell>{schedule.scheduleName}</TableCell>
                                                    <TableCell>{schedule.scheduleDate}</TableCell>
                                                    <TableCell>{schedule.scheduleTime}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </AccordionContent>
                             </AccordionItem>
                        )
                    })}
                 </Accordion>
            ): (
                 <div className="text-center text-muted-foreground py-10">
                    <p>Nenhum voluntário encontrado para os filtros aplicados.</p>
                 </div>
            )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}