'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon, Edit, Loader2, Search, Trash2 } from 'lucide-react';
import type { UserData, Absence } from '@/lib/types';
import { ABSENCE_TYPES } from '@/lib/types';
import { useState, useMemo, useTransition } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { addOrUpdateAbsenceAction, deleteAbsenceAction, getAbsences } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export function ManageAbsencesDialog({ isOpen, onOpenChange, officers, currentAbsences, onAbsencesUpdated }: { isOpen: boolean; onOpenChange: (o: boolean) => void; officers: UserData[]; currentAbsences: Absence[]; onAbsencesUpdated: (a: Absence[]) => void; }) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<{ id: string | null; officerId: string; reason: string; startDate?: Date; endDate?: Date; }>({ id: null, officerId: '', reason: '', startDate: undefined, endDate: undefined });
  const [searchTerm, setSearchTerm] = useState('');
  const [toDelete, setToDelete] = useState<Absence | null>(null);

  const handleSave = () => {
    const fd = new FormData();
    fd.set('id', form.id || ''); fd.set('officerId', form.officerId); fd.set('reason', form.reason);
    if (form.startDate) fd.set('startDate', form.startDate.toISOString());
    if (form.endDate) fd.set('endDate', form.endDate.toISOString());
    startTransition(async () => {
        const res = await addOrUpdateAbsenceAction(fd);
        if (res.success) { toast({ title: 'Sucesso!' }); setForm({ id: null, officerId: '', reason: '', startDate: undefined, endDate: undefined }); const upd = await getAbsences(); onAbsencesUpdated(upd); }
        else toast({ variant: 'destructive', title: 'Erro' });
    });
  };
  
  const handleDelete = () => {
    if (!toDelete) return;
    startTransition(async () => {
        const res = await deleteAbsenceAction(toDelete.id);
        if (res.success) { toast({ title: 'Sucesso!' }); const upd = await getAbsences(); onAbsencesUpdated(upd); }
        setToDelete(null);
    });
  }

  const filtered = useMemo(() => {
    if (!searchTerm) return currentAbsences;
    const term = searchTerm.toLowerCase();
    return currentAbsences.filter(a => {
        const o = officers.find(of => of.id === a.officerId);
        return o?.fullName.toLowerCase().includes(term) || a.reason.toLowerCase().includes(term);
    });
  }, [currentAbsences, officers, searchTerm]);

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader><DialogTitle>Gerenciar Afastamentos</DialogTitle></DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          <Card>
            <CardHeader><CardTitle className="text-lg">{form.id ? 'Editar' : 'Novo'}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2"><Label>Policial</Label><Select value={form.officerId} onValueChange={v => setForm(s => ({...s, officerId: v}))}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{officers.map(o => (<SelectItem key={o.id} value={o.id}>{o.rank} {o.fullName}</SelectItem>))}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Motivo</Label><Select value={form.reason} onValueChange={v => setForm(s => ({...s, reason: v}))}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{ABSENCE_TYPES.map(t => (<SelectItem key={t} value={t}>{t}</SelectItem>))}</SelectContent></Select></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Início</Label><Popover><PopoverTrigger asChild><Button variant='outline' className={cn('w-full justify-start', !form.startDate && 'text-muted-foreground')}><CalendarIcon className="mr-2 h-4 w-4" />{form.startDate ? format(form.startDate, 'P', { locale: ptBR }) : 'Data'}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={form.startDate} onSelect={d => setForm(s => ({...s, startDate: d}))} /></PopoverContent></Popover></div>
                <div className="space-y-2"><Label>Fim</Label><Popover><PopoverTrigger asChild><Button variant='outline' className={cn('w-full justify-start', !form.endDate && 'text-muted-foreground')}><CalendarIcon className="mr-2 h-4 w-4" />{form.endDate ? format(form.endDate, 'P', { locale: ptBR }) : 'Data'}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={form.endDate} onSelect={d => setForm(s => ({...s, endDate: d}))} disabled={(date) => !!(form.startDate && date < form.startDate)} /></PopoverContent></Popover></div>
              </div>
              <Button onClick={handleSave} disabled={isPending} className="w-full mt-6" style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-foreground)' }}>{isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Salvar'}</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><div className="relative"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Pesquisar..." className="pl-8" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div></CardHeader>
            <CardContent><ScrollArea className="h-80"><ul className="space-y-3">{filtered.map(a => { const o = officers.find(of => of.id === a.officerId); return (<li key={a.id} className="text-sm p-3 rounded-lg border bg-muted/50"><div className='flex justify-between items-start'><div><p className="font-semibold">{o?.rank} {o?.nickname}</p><p className='text-xs'>{a.reason} ({format(new Date(a.startDate), 'dd/MM')} - {format(new Date(a.endDate), 'dd/MM')})</p></div><div className='flex gap-1'><Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setForm({id: a.id, officerId: a.officerId, reason: a.reason, startDate: new Date(a.startDate), endDate: new Date(a.endDate)}) }><Edit className='h-4 w-4'/></Button><Button variant="destructive" size="icon" className="h-7 w-7" onClick={() => setToDelete(a)}><Trash2 className='h-4 w-4' /></Button></div></div></li>)})}</ul></ScrollArea></CardContent>
          </Card>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
    <AlertDialog open={!!toDelete} onOpenChange={o => !o && setToDelete(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle><AlertDialogDescription>Deseja remover este afastamento?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDelete} disabled={isPending} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </>
  );
}