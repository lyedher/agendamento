
'use client';

import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Edit, UserCircle } from 'lucide-react';
import type { UserData } from '@/lib/types';
import { ScrollArea } from '../ui/scroll-area';
import { maskFunctions } from '@/lib/schemas';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { EditUserFormLoader } from './edit-user-form-loader';
import { UserImporter } from './user-importer';
import { getTeamForDate } from '@/lib/utils';


type UserListProps = {
  users: UserData[];
  userCount: number;
  hideSearch?: boolean;
};

export function UserList({ users, userCount, hideSearch = false }: UserListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleEditClick = (user: UserData) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };
  
  const usersWithCurrentTeam = useMemo(() => {
    return users.map(user => ({
      ...user,
      currentTeam: getTeamForDate(user.teamHistory, new Date()) || 'N/A'
    }));
  }, [users]);


  const filteredUsers = useMemo(() => {
    if (!searchTerm) return usersWithCurrentTeam;
    const lowercasedFilter = searchTerm.toLowerCase();
    return usersWithCurrentTeam.filter(
      (user) =>
        user.fullName.toLowerCase().includes(lowercasedFilter) ||
        user.nickname.toLowerCase().includes(lowercasedFilter) ||
        user.rank.toLowerCase().includes(lowercasedFilter) ||
        (user.currentTeam && user.currentTeam.toLowerCase().includes(lowercasedFilter)) ||
        (user.rg && user.rg.toLowerCase().includes(lowercasedFilter)) ||
        user.taxId.toLowerCase().includes(lowercasedFilter) ||
        user.phone.toLowerCase().includes(lowercasedFilter)
    );
  }, [usersWithCurrentTeam, searchTerm]);

  return (
    <>
      <Card>
        {!hideSearch && (
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Efetivo da Unidade</CardTitle>
                <CardDescription className='mt-2'>
                  Visualize, pesquise e edite os dados do efetivo da unidade.
                </CardDescription>
              </div>
              <div className='flex items-center gap-4'>
                <Badge variant="secondary">Total: {userCount}</Badge>
                <UserImporter />
              </div>
            </div>
            <Input
              placeholder="Pesquisar por nome, posto, equipe, RG, CPF ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </CardHeader>
        )}
        <CardContent>
          <ScrollArea className="h-[70vh]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Foto</TableHead>
                  <TableHead>Posto/Grad.</TableHead>
                  <TableHead>Nome de Guerra</TableHead>
                  <TableHead>Nome Completo</TableHead>
                  <TableHead>Equipe</TableHead>
                  <TableHead>RG</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Avatar>
                          <AvatarImage src={user.photo} />
                          <AvatarFallback>
                            <UserCircle />
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">{user.rank}</TableCell>
                      <TableCell>{user.nickname}</TableCell>
                      <TableCell>{user.fullName}</TableCell>
                      <TableCell>{user.currentTeam}</TableCell>
                      <TableCell>{maskFunctions.rg(user.rg || '')}</TableCell>
                      <TableCell>{maskFunctions.taxId(user.taxId)}</TableCell>
                      <TableCell>{maskFunctions.phone(user.phone)}</TableCell>
                      <TableCell className="text-right">
                         <Button variant="ghost" size="icon" onClick={() => handleEditClick(user)}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Editar Usuário</span>
                         </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center">
                      Nenhum usuário encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
      {selectedUser && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-4xl">
                <DialogHeader>
                <DialogTitle>Editar Usuário</DialogTitle>
                <DialogDescription>
                    Altere os dados cadastrais de {selectedUser.rank} {selectedUser.fullName}.
                </DialogDescription>
                </DialogHeader>
                <EditUserFormLoader user={selectedUser} onFinished={() => setIsEditDialogOpen(false)} isAdmin={true} />
            </DialogContent>
        </Dialog>
      )}
    </>
  );
}
