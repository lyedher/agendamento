"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Users, LogOut, Printer, ShieldAlert, FileText, AlertCircle, Search, Edit3, Check, Trash2, Plus, CalendarDays, X, UserPlus, Shield } from "lucide-react";
import { getUsers, updateUser, getSchedules, createSchedule, deleteSchedule, updateSchedule } from "@/lib/actions";

const RANKS = ["Soldado", "Cabo", "3º Sargento", "2º Sargento", "1º Sargento", "Subtenente", "Aspirante", "2º Tenente", "1º Tenente", "Capitão", "Major", "Tenente-Coronel", "Coronel"];
const FUNCTIONS = ["Comandante de VTR", "Motorista de VTR", "Plantonista", "Auxiliar de Seção", "Chefe de Seção", "Comandante de UPM", "Subcomandante de UPM"];
const TEAMS = ["Alfa", "Bravo", "Charlie", "Delta", "ADM", "Afastado", "Transferido"];

export default function AdminDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("battalion-schedule");
  
  // User states
  const [usersList, setUsersList] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingUser, setEditingUser] = useState<any | null>(null);
  
  // Schedule states
  const [schedulesList, setSchedulesList] = useState<any[]>([]);
  const [editingSchedule, setEditingSchedule] = useState<any | null>(null);
  const [newScheduleData, setNewScheduleData] = useState({
    scheduleName: "",
    startTime: "08:00",
    endTime: "20:00",
    capacity: 1
  });
  
  // Schedule edit states
  const [editScheduleHours, setEditScheduleHours] = useState({
    startTime: "",
    endTime: ""
  });
  const [selectedVolunteerId, setSelectedVolunteerId] = useState("");

  // Calendar selection states
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDays, setSelectedDays] = useState<number[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [resUsers, resSchedules] = await Promise.all([getUsers(), getSchedules()]);
    
    if (resUsers.success) setUsersList(resUsers.users);
    if (resSchedules.success) setSchedulesList(resSchedules.schedules);
    
    setIsLoading(false);
  };

  const filteredUsers = usersList
    .filter(u => 
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.nickname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.taxId.includes(searchQuery)
    )
    .sort((a, b) => {
      const weightA = RANKS.indexOf(a.rank);
      const weightB = RANKS.indexOf(b.rank);
      if (weightA !== weightB) {
        return weightB - weightA;
      }
      const orderA = a.sortOrder ?? 999;
      const orderB = b.sortOrder ?? 999;
      return orderA - orderB;
    });

  const handleLogout = () => {
    router.push("/login");
  };

  // User Handlers
  const handleSaveUser = async () => {
    if (!editingUser) return;
    const res = await updateUser(editingUser.id, {
      rank: editingUser.rank,
      jobFunction: editingUser.jobFunction,
      workTeam: editingUser.workTeam,
      sortOrder: editingUser.sortOrder,
      fullName: editingUser.fullName,
      nickname: editingUser.nickname,
      email: editingUser.email,
      taxId: editingUser.taxId,
      rg: editingUser.rg,
      phone: editingUser.phone,
    });

    if (res.success) {
      setEditingUser(null);
      loadData();
    }
  };

  // Get days in month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);

  const toggleDay = (day: number) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const selectAllDays = () => {
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    setSelectedDays(days);
  };

  const clearSelection = () => {
    setSelectedDays([]);
  };

  // Schedule Handlers
  const handleCreateScheduleBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDays.length === 0) {
      alert("Selecione ao menos um dia no calendário!");
      return;
    }

    setIsLoading(true);
    try {
      for (const day of selectedDays) {
        const startParts = newScheduleData.startTime.split(":");
        const endParts = newScheduleData.endTime.split(":");
        
        const start = new Date(currentYear, currentMonth, day, parseInt(startParts[0]), parseInt(startParts[1]));
        const end = new Date(currentYear, currentMonth, day, parseInt(endParts[0]), parseInt(endParts[1]));
        
        if (end <= start) {
          end.setDate(end.getDate() + 1);
        }

        await createSchedule({
          scheduleName: newScheduleData.scheduleName,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          capacity: newScheduleData.capacity
        });
      }

      setSelectedDays([]);
      setNewScheduleData({ scheduleName: "", startTime: "08:00", endTime: "20:00", capacity: 1 });
      loadData();
    } catch (err) {
      alert("Ocorreu um erro ao salvar as escalas.");
      setIsLoading(false);
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (confirm("Deseja realmente excluir esta escala?")) {
      const res = await deleteSchedule(id);
      if (res.success) {
        if (editingSchedule?.id === id) setEditingSchedule(null);
        loadData();
      }
    }
  };

  // Manage Volunteers
  const handleOpenEditSchedule = (s: any) => {
    setEditingSchedule(s);
    const start = new Date(s.startTime);
    const end = new Date(s.endTime);
    
    setEditScheduleHours({
      startTime: `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`,
      endTime: `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`
    });
    setSelectedVolunteerId("");
  };

  const handleUpdateScheduleHours = async () => {
    if (!editingSchedule) return;

    const baseStart = new Date(editingSchedule.startTime);
    const baseEnd = new Date(editingSchedule.endTime);
    
    const startParts = editScheduleHours.startTime.split(":");
    const endParts = editScheduleHours.endTime.split(":");

    baseStart.setHours(parseInt(startParts[0]), parseInt(startParts[1]));
    baseEnd.setHours(parseInt(endParts[0]), parseInt(endParts[1]));

    if (baseEnd <= baseStart) {
      baseEnd.setDate(baseEnd.getDate() + 1);
    }

    const res = await updateSchedule(editingSchedule.id, {
      startTime: baseStart.toISOString(),
      endTime: baseEnd.toISOString()
    });

    if (res.success) {
      setEditingSchedule(res.schedule);
      loadData();
      alert("Horários atualizados com sucesso!");
    }
  };

  const handleAddVolunteer = async () => {
    if (!editingSchedule || !selectedVolunteerId) return;
    
    if (editingSchedule.userIds.includes(selectedVolunteerId)) {
      alert("Este policial já está escalado.");
      return;
    }

    if (editingSchedule.userIds.length >= editingSchedule.capacity) {
      alert("A escala já atingiu o limite máximo de vagas!");
      return;
    }

    const updatedUserIds = [...editingSchedule.userIds, selectedVolunteerId];
    
    const res = await updateSchedule(editingSchedule.id, {
      userIds: updatedUserIds
    });

    if (res.success) {
      setEditingSchedule(res.schedule);
      setSelectedVolunteerId("");
      loadData();
    } else {
      alert(res.message);
    }
  };

  const handleRemoveVolunteer = async (uid: string) => {
    if (!editingSchedule) return;

    const updatedUserIds = editingSchedule.userIds.filter((id: string) => id !== uid);
    const res = await updateSchedule(editingSchedule.id, {
      userIds: updatedUserIds
    });

    if (res.success) {
      setEditingSchedule(res.schedule);
      loadData();
    }
  };

  // Duty Matrix Calculations
  const isUserOnDutyMatrix = (team: string, day: number) => {
    if (team === "ADM") return false;
    const target = new Date(currentYear, currentMonth, day, 8, 0, 0);
    const baseline = new Date(2026, 4, 1, 8, 0, 0);
    const diffTime = target.getTime() - baseline.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return false;
    const remainder = ((diffDays % 4) + 4) % 4;
    
    const teamOffsets: Record<string, number> = { "Alfa": 0, "Bravo": 1, "Charlie": 2, "Delta": 3 };
    return remainder === teamOffsets[team];
  };

  const userHasExtraMatrix = (uid: string, day: number) => {
    return schedulesList.some(s => {
      const sDate = new Date(s.startTime);
      return sDate.getDate() === day && 
             sDate.getMonth() === currentMonth && 
             sDate.getFullYear() === currentYear && 
             s.userIds.includes(uid);
    });
  };

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  return (
    <div className="min-h-screen flex flex-col bg-[#F0F4F5]">
      {/* Header Administrador */}
      <header className="bg-[#79A3B1] border-b shadow-md sticky top-0 z-50 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-6 w-6" />
            <span className="text-xl font-bold tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Agendamento - Módulo Administrador
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-white/80 hidden md:inline-block">
              Conectado como <strong>Administrador</strong>
            </span>
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center gap-2 text-white hover:bg-white/20"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Ações Administrativas */}
        <div className="flex flex-col sm:flex-row sm:justify-end gap-3 mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
          <Button className="bg-white text-[#1a1a1a] hover:bg-[#ACC18A]/80 border shadow-sm" style={{ backgroundColor: '#ACC18A' }} onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir Quadro de Escalas
          </Button>
        </div>

        {/* Tabs Administrativas */}
        <Tabs defaultValue="battalion-schedule" className="w-full" onValueChange={setActiveTab} value={activeTab}>
          <TabsList className="grid w-full grid-cols-2 h-auto md:grid-cols-6 bg-white shadow p-1 rounded-xl mb-8">
            <TabsTrigger value="schedules" className="rounded-lg py-2.5 data-[state=active]:bg-[#79A3B1] data-[state=active]:text-white">Escalas SER</TabsTrigger>
            <TabsTrigger value="battalion-schedule" className="rounded-lg py-2.5 data-[state=active]:bg-[#79A3B1] data-[state=active]:text-white">Escala Ordinária</TabsTrigger>
            <TabsTrigger value="adm-schedule" className="rounded-lg py-2.5 data-[state=active]:bg-[#79A3B1] data-[state=active]:text-white">Expediente</TabsTrigger>
            <TabsTrigger value="away" className="rounded-lg py-2.5 data-[state=active]:bg-[#79A3B1] data-[state=active]:text-white">Afastados</TabsTrigger>
            <TabsTrigger value="volunteers" className="rounded-lg py-2.5 data-[state=active]:bg-[#79A3B1] data-[state=active]:text-white">Agendamentos</TabsTrigger>
            <TabsTrigger value="users" className="rounded-lg py-2.5 data-[state=active]:bg-[#79A3B1] data-[state=active]:text-white">Efetivo</TabsTrigger>
          </TabsList>

          {/* Tab 2: Escala Ordinária (Quadro de Escalas Integrado) */}
          <TabsContent value="battalion-schedule" className="animate-in fade-in duration-300">
            <Card className="border shadow-xl bg-white rounded-2xl print:shadow-none print:border-0">
              <CardHeader>
                <CardTitle className="text-[#79A3B1] print:text-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Quadro Geral de Escalas (Operacional)</CardTitle>
                <CardDescription>Visão do mês de {monthNames[currentMonth]} ({currentYear})</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto max-w-full">
                  <table className="w-full text-center text-xs border-collapse min-w-[800px]">
                    <thead className="bg-gray-100 text-gray-700 font-bold border-b sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left bg-gray-100 sticky left-0 min-w-[150px] z-10 border-r shadow-[2px_0_5px_rgba(0,0,0,0.05)]">Militar</th>
                        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => (
                          <th key={day} className="px-2 py-3 border-r border-b">{day}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {["Alfa", "Bravo", "Charlie", "Delta"].map((teamName) => {
                        const teamMembers = usersList.filter(u => u.workTeam === teamName);
                        if (teamMembers.length === 0) return null;

                        return (
                          <>
                            {/* Separador da Equipe */}
                            <tr key={teamName} className="bg-[#79A3B1]/10 text-gray-800 font-bold">
                              <td className="px-4 py-2 text-left bg-[#79A3B1]/10 sticky left-0 z-10 border-r shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                                Equipe {teamName}
                              </td>
                              <td colSpan={daysInMonth} className="px-4 py-2 text-left text-[10px] tracking-wider">
                                POLICIAIS DO PELOTÃO
                              </td>
                            </tr>

                            {teamMembers.map((m) => (
                              <tr key={m.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-4 py-3 text-left font-semibold text-gray-900 bg-white sticky left-0 z-10 border-r shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                                  {m.rank} {m.nickname}
                                </td>
                                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                                  const onDuty = isUserOnDutyMatrix(m.workTeam, day);
                                  const hasExtra = userHasExtraMatrix(m.id, day);

                                  return (
                                    <td key={day} className="px-1 py-3 border-r text-[10px] font-bold align-middle">
                                      <div className="flex flex-col gap-1 items-center justify-center">
                                        {onDuty && (
                                          <span className="w-full py-0.5 bg-blue-100 text-blue-800 border border-blue-300 rounded text-[9px]">
                                            24h
                                          </span>
                                        )}
                                        {hasExtra && (
                                          <span className="w-full py-0.5 bg-green-100 text-green-800 border border-green-300 rounded text-[9px]">
                                            SER
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 3: Expediente */}
          <TabsContent value="adm-schedule" className="animate-in fade-in duration-300">
            <Card className="border shadow-xl bg-white rounded-2xl">
              <CardHeader>
                <CardTitle className="text-[#79A3B1]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Policiamento Administrativo (Expediente)</CardTitle>
                <CardDescription>Militares prestando serviços internos administrativos.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {usersList.filter(u => u.workTeam === 'ADM').map(m => (
                    <div key={m.id} className="bg-gray-50 p-3 rounded-xl border flex items-center justify-between shadow-sm">
                      <div>
                        <span className="font-bold text-gray-800">{m.rank} {m.nickname}</span>
                        <p className="text-xs text-gray-500">{m.fullName}</p>
                      </div>
                      <span className="text-xs bg-blue-100 text-blue-800 font-semibold px-2 py-1 rounded-md">
                        {m.jobFunction || "Setor Interno"}
                      </span>
                    </div>
                  ))}
                </div>
                {usersList.filter(u => u.workTeam === 'ADM').length === 0 && (
                  <p className="text-center py-10 text-gray-400 text-sm">Nenhum militar na equipe ADM.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 1: Escalas SER */}
          <TabsContent value="schedules" className="animate-in fade-in duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="border shadow-xl bg-white rounded-2xl lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-[#79A3B1]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Criar Escala SER</CardTitle>
                  <CardDescription>Configure o serviço e selecione os dias.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateScheduleBatch} className="space-y-4">
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">Nome da Escala</Label>
                      <Input 
                        required 
                        placeholder="Ex: Guarda QG" 
                        value={newScheduleData.scheduleName}
                        onChange={(e) => setNewScheduleData({...newScheduleData, scheduleName: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500">Hora Inicial</Label>
                        <Input 
                          type="time" 
                          required 
                          value={newScheduleData.startTime}
                          onChange={(e) => setNewScheduleData({...newScheduleData, startTime: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500">Hora Final</Label>
                        <Input 
                          type="time" 
                          required 
                          value={newScheduleData.endTime}
                          onChange={(e) => setNewScheduleData({...newScheduleData, endTime: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">Vagas Disponíveis</Label>
                      <Input 
                        type="number" 
                        min="1" 
                        required 
                        value={newScheduleData.capacity}
                        onChange={(e) => setNewScheduleData({...newScheduleData, capacity: parseInt(e.target.value)})}
                      />
                    </div>

                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-xs font-semibold text-gray-600 flex items-center gap-1">
                          <CalendarDays className="h-4 w-4 text-[#79A3B1]" />
                          Dias em {monthNames[currentMonth]}
                        </Label>
                      </div>
                      <div className="grid grid-cols-7 gap-1.5 text-center">
                        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => (
                          <button
                            type="button"
                            key={day}
                            onClick={() => toggleDay(day)}
                            className={`py-2 text-xs font-medium rounded-md border transition-all ${
                              selectedDays.includes(day) 
                                ? 'bg-[#79A3B1] text-white border-[#79A3B1] shadow-sm font-bold' 
                                : 'hover:bg-gray-100 bg-gray-50 text-gray-700'
                            }`}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2 mt-3 text-xs">
                        <Button type="button" variant="ghost" size="sm" className="flex-1 text-gray-600 border hover:bg-gray-50" onClick={selectAllDays}>
                          Todos
                        </Button>
                        <Button type="button" variant="ghost" size="sm" className="flex-1 text-gray-600 border hover:bg-gray-50" onClick={clearSelection}>
                          Limpar
                        </Button>
                      </div>
                    </div>

                    <Button type="submit" className="w-full bg-[#ACC18A] text-gray-900 hover:bg-[#ACC18A]/80 mt-4">
                      <Check className="h-4 w-4 mr-1" /> Salvar Escala Criada
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="border shadow-xl bg-white rounded-2xl lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-[#79A3B1]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Escalas SER Criadas</CardTitle>
                  <CardDescription>Clique em "Gerenciar" para controlar vagas e policiais.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {isLoading ? (
                    <div className="h-60 flex items-center justify-center text-gray-400 text-sm">Carregando escalas...</div>
                  ) : schedulesList.length === 0 ? (
                    <div className="h-60 flex items-center justify-center text-gray-400 text-sm">Nenhuma escala SER cadastrada.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-700 font-medium border-b">
                          <tr>
                            <th className="px-6 py-4">Escala</th>
                            <th className="px-6 py-4">Período</th>
                            <th className="px-6 py-4">Vagas</th>
                            <th className="px-6 py-4 text-right">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {[...schedulesList].sort((a,b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()).map((s) => (
                            <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-6 py-4 font-semibold text-gray-900">{s.scheduleName}</td>
                              <td className="px-6 py-4 text-gray-600 text-xs">
                                {new Date(s.startTime).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} até {new Date(s.endTime).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </td>
                              <td className="px-6 py-4 text-gray-600 font-medium">
                                <span className={s.userIds?.length >= s.capacity ? "text-red-500" : "text-green-600"}>
                                  {s.userIds?.length || 0} / {s.capacity}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right flex items-center justify-end gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="hover:text-[#79A3B1] hover:bg-gray-100"
                                  onClick={() => handleOpenEditSchedule(s)}
                                >
                                  <Edit3 className="h-4 w-4 mr-1" /> Gerenciar
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-red-600 hover:bg-red-50"
                                  onClick={() => handleDeleteSchedule(s.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {editingSchedule && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
                <Card className="w-full max-w-3xl border shadow-2xl bg-white rounded-2xl relative animate-in zoom-in-95 duration-200">
                  <button 
                    onClick={() => setEditingSchedule(null)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                  <CardHeader className="border-b pb-4">
                    <div>
                      <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <span>Gerenciando Escala: {editingSchedule.scheduleName}</span>
                      </CardTitle>
                      <CardDescription className="text-xs text-gray-500 mt-1">
                        Data base: {new Date(editingSchedule.startTime).toLocaleDateString('pt-BR')}
                      </CardDescription>
                    </div>
                  </CardHeader>

                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                    <div className="space-y-4 border-r pr-0 md:pr-6 border-gray-100">
                      <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-[#79A3B1]" /> Ajustar Horários
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs font-medium text-gray-600">Hora Inicial</Label>
                          <Input 
                            type="time" 
                            className="p-2.5 border rounded-lg text-sm focus-visible:ring-[#79A3B1]"
                            value={editScheduleHours.startTime} 
                            onChange={(e) => setEditScheduleHours({...editScheduleHours, startTime: e.target.value})} 
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-medium text-gray-600">Hora Final</Label>
                          <Input 
                            type="time" 
                            className="p-2.5 border rounded-lg text-sm focus-visible:ring-[#79A3B1]"
                            value={editScheduleHours.endTime} 
                            onChange={(e) => setEditScheduleHours({...editScheduleHours, endTime: e.target.value})} 
                          />
                        </div>
                      </div>
                      <Button size="sm" className="w-full bg-[#79A3B1] text-white hover:bg-[#79A3B1]/90 font-medium" onClick={handleUpdateScheduleHours}>
                        Atualizar Horários da Escala
                      </Button>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                        <UserPlus className="h-4 w-4 text-[#79A3B1]" /> Voluntários escalados ({editingSchedule.userIds?.length || 0} / {editingSchedule.capacity})
                      </h4>

                      <div className="flex gap-2">
                        <select 
                          className="flex-1 p-2.5 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#79A3B1] focus:border-[#79A3B1] outline-none transition-all"
                          value={selectedVolunteerId}
                          onChange={(e) => setSelectedVolunteerId(e.target.value)}
                        >
                          <option value="">-- Selecione Policial --</option>
                          {usersList
                            .filter(u => !editingSchedule.userIds.includes(u.id))
                            .map(u => (
                              <option key={u.id} value={u.id}>{u.rank} {u.nickname} ({u.workTeam})</option>
                            ))
                          }
                        </select>
                        <Button 
                          size="sm" 
                          className="bg-[#ACC18A] text-gray-900 hover:bg-[#ACC18A]/80 font-medium"
                          onClick={handleAddVolunteer}
                          disabled={!selectedVolunteerId || editingSchedule.userIds.length >= editingSchedule.capacity}
                        >
                          Escalar
                        </Button>
                      </div>

                      <div className="bg-gray-50/80 rounded-xl p-3 border max-h-48 overflow-y-auto">
                        {editingSchedule.userIds.length === 0 ? (
                          <p className="text-gray-400 text-center text-xs py-4">Nenhum voluntário escalado.</p>
                        ) : (
                          <ul className="space-y-2">
                            {editingSchedule.userIds.map((uid: string) => {
                              const user = usersList.find(u => u.id === uid);
                              return (
                                <li key={uid} className="flex items-center justify-between bg-white p-2.5 rounded-lg shadow-sm border text-xs">
                                  <span className="font-semibold text-gray-800">
                                    {user ? `${user.rank} ${user.nickname}` : "Carregando..."}
                                  </span>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-6 w-6 p-0 text-red-500 hover:bg-red-50 rounded-full"
                                    onClick={() => handleRemoveVolunteer(uid)}
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </Button>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Tab 6: Efetivo */}
          <TabsContent value="users" className="animate-in fade-in duration-300">
            <Card className="border shadow-xl bg-white rounded-2xl">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b gap-4">
                <div>
                  <CardTitle className="text-[#79A3B1]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Gerenciar Efetivo</CardTitle>
                  <CardDescription>Gerencie funções, graduações e equipes dos policiais.</CardDescription>
                </div>
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input 
                    placeholder="Buscar por Nome ou CPF..." 
                    className="pl-9 focus-visible:ring-[#79A3B1]" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="h-60 flex items-center justify-center text-gray-400 text-sm">
                    Carregando banco de dados do efetivo...
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="h-60 flex items-center justify-center text-gray-400 text-sm">
                    Nenhum militar encontrado.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 text-gray-700 font-medium border-b">
                        <tr>
                          <th className="px-6 py-4">Militar</th>
                          <th className="px-6 py-4">Função</th>
                          <th className="px-6 py-4">Equipe</th>
                          <th className="px-6 py-4">Desempate (Ordem)</th>
                          <th className="px-6 py-4 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {filteredUsers.map((u) => (
                          <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-semibold text-gray-900 flex items-center gap-2">
                                <span>{u.rank} {u.nickname}</span>
                                {u.sortOrder && (
                                  <span className="text-[10px] bg-[#79A3B1]/20 text-[#79A3B1] px-2 py-0.5 rounded-full font-bold tracking-wide shadow-sm">
                                    #{u.sortOrder}º
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500">{u.fullName}</div>
                            </td>
                            <td className="px-6 py-4 text-gray-600">{u.jobFunction || "—"}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded-md text-xs font-semibold ${u.workTeam === 'ADM' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                                {u.workTeam || "—"}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-gray-600 font-medium">{u.sortOrder ?? 999}</td>
                            <td className="px-6 py-4 text-right">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="hover:text-[#79A3B1] hover:bg-gray-100"
                                onClick={() => setEditingUser(editingUser?.id === u.id ? null : u)}
                              >
                                <Edit3 className="h-4 w-4 mr-1" />
                                Alterar
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {editingUser && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
                <Card className="w-full max-w-4xl border shadow-2xl bg-white rounded-2xl relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                  <button 
                    onClick={() => setEditingUser(null)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                      <span>Alterar Cadastro Completo</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-6">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-gray-600">Nome Completo</Label>
                      <Input 
                        type="text" 
                        className="p-2.5 border rounded-lg text-sm focus-visible:ring-[#79A3B1]" 
                        value={editingUser.fullName || ""} 
                        onChange={(e) => setEditingUser({...editingUser, fullName: e.target.value})} 
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-gray-600">Nome de Guerra</Label>
                      <Input 
                        type="text" 
                        className="p-2.5 border rounded-lg text-sm focus-visible:ring-[#79A3B1]" 
                        value={editingUser.nickname || ""} 
                        onChange={(e) => setEditingUser({...editingUser, nickname: e.target.value})} 
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-gray-600">E-mail</Label>
                      <Input 
                        type="email" 
                        className="p-2.5 border rounded-lg text-sm focus-visible:ring-[#79A3B1]" 
                        value={editingUser.email || ""} 
                        onChange={(e) => setEditingUser({...editingUser, email: e.target.value})} 
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-gray-600">CPF</Label>
                      <Input 
                        type="text" 
                        className="p-2.5 border rounded-lg text-sm focus-visible:ring-[#79A3B1]" 
                        value={editingUser.taxId || ""} 
                        onChange={(e) => setEditingUser({...editingUser, taxId: e.target.value})} 
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-gray-600">RG</Label>
                      <Input 
                        type="text" 
                        className="p-2.5 border rounded-lg text-sm focus-visible:ring-[#79A3B1]" 
                        value={editingUser.rg || ""} 
                        onChange={(e) => setEditingUser({...editingUser, rg: e.target.value})} 
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-gray-600">Telefone / Celular</Label>
                      <Input 
                        type="text" 
                        className="p-2.5 border rounded-lg text-sm focus-visible:ring-[#79A3B1]" 
                        value={editingUser.phone || ""} 
                        onChange={(e) => setEditingUser({...editingUser, phone: e.target.value})} 
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-gray-600">Graduação</Label>
                      <select 
                        className="w-full p-2.5 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#79A3B1] focus:border-[#79A3B1] outline-none transition-all" 
                        value={editingUser.rank} 
                        onChange={(e) => setEditingUser({...editingUser, rank: e.target.value})}
                      >
                        {RANKS.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-gray-600">Função</Label>
                      <select 
                        className="w-full p-2.5 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#79A3B1] focus:border-[#79A3B1] outline-none transition-all" 
                        value={editingUser.jobFunction} 
                        onChange={(e) => setEditingUser({...editingUser, jobFunction: e.target.value})}
                      >
                        {FUNCTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-gray-600">Equipe</Label>
                      <select 
                        className="w-full p-2.5 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#79A3B1] focus:border-[#79A3B1] outline-none transition-all" 
                        value={editingUser.workTeam} 
                        onChange={(e) => setEditingUser({...editingUser, workTeam: e.target.value})}
                      >
                        {TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-gray-600">Desempate (Ordem de Antiguidade)</Label>
                      <Input 
                        type="number" 
                        className="w-full p-2.5 border rounded-lg text-sm focus-visible:ring-[#79A3B1]" 
                        value={editingUser.sortOrder ?? 999} 
                        onChange={(e) => setEditingUser({...editingUser, sortOrder: parseInt(e.target.value) || 999})}
                      />
                    </div>

                    <div className="sm:col-span-2 flex justify-end gap-3 pt-4 border-t mt-2">
                      <Button variant="ghost" size="sm" className="hover:bg-gray-100 text-gray-600" onClick={() => setEditingUser(null)}>
                        Cancelar
                      </Button>
                      <Button size="sm" className="bg-[#ACC18A] text-gray-900 hover:bg-[#ACC18A]/80 font-semibold" onClick={handleSaveUser}>
                        <Check className="h-4 w-4 mr-1.5" /> Salvar Alterações
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="away"><Card className="border shadow-xl bg-white rounded-2xl"><CardContent className="h-[300px] flex items-center justify-center text-gray-400 text-sm">Módulo de afastamentos em breve.</CardContent></Card></TabsContent>
          <TabsContent value="volunteers"><Card className="border shadow-xl bg-white rounded-2xl"><CardContent className="h-[300px] flex items-center justify-center text-gray-400 text-sm">Módulo de voluntários em breve.</CardContent></Card></TabsContent>

        </Tabs>
      </main>
    </div>
  );
}
