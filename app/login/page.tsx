"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { loginUser } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Mail, Lock, AlertCircle, ArrowRight, ShieldCheck, Instagram, MessageCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Pequeno delay para feedback visual
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Bypass para admin principal (mantendo regra do projeto)
      if (email.toLowerCase() === "lyedher@gmail.com" && password === "884336148") {
        await loginUser(email, password); // Garante que a sessão seja criada
        router.push("/admin/dashboard");
        return;
      }
      
      const result = await loginUser(email, password);
      
      if (!result.success) {
        throw new Error(result.message);
      }

      if (email.toLowerCase() === "lyedher@gmail.com") {
        router.push("/admin/dashboard");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Falha na autenticação. Verifique suas credenciais.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" 
      style={{ background: 'radial-gradient(circle at top right, #F0F4F5 0%, #79A3B1 100%)' }}>
      
      {/* Elementos Decorativos de Fundo */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-white/10 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#ACC18A]/10 rounded-full blur-3xl" />
      
      <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        {/* Logo / Título */}
        <div className="text-center mb-8 space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-xl mb-4 transform -rotate-3 hover:rotate-0 transition-transform duration-300">
            <ShieldCheck className="h-10 w-10 text-[#79A3B1]" />
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            AGENDAMENTO<span className="text-[#79A3B1]">.</span>
          </h1>
          <p className="text-gray-600 font-medium">Gestão de Escalas Militares</p>
        </div>

        <Card className="border-0 shadow-[0_20px_50px_rgba(0,0,0,0.1)] bg-white/95 backdrop-blur-xl rounded-3xl overflow-hidden">
          <CardHeader className="space-y-1 text-center pt-8">
            <CardTitle className="text-xl font-bold text-gray-800">Acesso ao Sistema</CardTitle>
            <CardDescription className="text-sm">
              Insira suas credenciais para continuar
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-4">
            <form onSubmit={handleLogin} className="space-y-5">
              {registered && (
                <Alert className="bg-emerald-50 text-emerald-800 border-emerald-100 rounded-2xl animate-in fade-in zoom-in">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <AlertDescription className="text-xs font-bold">Cadastro realizado com sucesso! Faça login para acessar.</AlertDescription>
                </Alert>
              )}
              {error && (
                <Alert variant="destructive" className="bg-red-50 text-red-800 border-red-100 rounded-2xl animate-in shake-1">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs font-bold">{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2 group">
                <Label htmlFor="email" className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">E-mail Corporativo</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#79A3B1] transition-colors" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="exemplo@pm.go.gov.br" 
                    required 
                    className="pl-12 h-14 bg-gray-50/50 border-gray-100 rounded-2xl focus:bg-white focus:ring-[#79A3B1]/20 focus:border-[#79A3B1] transition-all text-base"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2 group">
                <div className="flex items-center justify-between ml-1">
                  <Label htmlFor="password" className="text-xs font-bold text-gray-500 uppercase tracking-wider">Senha</Label>
                  <Link href="#" className="text-xs font-bold text-[#79A3B1] hover:text-[#ACC18A] transition-colors">
                    Esqueci minha senha
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#79A3B1] transition-colors" />
                  <Input 
                    id="password" 
                    type="password" 
                    required 
                    className="pl-12 h-14 bg-gray-50/50 border-gray-100 rounded-2xl focus:bg-white focus:ring-[#79A3B1]/20 focus:border-[#79A3B1] transition-all text-base"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-14 rounded-2xl text-base font-bold transition-all hover:shadow-lg active:scale-[0.98] mt-2 shadow-[#79A3B1]/20 shadow-lg" 
                disabled={isLoading}
                style={{ backgroundColor: '#79A3B1', color: '#FFFFFF' }}
              >
                {isLoading ? (
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-5 animate-spin rounded-full border-3 border-white/30 border-t-white" />
                    Autenticando...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    Acessar Dashboard
                    <ArrowRight className="h-5 w-5" />
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 pb-8 pt-0 px-8">
            <div className="h-[1px] w-full bg-gray-100" />
            <div className="text-xs text-center text-gray-400 font-medium">
              Não tem uma conta? <Link href="/register" className="text-[#79A3B1] font-bold hover:underline">Solicite acesso</Link>
            </div>
          </CardFooter>
        </Card>
        
        {/* Footer / Copyright */}
        <div className="mt-8 flex flex-col items-center gap-2">
          <div className="flex items-center gap-4">
            <a 
              href="https://instagram.com/sgt_lyedher" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 hover:text-[#79A3B1] transition-colors uppercase tracking-wider"
            >
              <Instagram className="h-3 w-3" />
              @sgt_lyedher
            </a>
            <a 
              href="https://wa.me/5562993923724" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 hover:text-emerald-600 transition-colors uppercase tracking-wider"
            >
              <MessageCircle className="h-3 w-3" />
              (62) 99392-3724
            </a>
          </div>
          <div className="text-[9px] text-gray-300 font-bold uppercase tracking-[0.3em]">
            © 2026 PMGO - Sistema de Gestão de Voluntários
          </div>
        </div>
      </div>
    </main>
  );
}
