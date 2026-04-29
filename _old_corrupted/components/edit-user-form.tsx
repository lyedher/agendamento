'use client';

import { useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { useUserProfile } from '@/components/layout/user-profile-provider';
import { PontuacaoSchema, type FormValues as PontuacaoFormValues } from '@/lib/schemas';
import { useToast } from '@/hooks/use-toast';
import { getPontuacaoAction, savePontuacaoAction } from '@/lib/actions';
import { Loader2, Save } from 'lucide-react';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';

const defaultValues: PontuacaoFormValues = {
    notaCfsc: 0, notaCfc: 0, notaCas: 0, notaCfs: 0, cursoAtualizacao: 0, cursoGraduacao: false, cursoPosGraduacao: false, cursoDoutorado: false, elogioMeritorio: 0, efetivoAno: 0, efetivoMes: 0, efetivoDia: 0, afastamentoAno: 0, afastamentoMes: 0, afastamentoDia: 0, medalhaDomPedro: false, medalhaTiradentes: false, medalhaAnhanguera: false, medalhaMeritoPolicial: false, medalhaMeritoMagisterio: false, medalhaMeritoIntelectual: false, medalhaGuardiao: false, medalhaSSP: false, medalhaServicoDistinto: false, anhangueraBronze: false, anhangueraPrata: false, anhangueraOuro: false, tempo10anos: false, tempo20anos: false, tempo30anos: false, medalha150anos: false, outrasCondecoracoes: 0, taf: '0', crimeDoloso: 0, crimeCulposo: 0, prisaoDisciplinar: 0, detencaoDisciplinar: 0, repreensao: 0,
};

export default function PontuacaoPage() {
    const { toast } = useToast();
    const { user } = useUserProfile();
    const [isPending, startTransition] = useTransition();
    const form = useForm<PontuacaoFormValues>({ resolver: zodResolver(PontuacaoSchema), defaultValues });
    const { register, watch, setValue, reset, control, handleSubmit } = form;

    useEffect(() => {
        async function load() {
            if (user?.id) {
                const res = await getPontuacaoAction();
                if (res.success && res.data) reset(res.data);
            }
        }
        load();
    }, [user, reset]);
    
    const onSubmit = (data: PontuacaoFormValues) => {
        startTransition(async () => {
            const res = await savePontuacaoAction(data);
            if (res.success) toast({ title: "Sucesso!", description: res.message });
            else toast({ variant: "destructive", title: "Erro!", description: res.message });
        });
    }

    const formData = watch();
    const calculateScore = (data: PontuacaoFormValues) => {
        let pos = 0, neg = 0;
        const calcCourse = (n: number) => (n >= 9) ? 2.0 : (n >= 8) ? 1.5 : 0;
        pos += calcCourse(Number(data.notaCfsc || 0)) + calcCourse(Number(data.notaCfc || 0)) + calcCourse(Number(data.notaCas || 0)) + calcCourse(Number(data.notaCfs || 0));
        pos += Math.min((Number(data.cursoAtualizacao || 0) / 3000) * 10, 10.0);
        if (data.cursoGraduacao) pos += 3.0; if (data.cursoPosGraduacao) pos += 3.0; if (data.cursoDoutorado) pos += 3.0;
        pos += (Number(data.elogioMeritorio || 0) * 0.5) + (Number(data.efetivoAno || 0) * 0.2);
        if (data.medalhaDomPedro) pos += 3.0; if (data.medalhaTiradentes) pos += 3.0; if (data.medalhaAnhanguera) pos += 3.0; if (data.medalhaMeritoPolicial) pos += 2.0; if (data.medalhaMeritoMagisterio) pos += 2.0; if (data.medalhaMeritoIntelectual) pos += 2.0; if (data.medalhaGuardiao) pos += 2.0; if (data.medalhaSSP) pos += 2.0; if (data.medalhaServicoDistinto) pos += 1.0; if (data.anhangueraBronze) pos += 1.0; if (data.anhangueraPrata) pos += 1.0; if (data.anhangueraOuro) pos += 1.0; if (data.tempo10anos) pos += 1.0; if (data.tempo20anos) pos += 1.0; if (data.tempo30anos) pos += 1.0; if (data.medalha150anos) pos += 0.8;
        pos += (Number(data.outrasCondecoracoes || 0) * 0.25) + Number(data.taf || 0);
        neg += (Number(data.crimeDoloso || 0) * 10.0) + (Number(data.crimeCulposo || 0) * 5.0) + (Number(data.prisaoDisciplinar || 0) * 4.0) + (Number(data.detencaoDisciplinar || 0) * 2.0) + (Number(data.repreensao || 0) * 1.0);
        return { pos, neg, total: pos - neg };
    }
    const { pos, neg, total } = calculateScore(formData);

  return (
      <main className="flex flex-1 flex-col items-center justify-start p-4 md:p-8">
        <Card className="w-full max-w-4xl animate-in fade-in duration-500">
          <CardHeader>
            <CardTitle className="font-headline text-3xl">Cálculo de Pontuação</CardTitle>
            <CardDescription>Insira os dados para calcular a pontuação funcional.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                    <Card>
                        <CardHeader><CardTitle className='text-xl text-primary'>Pontuação Positiva</CardTitle></CardHeader>
                        <CardContent>
                            <Accordion type="multiple" className="w-full space-y-4" defaultValue={['courses']}>
                                <AccordionItem value="courses">
                                    <AccordionTrigger className="font-semibold">1. Cursos e Formação</AccordionTrigger>
                                    <AccordionContent className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                                        <div className="space-y-2"><Label>Nota CFSd</Label><Input {...register('notaCfsc')} type="number" step="0.01" /></div>
                                        <div className="space-y-2"><Label>Nota CFC</Label><Input {...register('notaCfc')} type="number" step="0.01" /></div>
                                        <div className="space-y-2"><Label>Nota CFS</Label><Input {...register('notaCfs')} type="number" step="0.01" /></div>
                                        <div className="space-y-2"><Label>Nota CAS</Label><Input {...register('notaCas')} type="number" step="0.01" /></div>
                                        <div className="space-y-2"><Label>Atualização (h/a)</Label><Input {...register('cursoAtualizacao', { valueAsNumber: true })} type="number" /></div>
                                        <div className="space-y-4 md:col-span-2">
                                            <Label>Formação Acadêmica</Label>
                                            <div className='flex flex-col space-y-3'>
                                                {[ { id: "cursoGraduacao", label: "Graduação" }, { id: "cursoPosGraduacao", label: "Pós-Graduação" }, { id: "cursoDoutorado", label: "Doutorado" } ].map(item => (
                                                    <FormField key={item.id} control={control} name={item.id as any} render={({ field }) => (
                                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                                            <Label htmlFor={item.id} className="font-normal">{item.label}</Label>
                                                            <FormControl><Switch id={item.id} checked={!!field.value} onCheckedChange={field.onChange} /></FormControl>
                                                        </FormItem>
                                                    )} />
                                                ))}
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="merit">
                                    <AccordionTrigger className="font-semibold">2. Mérito e Tempo</AccordionTrigger>
                                    <AccordionContent className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                                        <div className="space-y-2"><Label>Elogios</Label><Input {...register('elogioMeritorio', { valueAsNumber: true })} type="number" /></div>
                                        <div className="space-y-2 md:col-span-2"><Label>Tempo de Efetivo</Label><div className='flex gap-2'><Input {...register('efetivoAno', { valueAsNumber: true })} type="number" placeholder="Anos" /><Input {...register('efetivoMes', { valueAsNumber: true })} type="number" placeholder="Meses" /></div></div>
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="medals">
                                    <AccordionTrigger className="font-semibold">3. Medalhas</AccordionTrigger>
                                    <AccordionContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                                        {[ { id: "medalhaDomPedro", label: "Dom Pedro II" }, { id: "medalhaTiradentes", label: "Tiradentes" }, { id: "medalhaAnhanguera", label: "Anhanguera" }, { id: "medalhaMeritoPolicial", label: "Mérito Policial" }, { id: "medalhaGuardiao", label: "Guardião" }, { id: "tempo10anos", label: "10 Anos" }, { id: "tempo20anos", label: "20 Anos" }, { id: "tempo30anos", label: "30 Anos" } ].map(item => (
                                            <FormField key={item.id} control={control} name={item.id as any} render={({ field }) => (
                                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                                    <Label htmlFor={item.id} className="font-normal text-sm">{item.label}</Label>
                                                    <FormControl><Switch id={item.id} checked={!!field.value} onCheckedChange={field.onChange} /></FormControl>
                                                </FormItem>
                                            )} />
                                        ))}
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="misc">
                                    <AccordionTrigger className="font-semibold">4. Outros</AccordionTrigger>
                                    <AccordionContent className="pt-4"><Label>T.A.F.</Label><RadioGroup value={formData.taf} onValueChange={(v) => setValue('taf', v)} className="flex gap-4 mt-2"><div className="flex items-center space-x-2"><RadioGroupItem value="1.0" id="taf-exc" /><Label htmlFor="taf-exc">Excelente (1,0)</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="0.5" id="taf-mb" /><Label htmlFor="taf-mb">Muito Bom (0,5)</Label></div></RadioGroup></AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle className='text-xl text-destructive'>Pontuação Negativa</CardTitle></CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                                <div className="space-y-2"><Label>Crime Doloso</Label><Input {...register('crimeDoloso', { valueAsNumber: true })} type="number" /></div>
                                <div className="space-y-2"><Label>Prisão Disciplinar</Label><Input {...register('prisaoDisciplinar', { valueAsNumber: true })} type="number" /></div>
                                <div className="space-y-2"><Label>Repreensão</Label><Input {...register('repreensao', { valueAsNumber: true })} type="number" /></div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-primary">
                        <CardHeader><CardTitle className="text-xl">Resultado Final</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-3 gap-4 text-center">
                            <div><p className="text-sm text-muted-foreground">Positivo</p><p className="text-2xl font-bold">{pos.toFixed(2)}</p></div>
                            <div><p className="text-sm text-muted-foreground">Negativo</p><p className="text-2xl font-bold text-destructive">{neg.toFixed(2)}</p></div>
                            <div><p className="text-sm text-muted-foreground">Total</p><p className="text-2xl font-bold text-primary">{total.toFixed(2)}</p></div>
                        </CardContent>
                    </Card>
                    <div className="flex justify-end">
                       <Button type="submit" disabled={isPending} style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-foreground)' }}>
                            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className='mr-2 h-4 w-4' />}
                            Salvar Pontuação
                        </Button>
                    </div>
                </form>
            </Form>
          </CardContent>
        </Card>
      </main>
  );
}
