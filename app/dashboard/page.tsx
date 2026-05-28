"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, ClipboardList, Clock, UserCheck, Calculator, ChevronLeft, ChevronRight } from "lucide-react";
import { getUsers, getSchedules, getSettings, getCurrentUser } from "@/lib/actions";
import { calculateUserAc4Summary, getSaoPauloDateParts } from "@/lib/utils/calculations";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

export default function DashboardPage() {
  const [usersList, setUsersList] = useState<any[]>([]);
  const [schedulesList, setSchedulesList] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const spToday = getSaoPauloDateParts(new Date());
    return { month: spToday.month, year: spToday.year };
  });

  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    async function load() {
      const [resU, resS, resSet, resMe] = await Promise.all([getUsers(), getSchedules(), getSettings(), getCurrentUser()]);
      if (resU && resU.success) setUsersList(resU.users);
      if (resS && resS.success) setSchedulesList(resS.schedules);
      if (resSet && resSet.success) setSettings(resSet.settings);
      if (resMe && resMe.success) setCurrentUser(resMe.user);
    }
    load();
  }, []);

  const activeUser = currentUser || { id: "" };

  const ac4 = settings && activeUser.id ? calculateUserAc4Summary(
    activeUser.id, 
    schedulesList, 
    settings.ac4Rates, 
    currentMonth.month, 
    currentMonth.year
  ) : { totalHours: 0, totalValue: 0, extraCount: 0 };

  const stats = [
    { 
      title: "Escalas no Mês", 
      value: `${ac4.extraCount}`, 
      icon: Calendar, 
      description: "Serviços no período",
      gradient: "from-blue-500/10 to-transparent",
      iconColor: "text-blue-500"
    },
    { 
      title: "Horas no Mês", 
      value: `${ac4.totalHours}h`, 
      icon: Clock, 
      description: "Total acumulado",
      gradient: "from-emerald-500/10 to-transparent",
      iconColor: "text-emerald-500"
    },
    { 
      title: "Previsão AC-4", 
      value: ac4.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 
      icon: Calculator, 
      description: "Valor bruto estimado",
      gradient: "from-[#79A3B1]/10 to-transparent",
      iconColor: "text-[#79A3B1]"
    },
  ];

  const monthSchedules = schedulesList
    .filter(s => {
      if (!s.userIds || !s.userIds.includes(activeUser.id)) return false;
      const startParts = getSaoPauloDateParts(new Date(s.startTime));
      return startParts.month === currentMonth.month && startParts.year === currentMonth.year;
    })
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          Visão Geral
        </h1>
        <p className="text-gray-500 mt-1">
          Bem-vindo ao sistema de gerenciamento de escalas.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx} className={`border-0 shadow-xl bg-white relative overflow-hidden group hover:shadow-2xl transition-all duration-300`}>
              <div className={`absolute top-0 left-0 w-full h-full bg-gradient-to-br ${stat.gradient} opacity-50`} />
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
                <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg bg-white shadow-sm ${stat.iconColor}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-black text-gray-900 mb-1">{stat.value}</div>
                <p className="text-xs font-medium text-gray-400">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Proximas Escalas List */}
        <Card className="lg:col-span-1 border-0 shadow-lg bg-white overflow-hidden">
          <CardHeader className="bg-gray-50/50 border-b">
            <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-[#79A3B1]" />
              Suas Escalas no Mês
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 max-h-[400px] overflow-y-auto">
            {monthSchedules.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {monthSchedules.map((s, idx) => {
                  const start = new Date(s.startTime);
                  const startParts = getSaoPauloDateParts(start);
                  return (
                    <div key={idx} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-center justify-center w-12 h-12 bg-[#79A3B1]/10 rounded-xl text-[#79A3B1]">
                          <span className="text-xs font-bold uppercase">{start.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', month: 'short' }).replace('.', '')}</span>
                          <span className="text-lg font-black leading-none">{startParts.day}</span>
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">{s.scheduleName}</div>
                          <div className="text-xs text-gray-500">
                            {start.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' })} - {new Date(s.endTime).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                      <div className="bg-emerald-500/10 text-emerald-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase">
                        Confirmado
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-400 text-sm italic">
                Nenhuma escala agendada para este mês.
              </div>
            )}
            <div className="p-4 bg-gray-50 border-t sticky bottom-0 z-10">
              <p className="text-[10px] text-center text-gray-400 uppercase font-bold tracking-widest">
                Consulte o calendário ao lado
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Calendar do mês completo com cores */}
        <Card className="lg:col-span-2 border-0 shadow-lg bg-white overflow-hidden">

        <CardHeader>
          <CardTitle style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#79A3B1' }}>
            Calendário do Mês
          </CardTitle>
          <CardDescription>
            Escalas para o mês corrente: vermelho = escala ordinária, verde = AC‑4 extra.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          {/* Month navigation menu */}
          <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
            <div className="flex items-center gap-2 flex-1 min-w-[250px]">
              <Select 
                value={currentMonth.month.toString()} 
                onValueChange={(val) => {
                  setCurrentMonth(prev => ({ ...prev, month: parseInt(val) }));
                }}
              >
                <SelectTrigger className="flex-1 sm:w-[140px] bg-white border-gray-200">
                  <SelectValue placeholder="Mês" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i} value={i.toString()} className="capitalize">
                      {new Date(2000, i, 1).toLocaleString('pt-BR', { month: 'long' })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select 
                value={currentMonth.year.toString()} 
                onValueChange={(val) => {
                  setCurrentMonth(prev => ({ ...prev, year: parseInt(val) }));
                }}
              >
                <SelectTrigger className="w-[90px] sm:w-[100px] bg-white border-gray-200">
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 11 }, (_, i) => {
                    const y = new Date().getFullYear() - 5 + i;
                    return <SelectItem key={y} value={y.toString()}>{y}</SelectItem>;
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden ml-auto">
              <button
                onClick={() => {
                  setCurrentMonth(prev => {
                    let m = prev.month - 1;
                    let y = prev.year;
                    if (m < 0) {
                      m = 11;
                      y -= 1;
                    }
                    return { month: m, year: y };
                  });
                }}
                className="p-2 hover:bg-gray-50 text-gray-600 border-r border-gray-100 transition-colors"
                title="Mês anterior"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => {
                  setCurrentMonth(prev => {
                    let m = prev.month + 1;
                    let y = prev.year;
                    if (m > 11) {
                      m = 0;
                      y += 1;
                    }
                    return { month: m, year: y };
                  });
                }}
                className="p-2 hover:bg-gray-50 text-gray-600 transition-colors"
                title="Próximo mês"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
          {/* Month calendar grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {/* Weekday headers */}
            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, idx) => (
              <div key={idx} className="text-center text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest">
                {d}
              </div>
            ))}
            {/* Day cells */}
            {(() => {
              const year = currentMonth.year;
              const month = currentMonth.month; // 0‑based
              const firstDay = new Date(year, month, 1);
              const startWeekDay = firstDay.getDay(); // 0 = Sun
              const daysInMonth = new Date(year, month + 1, 0).getDate();
              const cells = [];
              // Empty cells before the first day
              for (let i = 0; i < startWeekDay; i++) {
                cells.push(<div key={`empty-${i}`} className="p-2" />);
              }
              // Populate each day
              for (let d = 1; d <= daysInMonth; d++) {
                const pad = (n: number) => n.toString().padStart(2, '0');
                const dayStr = `${year}-${pad(month + 1)}-${pad(d)}`;
                
                const hasOrdinary = schedulesList.some((s) => {
                  if (!s.userIds?.includes(activeUser.id)) return false;
                  const startParts = getSaoPauloDateParts(new Date(s.startTime));
                  const sDayStr = `${startParts.year}-${pad(startParts.month + 1)}-${pad(startParts.day)}`;
                  return sDayStr === dayStr;
                });
                
                const hasAc4 = settings ? schedulesList.some((s) => {
                  if (!s.userIds?.includes(activeUser.id)) return false;
                  const startParts = getSaoPauloDateParts(new Date(s.startTime));
                  const sDayStr = `${startParts.year}-${pad(startParts.month + 1)}-${pad(startParts.day)}`;
                  return sDayStr === dayStr && !hasOrdinary;
                }) : false;

                const bg = hasOrdinary ? 'bg-red-500 ring-2 ring-red-500 ring-offset-2' : hasAc4 ? 'bg-emerald-500 ring-2 ring-emerald-500 ring-offset-2' : 'bg-gray-100 text-gray-400';
                
                const spToday = getSaoPauloDateParts(new Date());
                const isToday = spToday.year === year && spToday.month === month && spToday.day === d;
                
                cells.push(
                  <div 
                    key={d} 
                    className={`p-1 sm:p-2 text-center rounded-lg ${bg} ${hasOrdinary || hasAc4 ? 'text-white font-bold shadow-sm' : ''} transition-all relative ${isToday ? 'border-2 border-[#79A3B1]' : ''}`}
                  >
                    <span className="relative z-10 text-xs sm:text-sm">{d}</span>
                    {isToday && (
                      <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-[#79A3B1] rounded-full" />
                    )}
                  </div>
                );
              }
              return cells;
            })()}
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
