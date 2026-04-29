"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Users, LogOut, Printer, ShieldAlert, FileText, AlertCircle, Search, Edit3, Check, Trash2, Plus, CalendarDays, X, UserPlus, Shield, Calculator } from "lucide-react";
import { getUsers, updateUser, getSchedules, createSchedule, deleteSchedule, updateSchedule, adminAddUser } from "@/lib/actions";

const RANKS = ["Soldado", "Cabo", "3º Sargento", "2º Sargento", "1º Sargento", "Subtenente", "Aspirante", "2º Tenente", "1º Tenente", "Capitão", "Major", "Tenente-Coronel", "Coronel"];
const FUNCTIONS = ["Comandante de VTR", "Motorista de VTR", "Plantonista", "CPU", "Auxiliar de Seção", "Chefe de Seção", "Comandante de UPM", "Subcomandante de UPM"];
const TEAMS = ["Alfa", "Bravo", "Charlie", "Delta", "ADM", "Afastado", "Transferido"];

const formatRG = (rg: string) => {
  if (!rg) return "—";
  const clean = rg.replace(/\D/g, '');
  if (clean.length >= 5) {
    return `${clean.slice(0, 2)}.${clean.slice(2, 5)}`;
  }
  return rg;
};

const maskCPF = (value: string) => {
  const clean = value.replace(/\D/g, '').slice(0, 11);
  let masked = clean;
  if (clean.length > 9) {
    masked = `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9, 11)}`;
  } else if (clean.length > 6) {
    masked = `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6)}`;
  } else if (clean.length > 3) {
    masked = `${clean.slice(0, 3)}.${clean.slice(3)}`;
  }
  return masked;
};

const maskPhone = (value: string) => {
  const clean = value.replace(/\D/g, '').slice(0, 11);
  let masked = clean;
  if (clean.length > 10) {
    masked = `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7, 11)}`;
  } else if (clean.length > 6) {
    masked = `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
  } else if (clean.length > 2) {
    masked = `(${clean.slice(0, 2)}) ${clean.slice(2)}`;
  }
  return masked;
};

const maskRG = (value: string) => {
  const clean = value.replace(/\D/g, '').slice(0, 5);
  if (clean.length > 2) {
    return `${clean.slice(0, 2)}.${clean.slice(2)}`;
  }
  return clean;
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("battalion-schedule");
  
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  
  // User states
  const [usersList, setUsersList] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    rank: "Soldado",
    fullName: "",
    nickname: "",
    taxId: "",
    rg: "",
    jobFunction: "Plantonista",
    workTeam: "Alfa",
    phone: "",
    sortOrder: 999
  });

  const handleAddUserSubmit = async () => {
    if (!newUserForm.fullName || !newUserForm.nickname || !newUserForm.taxId) {
      alert("Preencha os campos obrigatórios: Nome Completo, Nome de Guerra e CPF!");
      return;
    }
    
    setIsLoading(true);
    const res = await adminAddUser(newUserForm);
    
    if (res.success) {
      setIsCreatingUser(false);
      setNewUserForm({
        rank: "Soldado",
        fullName: "",
        nickname: "",
        taxId: "",
        rg: "",
        jobFunction: "Plantonista",
        workTeam: "Alfa",
        phone: "",
        sortOrder: 999
      });
      loadData();
    } else {
      alert(res.message);
      setIsLoading(false);
    }
  };
  
  // AC-4 Rates state
  const [ac4Rates, setAc4Rates] = useState({
    blueDay: 35.0,
    blueNight: 42.0,
    redDay: 45.0,
    redNight: 52.0
  });

  const [selectedFilterDay, setSelectedFilterDay] = useState<number | null>(null);

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
    .filter(u => u.workTeam !== 'Transferido' && u.workTeam !== 'Afastado' && (
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.nickname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.taxId.includes(searchQuery) ||
      (u.workTeam && u.workTeam.toLowerCase().includes(searchQuery.toLowerCase()))
    ))
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

  const awayUsers = usersList
    .filter(u => u.workTeam === 'Afastado' && (
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.nickname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.taxId.includes(searchQuery) ||
      (u.workTeam && u.workTeam.toLowerCase().includes(searchQuery.toLowerCase()))
    ))
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

  const transferredUsers = usersList
    .filter(u => u.workTeam === 'Transferido' && (
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.nickname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.taxId.includes(searchQuery) ||
      (u.workTeam && u.workTeam.toLowerCase().includes(searchQuery.toLowerCase()))
    ))
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
      jobFunction: editingUser.workTeam === 'Transferido' ? "" : editingUser.jobFunction,
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

  // Cálculo AC-4
  const calculateAc4ForUser = (userId: string) => {
    const rates = ac4Rates;

    let totalHours = 0;
    let totalValue = 0;
    let blueDayHours = 0;
    let blueNightHours = 0;
    let redDayHours = 0;
    let redNightHours = 0;

    const userSchedules = schedulesList.filter(s => s.userIds && s.userIds.includes(userId));

    userSchedules.forEach(s => {
      if (!s.startTime || !s.endTime) return;
      const start = new Date(s.startTime);
      const end = new Date(s.endTime);
      
      let current = new Date(start);
      while (current < end) {
        const hour = current.getHours();
        const dayOfWeek = current.getDay(); 
        
        // Regra: Sexta 06h até Segunda 06h = Escala Vermelha
        let isVermelha = false;
        if (dayOfWeek === 5) { // Sexta
          isVermelha = hour >= 6;
        } else if (dayOfWeek === 6 || dayOfWeek === 0) { // Sábado ou Domingo
          isVermelha = true;
        } else if (dayOfWeek === 1) { // Segunda
          isVermelha = hour < 6;
        }

        // Regra: 06h até 22h = Diurno, 22h até 06h = Noturno
        const isNight = hour >= 22 || hour < 6;

        if (isVermelha) {
          if (isNight) {
            redNightHours += 1;
            totalValue += rates.redNight;
          } else {
            redDayHours += 1;
            totalValue += rates.redDay;
          }
        } else {
          if (isNight) {
            blueNightHours += 1;
            totalValue += rates.blueNight;
          } else {
            blueDayHours += 1;
            totalValue += rates.blueDay;
          }
        }

        totalHours += 1;
        current.setHours(current.getHours() + 1);
      }
    });

    return { totalHours, totalValue, blueDayHours, blueNightHours, redDayHours, redNightHours };
  };

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  const currentAdmin = usersList.find(u => u.email === 'lyedher@gmail.com' || u.role === 'admin') || { nickname: "Administrador", rg: "00.000", rank: "SGT" };

  return (
    <div className="min-h-screen flex flex-col bg-[#F0F4F5]">
      {/* Header Administrador */}
      <header className="bg-[#79A3B1] border-b shadow-md sticky top-0 z-50 text-white print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between relative">
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
            <ShieldAlert className="h-5 w-5" />
            <span className="text-lg font-bold tracking-tight whitespace-nowrap" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Painel do Administrador
            </span>
          </div>
          <div>{/* Spacer to keep between layout consistent */}</div>
          <div className="relative">
            <div 
              className="flex items-center gap-3 cursor-pointer hover:bg-white/10 p-1 px-2 rounded-xl transition-all"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            >
              <div className="flex flex-col text-right text-xs text-white/90 leading-tight hidden sm:flex">
                <span className="font-bold text-sm text-white">{currentAdmin.rank} {currentAdmin.nickname}</span>
                <span>RG: {formatRG(currentAdmin.rg)}</span>
              </div>
              
              {currentAdmin.avatar ? (
                <img src={currentAdmin.avatar} alt="Foto" className="h-9 w-9 rounded-full object-cover border border-white/40 shadow-sm" />
              ) : (
                <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center border border-white/40 shadow-sm">
                  <Users className="h-5 w-5 text-white" />
                </div>
              )}
            </div>

            {isUserMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-2xl border p-1.5 z-[110] animate-in slide-in-from-top-2 duration-150">
                <button 
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-[#79A3B1]/10 rounded-lg transition-colors font-semibold"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    router.push("/dashboard");
                  }}
                >
                  <Users className="h-4 w-4 text-[#79A3B1]" />
                  Área do Usuário
                </button>

                {/* Novos atalhos serão acrescentados aqui */}
                <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-t mt-1">
                  Atalhos Rápidos
                </div>
                
                <button 
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-400 cursor-not-allowed rounded-lg font-semibold"
                  disabled
                >
                  <Plus className="h-4 w-4 text-gray-300" />
                  Novo Atalho
                </button>
                
                <button 
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-semibold border-t mt-1 pt-2.5"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    handleLogout();
                  }}
                >
                  <LogOut className="h-4 w-4 text-red-500" />
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        


        {/* Tabs Administrativas */}
        <Tabs defaultValue="battalion-schedule" className="w-full" onValueChange={setActiveTab} value={activeTab}>
          <TabsList className="grid w-full grid-cols-2 h-auto md:grid-cols-7 bg-white shadow p-1 rounded-xl mb-8 print:hidden">
            <TabsTrigger value="schedules" className="rounded-lg py-2.5 data-[state=active]:bg-[#79A3B1] data-[state=active]:text-white">Escalas SER</TabsTrigger>
            <TabsTrigger value="battalion-schedule" className="rounded-lg py-2.5 data-[state=active]:bg-[#79A3B1] data-[state=active]:text-white">Escala Ordinária</TabsTrigger>
            <TabsTrigger value="adm-schedule" className="rounded-lg py-2.5 data-[state=active]:bg-[#79A3B1] data-[state=active]:text-white">Expediente</TabsTrigger>
            <TabsTrigger value="away" className="rounded-lg py-2.5 data-[state=active]:bg-[#79A3B1] data-[state=active]:text-white">Afastados</TabsTrigger>
            <TabsTrigger value="volunteers" className="rounded-lg py-2.5 data-[state=active]:bg-[#79A3B1] data-[state=active]:text-white">Agendamentos</TabsTrigger>
            <TabsTrigger value="users" className="rounded-lg py-2.5 data-[state=active]:bg-[#79A3B1] data-[state=active]:text-white">Efetivo</TabsTrigger>
            <TabsTrigger value="transferred" className="rounded-lg py-2.5 data-[state=active]:bg-[#79A3B1] data-[state=active]:text-white">Transferidos</TabsTrigger>
          </TabsList>

          {/* Tab 2: Escala Ordinária (Quadro de Escalas Integrado) */}
          <TabsContent value="battalion-schedule" className="animate-in fade-in duration-300">
            <Card className="border shadow-xl bg-white rounded-2xl print:shadow-none print:border-0">
              <CardHeader className="flex flex-col items-center text-center pb-6 border-b gap-4 print:border-b-0 relative">
                <div className="w-full text-center flex flex-col items-center">
                  <CardTitle className="text-[#79A3B1] print:text-black text-center w-full text-2xl font-bold tracking-wide" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    ESCALA ORDINÁRIA
                  </CardTitle>
                  <CardDescription className="text-center w-full text-base font-medium mt-1 text-gray-600">
                    {monthNames[currentMonth]} {currentYear}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 print:hidden">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      if (currentMonth === 0) {
                        setCurrentMonth(11);
                        setCurrentYear(prev => prev - 1);
                      } else {
                        setCurrentMonth(prev => prev - 1);
                      }
                    }}
                  >
                    Mês Anterior
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      if (currentMonth === 11) {
                        setCurrentMonth(0);
                        setCurrentYear(prev => prev + 1);
                      } else {
                        setCurrentMonth(prev => prev + 1);
                      }
                    }}
                  >
                    Próximo Mês
                  </Button>
                  <Button 
                    className="bg-[#ACC18A] text-gray-900 hover:bg-[#ACC18A]/80 border shadow-sm print:hidden ml-2" 
                    size="sm"
                    onClick={() => window.print()}
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    Imprimir Escala
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-8">
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                  const teams = ["Alfa", "Bravo", "Charlie", "Delta"];
                  const teamOnDuty = teams.find(team => isUserOnDutyMatrix(team, day));
                  if (!teamOnDuty) return null;
                  
                  const teamMembers = usersList
                    .filter(u => u.workTeam === teamOnDuty)
                    .sort((a, b) => {
                      const isPlantonistaA = a.jobFunction === 'Plantonista';
                      const isPlantonistaB = b.jobFunction === 'Plantonista';
                      
                      if (isPlantonistaA && !isPlantonistaB) return 1;
                      if (!isPlantonistaA && isPlantonistaB) return -1;
                      
                      const weightA = RANKS.indexOf(a.rank);
                      const weightB = RANKS.indexOf(b.rank);
                      if (weightA !== weightB) {
                        return weightB - weightA;
                      }
                      const orderA = a.sortOrder ?? 999;
                      const orderB = b.sortOrder ?? 999;
                      return orderA - orderB;
                    });
                  const dateStr = new Date(currentYear, currentMonth, day).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
                  
                  return (
                    <div key={day} className="border rounded-xl overflow-hidden shadow-sm bg-white print:shadow-none print:border print:break-after-page mb-4">
                      <div className="bg-[#79A3B1] text-white px-4 py-2 font-bold text-base text-center">
                        Equipe {teamOnDuty}
                      </div>
                      <div className="bg-[#79A3B1]/10 text-gray-800 px-4 py-2 font-medium text-sm border-b capitalize text-center">
                        {dateStr}
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-gray-50 text-gray-700 font-semibold border-b">
                            <tr>
                              <th className="px-6 py-3 w-12 text-gray-500">Nº</th>
                              <th className="px-6 py-3">Posto/Grad</th>
                              <th className="px-6 py-3">RG</th>
                              <th className="px-6 py-3">Nome Completo</th>
                              <th className="px-6 py-3">Função</th>
                              <th className="px-6 py-3 text-right print:hidden">Ações</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {teamMembers.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="px-6 py-4 text-center text-gray-400 text-xs">
                                  Nenhum militar alocado nesta equipe.
                                </td>
                              </tr>
                            ) : (
                              teamMembers.map((m, index) => (
                                <tr key={m.id} className="hover:bg-gray-50/50 transition-colors">
                                  <td className="px-6 py-3 font-medium text-gray-400">{index + 1}</td>
                                  <td className="px-6 py-3 font-semibold text-gray-900">{m.rank}</td>
                                  <td className="px-6 py-3 text-gray-600">{formatRG(m.rg)}</td>
                                  <td className="px-6 py-3 text-gray-900 font-medium">{m.fullName}</td>
                                  <td className="px-6 py-3 text-gray-600">{m.jobFunction || "—"}</td>
                                  <td className="px-6 py-3 text-right print:hidden">
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="hover:text-[#79A3B1] hover:bg-gray-100 text-xs"
                                      onClick={() => setEditingUser(m)}
                                    >
                                      <Edit3 className="h-3.5 w-3.5 mr-1" />
                                      Alterar
                                    </Button>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 3: Expediente */}
          <TabsContent value="adm-schedule" className="animate-in fade-in duration-300">
            <Card className="border shadow-xl bg-white rounded-2xl">
              <CardHeader className="flex flex-col items-center text-center pb-6 border-b gap-4 relative">
                <div className="w-full text-center flex flex-col items-center">
                  <CardTitle className="text-[#79A3B1] print:text-black text-center w-full text-2xl font-bold tracking-wide" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    EFETIVO ADMINISTRATIVO
                  </CardTitle>
                </div>
                <Button 
                  className="bg-[#ACC18A] text-gray-900 hover:bg-[#ACC18A]/80 border shadow-sm font-semibold print:hidden" 
                  size="sm"
                  onClick={() => window.print()}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Imprimir Expediente
                </Button>
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
              <div className="space-y-6 lg:col-span-1">
                {/* Card Valores AC-4 */}
                <Card className="border shadow-xl bg-white rounded-2xl">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-[#79A3B1] flex items-center gap-2 text-lg" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      <Calculator className="h-5 w-5 text-[#79A3B1]" />
                      Valores AC-4 (por Hora)
                    </CardTitle>
                    <CardDescription>Ajuste os coeficientes de hora extra.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold text-gray-500">Azul Diurno (R$)</Label>
                        <Input 
                          type="number" 
                          step="0.01"
                          value={ac4Rates.blueDay}
                          onChange={(e) => setAc4Rates({...ac4Rates, blueDay: parseFloat(e.target.value) || 0})}
                          className="focus-visible:ring-[#79A3B1]"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold text-gray-500">Azul Noturno (R$)</Label>
                        <Input 
                          type="number" 
                          step="0.01"
                          value={ac4Rates.blueNight}
                          onChange={(e) => setAc4Rates({...ac4Rates, blueNight: parseFloat(e.target.value) || 0})}
                          className="focus-visible:ring-[#79A3B1]"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold text-gray-500">Vermelho Diurno (R$)</Label>
                        <Input 
                          type="number" 
                          step="0.01"
                          value={ac4Rates.redDay}
                          onChange={(e) => setAc4Rates({...ac4Rates, redDay: parseFloat(e.target.value) || 0})}
                          className="focus-visible:ring-[#79A3B1]"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold text-gray-500">Vermelho Noturno (R$)</Label>
                        <Input 
                          type="number" 
                          step="0.01"
                          value={ac4Rates.redNight}
                          onChange={(e) => setAc4Rates({...ac4Rates, redNight: parseFloat(e.target.value) || 0})}
                          className="focus-visible:ring-[#79A3B1]"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border shadow-xl bg-white rounded-2xl">
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
                            onClick={() => {
                              toggleDay(day);
                              setSelectedFilterDay(prev => prev === day ? null : day);
                            }}
                            className={`py-2 text-xs font-medium rounded-md border transition-all ${
                              selectedDays.includes(day) 
                                ? 'bg-[#79A3B1] text-white border-[#79A3B1] shadow-sm font-bold' 
                                : selectedFilterDay === day
                                  ? 'bg-[#79A3B1]/20 text-[#79A3B1] border-[#79A3B1] font-bold shadow-sm'
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
            </div>

              <Card className="border shadow-xl bg-white rounded-2xl lg:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between pb-6 border-b">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-[#79A3B1]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Escalas SER Criadas</CardTitle>
                      {selectedFilterDay !== null && (
                        <button 
                          type="button"
                          onClick={() => setSelectedFilterDay(null)}
                          className="text-xs bg-[#79A3B1]/20 text-[#79A3B1] px-2 py-1 rounded-md font-semibold hover:bg-[#79A3B1]/30 transition-colors flex items-center gap-1"
                        >
                          <span>Filtrando Dia {selectedFilterDay}</span>
                          <span className="font-bold leading-none">&times;</span>
                        </button>
                      )}
                    </div>
                    <CardDescription>Clique em "Gerenciar" para controlar vagas e policiais.</CardDescription>
                  </div>
                  <Button 
                    className="bg-[#ACC18A] text-gray-900 hover:bg-[#ACC18A]/80 border shadow-sm print:hidden" 
                    size="sm"
                    onClick={() => window.print()}
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    Imprimir Escalas
                  </Button>
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
                            <th className="px-6 py-4">Voluntários</th>
                            <th className="px-6 py-4 text-right print:hidden">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {[...schedulesList]
                            .filter(s => {
                              if (selectedFilterDay === null) return true;
                              const sDate = new Date(s.startTime);
                              return sDate.getDate() === selectedFilterDay && 
                                     sDate.getMonth() === currentMonth && 
                                     sDate.getFullYear() === currentYear;
                            })
                            .sort((a,b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                            .map((s) => (
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
                              <td className="px-6 py-4 text-xs text-gray-600">
                                {s.userIds && s.userIds.length > 0 ? (
                                  (() => {
                                    const users = s.userIds
                                      .map((uid: string) => usersList.find(usr => usr.id === uid))
                                      .filter(Boolean)
                                      .sort((a: any, b: any) => RANKS.indexOf(b.rank) - RANKS.indexOf(a.rank));
                                    
                                    return users.map((u: any, idx: number) => (
                                      <div key={idx} className="py-0.5 font-medium text-gray-800">
                                        {u.rank} {u.nickname}
                                      </div>
                                    ));
                                  })()
                                ) : (
                                  <span className="text-gray-400 italic">Nenhum</span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-right flex items-center justify-end gap-1 print:hidden">
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
                            {editingSchedule.userIds.map((uid: string, index: number) => {
                              const user = usersList.find(u => u.id === uid);
                              return (
                                <li key={uid} className="flex items-center justify-between bg-white p-2.5 rounded-lg shadow-sm border text-xs">
                                  <span className="font-semibold text-gray-800">
                                    {index + 1}. {user ? `${user.rank} ${user.nickname}` : "Carregando..."}
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

          {/* Tab 5.5: Cálculo AC-4 */}
          <TabsContent value="ac4" className="animate-in fade-in duration-300">
            <Card className="border shadow-xl bg-white rounded-2xl">
              <CardHeader className="flex flex-col items-center text-center pb-6 border-b gap-4 relative">
                <div className="w-full text-center flex flex-col items-center">
                  <CardTitle className="text-[#79A3B1] text-center w-full text-2xl font-bold tracking-wide" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    CÁLCULO DE AC-4
                  </CardTitle>
                  <CardDescription className="text-center w-full text-sm text-gray-600 mt-1">
                    Resumo financeiro mensal estimado para o serviço extraordinário.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-700 font-medium border-b">
                      <tr>
                        <th className="px-6 py-4">Militar</th>
                        <th className="px-6 py-4">Horas Azul (D/N)</th>
                        <th className="px-6 py-4">Horas Vermelha (D/N)</th>
                        <th className="px-6 py-4">Total Horas</th>
                        <th className="px-6 py-4 text-right">Valor Previsto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {usersList.filter(u => u.workTeam !== 'Transferido').map((u) => {
                        const ac4 = calculateAc4ForUser(u.id);
                        if (ac4.totalHours === 0) return null;

                        return (
                          <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-semibold text-gray-900">
                                {u.rank} {u.nickname}
                              </div>
                              <div className="text-xs text-gray-500">RG: {formatRG(u.rg)}</div>
                            </td>
                            <td className="px-6 py-4 text-gray-600">
                              {ac4.blueDayHours}h / {ac4.blueNightHours}h
                            </td>
                            <td className="px-6 py-4 text-gray-600">
                              {ac4.redDayHours}h / {ac4.redNightHours}h
                            </td>
                            <td className="px-6 py-4 font-medium text-gray-900">
                              {ac4.totalHours}h
                            </td>
                            <td className="px-6 py-4 text-right font-bold text-green-600 text-base">
                              {ac4.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 6: Efetivo */}
          <TabsContent value="users" className="animate-in fade-in duration-300">
            <Card className="border shadow-xl bg-white rounded-2xl">
              <CardHeader className="flex flex-col items-center text-center pb-6 border-b gap-4 relative">
                <div className="w-full text-center flex flex-col items-center">
                  <CardTitle className="text-[#79A3B1] print:text-black text-center w-full text-2xl font-bold tracking-wide" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    EFETIVO
                  </CardTitle>
                  <CardDescription className="text-center w-full text-sm text-gray-600 mt-1">
                    Gerencie funções, graduações e equipes dos policiais.
                  </CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full print:hidden">
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input 
                      placeholder="Buscar por Nome ou CPF..." 
                      className="pl-9 focus-visible:ring-[#79A3B1]" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button 
                    className="bg-[#ACC18A] text-gray-900 hover:bg-[#ACC18A]/80 font-semibold whitespace-nowrap" 
                    onClick={() => setIsCreatingUser(true)}
                  >
                    <Plus className="h-4 w-4 mr-1.5" /> Cadastrar Militar
                  </Button>
                  <Button 
                    className="bg-[#79A3B1] text-white hover:bg-[#79A3B1]/90 border shadow-sm font-semibold" 
                    onClick={() => window.print()}
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    Imprimir Efetivo
                  </Button>
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
                          <th className="px-6 py-4 w-12 text-gray-500">Nº</th>
                          <th className="px-6 py-4">Militar</th>
                          <th className="px-6 py-4">RG</th>
                          <th className="px-6 py-4">Função</th>
                          <th className="px-6 py-4">Equipe</th>
                          <th className="px-6 py-4 text-right print:hidden">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {filteredUsers.map((u, index) => (
                          <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4 font-medium text-gray-400">{index + 1}</td>
                            <td className="px-6 py-4">
                              <div className="font-semibold text-gray-900 flex items-center gap-2">
                                <span>{u.rank} {u.nickname}</span>
                              </div>
                              <div className="text-xs text-gray-500">{u.fullName}</div>
                            </td>
                            <td className="px-6 py-4 text-gray-600">{formatRG(u.rg)}</td>
                            <td className="px-6 py-4 text-gray-600">{u.jobFunction || "—"}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded-md text-xs font-semibold ${u.workTeam === 'ADM' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                                {u.workTeam || "—"}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right print:hidden">
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



            {isCreatingUser && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
                <Card className="w-full max-w-4xl border shadow-2xl bg-white rounded-2xl relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                  <button 
                    onClick={() => setIsCreatingUser(false)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-[#79A3B1] flex items-center gap-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      <span>Cadastrar Novo Militar</span>
                    </CardTitle>
                    <CardDescription>Insira os dados básicos. O e-mail temporário será gerado e poderá ser complementado depois.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-6">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-gray-600">Nome Completo *</Label>
                      <Input 
                        type="text" 
                        className="p-2.5 border rounded-lg text-sm focus-visible:ring-[#79A3B1]" 
                        value={newUserForm.fullName} 
                        onChange={(e) => setNewUserForm({...newUserForm, fullName: e.target.value})} 
                        placeholder="Nome Completo"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-gray-600">Nome de Guerra *</Label>
                      <Input 
                        type="text" 
                        className="p-2.5 border rounded-lg text-sm focus-visible:ring-[#79A3B1]" 
                        value={newUserForm.nickname} 
                        onChange={(e) => setNewUserForm({...newUserForm, nickname: e.target.value})} 
                        placeholder="Ex: Lyedher"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-gray-600">CPF (Apenas números) *</Label>
                      <Input 
                        type="text" 
                        className="p-2.5 border rounded-lg text-sm focus-visible:ring-[#79A3B1]" 
                        value={newUserForm.taxId} 
                        onChange={(e) => setNewUserForm({...newUserForm, taxId: maskCPF(e.target.value)})} 
                        placeholder="Ex: 123.456.789-00"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-gray-600">RG</Label>
                      <Input 
                        type="text" 
                        className="p-2.5 border rounded-lg text-sm focus-visible:ring-[#79A3B1]" 
                        value={newUserForm.rg} 
                        onChange={(e) => setNewUserForm({...newUserForm, rg: maskRG(e.target.value)})} 
                        placeholder="Ex: 12.345"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-gray-600">Telefone / Celular</Label>
                      <Input 
                        type="text" 
                        className="p-2.5 border rounded-lg text-sm focus-visible:ring-[#79A3B1]" 
                        value={newUserForm.phone} 
                        onChange={(e) => setNewUserForm({...newUserForm, phone: maskPhone(e.target.value)})} 
                        placeholder="Ex: (61) 99999-9999"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-gray-600">Graduação</Label>
                      <select 
                        className="w-full p-2.5 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#79A3B1] focus:border-[#79A3B1] outline-none transition-all" 
                        value={newUserForm.rank} 
                        onChange={(e) => setNewUserForm({...newUserForm, rank: e.target.value})}
                      >
                        {RANKS.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-gray-600">Função</Label>
                      <select 
                        className="w-full p-2.5 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#79A3B1] focus:border-[#79A3B1] outline-none transition-all" 
                        value={newUserForm.jobFunction} 
                        onChange={(e) => setNewUserForm({...newUserForm, jobFunction: e.target.value})}
                      >
                        {FUNCTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-gray-600">Equipe</Label>
                      <select 
                        className="w-full p-2.5 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#79A3B1] focus:border-[#79A3B1] outline-none transition-all" 
                        value={newUserForm.workTeam} 
                        onChange={(e) => setNewUserForm({...newUserForm, workTeam: e.target.value})}
                      >
                        {TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-gray-600">Desempate (Ordem de Antiguidade)</Label>
                      <Input 
                        type="number" 
                        className="w-full p-2.5 border rounded-lg text-sm focus-visible:ring-[#79A3B1]" 
                        value={newUserForm.sortOrder} 
                        onChange={(e) => setNewUserForm({...newUserForm, sortOrder: parseInt(e.target.value) || 999})}
                      />
                    </div>

                    <div className="sm:col-span-3 flex justify-end gap-3 pt-4 border-t mt-2">
                      <Button variant="ghost" size="sm" className="hover:bg-gray-100 text-gray-600" onClick={() => setIsCreatingUser(false)}>
                        Cancelar
                      </Button>
                      <Button size="sm" className="bg-[#ACC18A] text-gray-900 hover:bg-[#ACC18A]/80 font-semibold" onClick={handleAddUserSubmit}>
                        <Check className="h-4 w-4 mr-1.5" /> Cadastrar Policial
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="away" className="animate-in fade-in duration-300">
            <Card className="border shadow-xl bg-white rounded-2xl">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b gap-4">
                <div>
                  <CardTitle className="text-[#79A3B1]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Militares Afastados</CardTitle>
                  <CardDescription>Militares atualmente afastados das atividades de serviço.</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {awayUsers.length === 0 ? (
                  <div className="h-60 flex items-center justify-center text-gray-400 text-sm">
                    Nenhum militar afastado encontrado.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 text-gray-700 font-medium border-b">
                        <tr>
                          <th className="px-6 py-4">Militar</th>
                          <th className="px-6 py-4">RG</th>
                          <th className="px-6 py-4">Função</th>
                          <th className="px-6 py-4">Equipe</th>
                          <th className="px-6 py-4 text-right print:hidden">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {awayUsers.map((u) => (
                          <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-semibold text-gray-900">
                                {u.rank} {u.nickname}
                              </div>
                              <div className="text-xs text-gray-500">{u.fullName}</div>
                            </td>
                            <td className="px-6 py-4 text-gray-600">{formatRG(u.rg)}</td>
                            <td className="px-6 py-4 text-gray-600">{u.jobFunction || "—"}</td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-1 rounded-md text-xs font-semibold bg-red-100 text-red-800">
                                {u.workTeam}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right print:hidden">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="hover:text-[#79A3B1] hover:bg-gray-100"
                                onClick={() => setEditingUser(u)}
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
          </TabsContent>
          <TabsContent value="volunteers"><Card className="border shadow-xl bg-white rounded-2xl"><CardContent className="h-[300px] flex items-center justify-center text-gray-400 text-sm">Módulo de voluntários em breve.</CardContent></Card></TabsContent>

          <TabsContent value="transferred" className="animate-in fade-in duration-300">
            <Card className="border shadow-xl bg-white rounded-2xl">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b gap-4">
                <div>
                  <CardTitle className="text-[#79A3B1]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Militares Transferidos</CardTitle>
                  <CardDescription>Militares que foram transferidos da unidade, mas que podem retornar.</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {transferredUsers.length === 0 ? (
                  <div className="h-60 flex items-center justify-center text-gray-400 text-sm">
                    Nenhum militar transferido encontrado.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 text-gray-700 font-medium border-b">
                        <tr>
                          <th className="px-6 py-4">Militar</th>
                          <th className="px-6 py-4">RG</th>
                          <th className="px-6 py-4">Função</th>
                          <th className="px-6 py-4">Equipe</th>
                          <th className="px-6 py-4 text-right print:hidden">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {transferredUsers.map((u) => (
                          <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-semibold text-gray-900">
                                {u.rank} {u.nickname}
                              </div>
                              <div className="text-xs text-gray-500">{u.fullName}</div>
                            </td>
                            <td className="px-6 py-4 text-gray-600">{formatRG(u.rg)}</td>
                            <td className="px-6 py-4 text-gray-600">—</td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-800">
                                {u.workTeam}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right print:hidden">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="hover:text-[#79A3B1] hover:bg-gray-100"
                                onClick={() => setEditingUser(u)}
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
          </TabsContent>

        </Tabs>

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
                    onChange={(e) => setEditingUser({...editingUser, taxId: maskCPF(e.target.value)})} 
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-gray-600">RG</Label>
                  <Input 
                    type="text" 
                    className="p-2.5 border rounded-lg text-sm focus-visible:ring-[#79A3B1]" 
                    value={editingUser.rg || ""} 
                    onChange={(e) => setEditingUser({...editingUser, rg: maskRG(e.target.value)})} 
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-gray-600">Telefone / Celular</Label>
                  <Input 
                    type="text" 
                    className="p-2.5 border rounded-lg text-sm focus-visible:ring-[#79A3B1]" 
                    value={editingUser.phone || ""} 
                    onChange={(e) => setEditingUser({...editingUser, phone: maskPhone(e.target.value)})} 
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
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-gray-600">Permissão (Role)</Label>
                  <select 
                    className="w-full p-2.5 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#79A3B1] focus:border-[#79A3B1] outline-none transition-all" 
                    value={editingUser.role || 'user'} 
                    onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
                  >
                    <option value="user">Usuário Padrão</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>

                <div className="sm:col-span-3 flex justify-end gap-3 pt-4 border-t mt-2">
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

      </main>
    </div>
  );
}
