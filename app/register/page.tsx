"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert, ArrowLeft, Building2, UserPlus2, CheckCircle2, ShieldCheck, User, CreditCard, Shield, Phone, Mail, Lock, Save, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { publicRegisterUser, validateInviteCode, getUnits } from "@/lib/actions";
import { maskRG, maskCPF, maskPhone } from "@/lib/utils/masks";

const RANKS = ["Soldado", "Cabo", "3º Sargento", "2º Sargento", "1º Sargento", "Subtenente", "Aspirante", "2º Tenente", "1º Tenente", "Capitão", "Major", "Tenente-Coronel", "Coronel"];
const TEAMS = ["Alpha", "Bravo", "Charlie", "Delta", "ADM"];

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteCode = searchParams.get("code");
  
  const [unitsList, setUnitsList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [unitName, setUnitName] = useState("");
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    nickname: "",
    rank: "Soldado",
    workTeam: "Alpha",
    taxId: "",
    rg: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    jobFunction: "Plantonista",
    unitId: ""
  });

  useEffect(() => {
    async function loadPageData() {
      try {
        // 1. Carregar lista de batalhões/unidades
        const unitsRes = await getUnits();
        if (unitsRes.success) {
          setUnitsList(unitsRes.units);
        }

        // 2. Validar convite se existir na URL
        if (inviteCode) {
          const result = await validateInviteCode(inviteCode);
          if (result.valid) {
            setUnitName(result.unitName || "");
            
            // Tenta pré-selecionar o batalhão correspondente
            const matchedUnit = unitsRes.success 
              ? unitsRes.units.find((u: any) => u.name === result.unitName) 
              : null;
            
            setFormData(prev => ({ 
              ...prev, 
              unitId: matchedUnit?.id || prev.unitId 
            }));
          } else {
            setError("O link de convite é inválido ou expirou. Por favor, selecione abaixo o seu Batalhão para se cadastrar normalmente!");
          }
        }
      } catch (err) {
        console.error("Erro ao iniciar formulário:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadPageData();
  }, [inviteCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.unitId) {
      setError("Por favor, selecione a qual Batalhão / UPM você pertence.");
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError("As senhas não conferem.");
      return;
    }

    if (formData.password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await publicRegisterUser(formData, inviteCode || undefined);

      if (result.success) {
        router.push("/login?registered=true");
      } else {
        setError(result.message || "Erro ao realizar cadastro.");
      }
    } catch (err: any) {
      setError("Falha na conexão com o servidor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F0F4F5]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 text-[#79A3B1] animate-spin" />
          <p className="text-gray-500 font-bold animate-pulse">Carregando formulário...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#F0F4F5] py-12 px-4 flex items-center justify-center relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#79A3B1]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#ACC18A]/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <div className="w-full max-w-4xl relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <Card className="border-0 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] rounded-[40px] overflow-hidden bg-white/80 backdrop-blur-xl border border-white/20">
          <form onSubmit={handleSubmit}>
            <div className="h-2 bg-gradient-to-r from-[#79A3B1] to-[#ACC18A]" />
            <CardHeader className="p-8 pb-4 text-center md:text-left md:flex-row md:items-center md:justify-between gap-6">
              <div className="space-y-1">
                <div className="flex items-center justify-center md:justify-start gap-2 text-[#79A3B1] font-black uppercase tracking-tighter text-sm mb-2">
                  <Building2 className="h-4 w-4" />
                  {unitName || (formData.unitId ? (unitsList.find(u => u.id === formData.unitId)?.name) : "Cadastro Aberto")}
                </div>
                <CardTitle className="text-3xl font-black text-gray-900 tracking-tight flex items-center justify-center md:justify-start gap-3">
                  <UserPlus2 className="h-8 w-8 text-[#79A3B1]" />
                  Solicitar Acesso
                </CardTitle>
                <CardDescription className="text-gray-500 font-medium text-lg">
                  Preencha os dados abaixo para integrar o sistema.
                </CardDescription>
              </div>
              <Link href="/login" className="hidden md:block">
                <Button variant="ghost" className="rounded-xl font-bold text-gray-400 hover:text-[#79A3B1]">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Login
                </Button>
              </Link>
            </CardHeader>

            <CardContent className="p-8">
              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-700 text-sm font-bold animate-in shake-1 mb-6">
                  <AlertCircle className="h-5 w-5" />
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-gray-400 uppercase ml-1">Nome Completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                      required value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                      className="pl-10 h-11 bg-gray-50 border-gray-100 rounded-xl focus:bg-white transition-all shadow-sm"
                      placeholder="Nome completo do militar"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-gray-400 uppercase ml-1">Nome de Guerra</Label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                      required value={formData.nickname}
                      onChange={(e) => setFormData({...formData, nickname: e.target.value})}
                      className="pl-10 h-11 bg-gray-50 border-gray-100 rounded-xl focus:bg-white transition-all shadow-sm"
                      placeholder="Ex: Sgt Lyedher"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-gray-400 uppercase ml-1">Posto / Graduação</Label>
                  <select 
                    className="w-full h-11 px-4 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#79A3B1]/20 focus:border-[#79A3B1] transition-all shadow-sm"
                    value={formData.rank}
                    onChange={(e) => setFormData({...formData, rank: e.target.value})}
                  >
                    {RANKS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-gray-400 uppercase ml-1">Equipe de Trabalho</Label>
                  <select 
                    className="w-full h-11 px-4 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#79A3B1]/20 focus:border-[#79A3B1] transition-all shadow-sm"
                    value={formData.workTeam}
                    onChange={(e) => setFormData({...formData, workTeam: e.target.value})}
                  >
                    {TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label className="text-xs font-bold text-gray-400 uppercase ml-1">Batalhão / Unidade Militar (UPM)</Label>
                  <select 
                    required
                    className="w-full h-11 px-4 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#79A3B1]/20 focus:border-[#79A3B1] transition-all shadow-sm"
                    value={formData.unitId}
                    onChange={(e) => setFormData({...formData, unitId: e.target.value})}
                  >
                    <option value="">Selecione seu Batalhão...</option>
                    {unitsList.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-gray-400 uppercase ml-1">CPF</Label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                      required value={formData.taxId}
                      onChange={(e) => setFormData({...formData, taxId: maskCPF(e.target.value)})}
                      className="pl-10 h-11 bg-gray-50 border-gray-100 rounded-xl focus:bg-white transition-all shadow-sm"
                      placeholder="000.000.000-00"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-gray-400 uppercase ml-1">RG Militar</Label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                      required value={formData.rg}
                      onChange={(e) => setFormData({...formData, rg: maskRG(e.target.value)})}
                      className="pl-10 h-11 bg-gray-50 border-gray-100 rounded-xl focus:bg-white transition-all shadow-sm"
                      placeholder="Ex: 12.345"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-gray-400 uppercase ml-1">Telefone / WhatsApp</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                      required value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: maskPhone(e.target.value)})}
                      className="pl-10 h-11 bg-gray-50 border-gray-100 rounded-xl focus:bg-white transition-all shadow-sm"
                      placeholder="(62) 99999-0000"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-gray-400 uppercase ml-1">E-mail Corporativo</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                      type="email" required value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="pl-10 h-11 bg-gray-50 border-gray-100 rounded-xl focus:bg-white transition-all shadow-sm"
                      placeholder="policial@pm.go.gov.br"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-gray-400 uppercase ml-1">Senha de Acesso</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                      type="password" required value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="pl-10 h-11 bg-gray-50 border-gray-100 rounded-xl focus:bg-white transition-all shadow-sm"
                      placeholder="Mínimo 6 caracteres"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-gray-400 uppercase ml-1">Confirmar Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                      type="password" required value={formData.confirmPassword}
                      onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                      className="pl-10 h-11 bg-gray-50 border-gray-100 rounded-xl focus:bg-white transition-all shadow-sm"
                      placeholder="Repita sua senha"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="p-8 pt-0 flex flex-col gap-4">
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full h-14 rounded-2xl bg-[#79A3B1] text-white font-black uppercase tracking-widest hover:bg-[#79A3B1]/90 shadow-xl shadow-[#79A3B1]/20 transition-all active:scale-95"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Finalizando Cadastro...
                  </div>
                ) : (
                  "Concluir Cadastro e Entrar"
                )}
              </Button>
              <Link href="/login" className="text-xs font-bold text-gray-400 hover:text-[#79A3B1] transition-colors text-center">
                Já tenho cadastro? Voltar ao Login
              </Link>
            </CardFooter>
          </form>
        </Card>
      </div>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#F0F4F5]"><div className="w-8 h-8 border-4 border-[#79A3B1] border-t-transparent rounded-full animate-spin" /></div>}>
      <RegisterForm />
    </Suspense>
  );
}
