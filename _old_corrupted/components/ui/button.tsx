'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { Loader2, UserCircle, PlusCircle, Trash2, CheckCircle2 } from 'lucide-react';
import { useFormStatus } from 'react-dom';
import { formatInTimeZone } from 'date-fns-tz';

import { updateUserAction } from '@/lib/actions';
import { UpdateUserSchema, maskFunctions } from '@/lib/schemas';
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
import { cn, TIME_ZONE } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { UserData, TeamHistoryEntry } from '@/lib/types';
import { TEAM_NAMES, JOB_FUNCTION_NAMES, RANK_NAMES } from '@/lib/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Label } from '../ui/label';

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

type EditUserFormValues = z.infer<typeof UpdateUserSchema>;

export function EditUserForm({ user, onFinished, isAdmin = false }: { user: UserData; onFinished?: () => void; isAdmin?: boolean; }) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(user?.photo || null);
  const [isPhotoLoading, setIsPhotoLoading] = useState(false);
  const [teamHistory, setTeamHistory] = useState<TeamHistoryEntry[]>(user.teamHistory || []);

  const [state, formAction] = useActionState(updateUserAction.bind(null, user.id), { message: '', success: false });

  const form = useForm<EditUserFormValues>({
    resolver: zodResolver(UpdateUserSchema),
    defaultValues: {
      photo: user.photo || '',
      rank: user.rank || '',
      rg: user.rg ? (maskFunctions as any).rg(user.rg) : '',
      nickname: user.nickname || '',
      fullName: user.fullName || '',
      jobFunction: user.jobFunction || '',
      password: '',
      phone: user.phone,
      sortOrder: user.sortOrder,
      presentationDate: user.presentationDate ? new Date(user.presentationDate) : undefined,
      teamHistory: user.teamHistory || [],
    },
  });

  useEffect(() => { if (state.message) { toast({ title: state.success ? 'Sucesso!' : 'Erro', description: state.message, variant: state.success ? 'default' : 'destructive' }); if (state.success && onFinished) onFinished(); } }, [state, toast, onFinished]);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsPhotoLoading(true);
      try {
        const { readAndCompressImage } = await import('browser-image-resizer');
        const config = { quality: 0.7, maxWidth: 800, maxHeight: 800, autoRotate: true };
        const resizedImage = await readAndCompressImage(file, config);
        const reader = new FileReader();
        reader.onloadend = () => { setPhotoPreview(reader.result as string); form.setValue('photo', reader.result as string); setIsPhotoLoading(false); };
        reader.readAsDataURL(resizedImage);
      } catch { setIsPhotoLoading(false); }
    }
  };

  const addTeamHistoryEntry = () => {
    const newEntry: TeamHistoryEntry = { team: 'ALPHA', effectiveDate: new Date().toISOString() };
    setTeamHistory(prev => [...prev, newEntry].sort((a,b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime()));
  };

  return (
    <Form {...form}>
      <form action={(fd) => {
        const pDate = form.getValues('presentationDate');
        if (pDate) fd.set('presentationDate', pDate.toISOString());
        fd.set('teamHistory', JSON.stringify(teamHistory));
        formAction(fd);
      }} className="space-y-6">
        <div className="flex flex-col items-center space-y-4">
          <Avatar className="h-24 w-24">
              <AvatarImage src={photoPreview || undefined} />
              <AvatarFallback>{isPhotoLoading ? <Loader2 className="animate-spin" /> : <UserCircle className="h-24 w-24 text-muted-foreground" />}</AvatarFallback>
          </Avatar>
          <input type="file" ref={fileInputRef} onChange={handlePhotoChange} className="hidden" accept="image/*" />
          <Button type="button" variant="link" onClick={() => fileInputRef.current?.click()} disabled={isPhotoLoading}>Alterar foto</Button>
          <FormField control={form.control} name="photo" render={({ field }) => (<Input type="hidden" {...field} />)} />
        </div>

        <div className="space-y-6">
            <FormField
                control={form.control}
                name="rank"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-base font-medium">Posto / Graduação</FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {RANK_NAMES.map((rank) => (
                          <Button
                            key={rank}
                            type="button"
                            variant={field.value === rank ? 'default' : 'outline'}
                            className={cn(
                              "w-full justify-start text-[10px] sm:text-xs h-auto py-2.5",
                              field.value === rank && "ring-2 ring-primary ring-offset-1 shadow-md"
                            )}
                            onClick={() => field.onChange(rank)}
                          >
                            {field.value === rank && <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />}
                            {rank}
                          </Button>
                        ))}
                      </div>
                    </FormControl>
                  </FormItem>
                )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="rg" render={({ field }) => (<FormItem><FormLabel>Identidade</FormLabel><Input {...field} onChange={(e) => form.setValue('rg', (maskFunctions as any).rg(e.target.value))} /></FormItem>)} />
                <FormField control={form.control} name="nickname" render={({ field }) => (<FormItem><FormLabel>Nome de Guerra</FormLabel><Input {...field} /></FormItem>)} />
            </div>
            <FormField control={form.control} name="fullName" render={({ field }) => (<FormItem><FormLabel>Nome Completo</FormLabel><Input {...field} /></FormItem>)} />
            
            <FormField
              control={form.control}
              name="jobFunction"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-base font-medium">Função</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {JOB_FUNCTION_NAMES.map((job) => (
                        <Button
                          key={job}
                          type="button"
                          variant={field.value === job ? 'default' : 'outline'}
                          className={cn(
                            "w-full text-[10px] sm:text-xs h-auto py-2.5",
                            field.value === job && "ring-2 ring-primary ring-offset-1 shadow-md"
                          )}
                          onClick={() => field.onChange(field.value === job ? '' : job)}
                        >
                          {job}
                        </Button>
                      ))}
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField control={form.control} name="phone" render={({ field }) => (
              <FormItem><FormLabel>Telefone</FormLabel><Input {...field} onChange={(e) => form.setValue('phone', (maskFunctions as any).phone(e.target.value))} /></FormItem>
            )} />
            
            <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="team-history">
                    <AccordionTrigger>Histórico de Equipes</AccordionTrigger>
                    <AccordionContent>
                        <div className="space-y-4 pt-4">
                            {teamHistory.map((entry, idx) => (
                                <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-end gap-4 p-3 border rounded-md">
                                    <div className="flex-1 space-y-2 w-full">
                                        <Label>Equipe</Label>
                                        <div className="grid grid-cols-3 gap-1">
                                            {TEAM_NAMES.map(t => (
                                                <Button 
                                                  key={t} 
                                                  type="button" 
                                                  variant={entry.team === t ? 'default' : 'outline'}
                                                  onClick={() => { const h = [...teamHistory]; h[idx].team = t; setTeamHistory(h); }} 
                                                  className="py-1 h-auto text-[10px]"
                                                >
                                                  {t}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex-1 space-y-2 w-full">
                                        <Label>Início</Label>
                                        <Input 
                                          type="date" 
                                          value={formatInTimeZone(new Date(entry.effectiveDate), 'UTC', 'yyyy-MM-dd')} 
                                          onChange={(e) => { 
                                            const h = [...teamHistory]; 
                                            h[idx].effectiveDate = new Date(e.target.value + 'T12:00:00Z').toISOString(); 
                                            setTeamHistory(h); 
                                          }} 
                                        />
                                    </div>
                                    <Button type="button" variant="ghost" size="icon" onClick={() => setTeamHistory(teamHistory.filter((_, i) => i !== idx))}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                </div>
                            ))}
                            <Button type="button" variant="outline" onClick={addTeamHistoryEntry} className="w-full"><PlusCircle className="mr-2 h-4 w-4"/>Adicionar Histórico de Equipe</Button>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>

            {isAdmin && (<FormField control={form.control} name="sortOrder" render={({ field }) => (<FormItem><FormLabel>Ordem de Classificação</FormLabel><Input type="number" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))} /></FormItem>)} />)}
            <FormField control={form.control} name="password" render={({ field }) => (<FormItem><FormLabel>Nova Senha</FormLabel><Input type="password" placeholder="Em branco para não alterar" {...field} /></FormItem>)} />
            <SubmitButton />
        </div>
      </form>
    </Form>
  );
}
