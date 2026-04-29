
'use client';

import { useState, useEffect } from 'react';
import type { UserData } from '@/lib/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ReportPrintButton } from '@/components/admin/report-print-button';
import { maskFunctions } from '@/lib/schemas';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '../ui/skeleton';
import { getTeamForDate, cn } from '@/lib/utils';

type UsersReportContentProps = {
    users: UserData[];
}

export function UsersReportContent({ users }: UsersReportContentProps) {
    const [emissionDate, setEmissionDate] = useState('');
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        setEmissionDate(format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }));
    }, []);

    return (
        <div className="bg-background text-foreground min-h-screen">
          <main className="container mx-auto p-4 md:p-8 print:p-0">
            <div className="text-center mb-8 print:mb-4">
                <h1 className="text-2xl font-bold uppercase tracking-wider">Estado de Goiás</h1>
                <h2 className="text-xl font-semibold uppercase tracking-wide">Polícia Militar</h2>
                <h2 className="text-xl font-semibold uppercase tracking-wide">39º BPM</h2>
            </div>
    
            <div className="text-center mb-4">
                <h3 className="text-lg font-bold">RELAÇÃO DE EFETIVO</h3>
                {!isClient ? (
                    <Skeleton className="h-4 w-48 mx-auto mt-1" />
                ) : emissionDate && (
                    <p className="text-sm text-muted-foreground">
                        Data de Emissão: {emissionDate}
                    </p>
                )}
            </div>
    
    
            <div className="flex justify-between items-center mb-4 print:hidden">
                <Button asChild variant="outline">
                    <Link href="/admin/dashboard">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar ao Painel
                    </Link>
                </Button>
                <div className="flex items-center gap-4">
                   <Badge variant="secondary">Total: {users.length}</Badge>
                   <ReportPrintButton />
                </div>
            </div>
    
            <div className="space-y-8">
                 <div className="overflow-x-auto">
                    <table className="w-full mt-2 text-sm print:text-xs">
                        <thead className="border-b">
                            <tr>
                                <th className="px-2 py-1 text-left font-semibold w-[15%]">Posto/Grad</th>
                                <th className="px-2 py-1 text-left font-semibold w-[10%]">RG</th>
                                <th className="px-2 py-1 text-left font-semibold w-[35%]">Nome Completo</th>
                                <th className="px-2 py-1 text-left font-semibold w-[15%]">CPF</th>
                                <th className="px-2 py-1 text-left font-semibold w-[15%]">Telefone</th>
                                <th className="px-2 py-1 text-left font-semibold w-[10%]">Equipe</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user, index) => (
                                <tr key={user.id} className={cn("border-b border-muted whitespace-nowrap", index % 2 !== 0 && "bg-muted/50 print-bg-muted")}>
                                    <td className="px-2 py-1">{user.rank}</td>
                                    <td className="px-2 py-1">{maskFunctions.rg(user.rg)}</td>
                                    <td className="px-2 py-1">{user.fullName}</td>
                                    <td className="px-2 py-1">{maskFunctions.taxId(user.taxId)}</td>
                                    <td className="px-2 py-1">{maskFunctions.phone(user.phone)}</td>
                                    <td className="px-2 py-1">{getTeamForDate(user.teamHistory, new Date())}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                 {users.length === 0 && (
                    <div className="text-center text-muted-foreground py-10">
                        <p>Nenhum usuário encontrado para gerar o relatório.</p>
                    </div>
                )}
            </div>
          </main>
        </div>
      );
}
