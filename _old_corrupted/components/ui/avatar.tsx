
'use client';

import { useActionState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { useFormStatus } from 'react-dom';

import { updateScheduleAction } from '@/lib/actions';
import { UpdateScheduleSchema } from '@/lib/schemas';
import type { Schedule } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { getLocalTime } from '@/lib/utils';

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      className="w-full"
      disabled={pending}
      style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-foreground)' }}
    >
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      Salvar Alterações
    </Button>
  );
}

type EditScheduleFormValues = z.infer<typeof UpdateScheduleSchema>;

type EditScheduleFormProps = {
    schedule: Schedule;
    onFinished: () => void;
}

export function EditScheduleForm({ schedule, onFinished }: EditScheduleFormProps) {
  const { toast } = useToast();

  const updateScheduleActionWithId = updateScheduleAction.bind(null, schedule.id);

  const [state, formAction] = useActionState(updateScheduleActionWithId, {
    message: '',
    success: false,
  });

  const form = useForm<EditScheduleFormValues>({
    resolver: zodResolver(UpdateScheduleSchema),
    defaultValues: {
      scheduleName: schedule.scheduleName,
      startTime: getLocalTime(schedule.startTime),
      endTime: getLocalTime(schedule.endTime),
      capacity: schedule.capacity,
    },
  });

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast({
          title: 'Sucesso!',
          description: state.message,
        });
        onFinished();
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: state.message,
        });
      }
    }
  }, [state, toast, onFinished]);


  return (
    <Form {...form}>
      <form action={formAction} className="space-y-6 mt-4">
        <FormField
            control={form.control}
            name="scheduleName"
            render={({ field }) => (
            <FormItem>
                <FormLabel>Nome da Escala</FormLabel>
                <FormControl>
                <Input placeholder="Ex: MATUTINA, DETRAN" {...field} />
                </FormControl>
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
                <FormLabel>Horário de Início</FormLabel>
                <FormControl>
                    <Input type="time" {...field} />
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
                    <Input type="time" {...field} />
                </FormControl>
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
                <FormLabel>Quantidade de Vagas</FormLabel>
                <FormControl>
                    <Input 
                        type="number"
                        {...field}
                        value={field.value || ''}
                        onChange={e => {
                            const value = e.target.value;
                            field.onChange(value === '' ? undefined : parseInt(value, 10));
                        }}
                    />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        <SubmitButton />
      </form>
    </Form>
  );
}

    