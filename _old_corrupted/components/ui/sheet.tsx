
'use client';
import Link from 'next/link';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { UserCircle } from 'lucide-react';
import { logoutAction } from '@/lib/actions';
import { maskFunctions } from '@/lib/schemas';
import type { Team, TeamHistoryEntry } from '@/lib/types';

export type UserData = {
  id: string; // This is the user's document ID from firestore (the unmasked taxId)
  photo: string;
  rank: string;
  nickname: string;
  fullName: string;
  rg: string; 
  jobFunction: string;
  taxId: string;
  phone: string;
  workTeam?: string; // Legacy, will be phased out
  teamHistory?: TeamHistoryEntry[];
  email: string;
  sortOrder: number;
  presentationDate?: string;
};

export function UserProfile({ user, isAdmin }: { user: UserData, isAdmin?: boolean }) {
  return (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-12 w-auto flex items-center justify-end gap-3 px-0">
                 <div className="text-right">
                    <p className="text-sm font-medium">{user.rank} - {user.nickname}</p>
                    {user.rg && <p className="text-xs text-muted-foreground">RG: {maskFunctions.rg(user.rg)}</p>}
                </div>
                <Avatar className="h-10 w-10">
                    <AvatarImage src={user.photo || ''} alt="Foto do perfil" />
                    <AvatarFallback>
                        <UserCircle className="h-10 w-10 text-muted-foreground" />
                    </AvatarFallback>
                </Avatar>
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user.nickname}</p>
                <p className="text-xs leading-none text-muted-foreground">
                {user.rank}
                </p>
            </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                <Link href="/dashboard">Painel</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
                <Link href="/agendamento">Agendamento</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
                <Link href="/ac4">Cálculo AC-4</Link>
            </DropdownMenuItem>
             <DropdownMenuItem asChild>
                <Link href="/pontuacao">Cálculo de Pontuação</Link>
            </DropdownMenuItem>
             {isAdmin && (
                <DropdownMenuItem asChild>
                    <Link href="/admin/dashboard">Painel do Administrador</Link>
                </DropdownMenuItem>
             )}
            <DropdownMenuItem asChild>
              <Link href="/profile">Meu Perfil</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <form action={logoutAction} className="w-full">
                <DropdownMenuItem asChild>
                    <button type="submit" className="w-full text-left">
                        Sair
                    </button>
                </DropdownMenuItem>
            </form>
        </DropdownMenuContent>
    </DropdownMenu>
  );
}
