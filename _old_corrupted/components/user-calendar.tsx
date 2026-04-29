

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Calendar, Printer, Users } from 'lucide-react';
import { ScheduleManager } from '@/components/admin/schedule-manager';
import { ScheduleList } from '@/components/admin/schedule-list';
import type { Schedule, VolunteerSchedule, Absence, Ac4Rates, ScheduleSettings, UserData } from '@/lib/types';
import { UserList } from './user-list';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { VolunteerScheduleList } from './volunteer-schedule-list';
import { Button } from '../ui/button';
import { BattalionScheduleView } from './battalion/battalion-schedule-view';
import { Ac4RateManager } from './ac4-rate-manager';
import { ScheduleSettingsManager } from './schedule-settings-manager';

type AdminDashboardProps = {
    schedules: Schedule[];
    users: UserData[];
    userCount: number;
    volunteerSchedules: VolunteerSchedule[];
    battalionOfficers: UserData[];
    admOfficers: UserData[];
    awayOfficers: UserData[];
    absences: Absence[];
    ac4Rates: Ac4Rates;
    scheduleSettings: ScheduleSettings;
}

export function AdminDashboard({schedules, users, userCount, volunteerSchedules, battalionOfficers, admOfficers, awayOfficers, absences, ac4Rates, scheduleSettings}: AdminDashboardProps) {
    const [viewingDates, setViewingDates] = useState<Date[]>([]);

  return (
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
             <Button asChild variant="outline">
                <Link href="/admin/battalion-report">
                    <Calendar className="mr-2 h-4 w-4" />
                    Gerar Escalas Ordinárias
                </Link>
            </Button>
             <Button asChild variant="outline">
                <Link href="/admin/users-report">
                    <Users className="mr-2 h-4 w-4" />
                    Gerar Relatório Efetivo
                </Link>
            </Button>
            <Button asChild variant="outline">
                <Link href="/admin/report">
                    <Printer className="mr-2 h-4 w-4" />
                    Gerar Escalas AC-4
                </Link>
            </Button>
        </div>
        <Tabs defaultValue="schedules" className="w-full">
            <TabsList className="grid w-full grid-cols-1 h-auto md:grid-cols-6 md:h-10">
                <TabsTrigger value="schedules">Gerenciar Escalas SER</TabsTrigger>
                <TabsTrigger value="battalion-schedule">Escala Ordinária</TabsTrigger>
                <TabsTrigger value="adm-schedule">Expediente</TabsTrigger>
                <TabsTrigger value="away">Afastados</TabsTrigger>
                <TabsTrigger value="volunteers">Agendamentos</TabsTrigger>
                <TabsTrigger value="users">Efetivo</TabsTrigger>
            </TabsList>
            <TabsContent value="schedules">
                 <Card>
                    <CardHeader>
                        <CardTitle>Crie e Edite as Escalas Extraordinárias</CardTitle>
                        <CardDescription>
                           Crie e gerencie as escalas de serviços extraordinários. Selecione um dia no calendário para visualizar ou criar novas escalas.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 md:gap-8">
                        <ScheduleManager 
                            schedules={schedules} 
                            viewingDates={viewingDates}
                            setViewingDates={setViewingDates}
                        />
                        <div className="space-y-4">
                           <ScheduleList 
                                schedules={schedules} 
                                allUsers={users}
                                viewingDates={viewingDates}
                            />
                            <Ac4RateManager initialRates={ac4Rates} />
                            <ScheduleSettingsManager initialSettings={scheduleSettings} />
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="battalion-schedule">
                 <BattalionScheduleView 
                    initialOfficers={battalionOfficers} 
                    initialAbsences={absences} 
                 />
            </TabsContent>
            <TabsContent value="adm-schedule">
                <Card>
                    <CardHeader>
                        <CardTitle>Escala Administrativa</CardTitle>
                        <CardDescription>
                           Visualize a lista de policiais que cumprem o expediente administrativo.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <UserList users={admOfficers} userCount={admOfficers.length} hideSearch={true} />
                    </CardContent>
                </Card>
            </TabsContent>
             <TabsContent value="away">
                <Card>
                    <CardHeader>
                        <CardTitle>Efetivo Afastado</CardTitle>
                        <CardDescription>
                           Visualize a lista de policiais que estão atualmente afastados (férias, licença, etc.).
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <UserList users={awayOfficers} userCount={awayOfficers.length} hideSearch={true} />
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="volunteers">
                <VolunteerScheduleList volunteerSchedules={volunteerSchedules} />
            </TabsContent>
            <TabsContent value="users">
                <UserList users={users} userCount={userCount} />
            </TabsContent>
        </Tabs>
      </main>
  );
}
