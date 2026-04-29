
'use client';

import { Printer } from 'lucide-react';
import { Button } from '../ui/button';

export function ReportPrintButton() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <Button onClick={handlePrint} style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-foreground)' }}>
      <Printer className="mr-2 h-4 w-4" />
      Imprimir Relatório
    </Button>
  );
}
