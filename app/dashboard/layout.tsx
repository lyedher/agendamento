"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Calendar, Users, LogOut, Shield, Clock, Plus, Calculator, FileText, ClipboardList, User, Instagram, MessageCircle } from "lucide-react";
import { getUsers, getSchedules, updateUser, logout, getCurrentUser } from "@/lib/actions";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [usersList, setUsersList] = useState<any[]>([]);
  const [schedulesList, setSchedulesList] = useState<any[]>([]);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isAc4ModalOpen, setIsAc4ModalOpen] = useState(false);

  const [isFichaModalOpen, setIsFichaModalOpen] = useState(false);
  const [fichaTab, setFichaTab] = useState<'ac4' | 'pontuacao'>('ac4');
  const [pontuacaoData, setPontuacaoData] = useState({
    dataInclusao: "",
    notaCfsd: "",
    notaCfc: "",
    notaCfs: "",
    notaCas: "",
    cursosHoras: "",
    graduacao: false,
    posGraduacao: false,
    mestrado: false,
    doutorado: false,
    qtdElogios: "",
    domPedroII: false,
    tiradentes: false,
    anhanguera: false,
    meritoPolicial: false,
    meritoMagisterio: false,
    meritoIntelectual: false,
    guardiao: false,
    mauroBorges: false,
    servicoDistinto: false,
    destaqueBronze: false,
    destaquePrata: false,
    destaqueOuro: false,
    dezAnos: false,
    vinteAnos: false,
    trintaAnos: false,
    centoCinquentaAnos: false,
    coIrmasCount: "",
    tafScore: "",
    crimeDoloso: "",
    crimeCulposo: "",
    prisaoDisciplinar: "",
    detencaoDisciplinar: "",
    repreensao: ""
  });
  const [simStart, setSimStart] = useState("");
  const [simEnd, setSimEnd] = useState("");
  const [simResult, setSimResult] = useState<any | null>(null);

  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      const [resUsers, resSchedules, resMe] = await Promise.all([getUsers(), getSchedules(), getCurrentUser()]);
      if (resUsers.success) setUsersList(resUsers.users);
      if (resSchedules.success) setSchedulesList(resSchedules.schedules);
      if (resMe.success) setCurrentUser(resMe.user);
    }
    loadData();
  }, []);

  // Use a fallback for UI while loading
  const currentAdmin = currentUser || { nickname: "Policial", rg: "00.000", rank: "SD" };

  useEffect(() => {
    if (currentUser && currentUser.fichaData) {
      try {
        const parsed = JSON.parse(currentUser.fichaData);
        setPontuacaoData(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error("Erro ao carregar ficha salva", e);
      }
    }
  }, [currentUser]);

  const [isSavingFicha, setIsSavingFicha] = useState(false);

  const handleSaveFicha = async () => {
    if (!currentUser || !currentUser.id) return;
    setIsSavingFicha(true);
    const res = await updateUser(currentUser.id, { fichaData: JSON.stringify(pontuacaoData) });
    setIsSavingFicha(false);
    if (res.success) {
      // Atualiza a lista local
      setUsersList(prev => prev.map(u => u.id === currentUser.id ? { ...u, fichaData: JSON.stringify(pontuacaoData) } : u));
      alert("Pontuação da Ficha salva com sucesso!");
    } else {
      alert("Falha ao salvar pontuação: " + res.message);
    }
  };

  const formatRG = (rg: string) => {
    if (!rg) return "—";
    const clean = rg.replace(/\D/g, '');
    if (clean.length >= 5) {
      return `${clean.slice(0, 2)}.${clean.slice(2, 5)}`;
    }
    return rg;
  };

  const handleSimulateAc4 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simStart || !simEnd) return;

    const start = new Date(simStart);
    const end = new Date(simEnd);
    if (end <= start) {
      // Caso o horário final seja menor ou igual ao inicial, assume que cruzou a meia-noite
      end.setDate(end.getDate() + 1);
    }

    const rates = { blueDay: 35.0, blueNight: 42.0, redDay: 45.0, redNight: 52.0 };
    let totalHours = 0, totalValue = 0;
    let blueDay = 0, blueNight = 0, redDay = 0, redNight = 0;

    const current = new Date(start);
    while (current < end) {
      const hour = current.getHours();
      const dayOfWeek = current.getDay();
      
      let isVermelha = false;
      if (dayOfWeek === 5) {
        isVermelha = hour >= 6;
      } else if (dayOfWeek === 6 || dayOfWeek === 0) {
        isVermelha = true;
      } else if (dayOfWeek === 1) {
        isVermelha = hour < 6;
      }

      const isNight = hour >= 22 || hour < 6;

      if (isVermelha) {
        if (isNight) {
          redNight += 1;
          totalValue += rates.redNight;
        } else {
          redDay += 1;
          totalValue += rates.redDay;
        }
      } else {
        if (isNight) {
          blueNight += 1;
          totalValue += rates.blueNight;
        } else {
          blueDay += 1;
          totalValue += rates.blueDay;
        }
      }
      totalHours += 1;
      current.setHours(current.getHours() + 1);
    }

    setSimResult({ totalHours, totalValue, blueDay, blueNight, redDay, redNight });
  };

  const calculateAc4ForUser = (userId: string) => {
    const rates = {
      blueDay: 35.0,
      blueNight: 42.0,
      redDay: 45.0,
      redNight: 52.0
    };

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
      
      const current = new Date(start);
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

  const calcularResultadosFicha = () => {
    const tempo = (() => {
      if (!pontuacaoData.dataInclusao) return { anos: 0, meses: 0, dias: 0 };
      const inc = new Date(pontuacaoData.dataInclusao);
      const hoje = new Date();
      let anos = hoje.getFullYear() - inc.getFullYear();
      let meses = hoje.getMonth() - inc.getMonth();
      let dias = hoje.getDate() - inc.getDate();
      
      if (dias < 0) {
        meses--;
        const diasMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth(), 0).getDate();
        dias += diasMesAnterior;
      }
      if (meses < 0) {
        anos--;
        meses += 12;
      }
      return { anos, meses, dias };
    })();

    let positivo = 0;
    
    const parseNota = (n: string) => {
      const val = parseFloat(n || "0");
      if (val >= 9 && val <= 10) return 2.0;
      if (val >= 8 && val < 9) return 1.5;
      return 0;
    };

    positivo += parseNota(pontuacaoData.notaCfsd);
    positivo += parseNota(pontuacaoData.notaCfc);
    positivo += parseNota(pontuacaoData.notaCfs);
    positivo += parseNota(pontuacaoData.notaCas);

    if (pontuacaoData.graduacao) positivo += 3.0;
    if (pontuacaoData.posGraduacao) positivo += 3.0;
    if (pontuacaoData.mestrado) positivo += 3.0;
    if (pontuacaoData.doutorado) positivo += 3.0;

    const ptsCursos = Math.floor(parseFloat(pontuacaoData.cursosHoras || "0") / 60) * 0.2;
    positivo += Math.min(10, ptsCursos);

    const elogiosValidos = Math.min(tempo.anos, parseFloat(pontuacaoData.qtdElogios || "0"));
    positivo += elogiosValidos * 0.5;

    if (pontuacaoData.domPedroII) positivo += 3.0;
    if (pontuacaoData.tiradentes) positivo += 3.0;
    if (pontuacaoData.anhanguera) positivo += 3.0;
    if (pontuacaoData.meritoPolicial) positivo += 2.0;
    if (pontuacaoData.meritoMagisterio) positivo += 2.0;
    if (pontuacaoData.meritoIntelectual) positivo += 2.0;
    if (pontuacaoData.guardiao) positivo += 2.0;
    if (pontuacaoData.mauroBorges) positivo += 2.0;
    if (pontuacaoData.servicoDistinto) positivo += 1.0;
    if (pontuacaoData.destaqueBronze) positivo += 1.0;
    if (pontuacaoData.destaquePrata) positivo += 1.0;
    if (pontuacaoData.destaqueOuro) positivo += 1.0;
    if (pontuacaoData.dezAnos) positivo += 1.0;
    if (pontuacaoData.vinteAnos) positivo += 1.0;
    if (pontuacaoData.trintaAnos) positivo += 1.0;
    if (pontuacaoData.centoCinquentaAnos) positivo += 0.8;
    
    positivo += (parseFloat(pontuacaoData.coIrmasCount || "0") * 0.8);
    positivo += tempo.anos * 0.2;

    if (pontuacaoData.tafScore === 'excelente') positivo += 1.0;
    else if (pontuacaoData.tafScore === 'muitoBom') positivo += 0.5;

    let negativo = 0;
    negativo += (parseFloat(pontuacaoData.crimeDoloso || "0") * 3.0);
    negativo += (parseFloat(pontuacaoData.crimeCulposo || "0") * 2.0);
    negativo += (parseFloat(pontuacaoData.prisaoDisciplinar || "0") * 1.4);
    negativo += (parseFloat(pontuacaoData.detencaoDisciplinar || "0") * 0.7);
    negativo += (parseFloat(pontuacaoData.repreensao || "0") * 0.35);

    const total = positivo - negativo;

    return { tempo, positivo, negativo, total };
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F0F4F5]">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between relative">
          <div className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-[#79A3B1]" />
            <span className="text-xl font-bold tracking-tight text-[#79A3B1]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Agendamento
            </span>
          </div>
          
          <div className="relative">
            <button 
              className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 p-1 px-2 rounded-xl transition-all"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            >
              <div className="flex flex-col text-right text-xs text-gray-600 leading-tight hidden sm:flex">
                <span className="font-bold text-sm text-gray-900">{currentUser?.rank} {currentUser?.nickname}</span>
                <span>RG: {currentUser ? formatRG(currentUser.rg) : "..."}</span>
              </div>
              
              {currentUser?.photo ? (
                <img src={currentUser.photo} alt="Foto" className="h-9 w-9 rounded-full object-cover border border-[#79A3B1]/40 shadow-sm" />
              ) : (
                <div className="h-9 w-9 rounded-full bg-[#79A3B1]/20 flex items-center justify-center border border-[#79A3B1]/40 shadow-sm">
                  <Users className="h-5 w-5 text-[#79A3B1]" />
                </div>
              )}
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-2xl border p-2 z-[110] animate-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-2 mb-1 border-b sm:hidden">
                  <span className="block font-bold text-sm text-gray-900">{currentUser?.rank} {currentUser?.nickname}</span>
                  <span className="block text-[10px] text-gray-500">RG: {currentUser ? formatRG(currentUser.rg) : "..."}</span>
                </div>

                <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Navegação
                </div>

                <button 
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-[#79A3B1]/10 rounded-lg transition-colors font-semibold"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    router.push("/dashboard");
                  }}
                >
                  <ClipboardList className="h-4 w-4 text-[#79A3B1]" />
                  Visão Geral
                </button>

                <button 
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-[#79A3B1]/10 rounded-lg transition-colors font-semibold"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    router.push("/dashboard/perfil");
                  }}
                >
                  <User className="h-4 w-4 text-[#79A3B1]" />
                  Meu Perfil
                </button>

                <button 
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-[#79A3B1]/10 rounded-lg transition-colors font-semibold"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    router.push("/dashboard/agendamento");
                  }}
                >
                  <Plus className="h-4 w-4 text-[#79A3B1]" />
                  Agendar Escala
                </button>

                {(currentUser?.role === 'admin' || currentUser?.role === 'superadmin') && (
                  <button 
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-[#79A3B1]/10 rounded-lg transition-colors font-semibold"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      router.push("/admin/dashboard");
                    }}
                  >
                    <Shield className="h-4 w-4 text-[#79A3B1]" />
                    Painel Administrativo
                  </button>
                )}

                <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-t mt-1">
                  Atalhos Rápidos
                </div>
                
                <button 
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-[#79A3B1]/10 rounded-lg transition-colors font-semibold"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    setIsAc4ModalOpen(true);
                  }}
                >
                  <Calculator className="h-4 w-4 text-[#79A3B1]" />
                  Cálculo AC-4
                </button>

                <button 
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-[#79A3B1]/10 rounded-lg transition-colors font-semibold"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    setIsFichaModalOpen(true);
                  }}
                >
                  <FileText className="h-4 w-4 text-[#79A3B1]" />
                  Cálculo da Ficha
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

      {/* Main Layout */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 gap-8">
        {/* Sidebar */}
        

        {/* Content */}
        <main className="flex-1 bg-white rounded-2xl shadow-xl border p-6 md:p-8 animate-in fade-in duration-500">
          {children}
        </main>
      </div>
      {/* Modal AC-4 */}
      {isAc4ModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[200] animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border p-6 w-full max-w-3xl mx-4 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b">
              <h3 className="text-xl font-bold text-[#79A3B1]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Cálculo AC-4
              </h3>
              <button 
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold leading-none"
                onClick={() => {
                  setIsAc4ModalOpen(false);
                  setSimResult(null);
                  setSimStart("");
                  setSimEnd("");
                }}
              >
                &times;
              </button>
            </div>
            
            <div className="py-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Lado Esquerdo: Extrato Consolidado */}
              <div className="space-y-4 border-r md:pr-6">
                <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
                  Extrato Consolidado
                </h4>
                {(() => {
                  const ac4 = calculateAc4ForUser(currentUser.id);
                  if (ac4.totalHours === 0) {
                    return (
                      <p className="text-gray-500 text-sm">
                        Você não possui escalas vinculadas no sistema para cálculo automatizado.
                      </p>
                    );
                  }

                  return (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <div>
                          <span className="text-xs text-gray-500 block">Total Horas</span>
                          <span className="text-xl font-bold text-gray-800">{ac4.totalHours}h</span>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 block">Valor Acumulado</span>
                          <span className="text-xl font-bold text-green-600">
                            {ac4.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                        </div>
                      </div>

                      <div className="pt-1 space-y-2 text-sm text-gray-600">
                        <div className="flex justify-between">
                          <span>Horas Azul (Diurno)</span>
                          <span className="font-medium">{ac4.blueDayHours}h</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Horas Azul (Noturno)</span>
                          <span className="font-medium">{ac4.blueNightHours}h</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Horas Vermelha (Diurno)</span>
                          <span className="font-medium">{ac4.redDayHours}h</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Horas Vermelha (Noturno)</span>
                          <span className="font-medium">{ac4.redNightHours}h</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Lado Direito: Simulador Interativo */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Simulador de Plantão</h4>
                <form onSubmit={handleSimulateAc4} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600 block">Horário de Entrada</label>
                    <input 
                      type="datetime-local" 
                      required
                      value={simStart}
                      onChange={(e) => setSimStart(e.target.value)}
                      className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#79A3B1]/50"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600 block">Horário de Saída</label>
                    <input 
                      type="datetime-local" 
                      required
                      value={simEnd}
                      onChange={(e) => setSimEnd(e.target.value)}
                      className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#79A3B1]/50"
                    />
                  </div>
                  <Button 
                    type="submit"
                    className="w-full bg-[#79A3B1] text-white hover:bg-[#79A3B1]/90 font-semibold text-xs py-2"
                  >
                    Calcular Simulação
                  </Button>
                </form>

                {simResult && (
                  <div className="mt-4 bg-blue-50/60 p-4 rounded-xl border border-blue-100 animate-in fade-in duration-200">
                    <div className="flex justify-between items-center pb-2 border-b border-blue-100 mb-2">
                      <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">Resultado</span>
                      <span className="text-base font-bold text-green-700">
                        {simResult.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>
                    <div className="space-y-1 text-xs text-gray-700">
                      <div className="flex justify-between">
                        <span>Total Simulado:</span>
                        <span className="font-bold">{simResult.totalHours}h</span>
                      </div>
                      {simResult.blueDay > 0 && (
                        <div className="flex justify-between">
                          <span>Azul Diurno:</span>
                          <span>{simResult.blueDay}h (x R$ 35,00)</span>
                        </div>
                      )}
                      {simResult.blueNight > 0 && (
                        <div className="flex justify-between">
                          <span>Azul Noturno:</span>
                          <span>{simResult.blueNight}h (x R$ 42,00)</span>
                        </div>
                      )}
                      {simResult.redDay > 0 && (
                        <div className="flex justify-between">
                          <span>Vermelha Diurno:</span>
                          <span>{simResult.redDay}h (x R$ 45,00)</span>
                        </div>
                      )}
                      {simResult.redNight > 0 && (
                        <div className="flex justify-between">
                          <span>Vermelha Noturno:</span>
                          <span>{simResult.redNight}h (x R$ 52,00)</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t flex justify-end">
              <Button 
                className="bg-[#79A3B1] text-white hover:bg-[#79A3B1]/90 font-semibold"
                onClick={() => setIsAc4ModalOpen(false)}
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Modal Cálculo da Ficha */}
      {isFichaModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[200] animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border p-6 w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b">
              <h3 className="text-xl font-bold text-[#79A3B1]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Cálculo da Ficha
              </h3>
              <button 
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold leading-none"
                onClick={() => {
                  setIsFichaModalOpen(false);
                  setSimResult(null);
                  setSimStart("");
                  setSimEnd("");
                }}
              >
                &times;
              </button>
            </div>

            <div className="py-4 flex-1 overflow-y-auto space-y-4 pr-2">
              <div className="space-y-5 text-sm">
                  {/* 0 - Informações Básicas */}
                  <div className="bg-gray-50 p-4 rounded-xl border">
                    <h4 className="font-bold text-[#79A3B1] mb-3 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-[#79A3B1]" /> Dados da Carreira
                    </h4>
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1">Data de Inclusão na Corporação</label>
                        <input 
                          type="date"
                          value={pontuacaoData.dataInclusao}
                          onChange={(e) => setPontuacaoData({...pontuacaoData, dataInclusao: e.target.value})}
                          className="w-full border rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#79A3B1]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 1 - Curso de Formação */}
                  <div className="bg-gray-50 p-4 rounded-xl border">
                    <h4 className="font-bold text-[#79A3B1] mb-3 flex items-center gap-2">
                      <Shield className="h-4 w-4 text-[#79A3B1]" /> 1 - Curso de Formação
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1">Nota CFSd</label>
                        <input 
                          type="number" step="0.01" placeholder="Ex: 9.50"
                          value={pontuacaoData.notaCfsd}
                          onChange={(e) => setPontuacaoData({...pontuacaoData, notaCfsd: e.target.value})}
                          className="w-full border rounded-lg p-1.5 text-xs focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1">Nota CFC</label>
                        <input 
                          type="number" step="0.01" placeholder="Ex: 9.80"
                          value={pontuacaoData.notaCfc}
                          onChange={(e) => setPontuacaoData({...pontuacaoData, notaCfc: e.target.value})}
                          className="w-full border rounded-lg p-1.5 text-xs focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1">Nota CFS</label>
                        <input 
                          type="number" step="0.01" placeholder="Ex: 9.20"
                          value={pontuacaoData.notaCfs}
                          onChange={(e) => setPontuacaoData({...pontuacaoData, notaCfs: e.target.value})}
                          className="w-full border rounded-lg p-1.5 text-xs focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1">Nota CAS</label>
                        <input 
                          type="number" step="0.01" placeholder="Ex: 9.70"
                          value={pontuacaoData.notaCas}
                          onChange={(e) => setPontuacaoData({...pontuacaoData, notaCas: e.target.value})}
                          className="w-full border rounded-lg p-1.5 text-xs focus:outline-none"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs font-semibold text-gray-600 block mb-1">Cursos Diversos (horas/aula)</label>
                        <input 
                          type="number" placeholder="Total de Horas"
                          value={pontuacaoData.cursosHoras}
                          onChange={(e) => setPontuacaoData({...pontuacaoData, cursosHoras: e.target.value})}
                          className="w-full border rounded-lg p-1.5 text-xs focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="mt-3">
                      <span className="text-xs font-bold text-gray-600 block mb-2">Formação Acadêmica</span>
                      <div className="grid grid-cols-2 gap-2">
                        <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                          <input type="checkbox" checked={pontuacaoData.graduacao} onChange={(e) => setPontuacaoData({...pontuacaoData, graduacao: e.target.checked})} />
                          Graduação
                        </label>
                        <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                          <input type="checkbox" checked={pontuacaoData.posGraduacao} onChange={(e) => setPontuacaoData({...pontuacaoData, posGraduacao: e.target.checked})} />
                          Pós-Graduação
                        </label>
                        <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                          <input type="checkbox" checked={pontuacaoData.mestrado} onChange={(e) => setPontuacaoData({...pontuacaoData, mestrado: e.target.checked})} />
                          Mestrado
                        </label>
                        <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                          <input type="checkbox" checked={pontuacaoData.doutorado} onChange={(e) => setPontuacaoData({...pontuacaoData, doutorado: e.target.checked})} />
                          Doutorado
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* 2 - Mérito e Tempo */}
                  <div className="bg-gray-50 p-4 rounded-xl border">
                    <h4 className="font-bold text-[#79A3B1] mb-3 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-[#79A3B1]" /> 2 - Mérito e Tempo
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1">Qtd Elogios</label>
                        <input 
                          type="number" placeholder="0"
                          value={pontuacaoData.qtdElogios}
                          onChange={(e) => setPontuacaoData({...pontuacaoData, qtdElogios: e.target.value})}
                          className="w-full border rounded-lg p-1.5 text-xs focus:outline-none"
                        />
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-gray-200 flex flex-col justify-center text-center shadow-sm">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Tempo Calculado</span>
                        <span className="text-xs font-extrabold text-gray-700">
                          {calcularResultadosFicha().tempo.anos}a, {calcularResultadosFicha().tempo.meses}m e {calcularResultadosFicha().tempo.dias}d
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 3 - Medalhas */}
                  <div className="bg-gray-50 p-4 rounded-xl border">
                    <h4 className="font-bold text-[#79A3B1] mb-3 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-[#79A3B1]" /> 3 - Medalhas
                    </h4>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-gray-700">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={pontuacaoData.domPedroII} onChange={(e) => setPontuacaoData({...pontuacaoData, domPedroII: e.target.checked})} />
                        Dom Pedro II (3pt)
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={pontuacaoData.tiradentes} onChange={(e) => setPontuacaoData({...pontuacaoData, tiradentes: e.target.checked})} />
                        Tiradentes (3pt)
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={pontuacaoData.anhanguera} onChange={(e) => setPontuacaoData({...pontuacaoData, anhanguera: e.target.checked})} />
                        Anhanguera (3pt)
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={pontuacaoData.meritoPolicial} onChange={(e) => setPontuacaoData({...pontuacaoData, meritoPolicial: e.target.checked})} />
                        Mérito Policial (2pt)
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={pontuacaoData.meritoMagisterio} onChange={(e) => setPontuacaoData({...pontuacaoData, meritoMagisterio: e.target.checked})} />
                        Mérito Magistério (2pt)
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={pontuacaoData.meritoIntelectual} onChange={(e) => setPontuacaoData({...pontuacaoData, meritoIntelectual: e.target.checked})} />
                        Mérito Intelectual (2pt)
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={pontuacaoData.guardiao} onChange={(e) => setPontuacaoData({...pontuacaoData, guardiao: e.target.checked})} />
                        Guardião (2pt)
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={pontuacaoData.mauroBorges} onChange={(e) => setPontuacaoData({...pontuacaoData, mauroBorges: e.target.checked})} />
                        SSP - Mauro Borges (2pt)
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={pontuacaoData.dezAnos} onChange={(e) => setPontuacaoData({...pontuacaoData, dezAnos: e.target.checked})} />
                        10 Anos (1pt)
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={pontuacaoData.vinteAnos} onChange={(e) => setPontuacaoData({...pontuacaoData, vinteAnos: e.target.checked})} />
                        20 Anos (1pt)
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={pontuacaoData.trintaAnos} onChange={(e) => setPontuacaoData({...pontuacaoData, trintaAnos: e.target.checked})} />
                        30 Anos (1pt)
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={pontuacaoData.servicoDistinto} onChange={(e) => setPontuacaoData({...pontuacaoData, servicoDistinto: e.target.checked})} />
                        Serviço Distinto (1pt)
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={pontuacaoData.centoCinquentaAnos} onChange={(e) => setPontuacaoData({...pontuacaoData, centoCinquentaAnos: e.target.checked})} />
                        150 anos da PMGO (0.8pt)
                      </label>
                    </div>

                    <div className="mt-3">
                      <span className="text-xs font-bold text-gray-600 block mb-2">Medalha Anhanguera (Grau)</span>
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                          <input type="checkbox" checked={pontuacaoData.destaqueBronze} onChange={(e) => setPontuacaoData({...pontuacaoData, destaqueBronze: e.target.checked})} />
                          Bronze
                        </label>
                        <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                          <input type="checkbox" checked={pontuacaoData.destaquePrata} onChange={(e) => setPontuacaoData({...pontuacaoData, destaquePrata: e.target.checked})} />
                          Prata
                        </label>
                        <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                          <input type="checkbox" checked={pontuacaoData.destaqueOuro} onChange={(e) => setPontuacaoData({...pontuacaoData, destaqueOuro: e.target.checked})} />
                          Ouro
                        </label>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1">Co-Irmãs (quantidade de Medalhas)</label>
                        <input 
                          type="number" placeholder="0"
                          value={pontuacaoData.coIrmasCount}
                          onChange={(e) => setPontuacaoData({...pontuacaoData, coIrmasCount: e.target.value})}
                          className="w-full border rounded-lg p-1.5 text-xs focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 4 - Outros */}
                  <div className="bg-gray-50 p-4 rounded-xl border">
                    <h4 className="font-bold text-[#79A3B1] mb-3 flex items-center gap-2">
                      <Users className="h-4 w-4 text-[#79A3B1]" /> 4 - Outros
                    </h4>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1">TAF (Teste de Aptidão Física)</label>
                      <select 
                        value={pontuacaoData.tafScore} 
                        onChange={(e) => setPontuacaoData({...pontuacaoData, tafScore: e.target.value})}
                        className="w-full border rounded-lg p-1.5 text-xs focus:outline-none"
                      >
                        <option value="">Não Realizado / Regular</option>
                        <option value="excelente">Excelente (1.0)</option>
                        <option value="muitoBom">Muito Bom (0.5)</option>
                      </select>
                    </div>
                  </div>
                  {/* Pontuação Negativa */}
                  <div className="bg-gray-50 p-4 rounded-xl border">
                    <h4 className="font-bold text-red-600 mb-3 flex items-center gap-2">
                      <Shield className="h-4 w-4 text-red-600" /> Pontuação Negativa
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1">Crime Doloso (-3pt)</label>
                        <input 
                          type="number" placeholder="0"
                          value={pontuacaoData.crimeDoloso}
                          onChange={(e) => setPontuacaoData({...pontuacaoData, crimeDoloso: e.target.value})}
                          className="w-full border rounded-lg p-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-red-400"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1">Crime Culposo (-2pt)</label>
                        <input 
                          type="number" placeholder="0"
                          value={pontuacaoData.crimeCulposo}
                          onChange={(e) => setPontuacaoData({...pontuacaoData, crimeCulposo: e.target.value})}
                          className="w-full border rounded-lg p-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-red-400"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1">Prisão Disciplinar (-1,4pt)</label>
                        <input 
                          type="number" placeholder="0"
                          value={pontuacaoData.prisaoDisciplinar}
                          onChange={(e) => setPontuacaoData({...pontuacaoData, prisaoDisciplinar: e.target.value})}
                          className="w-full border rounded-lg p-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-red-400"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1">Detenção Disciplinar (-0,7pt)</label>
                        <input 
                          type="number" placeholder="0"
                          value={pontuacaoData.detencaoDisciplinar}
                          onChange={(e) => setPontuacaoData({...pontuacaoData, detencaoDisciplinar: e.target.value})}
                          className="w-full border rounded-lg p-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-red-400"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1">Repreensão (-0,35pt)</label>
                        <input 
                          type="number" placeholder="0"
                          value={pontuacaoData.repreensao}
                          onChange={(e) => setPontuacaoData({...pontuacaoData, repreensao: e.target.value})}
                          className="w-full border rounded-lg p-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-red-400"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Resultado Final */}
                  <div className="bg-[#79A3B1]/10 p-4 rounded-xl border border-[#79A3B1]/30 mt-4 animate-in fade-in duration-300">
                    <h4 className="font-bold text-[#79A3B1] mb-3 text-center uppercase tracking-wider text-xs" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      Resultado Final da Nota
                    </h4>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="bg-white p-2 rounded-xl border shadow-sm">
                        <span className="text-2xs text-gray-500 block font-bold uppercase">Positivo</span>
                        <span className="text-lg font-extrabold text-green-600">
                          {calcularResultadosFicha().positivo.toFixed(2)}
                        </span>
                      </div>

                      <div className="bg-white p-2 rounded-xl border shadow-sm">
                        <span className="text-2xs text-gray-500 block font-bold uppercase">Negativo</span>
                        <span className="text-lg font-extrabold text-red-600">
                          {calcularResultadosFicha().negativo.toFixed(2)}
                        </span>
                      </div>

                      <div className="bg-white p-2 rounded-xl border border-[#79A3B1] shadow-sm">
                        <span className="text-2xs text-gray-500 block font-bold uppercase">Nota Total</span>
                        <span className="text-lg font-extrabold text-[#79A3B1]">
                          {calcularResultadosFicha().total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
            </div>

            <div className="pt-4 border-t flex justify-end gap-2">
              <Button 
                disabled={isSavingFicha}
                className="bg-[#79A3B1] text-white hover:bg-[#79A3B1]/90 font-semibold"
                onClick={handleSaveFicha}
              >
                {isSavingFicha ? "Salvando..." : "Salvar Ficha"}
              </Button>
              <Button 
                className="bg-gray-100 text-gray-700 hover:bg-gray-200 font-semibold"
                onClick={() => {
                  setIsFichaModalOpen(false);
                  setSimResult(null);
                  setSimStart("");
                  setSimEnd("");
                }}
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
