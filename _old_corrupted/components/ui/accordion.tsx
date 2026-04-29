
'use client';

import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { UserData, Absence, Team } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { maskFunctions } from '@/lib/schemas';
import { cn } from '@/lib/utils';

type BattalionDayRowProps = {
  date: Date;
  teamOnDuty: Team;
  officersOnDuty: UserData[];
  allAbsences: Absence[];
  isToday: boolean;
};

export function BattalionDayRow({ date, teamOnDuty, officersOnDuty, allAbsences, isToday }: BattalionDayRowProps) {
  const teamColorClasses: Record<Team, string> = {
    ALPHA: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    BRAVO: 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100',
    CHARLIE: 'bg-gray-300 text-gray-900 dark:bg-gray-600 dark:text-gray-50',
    DELTA: 'bg-gray-400 text-gray-900 dark:bg-gray-500 dark:text-gray-50',
    ADM: '',
    AFASTADO: ''
  };
  
  const processedOfficers = officersOnDuty.map(officer => {
    const absence = allAbsences.find(a => 
      a.officerId === officer.id &&
      isWithinInterval(date, { start: startOfDay(new Date(a.startDate)), end: endOfDay(new Date(a.endDate)) })
    );
    return {
      ...officer,
      isAbsent: !!absence,
      absenceReason: absence?.reason,
    };
  }).sort((a, b) => {
    const isAPlantonista = a.jobFunction?.toLowerCase() === 'plantonista';
    const isBPlantonista = b.jobFunction?.toLowerCase() === 'plantonista';

    // Rule 1: Absent officers go to the very bottom.
    if (a.isAbsent && !b.isAbsent) return 1;
    if (!a.isAbsent && b.isAbsent) return -1;
    if (a.isAbsent && b.isAbsent) return 0; // Keep original order among absent officers

    // Rule 2: Plantonista goes just above absent officers.
    if (isAPlantonista && !isBPlantonista) return 1;
    if (!isAPlantonista && isBPlantonista) return -1;
    
    // Otherwise, keep original sort order for active, non-plantonista officers.
    return 0; 
  });


  const renderOfficerTable = (officers: typeof processedOfficers, title: string) => (
    <div className="mt-4">
        <h4 className="font-semibold text-center mb-2">{title}</h4>
        {officers.length > 0 ? (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[20%]">Posto/Grad</TableHead>
                        <TableHead className="w-[15%]">RG</TableHead>
                        <TableHead className="w-[45%]">Nome Completo</TableHead>
                        <TableHead className="w-[20%]">Função</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {officers.map((officer, index) => (
                        <TableRow key={officer.id} className={cn(index % 2 !== 0 && "bg-muted/50 print-bg-muted")}>
                            <TableCell>{officer.rank}</TableCell>
                            <TableCell>{maskFunctions.rg(officer.rg)}</TableCell>
                            <TableCell className={cn(
                                officer.isAbsent && "text-red-500 line-through",
                                officer.jobFunction?.toLowerCase() === 'plantonista' && "text-blue-600 font-semibold"
                            )}>
                                {officer.fullName}
                            </TableCell>
                            <TableCell>{officer.isAbsent ? officer.absenceReason : officer.jobFunction}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        ) : (
            <p className="text-sm text-muted-foreground text-center">Nenhum policial para esta equipe.</p>
        )}
    </div>
  );


  return (
    <Card className={cn("overflow-hidden", isToday && "border-2 border-primary ring-2 ring-primary/50")}>
      <div className={`${teamColorClasses[teamOnDuty]}`}>
        <CardHeader className="p-4">
            <div className="text-center">
                <CardTitle className="text-xl font-bold uppercase tracking-wider">{teamOnDuty}</CardTitle>
                <CardDescription className="text-sm font-medium capitalize text-foreground/80">
                    {format(date, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </CardDescription>
            </div>
        </CardHeader>
      </div>
      <CardContent className="p-4 pt-2">
        {renderOfficerTable(processedOfficers, "Equipe de Serviço")}
      </CardContent>
    </Card>
  );
}
