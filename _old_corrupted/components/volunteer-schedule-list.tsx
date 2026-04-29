
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';

import { Ac4SimulatorSchema, maskFunctions } from '@/lib/schemas';
import type { Ac4Rates, Ac4Calculation } from '@/lib/types';
import { calculateAc4 } from '@/lib/utils';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

type Ac4SimulatorProps = {
  rates: Ac4Rates;
};

type FormValues = z.infer<typeof Ac4SimulatorSchema>;

export function Ac4Simulator({ rates }: Ac4SimulatorProps) {
  const [calculation, setCalculation] = useState<Ac4Calculation | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(Ac4SimulatorSchema),
    defaultValues: {
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
    
    const dummySchedule = {
      id: 'simulator',
      scheduleName: 'Simulação',
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      capacity: 0,
      userIds: [],
      volunteers: [],
    };

    const result = calculateAc4(dummySchedule, rates);
    setCalculation(result);
  };
  
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const handleTimeChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldName: 'startTime' | 'endTime'
  ) => {
    const { value } = e.target;
    form.setValue(fieldName, maskFunctions.time(value), { shouldValidate: true });
  }

  return (
    <div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
             <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data da Escala</FormLabel>
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
                            <span>Selecione uma data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
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
              name="startTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Horário de Início</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="HH:mm"
                      {...field}
                      onChange={(e) => handleTimeChange(e, 'startTime')}
                    />
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
                  <FormLabel>Horário de Fim</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="HH:mm"
                      {...field}
                      onChange={(e) => handleTimeChange(e, 'endTime')}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-foreground)' }}>Calcular Valor</Button>
          </div>
        </form>
      </Form>

      {calculation && (
        <Card className="mt-8 border-primary animate-in fade-in-50 duration-300">
          <CardHeader>
            <CardTitle className="text-xl">Resultado da Simulação</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">{formatCurrency(calculation.totalValue)}</p>
             <div className="mt-4 space-y-2 text-sm">
                {calculation.details.map((detail, i) => (
                    <div key={i} className="flex justify-between items-center flex-wrap gap-x-2">
                       <span className="text-muted-foreground">
                         {
                            { 
                                blueDay: 'Diurno Azul', 
                                blueNight: 'Noturno Azul', 
                                redDay: 'Diurno Vermelho', 
                                redNight: 'Noturno Vermelho' 
                            }[detail.type]
                         } ({detail.hours}h):
                       </span>
                       <span className="font-medium">{formatCurrency(detail.value)}</span>
                    </div>
                ))}
             </div>
          </CardContent>
           <CardFooter>
             <p className="text-xs text-muted-foreground">Este é um valor simulado e pode variar dependendo de fatores como feriados e alterações de valores.</p>
           </CardFooter>
        </Card>
      )}
    </div>
  );
}
