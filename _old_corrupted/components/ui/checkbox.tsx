'use client';

import { useState, useTransition } from 'react';
import { Loader2, Upload, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { ScrollArea } from '../ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { bulkCreateUsersAction } from '@/lib/actions';
import { SignupSchema } from '@/lib/schemas';
import type { z } from 'zod';

type NewUser = Omit<z.infer<typeof SignupSchema>, 'photo'>;
const REQUIRED_COLUMNS = ['Posto/Graduação', 'RG', 'Nome de Guerra', 'Nome Completo', 'Função', 'CPF', 'Telefone', 'E-mail', 'Senha'];

export function UserImporter() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [parsedUsers, setParsedUsers] = useState<NewUser[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [finalResult, setFinalResult] = useState<{success: boolean; message: string; count?: number} | null>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const processFile = async (file: File) => {
    setFileError(null); setParsedUsers([]); setFileName(file.name); setFinalResult(null);
    const XLSX = await import('xlsx');
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const json = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: "" }) as any[];
        if (json.length === 0) { setFileError("Planilha vazia."); return; }
        const missing = REQUIRED_COLUMNS.filter(col => !Object.keys(json[0]).includes(col));
        if (missing.length > 0) { setFileError(`Faltam colunas: ${missing.join(', ')}`); return; }
        setParsedUsers(json.map(row => ({
            rank: String(row['Posto/Graduação'] || ''), rg: String(row['RG'] || ''), nickname: String(row['Nome de Guerra'] || ''), fullName: String(row['Nome Completo'] || ''), jobFunction: String(row['Função'] || ''), workTeam: String(row['Equipe'] || ''), taxId: String(row['CPF'] || ''), phone: String(row['Telefone'] || ''), email: String(row['E-mail'] || ''), password: String(row['Senha'] || ''),
        })));
      } catch (err) { setFileError('Erro ao processar arquivo.'); }
    };
    reader.readAsArrayBuffer(file);
  };
  
  const handleImport = () => {
    if (parsedUsers.length === 0) return;
    startTransition(async () => {
        const res = await bulkCreateUsersAction(parsedUsers);
        setFinalResult(res);
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { setIsOpen(false); setParsedUsers([]); setFileName(null); setFinalResult(null); } else setIsOpen(true); }}>
      <DialogTrigger asChild><Button variant="outline"><Upload className="mr-2 h-4 w-4" />Importar Efetivo</Button></DialogTrigger>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader><DialogTitle>Importar Efetivo</DialogTitle><DialogDescription>Upload de .xlsx para adicionar múltiplos usuários.</DialogDescription></DialogHeader>
        <div className="py-4 space-y-6">
            {!finalResult ? (
                 <>
                    <div className="space-y-2"><p className='text-sm font-medium'>1. Faça o upload</p><div className="flex items-center justify-center w-full"><label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/80"><Upload className="w-8 h-8 mb-4 text-muted-foreground" /><p className="text-sm text-muted-foreground">Clique ou arraste .xlsx</p><input type="file" className="hidden" accept=".xlsx" onChange={handleFileChange} /></label></div></div>
                    {fileError && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Erro</AlertTitle><AlertDescription>{fileError}</AlertDescription></Alert>}
                    {parsedUsers.length > 0 && (
                        <div className="space-y-2">
                           <p className='text-sm font-medium'>2. Pré-visualização ({parsedUsers.length} usuários)</p>
                            <ScrollArea className="h-64 w-full rounded-md border"><Table><TableHeader><TableRow><TableHead>Posto/Grad</TableHead><TableHead>Nome</TableHead><TableHead>CPF</TableHead></TableRow></TableHeader><TableBody>{parsedUsers.map((u, i) => (<TableRow key={i}><TableCell>{u.rank}</TableCell><TableCell>{u.nickname}</TableCell><TableCell>{u.taxId}</TableCell></TableRow>))}</TableBody></Table></ScrollArea>
                        </div>
                    )}
                 </>
            ) : (
                <Alert variant={finalResult.success ? "default" : "destructive"}>{finalResult.success ? <CheckCircle className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}<AlertTitle>{finalResult.success ? 'Concluído!' : 'Falha'}</AlertTitle><AlertDescription>{finalResult.message}</AlertDescription></Alert>
            )}
        </div>
        <DialogFooter><DialogClose asChild><Button variant="outline">Fechar</Button></DialogClose>{!finalResult && <Button onClick={handleImport} disabled={isPending || parsedUsers.length === 0}>{isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Importar</Button>}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
