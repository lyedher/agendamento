"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Building2, Users, Wallet, Calendar, Plus, 
  TrendingUp, ShieldCheck, AlertCircle, ArrowLeft,
  Search, Shield, LayoutDashboard, Settings, UserPlus, LogOut, ClipboardList, History,
  Filter, Download, RefreshCcw, UserCheck, Edit3, X, Trash2, Check, MoreHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  getGlobalStats, createUnit, getGlobalUsers, transferUser, getUnits, logout, getAuditLogs,
  promoteUserToAdmin, deleteUser 
} from "@/lib/actions";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

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

const COLORS = [
  '#1A3636', '#D65A31', '#00ADB5', '#393E46', 
  '#F97316', '#8B5CF6', '#EC4899', '#10B981', 
  '#3B82F6', '#F59E0B', '#6366F1', '#14B8A6'
];

export default function CRPMDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingUnit, setIsCreatingUnit] = useState(false);
  const [newUnit, setNewUnit] = useState({ id: "", name: "", budgetLimit: 5000 });
  const [searchTerm, setSearchTerm] = useState("");
  const [rankFilter, setRankFilter] = useState("TODOS");
  const [unitFilter, setUnitFilter] = useState("TODAS");
  const [serviceFilter, setServiceFilter] = useState("TODOS");
  const [ageFilter, setAgeFilter] = useState("TODAS");
  const [functionFilter, setFunctionFilter] = useState("TODAS");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isTransferring, setIsTransferring] = useState(false);
  const [availableUnits, setAvailableUnits] = useState<any[]>([]);
  const [targetUnit, setTargetUnit] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  const loadData = async () => {
    setIsLoading(true);
    const [statsRes, usersRes, unitsRes, logsRes] = await Promise.all([
      getGlobalStats(),
      getGlobalUsers(),
      getUnits(),
      getAuditLogs()
    ]);
    
    if (statsRes.success) setStats(statsRes.stats);
    if (usersRes.success) setUsers(usersRes.users);
    if (unitsRes.success) setAvailableUnits(unitsRes.units);
    if (logsRes.success) setAuditLogs(logsRes.logs);
    setIsLoading(false);
  };

  const handleDelete = async (user: any) => {
    if (!confirm(`ATENÇÃO: Deseja realmente excluir permanentemente ${user.rank} ${user.nickname} do sistema?`)) return;
    const res = await deleteUser(user.id);
    if (res.success) {
      alert("Usuário excluído com sucesso!");
      loadData();
    } else {
      alert("Erro ao excluir: " + res.message);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateUnit = async () => {
    if (!newUnit.id || !newUnit.name) return;
    const res = await createUnit(newUnit);
    if (res.success) {
      setIsCreatingUnit(false);
      setNewUnit({ id: "", name: "", budgetLimit: 5000 });
      loadData();
    } else {
      alert(res.message);
    }
  };

  const handleTransfer = async () => {
    if (!selectedUser || !targetUnit) return;
    setIsUpdating(true);
    const res = await transferUser(selectedUser.id, targetUnit);
    setIsUpdating(false);
    
    if (res.success) {
      setIsTransferring(false);
      setSelectedUser(null);
      loadData();
    } else {
      alert(res.message);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#E0E0E0]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1A3636]"></div>
      </div>
    );
  }

  const ranks = ["TODOS", ...Array.from(new Set(users.map(u => u.rank))).sort()];
  const unitList = ["TODAS", ...availableUnits.map(u => u.id)];
  const functionList = ["TODAS", ...FUNCTIONS];

  // Derived Data for Charts and KPIs
  // Base data with all filters applied (including those in limbo/transferidos)
  const baseFilteredData = users.filter(u => {
    const matchesRank = rankFilter === "TODOS" || u.rank === rankFilter;
    const matchesUnit = unitFilter === "TODAS" || u.unitId === unitFilter;
    
    let userServiceType = u.serviceType;
    if (!userServiceType) {
      if (u.workTeam === "ADM") userServiceType = "ADM";
      else if (u.workTeam === "Afastado" || u.workTeam === "Transferido") userServiceType = "AFASTADO";
      else userServiceType = "OPER";
    }
    const matchesService = serviceFilter === "TODOS" || userServiceType === serviceFilter;
    
    let matchesAge = true;
    if (ageFilter !== "TODAS") {
      if (!u.birthDate) {
        matchesAge = false;
      } else {
        const birthDate = new Date(u.birthDate);
        const age = new Date().getFullYear() - birthDate.getFullYear();
        if (ageFilter === "18-25") matchesAge = age >= 18 && age <= 25;
        else if (ageFilter === "26-35") matchesAge = age >= 26 && age <= 35;
        else if (ageFilter === "36-45") matchesAge = age >= 36 && age <= 45;
        else if (ageFilter === "46-55") matchesAge = age >= 46 && age <= 55;
        else if (ageFilter === "56-60") matchesAge = age >= 56 && age <= 60;
        else if (ageFilter === "61-65") matchesAge = age >= 61 && age <= 65;
      }
    }

    const matchesFunction = functionFilter === "TODAS" || (u.jobFunction || "Plantonista") === functionFilter;
    
    return matchesRank && matchesUnit && matchesService && matchesAge && matchesFunction;
  });

  // dashboardData EXCLUI transferidos para não poluir gráficos e estatísticas
  const dashboardData = baseFilteredData.filter(u => u.workTeam !== "Transferido");

  const awayUsersList = dashboardData.filter(u => u.workTeam === "Afastado");

  const awayReasonData = Object.entries(
    awayUsersList.reduce((acc: any, u) => {
      const reason = u.absenceReason || "Outros / Transf.";
      acc[reason] = (acc[reason] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const awayRankData = Object.entries(
    awayUsersList.reduce((acc: any, u) => {
      acc[u.rank] = (acc[u.rank] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const awayUnitData = Object.entries(
    awayUsersList.reduce((acc: any, u) => {
      acc[u.unitId.toUpperCase()] = (acc[u.unitId] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const awayAgeData = ["18-25", "26-35", "36-45", "46-55", "56-60", "61-65"].map(group => {
    const count = awayUsersList.filter(u => {
      if (!u.birthDate) return false;
      const age = new Date().getFullYear() - new Date(u.birthDate).getFullYear();
      if (group === "18-25") return age >= 18 && age <= 25;
      if (group === "26-35") return age >= 26 && age <= 35;
      if (group === "36-45") return age >= 36 && age <= 45;
      if (group === "46-55") return age >= 46 && age <= 55;
      if (group === "56-60") return age >= 56 && age <= 60;
      if (group === "61-65") return age >= 61 && age <= 65;
      return false;
    }).length;
    return { name: group, value: count };
  });

  const filteredUsers = baseFilteredData.filter(u => {
    const searchLower = searchTerm.toLowerCase();
    return u.fullName.toLowerCase().includes(searchLower) ||
           u.nickname.toLowerCase().includes(searchLower) ||
           u.unitName.toLowerCase().includes(searchLower) ||
           u.rg.includes(searchTerm);
  });
  
  const totalUsersCount = dashboardData.length;
  const awayCount = dashboardData.filter(u => u.workTeam === "Afastado" || u.workTeam === "Transferido").length;
  const activeCount = totalUsersCount - awayCount;
  const totalSpent = availableUnits
    .filter(u => unitFilter === "TODAS" || u.id === unitFilter)
    .reduce((acc, unit) => acc + (unit.currentSpend || 0), 0);

  const unitStats = availableUnits
    .filter(u => unitFilter === "TODAS" || u.id === unitFilter)
    .map(unit => {
      const unitUsers = dashboardData.filter(u => u.unitId === unit.id);
      const unitAway = unitUsers.filter(u => u.workTeam === "Afastado" || u.workTeam === "Transferido").length;
      return {
        id: unit.id,
        name: unit.name,
        userCount: unitUsers.length,
        awayCount: unitAway,
        currentSpend: unit.currentSpend,
        budgetLimit: unit.budgetLimit
      };
    });

  const unitDataForChart = unitStats.map(u => ({
    name: u.id.toUpperCase(),
    'Efetivo': u.userCount,
    'Afastados': u.awayCount,
    'Em Serviço': u.userCount - u.awayCount
  }));

  const serviceDistribution = dashboardData.reduce((acc: any, u: any) => {
    let type = u.serviceType;
    if (!type) {
      if (u.workTeam === "ADM") type = "ADM";
      else if (u.workTeam === "Afastado" || u.workTeam === "Transferido") return acc;
      else type = "OPER";
    }
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, { OPER: 0, ADM: 0, ARI: 0, ALI: 0, APOIO: 0 });

  const serviceDataForChart = Object.entries(serviceDistribution).map(([name, value]) => ({
    name,
    value
  }));

  const birthdaysMonth = dashboardData.filter(u => {
    if (!u.birthDate) return false;
    return new Date(u.birthDate).getMonth() === new Date().getMonth();
  });

  const COLORS = {
    OPER: '#4CAF50',
    ADM: '#FFF176',
    ALI: '#FF9800',
    APOIO: '#2196F3',
    ARI: '#E91E63'
  };

  return (
    <div className="min-h-screen bg-[#E0E0E0] flex flex-col font-sans">
      {/* Google Data Studio Style Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50 px-6 py-4">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <img src="/assets/pmgo_logo.png" alt="PMGO" className="h-16 w-auto object-contain" />
            <div className="h-12 w-px bg-gray-200" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800 tracking-tight leading-none uppercase">
                Dashboard do Efetivo - 2º CRPM
              </h1>
              <p className="text-sm font-bold text-gray-400 mt-1 uppercase tracking-[0.2em]">
                Sistema de Gestão de Escalas e Pessoal
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Usuário Logado</p>
              <p className="text-sm font-bold text-gray-700">SUPER-ADMIN CRPM</p>
            </div>
            <img src="/assets/crpm_logo.png" alt="2º CRPM" className="h-16 w-auto object-contain" />
            <Button 
              variant="ghost" 
              onClick={handleLogout}
              className="h-12 w-12 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
            >
              <LogOut className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </header>

      {/* Filter Bar (Data Studio Style) */}
      <div className="bg-[#F8F9FA] border-b border-gray-200 px-6 py-3 flex items-center gap-4 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5 shadow-sm">
          <Filter className="h-4 w-4 text-gray-400" />
          <span className="text-xs font-bold text-gray-500 uppercase mr-2">Unidade</span>
          <select 
            className="text-sm font-bold text-gray-700 outline-none bg-transparent"
            value={unitFilter}
            onChange={(e) => setUnitFilter(e.target.value)}
          >
            {unitList.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5 shadow-sm">
          <Shield className="h-4 w-4 text-gray-400" />
          <span className="text-xs font-bold text-gray-500 uppercase mr-2">Posto/Grad</span>
          <select 
            className="text-sm font-bold text-gray-700 outline-none bg-transparent"
            value={rankFilter}
            onChange={(e) => setRankFilter(e.target.value)}
          >
            {ranks.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5 shadow-sm">
          <Settings className="h-4 w-4 text-gray-400" />
          <span className="text-xs font-bold text-gray-500 uppercase mr-2">Serviço</span>
          <select 
            className="text-sm font-bold text-gray-700 outline-none bg-transparent"
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
          >
            <option value="TODOS">TODOS</option>
            <option value="OPER">OPERACIONAL</option>
            <option value="ADM">ADMINISTRATIVO</option>
            <option value="ALI">ALI</option>
            <option value="ARI">ARI</option>
            <option value="APOIO">APOIO</option>
          </select>
        </div>

        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5 shadow-sm">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span className="text-xs font-bold text-gray-500 uppercase mr-2">Idade</span>
          <select 
            className="text-sm font-bold text-gray-700 outline-none bg-transparent"
            value={ageFilter}
            onChange={(e) => setAgeFilter(e.target.value)}
          >
            <option value="TODAS">TODAS</option>
            <option value="18-25">18 a 25 anos</option>
            <option value="26-35">26 a 35 anos</option>
            <option value="36-45">36 a 45 anos</option>
            <option value="46-55">46 a 55 anos</option>
            <option value="56-60">56 a 60 anos</option>
            <option value="61-65">61 a 65 anos</option>
          </select>
        </div>

        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5 shadow-sm">
          <ClipboardList className="h-4 w-4 text-gray-400" />
          <span className="text-xs font-bold text-gray-500 uppercase mr-2">Função</span>
          <select 
            className="text-sm font-bold text-gray-700 outline-none bg-transparent"
            value={functionFilter}
            onChange={(e) => setFunctionFilter(e.target.value)}
          >
            {functionList.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>

        <div className="flex-1" />

        <Button 
          variant="outline" 
          onClick={loadData}
          className="h-9 gap-2 border-gray-200 rounded-lg bg-white text-xs font-bold text-gray-600 hover:bg-gray-50"
        >
          <RefreshCcw className="h-3.5 w-3.5" /> Atualizar Dados
        </Button>
        <Button 
          className="h-9 gap-2 bg-[#1A3636] hover:bg-[#1A3636]/90 rounded-lg text-xs font-bold text-white shadow-md shadow-gray-200"
          onClick={() => setIsCreatingUnit(true)}
        >
          <Plus className="h-3.5 w-3.5" /> Nova Unidade
        </Button>
      </div>

      <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto space-y-6">
        <Tabs defaultValue="overview" className="w-full space-y-6">
          <div className="flex items-center justify-between">
            <TabsList className="bg-white border border-gray-200 p-1 rounded-xl h-auto shadow-sm">
              <TabsTrigger value="overview" className="rounded-lg py-2 px-6 data-[state=active]:bg-[#1A3636] data-[state=active]:text-white text-xs font-bold uppercase tracking-wider">
                Visão Geral
              </TabsTrigger>
              <TabsTrigger value="personnel" className="rounded-lg py-2 px-6 data-[state=active]:bg-[#1A3636] data-[state=active]:text-white text-xs font-bold uppercase tracking-wider">
                Gestão Global
              </TabsTrigger>
              <TabsTrigger value="away" className="rounded-lg py-2 px-6 data-[state=active]:bg-[#1A3636] data-[state=active]:text-white text-xs font-bold uppercase tracking-wider">
                Afastamentos
              </TabsTrigger>
              <TabsTrigger value="audit" className="rounded-lg py-2 px-6 data-[state=active]:bg-[#1A3636] data-[state=active]:text-white text-xs font-bold uppercase tracking-wider">
                Histórico / Logs
              </TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" className="h-9 gap-2 text-xs font-bold border-gray-200 rounded-lg bg-white">
                <Download className="h-3.5 w-3.5" /> PDF
              </Button>
              <Button variant="outline" className="h-9 gap-2 text-xs font-bold border-gray-200 rounded-lg bg-white">
                <Download className="h-3.5 w-3.5" /> CSV
              </Button>
            </div>
          </div>

          <TabsContent value="overview" className="animate-in fade-in duration-500 space-y-6">
            {/* KPI Cards Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
                <div className="h-1.5 w-full bg-[#00BCD4] rounded-full mb-4" />
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Efetivo Total</p>
                <p className="text-4xl font-black text-gray-900 leading-tight">{totalUsersCount}</p>
                <div className="mt-2 flex items-center gap-1 text-emerald-500 font-bold text-xs">
                  <TrendingUp className="h-3 w-3" /> {rankFilter === 'TODOS' ? '100% Regional' : `Filtrado por ${rankFilter}`}
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
                <div className="h-1.5 w-full bg-[#CDDC39] rounded-full mb-4" />
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Em Serviço Ativo</p>
                <p className="text-4xl font-black text-emerald-600 leading-tight">{activeCount}</p>
                <div className="mt-2 text-gray-400 font-bold text-[10px] uppercase">
                  {totalUsersCount > 0 ? Math.round((activeCount / totalUsersCount) * 100) : 0}% da categoria
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
                <div className="h-1.5 w-full bg-[#FFC107] rounded-full mb-4" />
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Afastamentos</p>
                <p className="text-4xl font-black text-amber-500 leading-tight">{awayCount}</p>
                <div className="mt-2 text-gray-400 font-bold text-[10px] uppercase">
                  Pol. Fora de Escala
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
                <div className="h-1.5 w-full bg-[#1A3636] rounded-full mb-4" />
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Gasto Acumulado</p>
                <p className="text-2xl font-black text-gray-900 leading-tight mt-1">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalSpent)}
                </p>
                <div className="mt-2 text-gray-400 font-bold text-[10px] uppercase">
                  Mês Corrente
                </div>
              </div>
            </div>

            {/* Main Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Bar Chart - Left */}
              <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">Efetivo por Unidade</h2>
                    <p className="text-xs font-bold text-gray-400 uppercase mt-1">Comparativo Regional Consolidado</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 bg-[#1A3636] rounded-full" />
                      <span className="text-[10px] font-bold text-gray-500 uppercase">Total</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 bg-[#ACC18A] rounded-full" />
                      <span className="text-[10px] font-bold text-gray-500 uppercase">Ativo</span>
                    </div>
                  </div>
                </div>
                
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={unitDataForChart} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 700 }}
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 700 }}
                      />
                      <Tooltip 
                        cursor={{ fill: '#f8f9fa' }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 700 }}
                      />
                      <Bar dataKey="Efetivo" fill="#1A3636" radius={[4, 4, 0, 0]} barSize={40} />
                      <Bar dataKey="Em Serviço" fill="#ACC18A" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Sidebar Cards - Right */}
              <div className="space-y-6">
                {/* Service Type Pie Chart */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
                  <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-6">Distribuição de Serviço</h3>
                  <div className="h-[200px] w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={serviceDataForChart}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {serviceDataForChart.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || '#E5E7EB'} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <p className="text-[10px] font-black text-gray-400 uppercase leading-none">Total</p>
                      <p className="text-2xl font-black text-gray-800 leading-tight">{totalUsersCount}</p>
                    </div>
                  </div>
                  
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    {serviceDataForChart.map((entry) => (
                      <div key={entry.name} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[entry.name as keyof typeof COLORS] || '#E5E7EB' }} />
                        <span className="text-[9px] font-black text-gray-600 uppercase flex-1">{entry.name}</span>
                        <span className="text-[10px] font-black text-gray-900">{entry.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Birthdays Card */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-emerald-500" /> Aniversariantes
                    </h3>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">{new Date().toLocaleString('pt-BR', { month: 'long' })}</span>
                  </div>
                  <div className="space-y-3 max-h-[180px] overflow-y-auto pr-2 no-scrollbar">
                    {birthdaysMonth.map((b: any) => (
                      <div key={b.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl transition-colors">
                        <div className="h-8 w-8 rounded-lg bg-emerald-50 flex flex-col items-center justify-center leading-none">
                          <span className="text-[10px] font-black text-emerald-600">{new Date(b.birthDate).getDate()}</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-black text-gray-800 leading-none">{b.nickname}</p>
                          <p className="text-[9px] font-bold text-gray-400 uppercase mt-0.5">{b.unitName}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Units Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {unitStats.map((unit: any) => (
                <div 
                  key={unit.id} 
                  className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                  onClick={() => router.push(`/admin/dashboard?unit=${unit.id}`)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-[#1A3636] transition-colors">
                      <Building2 className="h-5 w-5 text-gray-400 group-hover:text-white" />
                    </div>
                    <div className="text-right leading-none">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{unit.id}</p>
                      <h4 className="text-lg font-black text-gray-800 mt-0.5">{unit.name}</h4>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center p-2 bg-gray-50 rounded-xl">
                      <p className="text-[9px] font-bold text-gray-400 uppercase">Efetivo</p>
                      <p className="text-lg font-black text-gray-800 leading-none mt-1">{unit.userCount}</p>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded-xl">
                      <p className="text-[9px] font-bold text-gray-400 uppercase">Verba</p>
                      <p className={`text-lg font-black leading-none mt-1 ${unit.currentSpend > unit.budgetLimit ? 'text-red-500' : 'text-emerald-500'}`}>
                        {Math.round((unit.currentSpend / unit.budgetLimit) * 100)}%
                      </p>
                    </div>
                  </div>
                  
                  <div className="w-full bg-gray-100 h-1 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${unit.currentSpend > unit.budgetLimit ? 'bg-red-500' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.min(100, (unit.currentSpend / unit.budgetLimit) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="personnel" className="animate-in fade-in duration-500 space-y-6">
            <Card className="border-0 shadow-sm rounded-3xl bg-white overflow-hidden">
              <CardHeader className="p-8 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-black text-gray-800 uppercase">Pesquisa Global de Efetivo</CardTitle>
                    <CardDescription className="font-bold uppercase text-[10px] tracking-widest text-gray-400">Gerenciamento consolidado de todos os militares da região</CardDescription>
                  </div>
                  <div className="flex gap-4">
                    <div className="relative w-72">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input 
                        placeholder="Pesquisar por Nome, RG ou Unidade..." 
                        className="pl-10 h-10 bg-gray-50 border-0 rounded-xl font-bold text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50/50 border-y border-gray-100">
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest w-12 text-center">#</th>
                        <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Identificação Militar (Graduação | RG | Nome)</th>
                        <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Unidade Atual</th>
                        <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Situação</th>
                        <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Comandos</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredUsers.slice(0, 50).map((user: any, idx: number) => {
                        // Lógica para negritar apenas o nome de guerra dentro do nome completo
                        const fullName = user.fullName || "";
                        const nickname = user.nickname || "";
                        const parts = fullName.split(new RegExp(`(${nickname})`, 'gi'));

                        return (
                          <tr key={user.id} className="hover:bg-gray-50/50 transition-all group">
                            <td className="px-6 py-5 text-center">
                              <span className="text-[10px] font-black text-gray-300">{(idx + 1).toString().padStart(2, '0')}</span>
                            </td>
                            <td className="px-8 py-5">
                              <div className="flex items-baseline gap-2">
                                <span className="text-xs font-black text-[#1A3636] uppercase">{user.rank}</span>
                                <span className="text-[10px] font-bold text-gray-400">RG {user.rg}</span>
                                <span className="text-xs text-gray-600 uppercase">
                                  {parts.map((part, i) => 
                                    part.toLowerCase() === nickname.toLowerCase() ? 
                                      <strong key={i} className="text-[#1A3636] font-black">{part}</strong> : 
                                      part
                                  )}
                                </span>
                              </div>
                            </td>
                            <td className="px-8 py-5">
                              <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-widest">
                                {user.unitName}
                              </span>
                            </td>
                            <td className="px-8 py-5">
                              <div className="flex flex-col gap-1">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest w-fit ${
                                  user.workTeam === 'Afastado' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                                }`}>
                                  {user.workTeam === 'Afastado' ? 'Afastado' : 'Ativo'}
                                </span>
                                {user.workTeam === 'Afastado' && user.absenceReason && (
                                  <span className="text-[10px] font-black text-amber-600 uppercase">
                                    {user.absenceReason}
                                  </span>
                                )}
                              </div>
                            </td>
                          <td className="px-8 py-4 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="h-9 w-9 rounded-xl hover:bg-blue-50 text-blue-600"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setTargetUnit(user.unitId);
                                  setIsTransferring(true);
                                }}
                                title="Transferir de Unidade"
                              >
                                <RefreshCcw className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="h-9 w-9 rounded-xl hover:bg-red-50 text-red-600"
                                onClick={() => handleDelete(user)}
                                title="Excluir do Sistema"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
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

          <TabsContent value="away" className="animate-in fade-in duration-500 space-y-8">
            {/* Expanded Charts Section - Top Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* Row 1 */}
              <Card className="border-0 shadow-md rounded-[32px] bg-white p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <CardTitle className="text-sm font-black text-gray-800 uppercase tracking-tight">Análise por Motivo de Afastamento</CardTitle>
                    <CardDescription className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Distribuição regional de licenças e dispensas</CardDescription>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-orange-50 flex items-center justify-center">
                    <ClipboardList className="h-4 w-4 text-orange-500" />
                  </div>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={awayReasonData} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={100} fontSize={10} fontBold axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        cursor={{ fill: '#FFF7ED' }}
                      />
                      <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={24}>
                        {awayReasonData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="border-0 shadow-md rounded-[32px] bg-white p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <CardTitle className="text-sm font-black text-gray-800 uppercase tracking-tight">Distribuição por Graduação</CardTitle>
                    <CardDescription className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Impacto hierárquico nos afastamentos</CardDescription>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center">
                    <Shield className="h-4 w-4 text-emerald-500" />
                  </div>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={awayRankData} margin={{ bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="name" fontSize={9} axisLine={false} tickLine={false} />
                      <YAxis fontSize={9} axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={32}>
                        {awayRankData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Row 2 */}
              <Card className="border-0 shadow-md rounded-[32px] bg-white p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <CardTitle className="text-sm font-black text-gray-800 uppercase tracking-tight">Indisponibilidade por Unidade</CardTitle>
                    <CardDescription className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Comparativo entre Batalhões e CIPMs</CardDescription>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
                    <Building2 className="h-4 w-4 text-blue-500" />
                  </div>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={awayUnitData} margin={{ bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="name" fontSize={9} axisLine={false} tickLine={false} />
                      <YAxis fontSize={9} axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={40}>
                        {awayUnitData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[(index + 4) % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="border-0 shadow-md rounded-[32px] bg-white p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <CardTitle className="text-sm font-black text-gray-800 uppercase tracking-tight">Análise por Faixa Etária</CardTitle>
                    <CardDescription className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Perfil demográfico dos afastamentos</CardDescription>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center">
                    <Users className="h-4 w-4 text-indigo-500" />
                  </div>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={awayAgeData} margin={{ bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="name" fontSize={9} axisLine={false} tickLine={false} />
                      <YAxis fontSize={9} axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={40}>
                        {awayAgeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[(index + 6) % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>

            {/* List Section - Bottom Full Width */}
            <Card className="border-0 shadow-md rounded-[40px] bg-white overflow-hidden">
              <CardHeader className="p-8 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-black text-gray-800 uppercase text-orange-600">Militares Afastados (Relação Nominal)</CardTitle>
                    <CardDescription className="font-bold uppercase text-[10px] tracking-widest text-gray-400">Relação de policiais em escala extra-ordinária (Férias, Licenças, etc)</CardDescription>
                  </div>
                  <div className="h-12 w-12 rounded-2xl bg-orange-50 flex items-center justify-center">
                    <UserCheck className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/50 border-y border-gray-100">
                        <th className="px-10 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Militar</th>
                        <th className="px-10 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">RG / Identificação</th>
                        <th className="px-10 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Última Unidade</th>
                        <th className="px-10 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status / Motivo</th>
                        <th className="px-10 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {awayUsersList.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-10 py-20 text-center text-gray-400 font-bold uppercase text-xs tracking-widest">Nenhum afastamento registrado na região no momento.</td>
                        </tr>
                      ) : (
                        awayUsersList.map((user: any, idx: number) => {
                          const fullName = user.fullName || "";
                          const nickname = user.nickname || "";
                          const parts = fullName.split(new RegExp(`(${nickname})`, 'gi'));

                          return (
                            <tr key={user.id} className="hover:bg-gray-50/50 transition-all group">
                              <td className="px-6 py-5 text-center">
                                <span className="text-[10px] font-black text-gray-300">{(idx + 1).toString().padStart(2, '0')}</span>
                              </td>
                              <td className="px-10 py-5">
                                <div className="flex items-baseline gap-2">
                                  <span className="text-xs font-black text-[#1A3636] uppercase">{user.rank}</span>
                                  <span className="text-[10px] font-bold text-gray-400">RG {user.rg}</span>
                                  <span className="text-xs text-gray-600 uppercase">
                                    {parts.map((part, i) => 
                                      part.toLowerCase() === nickname.toLowerCase() ? 
                                        <strong key={i} className="text-[#1A3636] font-black">{part}</strong> : 
                                        part
                                    )}
                                  </span>
                                </div>
                              </td>
                              <td className="px-10 py-6">
                                <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-widest">
                                  {user.unitName}
                                </span>
                              </td>
                              <td className="px-10 py-6">
                                <div className="flex flex-col gap-1.5">
                                  <span className="px-4 py-1 rounded-xl bg-orange-100 text-orange-700 text-[10px] font-black uppercase tracking-widest w-fit">
                                    {user.workTeam}
                                  </span>
                                  {user.absenceReason && (
                                    <span className="text-[11px] font-black text-orange-600 uppercase tracking-tight ml-1">
                                      {user.absenceReason}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-10 py-6 text-right">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-10 px-4 text-[#1A3636] font-bold text-[10px] uppercase hover:bg-gray-100 rounded-2xl transition-all opacity-0 group-hover:opacity-100"
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setTargetUnit(user.unitId);
                                    setIsTransferring(true);
                                  }}
                                >
                                  <RefreshCcw className="h-3.5 w-3.5 mr-2" /> Transferir
                                </Button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit" className="animate-in fade-in duration-500">
            <Card className="border-0 shadow-sm rounded-3xl bg-white overflow-hidden">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="text-xl font-black text-gray-800 uppercase">Log de Auditoria Regional</CardTitle>
                <CardDescription className="font-bold uppercase text-[10px] tracking-widest text-gray-400">Histórico de transferências e alterações críticas no sistema</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50/50 border-y border-gray-100">
                        <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Data</th>
                        <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Ação</th>
                        <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Militar</th>
                        <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Movimentação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {auditLogs.map((log: any) => {
                        const targetUser = users.find(u => u.id === log.targetId);
                        return (
                          <tr key={log.id} className="hover:bg-gray-50/30 transition-colors">
                            <td className="px-8 py-4">
                              <p className="text-xs font-black text-gray-800">{new Date(log.createdAt).toLocaleDateString('pt-BR')}</p>
                              <p className="text-[10px] font-bold text-gray-400 uppercase">{new Date(log.createdAt).toLocaleTimeString('pt-BR')}</p>
                            </td>
                            <td className="px-8 py-4">
                              <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-[9px] font-black uppercase tracking-widest">
                                {log.action}
                              </span>
                            </td>
                            <td className="px-8 py-4">
                              <p className="text-xs font-black text-gray-800">{targetUser?.rank} {targetUser?.nickname}</p>
                              <p className="text-[10px] font-bold text-gray-400 uppercase">RG: {targetUser?.rg}</p>
                            </td>
                            <td className="px-8 py-4">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-gray-500 uppercase">{log.fromValue}</span>
                                <ArrowLeft className="h-3 w-3 text-gray-300 rotate-180" />
                                <span className="text-[10px] font-black text-emerald-600 uppercase">{log.toValue}</span>
                              </div>
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
        </Tabs>
      </main>

      {/* Modals */}
      {isCreatingUnit && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <Card className="w-full max-w-md border-0 shadow-2xl rounded-[40px] overflow-hidden">
            <CardHeader className="bg-[#1A3636] text-white p-8">
              <CardTitle className="text-2xl font-black">Nova Unidade</CardTitle>
              <CardDescription className="text-white/60 font-bold uppercase text-[10px] tracking-widest">Cadastrar novo Batalhão ou Companhia</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-gray-400 uppercase ml-1">ID da Unidade</Label>
                <Input 
                  value={newUnit.id}
                  onChange={(e) => setNewUnit({...newUnit, id: e.target.value.toLowerCase().replace(/\s/g, '')})}
                  className="h-12 bg-gray-50 border-0 rounded-2xl font-bold"
                  placeholder="39bpm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-gray-400 uppercase ml-1">Nome Completo</Label>
                <Input 
                  value={newUnit.name}
                  onChange={(e) => setNewUnit({...newUnit, name: e.target.value})}
                  className="h-12 bg-gray-50 border-0 rounded-2xl font-bold"
                  placeholder="39º Batalhão de Polícia Militar"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-gray-400 uppercase ml-1">Teto Orçamentário (R$)</Label>
                <Input 
                  type="number"
                  value={newUnit.budgetLimit}
                  onChange={(e) => setNewUnit({...newUnit, budgetLimit: Number(e.target.value)})}
                  className="h-12 bg-gray-50 border-0 rounded-2xl font-bold"
                />
              </div>
            </CardContent>
            <CardFooter className="p-8 pt-0 flex gap-3">
              <Button variant="ghost" onClick={() => setIsCreatingUnit(false)} className="flex-1 h-12 rounded-2xl font-bold">Cancelar</Button>
              <Button onClick={handleCreateUnit} className="flex-[2] h-12 bg-[#1A3636] hover:bg-[#1A3636]/90 rounded-2xl font-bold text-white shadow-lg">Cadastrar</Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {isTransferring && selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <Card className="w-full max-w-md border-0 shadow-2xl rounded-[40px] overflow-hidden">
            <CardHeader className="bg-[#1A3636] text-white p-8">
              <CardTitle className="text-xl font-black">Transferência de Militar</CardTitle>
              <CardDescription className="text-white/60 font-bold uppercase text-[10px] tracking-widest">Movimentação Regional de Efetivo</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="p-4 bg-gray-50 rounded-2xl">
                <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Militar</p>
                <p className="font-black text-gray-900">{selectedUser.rank} {selectedUser.nickname}</p>
                <p className="text-[10px] font-bold text-gray-500 mt-1 uppercase">Lotação Atual: {selectedUser.unitName}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black text-gray-400 uppercase ml-1">Destino</Label>
                <select 
                  className="w-full h-14 bg-gray-50 border-0 rounded-2xl font-bold px-6 appearance-none outline-none focus:ring-2 ring-emerald-500/20"
                  value={targetUnit}
                  onChange={(e) => setTargetUnit(e.target.value)}
                >
                  {availableUnits.map(unit => (
                    <option key={unit.id} value={unit.id}>{unit.name} ({unit.id})</option>
                  ))}
                </select>
              </div>
            </CardContent>
            <CardFooter className="p-8 pt-0 flex gap-3">
              <Button variant="ghost" onClick={() => setIsTransferring(false)} className="flex-1 h-12 rounded-2xl font-bold">Cancelar</Button>
              <Button 
                onClick={handleTransfer}
                disabled={isUpdating || targetUnit === selectedUser.unitId}
                className="flex-[2] h-12 bg-[#1A3636] hover:bg-[#1A3636]/90 rounded-2xl font-bold text-white"
              >
                {isUpdating ? "Processando..." : "Confirmar Transferência"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
