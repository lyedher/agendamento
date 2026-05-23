"use client";
// Version: 1.0.2 - Reset Cache
import React from "react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Users, LogOut, Printer, ShieldAlert, FileText, AlertCircle, Search, Edit3, Check, Trash2, Plus, CalendarDays, X, UserPlus, Shield, Calculator, UserCheck, TrendingUp, ShieldCheck, UsersRound, AlertTriangle, Settings, Clock, Lock, Instagram, MessageCircle, ClipboardList } from "lucide-react";
import { getUsers, updateUser, getSchedules, createSchedule, deleteSchedule, updateSchedule, adminAddUser, getSettings, updateSettings, getCurrentUser, getUnits, deleteUser, promoteUserToAdmin, logout } from "@/lib/actions";
import { calculateSingleScheduleValue, calculateUserAc4Summary } from "@/lib/utils/calculations";

import { maskRG, maskCPF, maskPhone, formatRG } from "@/lib/utils/masks";

const RANKS = ["Soldado", "Cabo", "3º Sargento", "2º Sargento", "1º Sargento", "Subtenente", "Aspirante", "2º Tenente", "1º Tenente", "Capitão", "Major", "Tenente-Coronel", "Coronel"];
const FUNCTIONS = [
  "Comandante de Unidade",
  "Subcomandante de Unidade",
  "CPU",
  "Chefe de Seção",
  "Auxiliar de Seção",
  "Comandante de VTR",
  "Motorista de VTR",
  "Plantonista / Sentinela",
  "ARI",
  "ALI",
  "Apoio Administrativo"
];
const TEAMS = ["Alpha", "Bravo", "Charlie", "Delta", "ADM", "Afastado", "Transferido"];
const SERVICE_TYPES = ["OPER", "ADM", "ALI", "ARI", "APOIO"];
const ABSENCE_REASONS = [
  "Férias",
  "Lic. Especial",
  "Rest. Administrativa",
  "Atestado",
  "Outros Cursos",
  "CAS",
  "JCS",
  "CPT",
  "COA",
  "Recompensa",
  "COD",
  "Lic. Paternidade",
  "Rest. Judicial",
  "Lic. Inter Partc"
];

function AdminDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const unitId = searchParams.get("unit") || undefined;

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
    email: "",
    password: "",
    jobFunction: "Plantonista",
    serviceType: "OPER",
    workTeam: "Alpha",
    birthDate: "",
    absenceReason: "",
    phone: "",
    sortOrder: 999,
    unitId: ""
  });
  const [availableUnits, setAvailableUnits] = useState<any[]>([]);

  const handleAddUserSubmit = async () => {
    if (!newUserForm.fullName || !newUserForm.nickname || !newUserForm.taxId || !newUserForm.password) {
      alert("Preencha os campos obrigatórios: Nome Completo, Nome de Guerra, CPF e Senha Inicial!");
      return;
    }

    setIsLoading(true);
    const res = await adminAddUser({ ...newUserForm, unitId: newUserForm.unitId || unitId });

    if (res.success) {
      setIsCreatingUser(false);
      setNewUserForm({
        rank: "Soldado",
        fullName: "",
        nickname: "",
        taxId: "",
        rg: "",
        email: "",
        password: "",
        jobFunction: "Plantonista",
        serviceType: "OPER",
        workTeam: "Alpha",
        birthDate: "",
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
  const [maxMonthlySlots, setMaxMonthlySlots] = useState(10);
  const [schedulingWindow, setSchedulingWindow] = useState({
    inviteCode: ""
  });
  const [dutyBaseline, setDutyBaseline] = useState("2026-05-01");

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
    endTime: "",
    capacity: 1
  });
  const [selectedVolunteerId, setSelectedVolunteerId] = useState("");
  const [selectedVolunteerSummary, setSelectedVolunteerSummary] = useState<any | null>(null);

  // Calendar selection states
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  // Month for creating new schedules
  const [creationMonth, setCreationMonth] = useState(new Date().getMonth());
  const [creationYear, setCreationYear] = useState(new Date().getFullYear());

  const [selectedDays, setSelectedDays] = useState<number[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [uRes, sRes, setRes, unitsRes] = await Promise.all([
      getUsers(unitId),
      getSchedules(unitId),
      getSettings(unitId),
      getUnits()
    ]);

    if (uRes.success) setUsersList(uRes.users);
    if (sRes.success) setSchedulesList(sRes.schedules);
    if (unitsRes.success) setAvailableUnits(unitsRes.units);
    if (setRes.success && setRes.settings) {
      setAc4Rates(setRes.settings.ac4Rates);
      setMaxMonthlySlots(setRes.settings.maxMonthlySlots);

      const toLocalISO = (utcStr: string) => {
        if (!utcStr) return "";
        const d = new Date(utcStr);
        if (isNaN(d.getTime())) return "";
        const tzOffset = d.getTimezoneOffset() * 60000;
        const localDate = new Date(d.getTime() - tzOffset);
        return localDate.toISOString().slice(0, 16);
      };

      setSchedulingWindow({
        openDateTime: toLocalISO(setRes.settings.openDateTime),
        closeDateTime: toLocalISO(setRes.settings.closeDateTime),
        inviteCode: setRes.settings.inviteCode || ""
      });
      setDutyBaseline(setRes.settings.dutyBaseline || "2026-05-01");
    }
    setIsLoading(false);
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    const res = await updateSettings({
      ac4Rates,
      maxMonthlySlots,
      openDateTime: schedulingWindow.openDateTime ? new Date(schedulingWindow.openDateTime).toISOString() : "",
      closeDateTime: schedulingWindow.closeDateTime ? new Date(schedulingWindow.closeDateTime).toISOString() : "",
      inviteCode: schedulingWindow.inviteCode,
      dutyBaseline
    }, unitId);

    if (res.success) {
      alert("Configurações salvas com sucesso!");
      await loadData();
    } else {
      alert("Erro ao salvar: " + res.message);
    }
    setIsLoading(false);
  };

  const filteredUsers = usersList
    .filter(u => (unitId ? u.unitId === unitId : true) && u.workTeam !== 'Transferido' && u.workTeam !== 'Afastado' && (
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
    .filter(u => (unitId ? u.unitId === unitId : true) && u.workTeam === 'Afastado' && (
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
    .filter(u => (unitId ? u.unitId === unitId : true) && u.workTeam === 'Transferido' && (
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

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  // User Handlers
  const handleSaveUser = async () => {
    if (!editingUser) return;
    const updateData: any = {
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
      unitId: editingUser.unitId,
      serviceType: editingUser.serviceType,
      birthDate: editingUser.birthDate,
      absenceReason: editingUser.workTeam === 'Afastado' ? editingUser.absenceReason : "",
    };

    if (editingUser.password && editingUser.password.trim() !== "") {
      updateData.passwordHash = editingUser.password;
    }

    const res = await updateUser(editingUser.id, updateData);

    if (res.success) {
      setEditingUser(null);
      loadData();
    }
  };

  const handleDeleteUser = async (uid: string) => {
    if (!confirm("Tem certeza que deseja EXCLUIR permanentemente este militar do sistema? Esta ação não pode ser desfeita.")) {
      return;
    }

    setIsLoading(true);
    const res = await deleteUser(uid);
    if (res.success) {
      loadData();
    } else {
      alert(res.message);
      setIsLoading(false);
    }
  };

  const handlePromoteUser = async (uid: string) => {
    if (!confirm("Tem certeza que deseja promover este militar a ADMINISTRADOR? Ele terá controle total sobre as escalas e efetivo desta unidade.")) {
      return;
    }

    setIsLoading(true);
    const res = await promoteUserToAdmin(uid);
    if (res.success) {
      alert("Militar promovido com sucesso!");
      loadData();
    } else {
      alert(res.message);
      setIsLoading(false);
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

        const start = new Date(creationYear, creationMonth, day, parseInt(startParts[0]), parseInt(startParts[1]));
        const end = new Date(creationYear, creationMonth, day, parseInt(endParts[0]), parseInt(endParts[1]));

        if (end <= start) {
          end.setDate(end.getDate() + 1);
        }

        await createSchedule({
          scheduleName: newScheduleData.scheduleName,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          capacity: newScheduleData.capacity
        }, unitId);
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
      endTime: `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`,
      capacity: s.capacity || 1
    });
    setSelectedVolunteerId("");
  };

  const handleUpdateScheduleHours = async () => {
    if (!editingSchedule) return;

    const baseStart = new Date(editingSchedule.startTime);
    const baseEnd = new Date(editingSchedule.startTime); // Reset baseEnd to baseStart's date

    const startParts = editScheduleHours.startTime.split(":");
    const endParts = editScheduleHours.endTime.split(":");

    baseStart.setHours(parseInt(startParts[0]), parseInt(startParts[1]));
    baseEnd.setHours(parseInt(endParts[0]), parseInt(endParts[1]));

    if (baseEnd <= baseStart) {
      baseEnd.setDate(baseEnd.getDate() + 1);
    }

    const res = await updateSchedule(editingSchedule.id, {
      startTime: baseStart.toISOString(),
      endTime: baseEnd.toISOString(),
      capacity: editScheduleHours.capacity
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
    const baseline = new Date(dutyBaseline + 'T08:00:00');
    const diffTime = target.getTime() - baseline.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return false;
    const remainder = ((diffDays % 4) + 4) % 4;

    const teamOffsets: Record<string, number> = { "Alpha": 0, "Bravo": 1, "Charlie": 2, "Delta": 3 };
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
    return calculateUserAc4Summary(userId, schedulesList, ac4Rates, currentMonth, currentYear);
  };

  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const checkUser = async () => {
      const res = await getCurrentUser();
      if (res.success) setCurrentUser(res.user);
    };
    checkUser();
  }, []);

  const adminUser = currentUser;
  const currentAdmin = adminUser || { nickname: "Administrador", rg: "00.000", rank: "SGT", avatar: null, role: 'admin' };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F0F4F5]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#79A3B1]"></div>
      </div>
    );
  }

  const unitName = availableUnits.find(u => u.id === unitId)?.name || "Painel Administrativo";

  return <section className="min-h-screen flex flex-col bg-[#F0F4F5]">
      <header className="bg-[#79A3B1] border-b shadow-md sticky top-0 z-50 text-white print:hidden">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between relative">
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
            <ShieldAlert className="h-5 w-5" />
            <span className="text-lg font-bold tracking-tight whitespace-nowrap">
              {unitName}
            </span>
          </div>
          <div />
          <div className="relative">
            <div
              className="flex items-center gap-3 cursor-pointer hover:bg-white/10 p-1 px-2 rounded-xl transition-all"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            >
              <div className="flex flex-col text-right text-xs text-white/90 leading-tight hidden sm:flex">
                <span className="font-bold text-sm text-white">{currentAdmin.rank} {currentAdmin.nickname}</span>
                <span>RG: {formatRG(currentAdmin.rg)}</span>
              </div>

              {currentAdmin.photo ? (
                <img src={currentAdmin.photo} alt="Foto" className="h-9 w-9 rounded-full object-cover border border-white/40 shadow-sm" />
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

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="battalion-schedule" className="w-full" onValueChange={setActiveTab} value={activeTab}>
          <TabsList className="flex flex-wrap w-full h-auto bg-white/50 backdrop-blur-md shadow-lg p-1.5 rounded-2xl mb-8 print:hidden border border-white/20 gap-1">
            <TabsTrigger value="battalion-schedule" className="flex-1 min-w-[110px] rounded-xl py-3 data-[state=active]:bg-[#79A3B1] data-[state=active]:text-white transition-all flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-wider">
              <Shield className="h-4 w-4" /> Ordinária
            </TabsTrigger>
            <TabsTrigger value="adm-schedule" className="flex-1 min-w-[110px] rounded-xl py-3 data-[state=active]:bg-[#79A3B1] data-[state=active]:text-white transition-all flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-wider">
              <FileText className="h-4 w-4" /> Expediente
            </TabsTrigger>
            <TabsTrigger value="schedules" className="flex-1 min-w-[110px] rounded-xl py-3 data-[state=active]:bg-[#79A3B1] data-[state=active]:text-white transition-all flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-wider">
              <CalendarDays className="h-4 w-4" /> Escalas SER
            </TabsTrigger>

            <TabsTrigger value="volunteers" className="flex-1 min-w-[110px] rounded-xl py-3 data-[state=active]:bg-[#79A3B1] data-[state=active]:text-white transition-all flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-wider">
              <TrendingUp className="h-4 w-4" /> Resumo
            </TabsTrigger>
            <TabsTrigger value="users" className="flex-1 min-w-[110px] rounded-xl py-3 data-[state=active]:bg-[#79A3B1] data-[state=active]:text-white transition-all flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-wider">
              <Users className="h-4 w-4" /> Efetivo
            </TabsTrigger>
            <TabsTrigger value="away" className="flex-1 min-w-[110px] rounded-xl py-3 data-[state=active]:bg-[#79A3B1] data-[state=active]:text-white transition-all flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-wider">
              <ShieldAlert className="h-4 w-4" /> Afastados
            </TabsTrigger>
            <TabsTrigger value="transferred" className="flex-1 min-w-[110px] rounded-xl py-3 data-[state=active]:bg-[#79A3B1] data-[state=active]:text-white transition-all flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-wider">
              <LogOut className="h-4 w-4" /> Inativos
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex-1 min-w-[110px] rounded-xl py-3 data-[state=active]:bg-orange-500 data-[state=active]:text-white transition-all flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-wider border-2 border-orange-200/30">
              <Settings className="h-4 w-4" /> Ajustes
            </TabsTrigger>
          </TabsList>

          {/* Tab 2: Escala Ordinária (Quadro de Escalas Integrado) */}
          <TabsContent value="battalion-schedule" className="animate-in fade-in duration-300 space-y-6">
            <Card className="border-0 shadow-xl bg-white rounded-2xl overflow-hidden print:shadow-none print:border-0">
              <CardHeader className="bg-gray-50/50 border-b p-6 print:border-b-0">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="space-y-1">
                    <CardTitle className="text-[#79A3B1] text-2xl font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      ESCALA ORDINÁRIA
                    </CardTitle>
                    <CardDescription className="text-gray-500 font-medium">
                      {new Date(currentYear, currentMonth).toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 print:hidden bg-white p-1 rounded-xl shadow-sm border border-gray-100">
                    <Button
                      variant="ghost" size="sm" className="h-9 px-4 hover:bg-[#79A3B1]/10 text-[#79A3B1] font-bold text-xs uppercase tracking-wider"
                      onClick={() => {
                        if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(prev => prev - 1); }
                        else { setCurrentMonth(prev => prev - 1); }
                      }}
                    >
                      Anterior
                    </Button>
                    <div className="w-px h-4 bg-gray-200 mx-1" />
                    <Button
                      variant="ghost" size="sm" className="h-9 px-4 hover:bg-[#79A3B1]/10 text-[#79A3B1] font-bold text-xs uppercase tracking-wider"
                      onClick={() => {
                        if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(prev => prev + 1); }
                        else { setCurrentMonth(prev => prev + 1); }
                      }}
                    >
                      Próximo
                    </Button>
                  </div>
                  <Button
                    className="bg-[#ACC18A] text-gray-900 hover:bg-[#8da36d] shadow-lg shadow-[#ACC18A]/20 font-bold uppercase tracking-widest text-xs h-10 print:hidden"
                    onClick={() => window.print()}
                  >
                    <Printer className="mr-2 h-4 w-4" /> Imprimir
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-8">
                <div className="grid grid-cols-1 gap-8">
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                    const teams = ["Alpha", "Bravo", "Charlie", "Delta"];
                    const teamOnDuty = teams.find(team => isUserOnDutyMatrix(team, day));
                    if (!teamOnDuty) return null;

                    const date = new Date(currentYear, currentMonth, day);
                    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                    const dateStr = date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

                    const teamMembers = usersList
                      .filter(u => u.workTeam === teamOnDuty)
                      .sort((a, b) => {
                        const isPlantonistaA = a.jobFunction === 'Plantonista';
                        const isPlantonistaB = b.jobFunction === 'Plantonista';
                        if (isPlantonistaA && !isPlantonistaB) return 1;
                        if (!isPlantonistaA && isPlantonistaB) return -1;
                        const weightA = RANKS.indexOf(a.rank);
                        const weightB = RANKS.indexOf(b.rank);
                        if (weightA !== weightB) return weightB - weightA;
                        return (a.sortOrder ?? 999) - (b.sortOrder ?? 999);
                      });

                    return (
                      <div key={day} className={`group border-0 shadow-md rounded-2xl overflow-hidden bg-white print:break-inside-avoid print:mb-8 transition-all hover:shadow-lg ${isWeekend ? 'ring-1 ring-red-100' : ''}`}>
                        <div className={`px-6 py-4 flex items-center justify-between ${isWeekend ? 'bg-red-50/50' : 'bg-[#79A3B1]/5'}`}>
                          <div className="flex items-center gap-4">
                            <div className={`h-12 w-12 rounded-2xl flex flex-col items-center justify-center shadow-sm ${isWeekend ? 'bg-red-500 text-white' : 'bg-[#79A3B1] text-white'}`}>
                              <span className="text-[10px] font-black uppercase leading-none mb-0.5 opacity-80">{date.toLocaleDateString('pt-BR', { weekday: 'short' })}</span>
                              <span className="text-xl font-black leading-none">{day}</span>
                            </div>
                            <div>
                              <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">{dateStr}</h3>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest ${isWeekend ? 'bg-red-100 text-red-700' : 'bg-[#79A3B1]/20 text-[#79A3B1]'}`}>
                                  Equipe {teamOnDuty}
                                </span>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                  {teamMembers.length} MILITARES
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-y">
                              <tr>
                                <th className="px-6 py-3 w-16">Nº</th>
                                <th className="px-6 py-3">Militar</th>
                                <th className="px-6 py-3">RG / CPF</th>
                                <th className="px-6 py-3">Função / Equipe</th>
                                <th className="px-6 py-3 text-right print:hidden">Gestão</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {teamMembers.length === 0 ? (
                                <tr>
                                  <td colSpan={5} className="px-6 py-10 text-center text-gray-400 italic text-sm">
                                    Nenhum militar alocado nesta equipe.
                                  </td>
                                </tr>
                              ) : (
                                teamMembers.map((m, index) => (
                                  <tr key={m.id} className="hover:bg-gray-50/30 transition-colors">
                                    <td className="px-6 py-4 font-black text-gray-300 text-xs">{index + 1}</td>
                                    <td className="px-6 py-4">
                                      <div className="flex flex-col">
                                        <span className="text-sm font-black text-gray-900">{m.rank} {m.nickname}</span>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4">
                                      <div className="flex flex-col">
                                        <span className="text-xs font-bold text-gray-700">RG: {formatRG(m.rg)}</span>
                                        <span className="text-[10px] text-gray-400 font-medium">CPF: {m.taxId}</span>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4">
                                      <div className="flex flex-wrap gap-1.5">
                                        <span className="text-[10px] font-black bg-white border border-gray-200 px-2 py-0.5 rounded shadow-sm text-gray-600 uppercase">
                                          {m.jobFunction || "Plantonista"}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 text-right print:hidden">
                                      <Button
                                        variant="ghost" size="sm"
                                        className="h-8 text-[#79A3B1] hover:bg-[#79A3B1]/10 font-bold text-[10px] uppercase tracking-wider"
                                        onClick={() => setEditingUser(m)}
                                      >
                                        <Edit3 className="h-3.5 w-3.5 mr-1" /> Editar
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
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 3: Expediente */}
          <TabsContent value="adm-schedule" className="animate-in fade-in duration-300 space-y-6">
            <Card className="border-0 shadow-xl bg-white rounded-2xl overflow-hidden">
              <CardHeader className="bg-[#79A3B1]/5 border-b p-6 flex flex-row items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-[#79A3B1] text-2xl font-black uppercase tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    EFETIVO ADMINISTRATIVO
                  </CardTitle>
                  <CardDescription className="text-gray-500 font-medium">Pessoal alocado no expediente interno.</CardDescription>
                </div>
                <Button
                  className="bg-[#ACC18A] text-gray-900 hover:bg-[#8da36d] shadow-lg shadow-[#ACC18A]/20 font-bold uppercase tracking-widest text-xs h-10 print:hidden"
                  onClick={() => window.print()}
                >
                  <Printer className="mr-2 h-4 w-4" /> Imprimir
                </Button>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {usersList.filter(u => u.workTeam === 'ADM').map(m => (
                    <div key={m.id} className="group bg-white border border-gray-100 p-4 rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100 group-hover:bg-[#79A3B1]/10 transition-colors">
                        <Users className="h-6 w-6 text-[#79A3B1]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-gray-900 truncate">{m.rank} {m.nickname}</span>
                        </div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">{m.fullName}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px] font-black bg-[#79A3B1]/10 text-[#79A3B1] px-2 py-0.5 rounded-full uppercase tracking-tighter">
                            {m.jobFunction || "Expediente"}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost" size="icon" className="h-8 w-8 text-gray-300 hover:text-[#79A3B1] print:hidden"
                        onClick={() => setEditingUser(m)}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                {usersList.filter(u => u.workTeam === 'ADM').length === 0 && (
                  <div className="py-20 flex flex-col items-center justify-center text-gray-400 gap-4">
                    <Users className="h-12 w-12 opacity-10" />
                    <p className="text-sm font-medium">Nenhum militar na equipe ADM.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 1: Escalas SER */}
          <TabsContent value="schedules" className="animate-in fade-in duration-300 space-y-6">
            {/* KPI Cards for Admin */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {(() => {
                const monthSchedules = schedulesList.filter(s => {
                  const d = new Date(s.startTime);
                  return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
                });
                const totalVacancies = monthSchedules.reduce((acc, s) => acc + (s.capacity || 0), 0);
                const totalVolunteers = monthSchedules.reduce((acc, s) => acc + (s.userIds?.length || 0), 0);

                const totalCost = monthSchedules.reduce((acc, s) => {
                  const scheduleValue = calculateSingleScheduleValue(s, ac4Rates);
                  return acc + (scheduleValue * (s.userIds?.length || 0));
                }, 0);

                return (
                  <>
                    <Card className="border-0 shadow-md bg-white overflow-hidden group">
                      <div className="h-1 w-full bg-[#79A3B1]" />
                      <CardContent className="p-4">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total de Vagas</p>
                        <div className="flex items-end justify-between">
                          <span className="text-2xl font-black text-gray-900">{totalVacancies}</span>
                          <Calendar className="h-8 w-8 text-[#79A3B1]/20 group-hover:scale-110 transition-transform" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-0 shadow-md bg-white overflow-hidden group">
                      <div className="h-1 w-full bg-emerald-500" />
                      <CardContent className="p-4">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Inscrições</p>
                        <div className="flex items-end justify-between">
                          <span className="text-2xl font-black text-emerald-600">{totalVolunteers}</span>
                          <UserCheck className="h-8 w-8 text-emerald-500/20 group-hover:scale-110 transition-transform" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-0 shadow-md bg-white overflow-hidden group">
                      <div className="h-1 w-full bg-orange-500" />
                      <CardContent className="p-4">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Vagas Livres</p>
                        <div className="flex items-end justify-between">
                          <span className="text-2xl font-black text-orange-600">{totalVacancies - totalVolunteers}</span>
                          <AlertCircle className="h-8 w-8 text-orange-500/20 group-hover:scale-110 transition-transform" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-0 shadow-md bg-white overflow-hidden group">
                      <div className="h-1 w-full bg-[#ACC18A]" />
                      <CardContent className="p-4">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Custo Projetado</p>
                        <div className="flex items-end justify-between">
                          <span className="text-lg font-black text-gray-900">
                            {totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                          <Calculator className="h-8 w-8 text-[#ACC18A]/20 group-hover:scale-110 transition-transform" />
                        </div>
                      </CardContent>
                    </Card>
                  </>
                );
              })()}
            </div>



            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
              <div className="lg:col-span-1 space-y-6">
        {/* Criar Nova Escala SER */}
        <Card className="border-0 shadow-lg bg-white rounded-2xl overflow-hidden">
          <div className="bg-[#ACC18A]/10 p-4 border-b">
            <CardTitle className="text-[#6d8050] flex items-center gap-2 text-base" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              <Plus className="h-5 w-5" />
              Criar Nova Escala SER
            </CardTitle>
          </div>
          <CardContent className="p-5">
            <form onSubmit={handleCreateScheduleBatch} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Identificação do Serviço</Label>
                <Input
                  required placeholder="Ex: Guarda do Quartel" value={newScheduleData.scheduleName}
                  onChange={(e) => setNewScheduleData({ ...newScheduleData, scheduleName: e.target.value })}
                  className="bg-gray-50 border-gray-100 focus:bg-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Início</Label>
                  <Input
                    type="time" required value={newScheduleData.startTime}
                    onChange={(e) => setNewScheduleData({ ...newScheduleData, startTime: e.target.value })}
                    className="bg-gray-50 border-gray-100 focus:bg-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Término</Label>
                  <Input
                    type="time" required value={newScheduleData.endTime}
                    onChange={(e) => setNewScheduleData({ ...newScheduleData, endTime: e.target.value })}
                    className="bg-gray-50 border-gray-100 focus:bg-white"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Vagas por Dia</Label>
                <Input
                  type="number" min="1" required value={newScheduleData.capacity}
                  onChange={(e) => setNewScheduleData({ ...newScheduleData, capacity: parseInt(e.target.value) || 1 })}
                  className="bg-gray-50 border-gray-100 focus:bg-white"
                />
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-[11px] font-bold text-gray-600 flex items-center gap-1 uppercase tracking-tight">
                    <CalendarDays className="h-4 w-4 text-[#ACC18A]" />
                    Seleção de Dias ({new Date(creationYear, creationMonth).toLocaleString('pt-BR', { month: 'long' })})
                  </Label>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button" variant="ghost" size="icon" className="h-6 w-6"
                      onClick={() => {
                        if (creationMonth === 0) { setCreationMonth(11); setCreationYear(v => v - 1); }
                        else setCreationMonth(v => v - 1);
                        setSelectedDays([]);
                      }}
                    >
                      <Search className="h-3 w-3 rotate-180" />
                    </Button>
                    <Button
                      type="button" variant="ghost" size="icon" className="h-6 w-6"
                      onClick={() => {
                        if (creationMonth === 11) { setCreationMonth(0); setCreationYear(v => v + 1); }
                        else setCreationMonth(v => v + 1);
                        setSelectedDays([]);
                      }}
                    >
                      <Search className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1.5 text-center">
                  {Array.from({ length: getDaysInMonth(creationYear, creationMonth) }, (_, i) => i + 1).map(day => (
                    <button
                      type="button" key={day}
                      onClick={() => toggleDay(day)}
                      className={`h-8 w-full text-[10px] font-bold rounded-md border transition-all ${selectedDays.includes(day)
                        ? 'bg-[#ACC18A] text-white border-[#ACC18A] shadow-md'
                        : 'hover:bg-gray-100 bg-gray-50 text-gray-600 border-gray-100'
                        }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 mt-3">
                  <Button type="button" variant="outline" size="sm" className="flex-1 text-[10px] h-7 font-bold uppercase tracking-wider" onClick={() => setSelectedDays(Array.from({ length: getDaysInMonth(creationYear, creationMonth) }, (_, i) => i + 1))}>Todos</Button>
                  <Button type="button" variant="outline" size="sm" className="flex-1 text-[10px] h-7 font-bold uppercase tracking-wider" onClick={() => setSelectedDays([])}>Limpar</Button>
                </div>
              </div>

              <Button type="submit" className="w-full bg-[#ACC18A] text-gray-900 hover:bg-[#8da36d] shadow-lg shadow-[#ACC18A]/20 font-bold uppercase tracking-widest text-xs h-11">
                <Check className="h-4 w-4 mr-2" /> Criar Escalas
              </Button>
            </form>
          </CardContent>
        </Card>
              </div>
              <div className="lg:col-span-2 space-y-6">
        <Card className="border-0 shadow-xl bg-white rounded-2xl lg:col-span-2 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between p-6 border-b bg-gray-50/30">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <CardTitle className="text-[#79A3B1] text-xl font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Gestão de Escalas SER</CardTitle>
                {selectedFilterDay !== null && (
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-[#79A3B1] text-white text-[10px] font-bold rounded-full animate-in zoom-in-95">
                    Dia {selectedFilterDay}
                    <button onClick={() => setSelectedFilterDay(null)} className="hover:text-red-200">&times;</button>
                  </div>
                )}
              </div>
              <CardDescription className="text-xs">Gerencie vagas e inscrições dos voluntários.</CardDescription>
            </div>
            <Button
              className="bg-white text-gray-700 hover:bg-gray-50 border shadow-sm print:hidden h-9"
              size="sm" onClick={() => window.print()}
            >
              <Printer className="mr-2 h-4 w-4" /> Imprimir
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="h-96 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-4 border-[#79A3B1] border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm font-medium text-gray-400">Processando...</span>
                </div>
              </div>
            ) : schedulesList.length === 0 ? (
              <div className="h-96 flex flex-col items-center justify-center text-gray-400 gap-4">
                <Calendar className="h-12 w-12 opacity-20" />
                <p className="text-sm font-medium">Nenhuma escala SER cadastrada para este período.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b">
                    <tr>
                      <th className="px-6 py-4">Data/Horário</th>
                      <th className="px-6 py-4">Identificação</th>
                      <th className="px-6 py-4 text-center">Vagas</th>
                      <th className="px-6 py-4">Voluntários</th>
                      <th className="px-6 py-4 text-right print:hidden">Gestão</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {[...schedulesList]
                      .filter(s => {
                        const sDate = new Date(s.startTime);
                        const matchesMonth = sDate.getMonth() === currentMonth && sDate.getFullYear() === currentYear;
                        if (selectedFilterDay === null) return matchesMonth;
                        return matchesMonth && sDate.getDate() === selectedFilterDay;
                      })
                      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                      .map((s) => {
                        const occupancy = (s.userIds?.length || 0) / s.capacity;
                        const isFull = (s.userIds?.length || 0) >= s.capacity;
                        const date = new Date(s.startTime);

                        return (
                          <tr key={s.id} className="group hover:bg-gray-50/50 transition-all">
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className="text-sm font-black text-gray-900">{date.getDate().toString().padStart(2, '0')}/{(date.getMonth() + 1).toString().padStart(2, '0')}</span>
                                <span className="text-[10px] font-bold text-gray-400 uppercase">{date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm font-bold text-gray-700">{s.scheduleName}</span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col items-center gap-1.5">
                                <div className="flex items-center gap-2">
                                  <span className={`text-xs font-black ${isFull ? 'text-red-500' : 'text-emerald-600'}`}>
                                    {s.userIds?.length || 0}/{s.capacity}
                                  </span>
                                </div>
                                <div className="w-16 h-1 bg-gray-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full transition-all ${isFull ? 'bg-red-500' : 'bg-emerald-500'}`}
                                    style={{ width: `${Math.min(100, occupancy * 100)}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-wrap gap-1 max-w-[200px]">
                                {s.userIds && s.userIds.length > 0 ? (
                                  s.userIds
                                    .map((uid: string) => usersList.find(usr => usr.id === uid) || { id: uid, rank: "", nickname: "...", sortOrder: 999 })
                                    .sort((a: any, b: any) => {
                                      const weightA = RANKS.indexOf(a.rank);
                                      const weightB = RANKS.indexOf(b.rank);
                                      if (weightA !== weightB) return weightB - weightA;
                                      return (a.sortOrder ?? 999) - (b.sortOrder ?? 999);
                                    })
                                    .slice(0, 3)
                                    .map((u: any) => (
                                      <span key={u.id} className="text-[10px] font-bold bg-white border border-gray-200 px-2 py-0.5 rounded shadow-sm text-gray-600">
                                        {u.rank} {u.nickname}
                                      </span>
                                    ))
                                ) : (
                                  <span className="text-[10px] text-gray-400 italic">Vazio</span>
                                )}
                                {s.userIds && s.userIds.length > 3 && (
                                  <span className="text-[10px] font-bold text-gray-400">+{s.userIds.length - 3}</span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right print:hidden flex items-center justify-end gap-1">
                              <Button
                                variant="ghost" size="sm"
                                className="h-8 text-[#79A3B1] hover:bg-[#79A3B1]/10 font-bold text-[10px] uppercase tracking-wider"
                                onClick={() => handleOpenEditSchedule(s)}
                              >
                                <Edit3 className="h-3.5 w-3.5 mr-1" /> Gerenciar
                              </Button>
                              <Button
                                variant="ghost" size="sm"
                                className="h-8 text-red-500 hover:bg-red-50 font-bold text-[10px]"
                                onClick={() => handleDeleteSchedule(s.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
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
                  <Calendar className="h-4 w-4 text-[#79A3B1]" /> Ajustar Horários e Vagas
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-600">Hora Inicial</Label>
                    <Input
                      type="time"
                      className="p-2.5 border rounded-lg text-sm focus-visible:ring-[#79A3B1]"
                      value={editScheduleHours.startTime}
                      onChange={(e) => setEditScheduleHours({ ...editScheduleHours, startTime: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-600">Hora Final</Label>
                    <Input
                      type="time"
                      className="p-2.5 border rounded-lg text-sm focus-visible:ring-[#79A3B1]"
                      value={editScheduleHours.endTime}
                      onChange={(e) => setEditScheduleHours({ ...editScheduleHours, endTime: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-600">Nº Vagas</Label>
                    <Input
                      type="number" min="1"
                      className="p-2.5 border rounded-lg text-sm focus-visible:ring-[#79A3B1]"
                      value={editScheduleHours.capacity}
                      onChange={(e) => setEditScheduleHours({ ...editScheduleHours, capacity: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                </div>
                <Button size="sm" className="w-full bg-[#79A3B1] text-white hover:bg-[#79A3B1]/90 font-medium" onClick={handleUpdateScheduleHours}>
                  Atualizar Dados da Escala
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
                      .sort((a: any, b: any) => {
                        const weightA = RANKS.indexOf(a.rank);
                        const weightB = RANKS.indexOf(b.rank);
                        if (weightA !== weightB) return weightB - weightA;
                        return (a.sortOrder ?? 999) - (b.sortOrder ?? 999);
                      })
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
                      {editingSchedule.userIds
                        .map((uid: string) => usersList.find(u => u.id === uid) || { id: uid, rank: "", nickname: "Carregando...", sortOrder: 999 })
                        .sort((a: any, b: any) => {
                          const weightA = RANKS.indexOf(a.rank);
                          const weightB = RANKS.indexOf(b.rank);
                          if (weightA !== weightB) return weightB - weightA;
                          return (a.sortOrder ?? 999) - (b.sortOrder ?? 999);
                        })
                        .map((user: any, index: number) => (
                          <li key={user.id} className="flex items-center justify-between bg-white p-2.5 rounded-lg shadow-sm border text-xs">
                            <span className="font-semibold text-gray-800">
                              {index + 1}. {user.rank} {user.nickname}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-red-500 hover:bg-red-50 rounded-full"
                              onClick={() => handleRemoveVolunteer(user.id)}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </li>
                        ))
                      }
                    </ul>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </TabsContent>

  {/* Tab 6: Efetivo */ }
  <TabsContent value="users" className="animate-in fade-in duration-300 space-y-6">
    <Card className="border-0 shadow-xl bg-white rounded-2xl overflow-hidden">
      <CardHeader className="bg-gray-50/50 border-b p-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <CardTitle className="text-[#79A3B1] text-2xl font-black uppercase tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              GESTÃO DO EFETIVO
            </CardTitle>
            <CardDescription className="text-gray-500 font-medium">Controle de postos, graduações e lotação de toda a unidade.</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-3 print:hidden">
            <div className="relative w-full sm:w-64 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-[#79A3B1] transition-colors" />
              <Input
                placeholder="Buscar militar..."
                className="pl-10 h-10 bg-white border-gray-200 rounded-xl focus-visible:ring-[#79A3B1] focus-visible:border-[#79A3B1]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button
              className="bg-[#ACC18A] text-gray-900 hover:bg-[#8da36d] font-bold uppercase tracking-widest text-[10px] h-10 px-6 rounded-xl shadow-lg shadow-[#ACC18A]/20"
              onClick={() => setIsCreatingUser(true)}
            >
              <Plus className="h-4 w-4 mr-2" /> Cadastrar
            </Button>
            <Button
              variant="outline"
              className="border-gray-200 hover:bg-gray-50 font-bold uppercase tracking-widest text-[10px] h-10 px-4 rounded-xl"
              onClick={() => window.print()}
            >
              <Printer className="h-4 w-4 mr-2" /> Imprimir
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-gray-400 gap-4">
            <div className="h-8 w-8 border-4 border-[#79A3B1]/20 border-t-[#79A3B1] rounded-full animate-spin" />
            <p className="text-sm font-medium">Carregando banco de dados...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-gray-400 gap-4">
            <Search className="h-12 w-12 opacity-10" />
            <p className="text-sm font-medium">Nenhum militar encontrado para "{searchQuery}".</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b">
                <tr>
                  <th className="px-6 py-4 w-16">ID</th>
                  <th className="px-6 py-4">Militar</th>
                  <th className="px-6 py-4">Documentação</th>
                  <th className="px-6 py-4">Equipe / Função</th>
                  {(currentAdmin.role === 'superadmin' || currentAdmin.email === 'stivnil@hotmail.com') && !unitId && (
                    <th className="px-6 py-4">Unidade</th>
                  )}
                  <th className="px-6 py-4 text-right print:hidden">Gestão</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((u, index) => (
                  <tr key={u.id} className="group hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-[10px] font-black text-gray-300">#{index + 1}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-gray-900 leading-tight">{u.rank} {u.nickname}</span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase truncate max-w-[250px]">{u.fullName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-bold text-gray-700">RG: {formatRG(u.rg)}</span>
                        <span className="text-[10px] text-gray-400 font-medium">CPF: {u.taxId}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${u.workTeam === 'ADM' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {u.workTeam || "—"}
                        </span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase">
                          {u.jobFunction || "Operacional"}
                        </span>
                      </div>
                    </td>
                    {(currentAdmin.role === 'superadmin' || currentAdmin.email === 'stivnil@hotmail.com') && !unitId && (
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-black text-[#79A3B1] uppercase bg-gray-100 px-2 py-1 rounded-md">
                          {availableUnits.find(unit => unit.id === u.unitId)?.name || u.unitId || "N/A"}
                        </span>
                      </td>
                    )}
                    <td className="px-6 py-4 text-right print:hidden">
                      <div className="flex items-center justify-end gap-1 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-[#79A3B1] hover:bg-[#79A3B1]/10 font-bold text-[10px] uppercase tracking-wider"
                          onClick={() => setEditingUser(u)}
                        >
                          <Edit3 className="h-3.5 w-3.5 mr-1" /> Editar
                        </Button>
                        {u.role !== 'admin' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-emerald-600 hover:bg-emerald-50 font-bold text-[10px] uppercase tracking-wider"
                            onClick={() => handlePromoteUser(u.id)}
                          >
                            <ShieldCheck className="h-3.5 w-3.5 mr-1" /> Promover
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-red-500 hover:bg-red-50 font-bold text-[10px] uppercase tracking-wider"
                          onClick={() => handleDeleteUser(u.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" /> Excluir
                        </Button>
                      </div>
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
                onChange={(e) => setNewUserForm({ ...newUserForm, fullName: e.target.value })}
                placeholder="Nome Completo"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-gray-600">Nome de Guerra *</Label>
              <Input
                type="text"
                className="p-2.5 border rounded-lg text-sm focus-visible:ring-[#79A3B1]"
                value={newUserForm.nickname}
                onChange={(e) => setNewUserForm({ ...newUserForm, nickname: e.target.value })}
                placeholder="Ex: Lyedher"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-gray-600">CPF (Apenas números) *</Label>
              <Input
                type="text"
                className="p-2.5 border rounded-lg text-sm focus-visible:ring-[#79A3B1]"
                value={newUserForm.taxId}
                onChange={(e) => setNewUserForm({ ...newUserForm, taxId: maskCPF(e.target.value) })}
                placeholder="Ex: 123.456.789-00"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-gray-600">RG</Label>
              <Input
                type="text"
                className="p-2.5 border rounded-lg text-sm focus-visible:ring-[#79A3B1]"
                value={newUserForm.rg}
                onChange={(e) => setNewUserForm({ ...newUserForm, rg: maskRG(e.target.value) })}
                placeholder="Ex: 12.345"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-gray-600">E-mail Corporativo</Label>
              <Input
                type="email"
                className="p-2.5 border rounded-lg text-sm focus-visible:ring-[#79A3B1]"
                value={newUserForm.email}
                onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                placeholder="Ex: policial@pm.go.gov.br"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-gray-600">Senha Temporária *</Label>
              <Input
                type="text"
                className="p-2.5 border rounded-lg text-sm focus-visible:ring-[#79A3B1]"
                value={newUserForm.password}
                onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-gray-600">Telefone / Celular</Label>
              <Input
                type="text"
                className="p-2.5 border rounded-lg text-sm focus-visible:ring-[#79A3B1]"
                value={newUserForm.phone}
                onChange={(e) => setNewUserForm({ ...newUserForm, phone: maskPhone(e.target.value) })}
                placeholder="Ex: (61) 99999-9999"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-gray-600">Data de Nascimento</Label>
              <Input
                type="date"
                className="p-2.5 border rounded-lg text-sm focus-visible:ring-[#79A3B1]"
                value={newUserForm.birthDate}
                onChange={(e) => setNewUserForm({ ...newUserForm, birthDate: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-gray-600">Graduação</Label>
              <select
                className="w-full p-2.5 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#79A3B1] focus:border-[#79A3B1] outline-none transition-all"
                value={newUserForm.rank}
                onChange={(e) => setNewUserForm({ ...newUserForm, rank: e.target.value })}
              >
                {RANKS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-gray-600">Função Específica</Label>
              <select
                className="w-full p-2.5 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#79A3B1] focus:border-[#79A3B1] outline-none transition-all"
                value={newUserForm.jobFunction}
                onChange={(e) => setNewUserForm({ ...newUserForm, jobFunction: e.target.value })}
              >
                {FUNCTIONS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-gray-600">Tipo de Serviço</Label>
              <select
                className="w-full p-2.5 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#79A3B1] focus:border-[#79A3B1] outline-none transition-all"
                value={newUserForm.serviceType}
                onChange={(e) => setNewUserForm({ ...newUserForm, serviceType: e.target.value })}
              >
                {SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-gray-600">Equipe / Status</Label>
              <select
                className="w-full p-2.5 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#79A3B1] focus:border-[#79A3B1] outline-none transition-all"
                value={newUserForm.workTeam}
                onChange={(e) => setNewUserForm({ ...newUserForm, workTeam: e.target.value })}
              >
                {TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {newUserForm.workTeam === "Afastado" && (
              <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
                <Label className="text-xs font-semibold text-orange-600">Motivo do Afastamento</Label>
                <select
                  className="w-full p-2.5 border border-orange-200 rounded-lg text-sm bg-orange-50 focus:ring-2 focus:ring-orange-500 outline-none transition-all font-bold text-orange-800"
                  value={newUserForm.absenceReason}
                  onChange={(e) => setNewUserForm({ ...newUserForm, absenceReason: e.target.value })}
                >
                  <option value="">Selecione o motivo...</option>
                  {ABSENCE_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            )}

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-gray-600">Desempate (Ordem de Antiguidade)</Label>
              <Input
                type="number"
                className="w-full p-2.5 border rounded-lg text-sm focus-visible:ring-[#79A3B1]"
                value={newUserForm.sortOrder}
                onChange={(e) => setNewUserForm({ ...newUserForm, sortOrder: parseInt(e.target.value) || 999 })}
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

  {/* Tab 4: Afastados */ }
  <TabsContent value="away" className="animate-in fade-in duration-300 space-y-6">
    <Card className="border-0 shadow-xl bg-white rounded-2xl overflow-hidden">
      <CardHeader className="bg-orange-50 border-b p-6 flex flex-row items-center justify-between">
        <div className="space-y-1">
          <CardTitle className="text-orange-700 text-2xl font-black uppercase tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            MILITARES AFASTADOS
          </CardTitle>
          <CardDescription className="text-orange-600/70 font-medium">Pessoal atualmente fora de escala por motivo de licença ou dispensa.</CardDescription>
        </div>
        <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
          <ShieldAlert className="h-6 w-6 text-orange-600" />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {awayUsers.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-gray-400 gap-4">
            <ShieldCheck className="h-12 w-12 text-emerald-500 opacity-20" />
            <p className="text-sm font-medium">Nenhum militar afastado no momento.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b">
                <tr>
                  <th className="px-6 py-4">Militar</th>
                  <th className="px-6 py-4">RG / CPF</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right print:hidden">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {awayUsers.map((u) => (
                  <tr key={u.id} className="group hover:bg-orange-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-gray-900">{u.rank} {u.nickname}</span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase truncate max-w-[250px]">{u.fullName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-700">RG: {formatRG(u.rg)}</span>
                        <span className="text-[10px] text-gray-400 font-medium">CPF: {u.taxId}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-orange-100 text-orange-700 uppercase tracking-widest">
                        <AlertCircle className="h-3 w-3" /> {u.workTeam}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right print:hidden">
                      <Button
                        variant="ghost" size="sm"
                        className="h-8 text-orange-600 hover:bg-orange-100 font-bold text-[10px] uppercase tracking-wider"
                        onClick={() => setEditingUser(u)}
                      >
                        <Edit3 className="h-3.5 w-3.5 mr-1" /> Reverter Status
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
  {/* Tab 5: Agendamentos (Resumo Financeiro AC-4) */ }
  <TabsContent value="volunteers" className="animate-in fade-in duration-300 space-y-6">
    <Card className="border-0 shadow-xl bg-white rounded-2xl overflow-hidden">
      <CardHeader className="bg-emerald-50 border-b p-6 flex flex-row items-center justify-between">
        <div className="space-y-1">
          <CardTitle className="text-emerald-700 text-2xl font-black uppercase tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            RESUMO DE AGENDAMENTOS (AC-4)
          </CardTitle>
          <CardDescription className="text-emerald-600/70 font-medium">Controle financeiro e de carga horária extra por militar.</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right mr-4 hidden md:block">
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest leading-none mb-1">Mês de Referência</p>
            <p className="text-sm font-black text-emerald-800 leading-none">{new Date(currentYear, currentMonth).toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</p>
          </div>
          <Button
            className="bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 font-bold uppercase tracking-widest text-xs h-10 print:hidden"
            onClick={() => window.print()}
          >
            <Printer className="mr-2 h-4 w-4" /> Relatório
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b">
              <tr>
                <th className="px-6 py-4">Militar</th>
                <th className="px-6 py-4 text-center">Escalas</th>
                <th className="px-6 py-4 text-center">Horas Extras</th>
                <th className="px-6 py-4 text-right">Valor Projetado</th>
                <th className="px-6 py-4 text-center print:hidden">Progresso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {usersList
                .map(u => {
                  const userSchedules = schedulesList.filter(s =>
                    s.userIds?.includes(u.id) &&
                    new Date(s.startTime).getMonth() === currentMonth &&
                    new Date(s.startTime).getFullYear() === currentYear
                  );

                  if (userSchedules.length === 0) return null;

                  let totalHours = 0;
                  let totalValue = 0;

                  userSchedules.forEach(s => {
                    const start = new Date(s.startTime);
                    const end = new Date(s.endTime);
                    const diff = Math.abs(end.getTime() - start.getTime()) / 36e5;
                    totalHours += diff;

                    const isWeekend = start.getDay() === 0 || start.getDay() === 6;
                    const isNight = start.getHours() >= 19 || start.getHours() < 7;

                    let rate = ac4Rates.blueDay;
                    if (isWeekend) rate = isNight ? ac4Rates.redNight : ac4Rates.redDay;
                    else if (isNight) rate = ac4Rates.blueNight;

                    totalValue += diff * rate;
                  });

                  return { 
                    ...u, 
                    totalHours, 
                    totalValue, 
                    count: userSchedules.length,
                    schedules: userSchedules.sort((a,b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                  };
                })
                .filter(Boolean)
                .sort((a: any, b: any) => b.totalValue - a.totalValue)
                .map((u: any) => (
                  <tr key={u.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => setSelectedVolunteerSummary(u)}>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-gray-900">{u.rank} {u.nickname}</span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase truncate max-w-[200px]">{u.fullName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-xs font-black text-gray-700 bg-gray-100 px-2 py-1 rounded-md">
                        {u.count}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-black text-gray-900">{Number(u.totalHours.toFixed(2))}h</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-black text-emerald-600">
                        {u.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </td>
                    <td className="px-6 py-4 print:hidden">
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 transition-all"
                            style={{ width: `${Math.min(100, (u.totalHours / maxMonthlySlots) * 100)}%` }}
                          />
                        </div>
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Cota Mensal</span>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          {usersList.filter(u => schedulesList.some(s => s.userIds?.includes(u.id))).length === 0 && (
            <div className="py-20 flex flex-col items-center justify-center text-gray-400 gap-4">
              <Calculator className="h-12 w-12 opacity-10" />
              <p className="text-sm font-medium">Nenhum agendamento AC-4 no período.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>

    {selectedVolunteerSummary && (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
        <Card className="w-full max-w-2xl border shadow-2xl bg-white rounded-2xl relative animate-in zoom-in-95 duration-200">
          <button
            onClick={() => setSelectedVolunteerSummary(null)}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-lg font-bold text-emerald-700 flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Agendamentos: {selectedVolunteerSummary.rank} {selectedVolunteerSummary.nickname}
            </CardTitle>
            <CardDescription className="text-xs text-gray-500 font-medium uppercase tracking-wider mt-1">
              {selectedVolunteerSummary.count} escalas no mês atual
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 max-h-[60vh] overflow-y-auto">
            <ul className="space-y-3">
              {selectedVolunteerSummary.schedules.map((s: any) => {
                const start = new Date(s.startTime);
                const end = new Date(s.endTime);
                return (
                  <li key={s.id} className="flex justify-between items-center bg-gray-50 border border-gray-100 p-3.5 rounded-xl hover:bg-gray-100 transition-colors">
                    <div>
                      <p className="font-bold text-sm text-gray-900 capitalize-first">{s.scheduleName || "Escala AC-4"}</p>
                      <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">
                        {start.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-emerald-600 text-sm bg-emerald-50 px-3 py-1 rounded-lg">
                        {start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} às {end.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
          </CardContent>
        </Card>
      </div>
    )}
  </TabsContent>

  {/* Tab 7: Transferidos */ }
  <TabsContent value="transferred" className="animate-in fade-in duration-300 space-y-6">
    <Card className="border-0 shadow-xl bg-white rounded-2xl overflow-hidden">
      <CardHeader className="bg-gray-100 border-b p-6 flex flex-row items-center justify-between">
        <div className="space-y-1">
          <CardTitle className="text-gray-700 text-2xl font-black uppercase tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            HISTÓRICO DE TRANSFERIDOS
          </CardTitle>
          <CardDescription className="text-gray-500 font-medium">Militares que não pertencem mais à unidade.</CardDescription>
        </div>
        <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-sm">
          <LogOut className="h-5 w-5 text-gray-400" />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {transferredUsers.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-gray-300 gap-4">
            <UsersRound className="h-12 w-12 opacity-10" />
            <p className="text-sm font-medium">Nenhum registro de transferência.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b">
                <tr>
                  <th className="px-6 py-4">Militar</th>
                  <th className="px-6 py-4">RG / CPF</th>
                  <th className="px-6 py-4">Lotação Anterior</th>
                  <th className="px-6 py-4 text-right print:hidden">Gestão</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transferredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-gray-900">{u.rank} {u.nickname}</span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase truncate max-w-[200px]">{u.fullName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-700">RG: {formatRG(u.rg)}</span>
                        <span className="text-[10px] text-gray-400 font-medium">CPF: {u.taxId}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-black bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full uppercase">
                        {u.workTeam}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right print:hidden">
                      <Button
                        variant="ghost" size="sm"
                        className="h-8 text-gray-400 hover:text-[#79A3B1] hover:bg-gray-100 font-bold text-[10px] uppercase tracking-wider transition-opacity"
                        onClick={() => setEditingUser(u)}
                      >
                        <Edit3 className="h-3.5 w-3.5 mr-1" /> Reativar
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

  {/* Tab 8: Configurações */ }
  <TabsContent value="settings" className="animate-in fade-in duration-300 space-y-6">
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="space-y-6 lg:col-span-1">
        {/* Configurações Globais */}
        <Card className="border-0 shadow-lg bg-white rounded-2xl overflow-hidden">
          <div className="bg-[#79A3B1]/5 p-4 border-b flex items-center justify-between">
            <CardTitle className="text-[#79A3B1] flex items-center gap-2 text-base" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              <Settings className="h-5 w-5" />
              Configurações Globais
            </CardTitle>
            <div className="flex items-center gap-2">
              {(() => {
                const now = new Date();
                const isOpen = schedulingWindow.openDateTime && schedulingWindow.closeDateTime ? (
                  now >= new Date(schedulingWindow.openDateTime) &&
                  now <= new Date(schedulingWindow.closeDateTime)
                ) : false;
                return (
                  <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tighter ${isOpen ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                    {isOpen ? "Aberto" : "Fechado"}
                  </div>
                );
              })()}
              <Button
                size="sm"
                className="bg-[#79A3B1] text-white hover:bg-[#79A3B1]/90 h-8 px-3 text-[10px] font-black uppercase tracking-widest"
                onClick={handleSaveSettings}
              >
                <Check className="h-3 w-3 mr-1" /> Salvar
              </Button>
            </div>
          </div>
          <CardContent className="p-5 space-y-6">
            {/* AC-4 Rates */}
            <div className="space-y-3">
              <Label className="text-[10px] font-black text-[#79A3B1] uppercase tracking-widest flex items-center gap-2">
                <Calculator className="h-3 w-3" /> Valores AC-4 (R$/Hora)
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Azul Diurno</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[10px]">R$</span>
                    <Input
                      type="number" step="0.01" value={ac4Rates.blueDay}
                      onChange={(e) => setAc4Rates({ ...ac4Rates, blueDay: parseFloat(e.target.value) || 0 })}
                      className="pl-8 h-9 text-xs bg-gray-50 border-gray-100 focus:bg-white"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Azul Noturno</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[10px]">R$</span>
                    <Input
                      type="number" step="0.01" value={ac4Rates.blueNight}
                      onChange={(e) => setAc4Rates({ ...ac4Rates, blueNight: parseFloat(e.target.value) || 0 })}
                      className="pl-8 h-9 text-xs bg-gray-50 border-gray-100 focus:bg-white"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Vermelho Diurno</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[10px]">R$</span>
                    <Input
                      type="number" step="0.01" value={ac4Rates.redDay}
                      onChange={(e) => setAc4Rates({ ...ac4Rates, redDay: parseFloat(e.target.value) || 0 })}
                      className="pl-8 h-9 text-xs bg-gray-50 border-gray-100 focus:bg-white"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Vermelho Noturno</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[10px]">R$</span>
                    <Input
                      type="number" step="0.01" value={ac4Rates.redNight}
                      onChange={(e) => setAc4Rates({ ...ac4Rates, redNight: parseFloat(e.target.value) || 0 })}
                      className="pl-8 h-9 text-xs bg-gray-50 border-gray-100 focus:bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Duty Baseline */}
            <div className="space-y-3 pt-4 border-t border-gray-50">
              <Label className="text-[10px] font-black text-[#79A3B1] uppercase tracking-widest flex items-center gap-2">
                <Calendar className="h-3 w-3" /> Ciclo de Escala (Alpha)
              </Label>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Início do Ciclo (Dia da Equipe Alpha)</Label>
                <Input
                  type="date"
                  value={dutyBaseline}
                  onChange={(e) => setDutyBaseline(e.target.value)}
                  className="h-9 text-xs bg-gray-50 border-gray-100 focus:bg-white font-bold"
                />
                <p className="text-[9px] text-gray-400 leading-tight">Define o dia de referência para o cálculo da Matriz de Escala. Neste dia, a equipe Alpha estará de serviço.</p>
              </div>
            </div>

            {/* Volunteer Limits */}
            <div className="space-y-3 pt-4 border-t border-gray-50">
              <Label className="text-[10px] font-black text-[#79A3B1] uppercase tracking-widest flex items-center gap-2">
                <Lock className="h-3 w-3" /> Regras de Voluntariado
              </Label>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Limite Mensal de Vagas (por Policial)</Label>
                <Input
                  type="number" value={maxMonthlySlots}
                  onChange={(e) => setMaxMonthlySlots(parseInt(e.target.value) || 0)}
                  className="h-9 text-xs bg-gray-50 border-gray-100 focus:bg-white"
                />
              </div>
            </div>

            {/* Window */}
            <div className="space-y-3 pt-4 border-t border-gray-50">
              <Label className="text-[10px] font-black text-[#79A3B1] uppercase tracking-widest flex items-center gap-2">
                <Clock className="h-3 w-3" /> Janela de Agendamento
              </Label>
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Início (Abertura)</Label>
                  <Input
                    type="datetime-local" value={schedulingWindow.openDateTime}
                    onChange={(e) => setSchedulingWindow({ ...schedulingWindow, openDateTime: e.target.value })}
                    className="h-9 text-xs bg-gray-50 border-gray-100 focus:bg-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Fim (Encerramento)</Label>
                  <Input
                    type="datetime-local" value={schedulingWindow.closeDateTime}
                    onChange={(e) => setSchedulingWindow({ ...schedulingWindow, closeDateTime: e.target.value })}
                    className="h-9 text-xs bg-gray-50 border-gray-100 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Invite Code */}
            <div className="space-y-3 pt-4 border-t border-gray-50">
              <Label className="text-[10px] font-black text-orange-500 uppercase tracking-widest flex items-center gap-2">
                <UserPlus className="h-3 w-3" /> Convite para Auto-Cadastro
              </Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    value={schedulingWindow.inviteCode}
                    onChange={(e) => setSchedulingWindow({ ...schedulingWindow, inviteCode: e.target.value })}
                    placeholder="Código secreto do convite"
                    className="h-9 text-xs bg-gray-50 border-gray-100 focus:bg-white font-mono"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 text-[10px] font-bold uppercase"
                    onClick={() => {
                      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
                      setSchedulingWindow({ ...schedulingWindow, inviteCode: code });
                    }}
                  >
                    Gerar
                  </Button>
                </div>
                {schedulingWindow.inviteCode && (
                  <div className="p-3 bg-orange-50 rounded-lg border border-orange-100 space-y-2">
                    <p className="text-[9px] font-black text-orange-800 uppercase tracking-tighter">Link de Convite Ativo:</p>
                    <div className="flex items-center justify-between gap-2">
                      <code className="text-[10px] text-orange-600 font-bold break-all">
                        {typeof window !== 'undefined' ? `${window.location.origin}/register?code=${schedulingWindow.inviteCode}` : `.../register?code=${schedulingWindow.inviteCode}`}
                      </code>
                      <Button
                        size="sm" variant="ghost" className="h-6 w-6 p-0 text-orange-600 hover:bg-orange-100"
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/register?code=${schedulingWindow.inviteCode}`);
                          alert("Link copiado!");
                        }}
                      >
                        <ClipboardList className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <p className="text-[9px] text-orange-400 italic">Compartilhe este link com os militares para que eles mesmos se cadastrem.</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

    </div>
  </TabsContent>

        </Tabs >

    { editingUser && (
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
                onChange={(e) => setEditingUser({ ...editingUser, fullName: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-gray-600">Nome de Guerra</Label>
              <Input
                type="text"
                className="p-2.5 border rounded-lg text-sm focus-visible:ring-[#79A3B1]"
                value={editingUser.nickname || ""}
                onChange={(e) => setEditingUser({ ...editingUser, nickname: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-gray-600">E-mail</Label>
              <Input
                type="email"
                className="p-2.5 border rounded-lg text-sm focus-visible:ring-[#79A3B1]"
                value={editingUser.email || ""}
                onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-gray-600">CPF</Label>
              <Input
                type="text"
                className="p-2.5 border rounded-lg text-sm focus-visible:ring-[#79A3B1]"
                value={editingUser.taxId || ""}
                onChange={(e) => setEditingUser({ ...editingUser, taxId: maskCPF(e.target.value) })}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-gray-600">RG</Label>
              <Input
                type="text"
                className="p-2.5 border rounded-lg text-sm focus-visible:ring-[#79A3B1]"
                value={editingUser.rg || ""}
                onChange={(e) => setEditingUser({ ...editingUser, rg: maskRG(e.target.value) })}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-gray-600">Telefone / Celular</Label>
              <Input
                type="text"
                className="p-2.5 border rounded-lg text-sm focus-visible:ring-[#79A3B1]"
                value={editingUser.phone || ""}
                onChange={(e) => setEditingUser({ ...editingUser, phone: maskPhone(e.target.value) })}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-gray-600">Data de Nascimento</Label>
              <Input
                type="date"
                className="p-2.5 border rounded-lg text-sm focus-visible:ring-[#79A3B1]"
                value={editingUser.birthDate || ""}
                onChange={(e) => setEditingUser({ ...editingUser, birthDate: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-gray-600">Graduação</Label>
              <select
                className="w-full p-2.5 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#79A3B1] focus:border-[#79A3B1] outline-none transition-all"
                value={editingUser.rank}
                onChange={(e) => setEditingUser({ ...editingUser, rank: e.target.value })}
              >
                {RANKS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-gray-600">Função Específica</Label>
              <select
                className="w-full p-2.5 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#79A3B1] focus:border-[#79A3B1] outline-none transition-all"
                value={editingUser.jobFunction}
                onChange={(e) => setEditingUser({ ...editingUser, jobFunction: e.target.value })}
              >
                {FUNCTIONS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-gray-600">Tipo de Serviço</Label>
              <select
                className="w-full p-2.5 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#79A3B1] focus:border-[#79A3B1] outline-none transition-all"
                value={editingUser.serviceType || "OPER"}
                onChange={(e) => setEditingUser({ ...editingUser, serviceType: e.target.value })}
              >
                {SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-gray-600">Equipe / Status</Label>
              <select
                className="w-full p-2.5 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#79A3B1] focus:border-[#79A3B1] outline-none transition-all"
                value={editingUser.workTeam}
                onChange={(e) => setEditingUser({ ...editingUser, workTeam: e.target.value })}
              >
                {TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {editingUser.workTeam === "Afastado" && (
              <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
                <Label className="text-xs font-semibold text-orange-600">Motivo do Afastamento</Label>
                <select
                  className="w-full p-2.5 border border-orange-200 rounded-lg text-sm bg-orange-50 focus:ring-2 focus:ring-orange-500 outline-none transition-all font-bold text-orange-800"
                  value={editingUser.absenceReason || ""}
                  onChange={(e) => setEditingUser({ ...editingUser, absenceReason: e.target.value })}
                >
                  <option value="">Selecione o motivo...</option>
                  {ABSENCE_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            )}

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-gray-600">Desempate (Ordem de Antiguidade)</Label>
              <Input
                type="number"
                className="w-full p-2.5 border rounded-lg text-sm focus-visible:ring-[#79A3B1]"
                value={editingUser.sortOrder ?? 999}
                onChange={(e) => setEditingUser({ ...editingUser, sortOrder: parseInt(e.target.value) || 999 })}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-gray-600 text-orange-600">Redefinir Senha Temporária</Label>
              <Input
                type="text"
                className="p-2.5 border border-orange-200 rounded-lg text-sm focus-visible:ring-orange-500"
                value={editingUser.password || ""}
                onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                placeholder="Nova senha se desejar alterar"
              />
            </div>

            {(currentAdmin.role === 'superadmin' || currentAdmin.email === 'stivnil@hotmail.com') && (
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-[#1A3636] flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" /> Unidade (Transferência)
                </Label>
                <select
                  className="w-full p-2.5 border-2 border-orange-100 rounded-lg text-sm bg-orange-50/30 focus:ring-2 focus:ring-orange-500 outline-none transition-all font-bold"
                  value={editingUser.unitId || ""}
                  onChange={(e) => setEditingUser({ ...editingUser, unitId: e.target.value })}
                >
                  <option value="">Selecione a Unidade</option>
                  {availableUnits.map(unit => (
                    <option key={unit.id} value={unit.id}>{unit.name}</option>
                  ))}
                </select>
                <p className="text-[10px] text-orange-600 italic">Alterar a unidade moverá o policial para outro dashboard.</p>
              </div>
            )}

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


      </main >

  <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-gray-100 mt-8">
    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <a
          href="https://instagram.com/sgt_lyedher"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 hover:text-[#79A3B1] transition-colors uppercase tracking-widest"
        >
          <Instagram className="h-3.5 w-3.5" />
          Developed by @sgt_lyedher
        </a>
        <a
          href="https://wa.me/5562993923724"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 hover:text-emerald-600 transition-colors uppercase tracking-widest"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          (62) 99392-3724
        </a>
      </div>
      <div className="text-[9px] text-gray-300 font-bold uppercase tracking-[0.3em]">
        © 2026 PMGO - Unidade de Polícia Militar
      </div>
    </div>
  </footer>
    </section>
}


export default function AdminDashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#F0F4F5]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#79A3B1]"></div>
      </div>
    }>
      <AdminDashboardContent />
    </Suspense>
  );
}
