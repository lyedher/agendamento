
'use client';

import { useActionState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { useFormStatus } from 'react-dom';

import { updateAc4RatesAction } from '@/lib/actions';
import { Ac4RatesSchema } from '@/lib/schemas';
import type { Ac4Rates } from '@/lib/types';
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      className="w-full mt-4"
      disabled={pending}
    >
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      Salvar Valores
    </Button>
  );
}

type Ac4RateManagerProps = {
  initialRates: Ac4Rates;
};

type FormValues = z.infer<typeof Ac4RatesSchema>;

export function Ac4RateManager({ initialRates }: Ac4RateManagerProps) {
  const { toast } = useToast();

  const [state, formAction] = useActionState(updateAc4RatesAction, {
    message: '',
    success: false,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(Ac4RatesSchema),
    defaultValues: initialRates,
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
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Valores AC-4</CardTitle>
        <CardDescription>
          Gerencie os valores por hora para o cálculo de AC-4.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form action={formAction}>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="blueDay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Diurno Azul</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="blueNight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Noturno Azul</FormLabel>
                    <FormControl>
                       <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="redDay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Diurno Vermelho</FormLabel>
                    <FormControl>
                       <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="redNight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Noturno Vermelho</FormLabel>
                    <FormControl>
                       <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <SubmitButton />
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
