
'use client';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

type CalendarControlsProps = {
  currentDate: Date;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onGoToCurrentMonth: () => void;
};

export function CalendarControls({ currentDate, onPreviousMonth, onNextMonth, onGoToCurrentMonth }: CalendarControlsProps) {
  return (
    <div className="flex items-center justify-center gap-4 mt-4">
      <Button variant="outline" size="icon" onClick={onPreviousMonth}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div className='flex items-center gap-2'>
        <h3 className="text-lg font-semibold w-48 text-center capitalize">
          {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
        </h3>
        <Button variant="outline" onClick={onGoToCurrentMonth}>Mês Atual</Button>
      </div>
      <Button variant="outline" size="icon" onClick={onNextMonth}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
