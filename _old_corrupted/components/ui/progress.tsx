

'use client';

import { useTransition } from 'react';
import { useToast } from '@/hooks/use-toast';
import { signUpForScheduleAction, cancelSignUpAction } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

type ScheduleSignUpButtonProps = {
  scheduleId: string;
  isSignedUp: boolean;
  isFull: boolean;
  hasConflict: boolean;
  isWindowActive: boolean;
  isCancelWindowActive: boolean;
  isScheduleLimitReached: boolean;
};

export function ScheduleSignUpButton({ scheduleId, isSignedUp, isFull, hasConflict, isWindowActive, isCancelWindowActive, isScheduleLimitReached }: ScheduleSignUpButtonProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleSignUp = () => {
    startTransition(async () => {
      const result = await signUpForScheduleAction(scheduleId);
      if (result.success) {
        toast({ title: 'Sucesso!', description: result.message });
      } else {
        toast({ variant: 'destructive', title: 'Erro!', description: result.message });
      }
    });
  };

  const handleCancel = () => {
    startTransition(async () => {
      const result = await cancelSignUpAction(scheduleId);
      if (result.success) {
        toast({ title: 'Sucesso!', description: result.message });
      } else {
        toast({ variant: 'destructive', title: 'Erro!', description: result.message });
      }
    });
  };

  if (isSignedUp) {
    return (
      <Button variant="destructive" onClick={handleCancel} disabled={isPending || !isCancelWindowActive}>
        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {isCancelWindowActive ? 'Cancelar Inscrição' : 'Fora do Período'}
      </Button>
    );
  }

  if (!isWindowActive) {
     return (
      <Button disabled>
        Agendamento Fechado
      </Button>
    )
  }

  if (hasConflict) {
    return (
      <Button disabled>
        Conflito
      </Button>
    )
  }
  
  if (isScheduleLimitReached) {
     return (
      <Button disabled>
        Limite Atingido
      </Button>
    )
  }

  return (
    <Button 
      onClick={handleSignUp} 
      disabled={isFull || isPending}
      className="bg-accent text-accent-foreground hover:bg-accent/90"
    >
      {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      {isFull ? 'Esgotado' : 'Inscrever-se'}
    </Button>
  );
}
