

'use client';

import { useActionState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { useFormStatus } from 'react-dom';

import { updateScheduleSettingsAction } from '@/lib/actions';
import { ScheduleSettingsSchema, maskFunctions } from '@/lib/schemas';
import type { ScheduleSettings } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full mt-4" disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      Salvar Período
    </Button>
  );
}

type ScheduleSettingsManagerProps = {
  initialSettings: ScheduleSettings;
};

type FormValues = z.infer<typeof ScheduleSettingsSchema>;

function getInitialTime(isoDate: string | null | undefined): string {
    if (!isoDate) return '';
    try {
        const date = parseISO(isoDate); // Use parseISO for reliability
        const hours = date.getUTCHours().toString().padStart(2, '0');
        const minutes = date.getUTCMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    } catch {
        return '';
    }
}


export function ScheduleSettingsManager({ initialSettings }: ScheduleSettingsManagerProps) {
  const { toast } = useToast();

  const [state, formAction] = useActionState(updateScheduleSettingsAction, {
    message: '',
    success: false,
  });
  
  const form = useForm<FormValues>({
    resolver: zodResolver(ScheduleSettingsSchema),
    defaultValues: {
      schedulingStartDate: initialSettings.schedulingStartDate ? parseISO(initialSettings.schedulingStartDate) : null,
      schedulingStartTime: getInitialTime(initialSettings.schedulingStartDate),
      schedulingEndDate: initialSettings.schedulingEndDate ? parseISO(initialSettings.schedulingEndDate) : null,
      schedulingEndTime: getInitialTime(initialSettings.schedulingEndDate),
      maxSchedulesPerUser: initialSettings.maxSchedulesPerUser ?? null,
    },
  });

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast({
          title: 'Sucesso!',
          description: state.message,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: state.message,
        });
      }
    }
  }, [state, toast]);

  const handleClearDate = (dateFieldName: 'schedulingStartDate' | 'schedulingEndDate', timeFieldName: 'schedulingStartTime' | 'schedulingEndTime' ) => {
    form.setValue(dateFieldName, null);
    form.setValue(timeFieldName, '');
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações de Agendamento</CardTitle>
        <CardDescription>
          Defina uma janela de agendamento e um limite de escalas por policial.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form action={(formData) => {
              const startVal = form.getValues("schedulingStartDate");
              if (startVal) formData.set("schedulingStartDate", startVal.toISOString());
              const endVal = form.getValues("schedulingEndDate");
              if (endVal) formData.set("schedulingEndDate", endVal.toISOString());
              formAction(formData);
          }}>
            <div className="space-y-4">
                 <div className="p-4 border rounded-lg">
                    <FormLabel className='text-base'>Início do Período</FormLabel>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                        <FormField
                        control={form.control}
                        name="schedulingStartDate"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                            <FormLabel>Data de Início</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                <FormControl>
                                    <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                    )}
                                    >
                                    {field.value ? (
                                        format(field.value, "PPP", { locale: ptBR })
                                    ) : (
                                        <span>Selecione a data</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={field.value ?? undefined}
                                    onSelect={field.onChange}
                                    initialFocus
                                />
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                         <FormField
                            control={form.control}
                            name="schedulingStartTime"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Hora de Início</FormLabel>
                                <FormControl>
                                    <Input 
                                        type="time" 
                                        {...field}
                                        onChange={(e) => field.onChange(maskFunctions.time(e.target.value))}
                                    />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                     {form.getValues('schedulingStartDate') && (
                        <Button variant="link" size="sm" className="h-auto p-0 justify-start mt-2" onClick={() => handleClearDate('schedulingStartDate', 'schedulingStartTime')}>Limpar data/hora de início</Button>
                    )}
                 </div>

                 <div className="p-4 border rounded-lg">
                     <FormLabel className='text-base'>Fim do Período</FormLabel>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                        <FormField
                            control={form.control}
                            name="schedulingEndDate"
                            render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Data Final</FormLabel>
                                <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                        )}
                                    >
                                        {field.value ? (
                                        format(field.value, "PPP", { locale: ptBR })
                                        ) : (
                                        <span>Selecione a data</span>
                                        )}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                    mode="single"
                                    selected={field.value ?? undefined}
                                    onSelect={field.onChange}
                                    disabled={(date) =>
                                        form.getValues('schedulingStartDate')
                                        ? date < form.getValues('schedulingStartDate')!
                                        : false
                                    }
                                    initialFocus
                                    />
                                </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="schedulingEndTime"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Hora Final</FormLabel>
                                <FormControl>
                                    <Input 
                                     type="time" 
                                     {...field} 
                                     onChange={(e) => field.onChange(maskFunctions.time(e.target.value))}
                                    />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                     {form.getValues('schedulingEndDate') && (
                        <Button variant="link" size="sm" className="h-auto p-0 justify-start mt-2" onClick={() => handleClearDate('schedulingEndDate', 'schedulingEndTime')}>Limpar data/hora final</Button>
                    )}
                </div>
                 <div className="p-4 border rounded-lg">
                    <FormField
                        control={form.control}
                        name="maxSchedulesPerUser"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Limite de Escalas por Policial</FormLabel>
                            <FormControl>
                                <Input
                                type="number"
                                placeholder="Ex: 5"
                                {...field}
                                value={field.value ?? ''}
                                onChange={e => {
                                    const value = e.target.value;
                                    field.onChange(value === '' ? null : parseInt(value, 10));
                                }}
                                />
                            </FormControl>
                            <FormMessage />
                             <p className='text-xs text-muted-foreground pt-1'>Deixe em branco ou 0 para ilimitado.</p>
                            </FormItem>
                        )}
                    />
                </div>
            </div>
            <SubmitButton />
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
