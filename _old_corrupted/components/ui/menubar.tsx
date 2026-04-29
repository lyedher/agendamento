'use client';

import { useTransition, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle2, UserCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import { SignupSchema, maskFunctions } from '@/lib/schemas';
import type { z } from 'zod';
import { signupAction } from '@/lib/actions';
import { RANK_NAMES, JOB_FUNCTION_NAMES, TEAM_NAMES } from '@/lib/types';
import { cn } from '@/lib/utils';

type SignupFormValues = z.infer<typeof SignupSchema>;

export function SignupForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isPhotoLoading, setIsPhotoLoading] = useState(false);
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(SignupSchema),
    defaultValues: {
      fullName: '',
      nickname: '',
      rg: '',
      taxId: '',
      phone: '',
      email: '',
      password: '',
      rank: '',
      jobFunction: '',
      workTeam: '',
      photo: '',
    },
  });

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsPhotoLoading(true);
      try {
        const { readAndCompressImage } = await import('browser-image-resizer');
        const config = { quality: 0.7, maxWidth: 800, maxHeight: 800, autoRotate: true };
        const resizedImage = await readAndCompressImage(file, config);
        const reader = new FileReader();
        reader.onloadend = () => {
          setPhotoPreview(reader.result as string);
          form.setValue('photo', reader.result as string);
          setIsPhotoLoading(false);
        };
        reader.readAsDataURL(resizedImage);
      } catch {
        setIsPhotoLoading(false);
      }
    }
  };

  const onSubmit = (data: SignupFormValues) => {
    console.log("DADOS TENTANDO CADASTRAR:", data);
    startTransition(async () => {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (value instanceof Date) {
            formData.append(key, value.toISOString());
          } else {
            formData.append(key, String(value));
          }
        }
      });

      const result = await signupAction({ message: '', success: false }, formData);

      if (result.success) {
        toast({ title: 'Sucesso!', description: result.message, className: 'border-green-500' });
        router.push('/');
      } else {
        toast({ variant: 'destructive', title: 'Erro no Cadastro', description: result.message });
      }
    });
  };

  return (
    <Form {...form}>
      <form 
        onSubmit={form.handleSubmit(
          onSubmit,
          (errors) => console.log("ERROS DO ZOD:", errors)
        )} 
        className="space-y-8"
      >
        
        <div className="flex flex-col items-center space-y-4">
          <Avatar className="h-24 w-24">
            <AvatarImage src={photoPreview || ''} alt="Foto do perfil" />
            <AvatarFallback>
              {isPhotoLoading ? <Loader2 className="h-12 w-12 animate-spin" /> : <UserCircle className="h-24 w-24 text-muted-foreground" />}
            </AvatarFallback>
          </Avatar>
          <input type="file" ref={fileInputRef} onChange={handlePhotoChange} className="hidden" accept="image/*" />
          <Button type="button" variant="link" onClick={() => fileInputRef.current?.click()} disabled={isPhotoLoading}>
            {isPhotoLoading ? 'Processando...' : 'Inserir foto'}
          </Button>
          <FormField control={form.control} name="photo" render={({ field }) => (<Input type="hidden" {...field} />)} />
        </div>

        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-primary border-b pb-2">1. Dados Profissionais</h3>
          
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
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="jobFunction"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel className="text-base font-medium">Função (Opcional)</FormLabel>
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
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="workTeam"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel className="text-base font-medium">Equipe de Trabalho (Opcional)</FormLabel>
                <FormControl>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {TEAM_NAMES.map((team) => (
                      <Button
                        key={team}
                        type="button"
                        variant={field.value === team ? 'default' : 'outline'}
                        className={cn(
                          "w-full text-[10px] sm:text-xs h-auto py-2.5",
                          field.value === team && "ring-2 ring-primary ring-offset-1 shadow-md"
                        )}
                        onClick={() => field.onChange(field.value === team ? '' : team)}
                      >
                        {team}
                      </Button>
                    ))}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-primary border-b pb-2">2. Identificação</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="fullName" render={({ field }) => (
              <FormItem><FormLabel>Nome Completo</FormLabel><FormControl><Input placeholder="Nome Completo" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="nickname" render={({ field }) => (
              <FormItem><FormLabel>Nome de Guerra</FormLabel><FormControl><Input placeholder="Nome de Guerra" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="taxId" render={({ field }) => (
              <FormItem><FormLabel>CPF</FormLabel><FormControl><Input placeholder="000.000.000-00" maxLength={14} {...field} onChange={(e) => field.onChange(maskFunctions.taxId(e.target.value))} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="rg" render={({ field }) => (
              <FormItem><FormLabel>RG Militar</FormLabel><FormControl><Input placeholder="00.000" maxLength={9} {...field} onChange={(e) => field.onChange(maskFunctions.rg(e.target.value))} /></FormControl><FormMessage /></FormItem>
            )} />
          </div>
          
          <FormField control={form.control} name="phone" render={({ field }) => (
            <FormItem><FormLabel>Telefone (WhatsApp)</FormLabel><FormControl><Input placeholder="(62) 90000-0000" maxLength={15} {...field} onChange={(e) => field.onChange(maskFunctions.phone(e.target.value))} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-primary border-b pb-2">3. Dados de Acesso</h3>
          <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem><FormLabel>E-mail</FormLabel><FormControl><Input type="email" placeholder="email@exemplo.com" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="password" render={({ field }) => (
            <FormItem><FormLabel>Senha</FormLabel><FormControl><Input type="password" placeholder="Mínimo 8 caracteres" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>

        <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={isPending} style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-foreground)' }}>
          {isPending ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Criando Conta...</> : 'Criar Conta'}
        </Button>
      </form>
    </Form>
  );
}
