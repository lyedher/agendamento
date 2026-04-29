'use client';

import { useEffect, useState, useActionState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { useFormStatus } from 'react-dom';
import type { DayContentProps } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { ScheduleSchema } from '@/lib/schemas';
import { saveScheduleAction } from '@/lib/actions';
import type { Schedule } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { isSameDayInTz, TIME_ZONE } from '@/lib/utils';
import { format as formatTZ } from 'date-fns-tz';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button 
            type="submit" 
            className="w-full" 
            disabled={pending} 
            style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-foreground)' }}
        >
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Salvar Escalas'}
        </Button>
    );
}

export function ScheduleManager({ schedules, viewingDates, setViewingDates }: { schedules: Schedule[]; viewingDates: Date[]; setViewingDates: (d: Date[]) => void; }) {
    const { toast } = useToast();
    const [selectedDates, setSelectedDates] = useState<Date[]>([]);
    const [month, setMonth] = useState<Date | undefined>(new Date());
    const [state, formAction] = useActionState(saveScheduleAction, { message: '', success: false });
    
    const form = useForm<z.infer<typeof ScheduleSchema>>({ 
        resolver: zodResolver(ScheduleSchema), 
        defaultValues: { 
            scheduleName: '', 
            startTime: '', 
            endTime: '', 
            capacity: 1, 
            dates: [] 
        } 
    });

    // Update form dates whenever selectedDates change for client-side validation
    useEffect(() => { 
        form.setValue('dates', selectedDates, { shouldValidate: true }); 
    }, [selectedDates, form]);

    useEffect(() => { 
        if (state.message) { 
            toast({ 
                variant: state.success ? 'default' : 'destructive', 
                title: state.success ? 'Sucesso' : 'Erro', 
                description: state.message 
            }); 
            if (state.success) { 
                form.reset(); 
                setSelectedDates([]); 
            } 
        } 
    }, [state, toast, form]);

    const DayContentWithIndicator = (props: DayContentProps): JSX.Element | null => {
      const has = schedules.some(s => isSameDayInTz(s.startTime, props.date));
      return (
        <div className="relative flex items-center justify-center h-full w-full">
          <span>{formatTZ(props.date, 'd', { timeZone: TIME_ZONE })}</span>
          {has && <div className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-primary" />}
        </div>
      ) as any;
    };

    return (
      <Card>
        <CardHeader><CardTitle>Criar Escalas</CardTitle></CardHeader>
        <CardContent>
            <Tabs defaultValue="create" onValueChange={v => setViewingDates(v === 'create' ? selectedDates : [])}>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="create">Criar</TabsTrigger>
                    <TabsTrigger value="view">Filtrar</TabsTrigger>
                </TabsList>
                <TabsContent value="create" className="space-y-6 mt-6">
                    <Form {...form}>
                        <form 
                            action={(formData) => {
                                // Manual injection of dates into formData to prevent "Campos Inválidos"
                                if (selectedDates.length > 0) {
                                    formData.set('dates', selectedDates.map(d => d.toISOString()).join(','));
                                }
                                formAction(formData);
                            }} 
                            className="space-y-6"
                        >
                            <FormField 
                                control={form.control} 
                                name="scheduleName" 
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nome da Escala</FormLabel>
                                        <FormControl><Input placeholder="Ex: MATUTINA" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} 
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <FormField 
                                    control={form.control} 
                                    name="startTime" 
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Início</FormLabel>
                                            <Input type="time" {...field} />
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
                                            <Input type="time" {...field} />
                                            <FormMessage />
                                        </FormItem>
                                    )} 
                                />
                            </div>
                            <FormField 
                                control={form.control} 
                                name="capacity" 
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Vagas</FormLabel>
                                        <Input 
                                            type="number" 
                                            {...field} 
                                            onChange={e => field.onChange(Number(e.target.value))} 
                                        />
                                        <FormMessage />
                                    </FormItem>
                                )} 
                            />
                            <div className="flex flex-col items-center gap-4">
                                <Calendar 
                                    mode="multiple" 
                                    selected={selectedDates} 
                                    onSelect={d => { 
                                        const dates = d || []; 
                                        setSelectedDates(dates); 
                                        setViewingDates(dates); 
                                    }} 
                                    month={month} 
                                    onMonthChange={setMonth} 
                                    components={{ DayContent: (props) => DayContentWithIndicator(props) as any }} 
                                    className="rounded-md border" 
                                />
                                <FormField
                                    control={form.control}
                                    name="dates"
                                    render={() => (
                                        <FormItem>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="flex gap-2 w-full">
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        className="flex-1" 
                                        onClick={() => { 
                                            if (!month) return; 
                                            const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) }); 
                                            setSelectedDates(days); 
                                            setViewingDates(days); 
                                        }}
                                    >
                                        Mês todo
                                    </Button>
                                    <Button 
                                        type="button" 
                                        variant="ghost" 
                                        onClick={() => { 
                                            setSelectedDates([]); 
                                            setViewingDates([]); 
                                        }}
                                    >
                                        Limpar
                                    </Button>
                                </div>
                            </div>
                            <SubmitButton />
                        </form>
                    </Form>
                </TabsContent>
                <TabsContent value="view" className="flex flex-col items-center mt-4">
                   <Calendar 
                        mode="single" 
                        selected={viewingDates[0]} 
                        onSelect={d => setViewingDates(d ? [d] : [])} 
                        components={{ DayContent: (props) => DayContentWithIndicator(props) as any }} 
                        className="rounded-md border" 
                    />
                </TabsContent>
            </Tabs>
        </CardContent>
      </Card>
    );
}
