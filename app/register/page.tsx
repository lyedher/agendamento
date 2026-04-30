"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert, ArrowLeft, Building2, UserPlus2, CheckCircle2, ShieldCheck, User, CreditCard, Shield, Phone, Mail, Lock, Save, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { publicRegisterUser, getSettings } from "@/lib/actions";
import { maskRG, maskCPF, maskPhone } from "@/lib/utils/masks";

const RANKS = ["Soldado", "Cabo", "3º Sargento", "2º Sargento", "1º Sargento", "Subtenente", "Aspirante", "2º Tenente", "1º Tenente", "Capitão", "Major", "Tenente-Coronel", "Coronel"];
const TEAMS = ["Alfa", "Bravo", "Charlie", "Delta", "ADM"];

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteCode = searchParams.get("code");
  
  const [isValidCode, setIsValidCode] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    nickname: "",
    rank: "Soldado",
    workTeam: "Alfa",
    taxId: "",
    rg: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    jobFunction: "Plantonista"
  });

  useEffect(() => {
    async function validate() {
      if (!inviteCode) {
        setIsValidCode(false);
        setIsLoading(false);
        return;
      }
      const res = await getSettings();
      if (res.success && res.settings.inviteCode === inviteCode) {
        setIsValidCode(true);
      } else {
        setIsValidCode(false);
      }
      setIsLoading(false);
    }
    validate();
  }, [inviteCode]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    if (formData.password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setIsSubmitting(true);
    const res = await publicRegisterUser(formData, inviteCode || "");
    
    if (res.success) {
      router.push("/login?registered=true");
    } else {
      setError(res.message);
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-[#F0F4F5]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 text-[#79A3B1] animate-spin" />
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Validando Convite...</p>
        </div>
      </main>
    );
  }

  // Se NÃO houver código ou código inválido, mostra a página de restrição
  if (!isValidCode) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" 
        style={{ background: 'radial-gradient(circle at bottom left, #F0F4F5 0%, #79A3B1 100%)' }}>
        
        <div className="absolute top-[-5%] left-[-5%] w-[30%] h-[30%] bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[30%] h-[30%] bg-[#ACC18A]/10 rounded-full blur-3xl" />

        <div className="w-full max-w-lg relative z-10 animate-in fade-in slide-in-from-top-4 duration-1000">
          <Card className="border-0 shadow-[0_20px_50px_rgba(0,0,0,0.1)] bg-white/95 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
            <CardHeader className="p-10 pb-6 text-center space-y-4">
              <div className="mx-auto w-20 h-20 bg-orange-50 rounded-3xl flex items-center justify-center mb-2 transform rotate-6 hover:rotate-0 transition-transform duration-500 shadow-inner">
                <ShieldAlert className="h-10 w-10 text-orange-500" />
              </div>
              <div className="space-y-2">
                <CardTitle className="text-3xl font-black text-gray-900 tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  CADASTRO <span className="text-orange-500">RESTRITO</span>
                </CardTitle>
                <CardDescription className="text-base font-medium text-gray-500">
                  Acesso exclusivo para Policiais Militares ativos da Unidade.
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="px-10 pb-8 space-y-8">
              <div className="bg-gray-50/80 rounded-[2rem] p-8 border border-gray-100 space-y-6">
                <p className="text-gray-600 text-sm leading-relaxed text-center font-medium">
                  O auto-cadastro direto está desativado. 
                  Se você recebeu um link de convite, certifique-se de usá-lo corretamente.
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center flex-shrink-0 text-xs font-black text-[#79A3B1] border border-gray-100">01</div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-800">Solicite o Link</h4>
                      <p className="text-xs text-gray-500 mt-0.5">Peça o link de convite ao Administrador da sua Unidade.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center flex-shrink-0 text-xs font-black text-[#79A3B1] border border-gray-100">02</div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-800">Complete seu Perfil</h4>
                      <p className="text-xs text-gray-500 mt-0.5">Com o link, você mesmo preenche seus dados e define sua senha.</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>

            <CardFooter className="px-10 pb-10 flex flex-col space-y-4">
              <Button asChild variant="ghost" className="w-full h-14 rounded-2xl font-bold text-gray-500 hover:text-[#79A3B1] hover:bg-[#79A3B1]/5 transition-all">
                <Link href="/login" className="flex items-center justify-center gap-2">
                  <ArrowLeft className="h-5 w-5" />
                  Voltar para o Login
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    );
  }

  // Se houver código VÁLIDO, mostra o formulário de cadastro completo
  return (
    <main className="min-h-screen py-12 px-4 bg-[#F0F4F5] relative overflow-hidden">
      <div className="max-w-2xl mx-auto relative z-10">
        <div className="text-center mb-8 space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#79A3B1] shadow-xl mb-4 transform -rotate-3">
            <UserPlus2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            CADASTRO DE MILITAR
          </h1>
          <p className="text-gray-500 font-medium">Preencha seus dados para acessar o sistema de escalas</p>
        </div>

        <Card className="border-0 shadow-2xl rounded-[2rem] overflow-hidden bg-white/90 backdrop-blur-md">
          <form onSubmit={handleRegister}>
            <CardContent className="p-8 space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-700 text-sm font-bold animate-in shake-1">
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
                      className="pl-10 h-11 bg-gray-50 border-gray-100 rounded-xl focus:bg-white"
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
                      className="pl-10 h-11 bg-gray-50 border-gray-100 rounded-xl focus:bg-white"
                      placeholder="Ex: Sgt Lyedher"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-gray-400 uppercase ml-1">Posto / Graduação</Label>
                  <select 
                    className="w-full h-11 px-4 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#79A3B1]/20 focus:border-[#79A3B1] transition-all"
                    value={formData.rank}
                    onChange={(e) => setFormData({...formData, rank: e.target.value})}
                  >
                    {RANKS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-gray-400 uppercase ml-1">Equipe de Trabalho</Label>
                  <select 
                    className="w-full h-11 px-4 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#79A3B1]/20 focus:border-[#79A3B1] transition-all"
                    value={formData.workTeam}
                    onChange={(e) => setFormData({...formData, workTeam: e.target.value})}
                  >
                    {TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-gray-400 uppercase ml-1">CPF</Label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                      required value={formData.taxId}
                      onChange={(e) => setFormData({...formData, taxId: maskCPF(e.target.value)})}
                      className="pl-10 h-11 bg-gray-50 border-gray-100 rounded-xl focus:bg-white"
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
                      className="pl-10 h-11 bg-gray-50 border-gray-100 rounded-xl focus:bg-white"
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
                      className="pl-10 h-11 bg-gray-50 border-gray-100 rounded-xl focus:bg-white"
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
                      className="pl-10 h-11 bg-gray-50 border-gray-100 rounded-xl focus:bg-white"
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
                      className="pl-10 h-11 bg-gray-50 border-gray-100 rounded-xl focus:bg-white"
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
                      className="pl-10 h-11 bg-gray-50 border-gray-100 rounded-xl focus:bg-white"
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
