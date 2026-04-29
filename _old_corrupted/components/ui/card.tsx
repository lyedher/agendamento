'use client';

import { useState, useTransition, useMemo } from 'react';
import { format as formatTZ } from 'date-fns-tz';
import { ptBR } from 'date-fns/locale';
import { Loader2, MoreVertical, Trash2, UserPlus, UserX, Edit } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { Schedule } from '@/lib/types';
import type { UserData } from '../layout/user-profile';
import { deleteScheduleAction, updateVolunteersAction } from '@/lib/actions';
import { getLocalTime } from '@/lib/utils';
import { EditScheduleForm } from './edit-schedule-form';

type ScheduleListProps = {
  schedules: Schedule[];
  allUsers: UserData[];
  viewingDates?: Date[];
};

export function ScheduleList({ schedules, allUsers, viewingDates = [] }: ScheduleListProps) {
  const { toast } = useToast();
  const [isDeleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [isManageModalOpen, setManageModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [currentVolunteers, setCurrentVolunteers] = useState<UserData[]>([]);
  const [volunteerToAdd, setVolunteerToAdd] = useState<string>('');
  const [isPending, startTransition] = useTransition();

  const timeZone = 'America/Sao_Paulo';

  const filteredSchedules = useMemo(() => {
    if (viewingDates.length === 0) return [];
    return schedules.filter(schedule => 
        viewingDates.some(viewingDate => {
          const scheduleDateStr = formatTZ(new Date(schedule.startTime), 'yyyy-MM-dd', { timeZone });
          const viewDateStr = formatTZ(viewingDate, 'yyyy-MM-dd', { timeZone });
          return scheduleDateStr === viewDateStr;
        })
    );
 }, [schedules, viewingDates]);


  const handleDelete = () => {
    if (!selectedSchedule) return;
    startTransition(async () => {
      const result = await deleteScheduleAction(selectedSchedule.id);
      if (result.success) {
        toast({ title: 'Sucesso!', description: result.message });
      } else {
        toast({ variant: 'destructive', title: 'Erro!', description: result.message });
      }
      setDeleteAlertOpen(false);
      setSelectedSchedule(null);
    });
  };

  const handleManageClick = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setCurrentVolunteers(schedule.volunteers || []);
    setManageModalOpen(true);
  };
  
   const handleEditClick = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setEditModalOpen(true);
  };

  const handleAddVolunteer = () => {
      if (!volunteerToAdd) return;
      const user = allUsers.find(u => u.id === volunteerToAdd);
      if (user && !currentVolunteers.some(v => v.id === user.id)) {
        setCurrentVolunteers(prev => [...prev, user]);
      }
      setVolunteerToAdd('');
  };

  const handleRemoveVolunteer = (userId: string) => {
    setCurrentVolunteers(prev => prev.filter(v => v.id !== userId));
  };
  
  const handleSaveChanges = () => {
    if(!selectedSchedule) return;
    const volunteerIds = currentVolunteers.map(v => v.id);

    startTransition(async () => {
        const result = await updateVolunteersAction(selectedSchedule.id, volunteerIds);
         if (result.success) {
            toast({ title: 'Sucesso!', description: 'Voluntários atualizados.' });
        } else {
            toast({ variant: 'destructive', title: 'Erro!', description: result.message });
        }
        setManageModalOpen(false);
        setSelectedSchedule(null);
    })
  };

  const groupedSchedules: { [key: string]: Schedule[] } = filteredSchedules.reduce(
    (acc, schedule) => {
      const date = formatTZ(new Date(schedule.startTime), 'yyyy-MM-dd', { timeZone });
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(schedule);
      return acc;
    },
    {} as { [key: string]: Schedule[] }
  );

  return (
    <Card className="flex-1 flex flex-col min-h-0">
      <CardHeader>
        <CardTitle>Escalas Criadas</CardTitle>
        <CardDescription>
            {viewingDates.length > 0
                ? `Mostrando escalas para as datas selecionadas.`
                : 'Selecione um dia no calendário para ver as escalas.'
            }
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
         <ScrollArea className='h-full'>
          {filteredSchedules.length > 0 ? (
            Object.entries(groupedSchedules).sort(([a], [b]) => a.localeCompare(b)).map(([date, schedulesOnDate]) => (
              <div key={date} className="mb-6">
                <h3 className="mb-3 text-lg font-semibold text-foreground">
                  {formatTZ(new Date(date + 'T12:00:00'), "EEEE, dd 'de' MMMM", {
                    timeZone,
                    locale: ptBR,
                  })}
                </h3>
                <ul className="space-y-3">
                  {schedulesOnDate.map((schedule) => (
                    <li
                      key={schedule.id}
                      className="rounded-md border p-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-primary">
                            {schedule.scheduleName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {getLocalTime(schedule.startTime)} -{' '}
                            {getLocalTime(schedule.endTime)}
                          </p>
                        </div>
                        <div className='flex items-center gap-2'>
                            <Badge
                            variant={
                                (schedule.userIds?.length || 0) >= schedule.capacity
                                ? 'destructive'
                                : 'secondary'
                            }
                            >
                            Vagas: {schedule.userIds?.length || 0} / {schedule.capacity}
                            </Badge>
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditClick(schedule)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Editar Escala
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleManageClick(schedule)}>
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Gerenciar Voluntários
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => {
                                        setSelectedSchedule(schedule);
                                        setDeleteAlertOpen(true);
                                    }}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Excluir Escala
                                </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                      </div>
                       {schedule.volunteers && schedule.volunteers.length > 0 && (
                          <div className='mt-2 border-t pt-2'>
                              <p className='text-xs font-medium mb-1'>Voluntários:</p>
                              <ul className='space-y-1'>
                                  {schedule.volunteers.map(v => (
                                      <li key={v.id} className='text-xs text-muted-foreground'>{v.rank} {v.nickname}</li>
                                  ))}
                              </ul>
                          </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              {viewingDates.length > 0 ? 'Nenhuma escala encontrada para este dia.' : 'Selecione um dia no calendário ao lado.'}
            </p>
          )}
        </ScrollArea>
      </CardContent>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente a escala.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isPending} className='bg-destructive hover:bg-destructive/90'>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

       {selectedSchedule && (
        <Dialog open={isEditModalOpen} onOpenChange={setEditModalOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Editar Escala</DialogTitle>
                    <DialogDescription>
                        Altere os detalhes da escala <span className="font-bold text-primary">{selectedSchedule.scheduleName}</span> do dia{' '}
                        <span className="font-bold text-primary">{formatTZ(new Date(selectedSchedule.startTime), 'dd/MM/yyyy', { timeZone })}</span>.
                    </DialogDescription>
                </DialogHeader>
                <EditScheduleForm schedule={selectedSchedule} onFinished={() => {
                  setEditModalOpen(false);
                  setSelectedSchedule(null);
                }} />
            </DialogContent>
        </Dialog>
      )}

      <Dialog open={isManageModalOpen} onOpenChange={setManageModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerenciar Voluntários</DialogTitle>
            <DialogDescription>
              Adicione ou remova voluntários para a escala{' '}
              <span className='font-bold text-primary'>{selectedSchedule?.scheduleName}</span> do dia{' '}
              <span className='font-bold text-primary'>{selectedSchedule ? formatTZ(new Date(selectedSchedule.startTime), 'dd/MM/yyyy', { timeZone }) : ''}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div>
              <h4 className='text-sm font-medium mb-2'>Adicionar Voluntário</h4>
              <div className='flex gap-2'>
                 <Select value={volunteerToAdd} onValueChange={setVolunteerToAdd}>
                    <SelectTrigger>
                        <SelectValue placeholder="Selecione um voluntário" />
                    </SelectTrigger>
                    <SelectContent>
                        {allUsers.map(user => (
                            <SelectItem key={user.id} value={user.id} disabled={currentVolunteers.some(v => v.id === user.id)}>
                                {user.rank} {user.fullName}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Button onClick={handleAddVolunteer} disabled={!volunteerToAdd || currentVolunteers.length >= (selectedSchedule?.capacity || 0)}>
                    <UserPlus className='h-4 w-4'/>
                </Button>
              </div>
            </div>
            <div>
                 <h4 className='text-sm font-medium mb-2'>Voluntários Atuais ({currentVolunteers.length}/{selectedSchedule?.capacity})</h4>
                 <ScrollArea className='h-32'>
                    <ul className='space-y-2'>
                        {currentVolunteers.map(v => (
                            <li key={v.id} className='flex items-center justify-between text-sm p-2 rounded-md bg-muted'>
                                <span>{v.rank} {v.fullName}</span>
                                <Button size='icon' variant='ghost' className='h-6 w-6' onClick={() => handleRemoveVolunteer(v.id)}>
                                    <UserX className='h-4 w-4 text-destructive'/>
                                </Button>
                            </li>
                        ))}
                    </ul>
                 </ScrollArea>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleSaveChanges} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}