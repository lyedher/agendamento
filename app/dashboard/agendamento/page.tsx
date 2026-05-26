"use client";
 
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, ClipboardList, Clock, UserCheck, Calculator, ChevronLeft, ChevronRight, UserPlus, CheckCircle2, AlertCircle, Users, Lock } from "lucide-react";
import { getUsers, getSchedules, volunteerToSchedule, unvolunteerFromSchedule, getSettings, getCurrentUser } from "@/lib/actions";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
 
export default function AgendamentoPage() {
  const [usersList, setUsersList] = useState<any[]>([]);
  const [schedulesList, setSchedulesList] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [expandedSchedules, setExpandedSchedules] = useState<Record<string, boolean>>({});
  const [currentUser, setCurrentUser] = useState<any>(null);
 
  const toggleExpandSchedule = (scheduleId: string) => {
    setExpandedSchedules(prev => ({
      ...prev,
      [scheduleId]: !prev[scheduleId]
    }));
  };
 
  useEffect(() => {
    loadData();
  }, []);
 
  async function loadData() {
    const [resU, resS, resSet, resMe] = await Promise.all([getUsers(), getSchedules(), getSettings(), getCurrentUser()]);
    if (resU.success) setUsersList(resU.users);
    if (resS.success) setSchedulesList(resS.schedules);
    if (resSet.success) setSettings(resSet.settings);
    if (resMe.success) setCurrentUser(resMe.user);
  }
 
  const activeUser = currentUser || { id: "" };
 
  const currentYear = currentMonth.getFullYear();
 
  const userMonthlyQuotaCount = schedulesList.filter(s => 
    s.userIds?.includes(activeUser.id) &&
    new Date(s.startTime).getMonth() === currentMonth.getMonth() &&
    new Date(s.startTime).getFullYear() === currentYear
  ).length;
 
  const isWindowOpen = settings ? (
    new Date() >= new Date(settings.openDateTime) && 
    new Date() <= new Date(settings.closeDateTime)
  ) : true;
 
  const handleVolunteer = async (scheduleId: string) => {
    setIsLoading(true);
    setMessage(null);
    const res = await volunteerToSchedule(scheduleId, activeUser.id);
    if (res.success) {
      setMessage({ text: "Inscrição realizada com sucesso!", type: 'success' });
      await loadData();
    } else {
      setMessage({ text: res.message || "Erro ao se inscrever.", type: 'error' });
    }
    setIsLoading(false);
  };
 
  const handleUnvolunteer = async (scheduleId: string) => {
    setIsLoading(true);
    setMessage(null);
    const res = await unvolunteerFromSchedule(scheduleId, activeUser.id);
    if (res.success) {
      setMessage({ text: "Inscrição cancelada.", type: 'success' });
      await loadData();
    } else {
      setMessage({ text: res.message || "Erro ao cancelar.", type: 'error' });
    }
    setIsLoading(false);
  };

  const selectedDateStr = selectedDate ? selectedDate.toISOString().split('T')[0] : "";
  const schedulesForSelectedDate = schedulesList.filter(s => s.startTime?.startsWith(selectedDateStr));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Agendamento de Escalas
          </h1>
          <p className="text-gray-500 mt-1">
            Selecione um dia no calendário para ver as vagas de AC-4 disponíveis.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {settings && (
          <Card className={`border-0 shadow-md ${isWindowOpen ? 'bg-emerald-50 border-emerald-100' : 'bg-orange-50 border-orange-100'}`}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${isWindowOpen ? 'bg-emerald-500 text-white' : 'bg-orange-500 text-white'}`}>
                {isWindowOpen ? <Clock size={20} /> : <Lock size={20} />}
              </div>
              <div>
                <p className={`text-[10px] font-black uppercase tracking-widest ${isWindowOpen ? 'text-emerald-600' : 'text-orange-600'}`}>
                  {isWindowOpen ? 'Agendamento Aberto' : 'Agendamento Fechado'}
                </p>
                <p className="text-xs text-gray-500 font-medium">
                  {isWindowOpen 
                    ? `Encerra em: ${new Date(settings.closeDateTime).toLocaleString('pt-BR')}`
                    : `Abre em: ${new Date(settings.openDateTime).toLocaleString('pt-BR')}`}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {settings && (
          <Card className="border-0 shadow-md bg-white">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-[#79A3B1] text-white flex items-center justify-center">
                <Calculator size={20} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] font-black text-[#79A3B1] uppercase tracking-widest">Sua Cota Mensal</p>
                  <span className="text-xs font-bold text-gray-700">{userMonthlyQuotaCount}/{settings.maxMonthlySlots}</span>
                </div>
                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all ${userMonthlyQuotaCount >= settings.maxMonthlySlots ? 'bg-orange-500' : 'bg-[#79A3B1]'}`}
                    style={{ width: `${Math.min(100, (userMonthlyQuotaCount / settings.maxMonthlySlots) * 100)}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-300 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-blue-50 text-blue-700 border border-blue-100'}`}>
          {message.type === 'success' ? <CheckCircle2 size={20} /> : message.type === 'error' ? <AlertCircle size={20} /> : <Clock size={20} />}
          <span className="font-medium">{message.text}</span>
          <button className="ml-auto text-current opacity-50 hover:opacity-100" onClick={() => setMessage(null)}>&times;</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Calendar Section */}
        <Card className="lg:col-span-5 border-0 shadow-lg bg-white overflow-hidden">
          <CardHeader className="bg-gray-50/50 border-b">
            <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#79A3B1]" />
              Calendário de Vagas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-2 mb-6">
              <Select 
                value={currentMonth.getMonth().toString()} 
                onValueChange={(val) => {
                  const d = new Date(currentMonth);
                  d.setMonth(parseInt(val));
                  setCurrentMonth(d);
                }}
              >
                <SelectTrigger className="flex-1 bg-white border-gray-200">
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
                value={currentMonth.getFullYear().toString()} 
                onValueChange={(val) => {
                  const d = new Date(currentMonth);
                  d.setFullYear(parseInt(val));
                  setCurrentMonth(d);
                }}
              >
                <SelectTrigger className="w-[100px] bg-white border-gray-200">
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => {
                    const y = new Date().getFullYear() - 1 + i;
                    return <SelectItem key={y} value={y.toString()}>{y}</SelectItem>;
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, idx) => (
                <div key={idx} className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest pb-2">
                  {d}
                </div>
              ))}
              {(() => {
                const year = currentMonth.getFullYear();
                const month = currentMonth.getMonth();
                const firstDay = new Date(year, month, 1);
                const startWeekDay = firstDay.getDay();
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                const cells = [];

                for (let i = 0; i < startWeekDay; i++) {
                  cells.push(<div key={`empty-${i}`} />);
                }

                for (let d = 1; d <= daysInMonth; d++) {
                  const dayDate = new Date(year, month, d);
                  const dayStr = dayDate.toISOString().split('T')[0];
                  const isSelected = selectedDateStr === dayStr;
                  const isToday = new Date().toDateString() === dayDate.toDateString();
                  
                  // Check if has available vacancies
                  const daySchedules = schedulesList.filter(s => s.startTime?.startsWith(dayStr));
                  const hasVacancies = daySchedules.some(s => (s.userIds?.length || 0) < s.capacity);
                  const isFullyBooked = daySchedules.length > 0 && daySchedules.every(s => (s.userIds?.length || 0) >= s.capacity);

                  let bg = "bg-gray-50 text-gray-400 hover:bg-gray-100";
                  if (hasVacancies) bg = "bg-emerald-50 text-emerald-600 font-bold border border-emerald-100 hover:bg-emerald-100";
                  else if (isFullyBooked) bg = "bg-orange-50 text-orange-600 border border-orange-100";
                  
                  if (isSelected) bg = "bg-[#79A3B1] text-white font-bold shadow-md ring-2 ring-[#79A3B1] ring-offset-2";

                  cells.push(
                    <button 
                      key={d} 
                      onClick={() => setSelectedDate(dayDate)}
                      className={`h-10 w-10 sm:h-12 sm:w-12 mx-auto flex items-center justify-center rounded-xl transition-all relative ${bg}`}
                    >
                      <span className="relative z-10">{d}</span>
                      {isToday && !isSelected && (
                        <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#79A3B1] rounded-full" />
                      )}
                    </button>
                  );
                }
                return cells;
              })()}
            </div>

            <div className="mt-8 pt-6 border-t space-y-3">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Legenda</h4>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <div className="w-3 h-3 bg-emerald-500 rounded-sm" />
                  <span>Vagas Disponíveis</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <div className="w-3 h-3 bg-orange-500 rounded-sm" />
                  <span>Vagas Esgotadas</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <div className="w-3 h-3 bg-gray-200 rounded-sm" />
                  <span>Sem Escalas</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vacancies List Section */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-800">
              {selectedDate ? selectedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : "Selecione uma data"}
            </h3>
            <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {schedulesForSelectedDate.length} {schedulesForSelectedDate.length === 1 ? 'escala encontrada' : 'escalas encontradas'}
            </span>
          </div>

          {schedulesForSelectedDate.length > 0 ? (
            <div className="grid gap-4">
              {schedulesForSelectedDate.map((s) => {
                const isVolunteered = s.userIds?.includes(activeUser.id);
                const isFull = (s.userIds?.length || 0) >= s.capacity;
                const start = new Date(s.startTime);
                const end = new Date(s.endTime);

                const isClosed = isFull || new Date(s.endTime) < new Date() || !isWindowOpen;
                const hasVacancy = !isFull && (s.capacity - (s.userIds?.length || 0) >= 1);
                const showVolunteersOption = hasVacancy && (s.userIds?.length || 0) > 0;
                const showVolunteersDirectly = isClosed && (s.userIds?.length || 0) > 0;
                const isExpanded = !!expandedSchedules[s.id];

                return (
                  <Card key={s.id} className={`border-0 shadow-md overflow-hidden ${isVolunteered ? 'ring-2 ring-emerald-500' : ''}`}>
                    <div className="flex flex-col md:flex-row">
                      <div className={`md:w-32 flex flex-col items-center justify-center p-4 text-white ${isVolunteered ? 'bg-emerald-500' : 'bg-[#79A3B1]'}`}>
                        <Clock size={24} className="mb-1 opacity-80" />
                        <span className="text-lg font-black">{start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="text-[10px] uppercase opacity-80 font-bold">Início</span>
                      </div>
                      
                      <CardContent className="flex-1 p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-lg font-bold text-gray-900">{s.scheduleName}</h4>
                              {isVolunteered && (
                                <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                                  <CheckCircle2 size={10} /> Você está aqui
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500">
                              Término previsto: {end.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} ({end.toLocaleDateString('pt-BR')})
                            </p>
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            <div className="text-right">
                              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Vagas</div>
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-24 bg-gray-100 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full transition-all ${isFull ? 'bg-orange-500' : 'bg-emerald-500'}`} 
                                    style={{ width: `${Math.min(100, ((s.userIds?.length || 0) / s.capacity) * 100)}%` }} 
                                  />
                                </div>
                                <span className="text-sm font-bold text-gray-700">
                                  {s.userIds?.length || 0}/{s.capacity}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-6 flex flex-wrap items-center gap-3 border-t pt-4">
                          {isVolunteered ? (
                            <Button 
                              variant="outline" 
                              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                              onClick={() => handleUnvolunteer(s.id)}
                              disabled={isLoading}
                            >
                              Cancelar Voluntariado
                            </Button>
                          ) : (
                            <Button 
                              className="bg-[#79A3B1] hover:bg-[#658b99] text-white shadow-lg shadow-[#79A3B1]/20 flex items-center gap-2"
                              disabled={isFull || isLoading || !isWindowOpen || (settings && userMonthlyQuotaCount >= settings.maxMonthlySlots)}
                              onClick={() => handleVolunteer(s.id)}
                            >
                              <UserPlus size={18} />
                              {isFull 
                                ? "Vagas Esgotadas" 
                                : !isWindowOpen 
                                  ? "Agendamento Fechado" 
                                  : (settings && userMonthlyQuotaCount >= settings.maxMonthlySlots)
                                    ? "Limite Mensal Atingido"
                                    : "Voluntariar-se"}
                            </Button>
                          )}
                          
                          <div className="flex items-center gap-3 ml-auto">
                            {showVolunteersOption && (
                              <Button
                                variant="ghost"
                                size="sm"
                                type="button"
                                className="text-xs text-[#79A3B1] hover:text-[#5c7f8c] font-black p-0 h-auto flex items-center gap-1 hover:bg-transparent"
                                onClick={() => toggleExpandSchedule(s.id)}
                              >
                                <Users size={14} />
                                {isExpanded ? "Ocultar Quem Já Pegou" : "Ver Quem Já Pegou"}
                              </Button>
                            )}

                            <div className="flex -space-x-2">
                              {s.userIds?.slice(0, 5).map((uid: string) => {
                                const u = usersList.find(usr => usr.id === uid);
                                const nameTitle = u ? `${u.rank} ${u.nickname}` : "Policial Escalado";
                                return (
                                  <div key={uid} className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center overflow-hidden cursor-help" title={nameTitle}>
                                    <Users size={14} className="text-gray-400" />
                                  </div>
                                );
                              })}
                              {(s.userIds?.length || 0) > 5 && (
                                <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500">
                                  +{(s.userIds?.length || 0) - 5}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {((showVolunteersOption && isExpanded) || showVolunteersDirectly) && (
                          <div className="mt-4 p-3 bg-gray-50 border border-gray-100 rounded-xl animate-in fade-in duration-200">
                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                              <Users size={12} className="text-gray-400" />
                              {isClosed ? "Militares Escalados (Escala Encerrada)" : "Quem já pegou esta escala"}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {s.userIds.map((uid: string) => {
                                const u = usersList.find(usr => usr.id === uid);
                                if (!u) return null;
                                return (
                                  <span key={u.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-gray-200 text-xs font-bold text-gray-700 rounded-lg shadow-sm">
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                    {u.rank} {u.nickname}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="h-8 w-8 text-gray-300" />
              </div>
              <h4 className="text-lg font-bold text-gray-900">Sem vagas para esta data</h4>
              <p className="text-sm text-gray-500 max-w-xs mt-2">
                Não há escalas criadas para o dia selecionado. Tente selecionar outro dia ou consulte o administrador.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
