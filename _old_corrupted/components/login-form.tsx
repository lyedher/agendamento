
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, PlusCircle, Trash2 } from 'lucide-react';

import { ExternalScheduleSchema, maskFunctions } from '@/lib/schemas';
import type { Schedule } from '@/lib/types';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '../ui/scroll-area';

type ExternalScheduleManagerProps = {
  externalSchedules: (Schedule & { isExternal?: boolean })[];
  onAddSchedule: (schedule: Omit<Schedule, 'id' | 'capacity' | 'userIds' | 'volunteers'>) => void;
  onRemoveSchedule: (id: string) => void;
};

type FormValues = z.infer<typeof ExternalScheduleSchema>;

export function ExternalScheduleManager({ externalSchedules, onAddSchedule, onRemoveSchedule }: ExternalScheduleManagerProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(ExternalScheduleSchema),
    defaultValues: {
      scheduleName: '',
      startTime: '',
      endTime: '',
    },
  });

  const onSubmit = (data: FormValues) => {
    const { date, startTime, endTime } = data;

    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    const startDateTime = new Date(date);
    startDateTime.setHours(startHour, startMinute, 0, 0);

    const endDateTime = new Date(date);
    endDateTime.setHours(endHour, endMinute, 0, 0);

    if (endDateTime <= startDateTime) {
        endDateTime.setDate(endDateTime.getDate() + 1);
    }
    
    onAddSchedule({
      scheduleName: data.scheduleName,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
    });

    form.reset();
  };

  const handleTimeChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldName: 'startTime' | 'endTime'
  ) => {
    const { value } = e.target;
    form.setValue(fieldName, maskFunctions.time(value), { shouldValidate: true });
  }

  return (
    <Card className="w-full animate-in fade-in-0 duration-500 delay-200">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Adicionar Serviço Externo</CardTitle>
        <CardDescription>
          Adicione serviços de outras unidades para incluí-los no cálculo total de horas e valores. Estes dados são salvos apenas no seu navegador.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="scheduleName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição do Serviço</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: SER - CPE Anápolis" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                            {field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Selecione</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Início</FormLabel>
                    <FormControl>
                      <Input type="text" placeholder="HH:mm" {...field} onChange={(e) => handleTimeChange(e, 'startTime')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fim</FormLabel>
                    <FormControl>
                      <Input type="text" placeholder="HH:mm" {...field} onChange={(e) => handleTimeChange(e, 'endTime')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button type="submit" className="w-full" style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-foreground)' }}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Serviço
            </Button>
          </form>
        </Form>
        
        {externalSchedules.length > 0 && (
          <div className="mt-8">
            <h4 className="text-md font-semibold mb-2">Serviços Externos Adicionados</h4>
            <ScrollArea className="h-40 rounded-md border">
              <div className="p-4 space-y-3">
                {externalSchedules.map(schedule => (
                  <div key={schedule.id} className="flex justify-between items-center text-sm p-2 bg-muted/50 rounded-md">
                    <div>
                      <p className="font-medium">{schedule.scheduleName}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(schedule.startTime), 'dd/MM/yyyy')} das {format(new Date(schedule.startTime), 'HH:mm')} às {format(new Date(schedule.endTime), 'HH:mm')}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onRemoveSchedule(schedule.id)}>
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Remover</span>
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
