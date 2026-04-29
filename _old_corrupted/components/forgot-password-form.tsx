
'use client';

import type { Ac4Calculation } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toZonedTime } from 'date-fns-tz';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';

type Ac4SummaryProps = {
  calculations: Ac4Calculation[];
};

export function Ac4Summary({ calculations }: Ac4SummaryProps) {
  if (calculations.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-10">
        <p>Nenhum serviço extraordinário encontrado para cálculo.</p>
        <p className="text-sm mt-1">Inscreva-se em uma escala na página de Agendamento.</p>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const detailLabels: { [key in Ac4Calculation['details'][0]['type']]: string } = {
    blueDay: 'Diurno Azul',
    blueNight: 'Noturno Azul',
    redDay: 'Diurno Vermelho',
    redNight: 'Noturno Vermelho',
  };
  
  const totalGeral = calculations.reduce((acc, calc) => acc + calc.totalValue, 0);

  return (
    <div className="space-y-6">
       <Card className="border-primary">
        <CardHeader>
          <CardTitle className="text-xl">Total Geral Acumulado</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-primary">{formatCurrency(totalGeral)}</p>
        </CardContent>
      </Card>

      <Accordion type="multiple" className="w-full space-y-4">
        {calculations.map((calc, index) => (
          <AccordionItem value={`item-${index}`} key={index} className="border rounded-lg bg-card">
             <AccordionTrigger className="p-4 hover:no-underline">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center w-full text-left gap-2 md:gap-4">
                    <div className='flex-1'>
                        <p className="font-semibold text-primary">{calc.scheduleName}</p>
                        <p className="text-sm text-muted-foreground">
                            {format(toZonedTime(new Date(calc.startTime), 'UTC'), 'PPP', { locale: ptBR })}
                            {calc.isExternal && <Badge variant="outline" className="ml-2 border-amber-500 text-amber-600">Externo</Badge>}
                        </p>
                    </div>
                     <p className="text-lg font-semibold whitespace-nowrap">{formatCurrency(calc.totalValue)}</p>
                </div>
             </AccordionTrigger>
             <AccordionContent className="px-4 pb-4">
                 <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="text-center">Horas</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {calc.details.map((detail, i) => (
                        <TableRow key={i}>
                            <TableCell className="font-medium">{detailLabels[detail.type]}</TableCell>
                            <TableCell className="text-center">{detail.hours}</TableCell>
                            <TableCell className="text-right">{formatCurrency(detail.value)}</TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                    </Table>
             </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
