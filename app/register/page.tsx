"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { AlertCircle, User, Shield, Phone, Mail, Lock, Building, CreditCard, Camera, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const RANKS = ["Soldado", "Cabo", "3º Sargento", "2º Sargento", "1º Sargento", "Subtenente", "Aspirante", "2º Tenente", "1º Tenente", "Capitão", "Major", "Tenente-Coronel", "Coronel"];
const FUNCTIONS = [
  "Comandante de VTR", 
  "Motorista de VTR", 
  "Plantonista", 
  "Auxiliar de Seção", 
  "Chefe de Seção", 
  "Comandante de UPM", 
  "Subcomandante de UPM"
];
const TEAMS = ["Alfa", "Bravo", "Charlie", "Delta", "ADM"];

import { registerUser } from "@/lib/actions";

export default function RegisterPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    fullName: "",
    nickname: "",
    rank: "",
    jobFunction: "",
    workTeam: "",
    taxId: "",
    rg: "",
    phone: "",
    email: "",
    password: "",
    photo: "",
    sortOrder: 999,
  });
  
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isPhotoLoading, setIsPhotoLoading] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsPhotoLoading(true);
      try {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPhotoPreview(reader.result as string);
          setFormData(prev => ({ ...prev, photo: reader.result as string }));
          setIsPhotoLoading(false);
        };
        reader.readAsDataURL(file);
      } catch {
        setIsPhotoLoading(false);
      }
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (formData.password.length < 6) {
         throw new Error("A senha deve ter pelo menos 6 caracteres.");
      }

      const result = await registerUser(formData);
      
      if (!result.success) {
        throw new Error(result.message);
      }

      router.push("/login");
    } catch (err: any) {
      setError(err.message || "Falha ao criar conta.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 py-12" style={{ background: 'linear-gradient(135deg, #79A3B1 0%, #F0F4F5 100%)' }}>
      <Card className="w-full max-w-2xl border-0 shadow-2xl bg-white/90 backdrop-blur-xl relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <CardHeader className="space-y-2 text-center pb-6 border-b">
          <CardTitle className="text-3xl font-bold tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#79A3B1' }}>
            Registro no Sistema
          </CardTitle>
          <CardDescription className="text-md">
            Preencha os dados abaixo separados por seções.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleRegister} className="space-y-6">
            {error && (
              <Alert variant="destructive" className="animate-in fade-in zoom-in">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Foto do Perfil */}
            <div className="flex flex-col items-center space-y-4 pb-4 border-b">
              <Avatar className="h-24 w-24 border-2 border-[#79A3B1]">
                <AvatarImage src={photoPreview || undefined} />
                <AvatarFallback className="bg-gray-100 text-gray-400">
                  {isPhotoLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Camera className="h-8 w-8" />}
                </AvatarFallback>
              </Avatar>
              <input type="file" ref={fileInputRef} onChange={handlePhotoChange} className="hidden" accept="image/*" />
              <Button 
                type="button" 
                variant="link" 
                className="text-[#79A3B1]" 
                onClick={() => fileInputRef.current?.click()}
              >
                Alterar foto
              </Button>
            </div>

            <Accordion type="single" collapsible defaultValue="dados-profissionais" className="w-full">
              
              {/* Seção 1: Dados Profissionais */}
              <AccordionItem value="dados-profissionais" className="border-b-0 py-2">
                <AccordionTrigger className="text-lg font-semibold text-[#79A3B1] hover:no-underline">
                  1. Dados Profissionais
                </AccordionTrigger>
                <AccordionContent className="pt-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 group">
                      <Label htmlFor="fullName" className="text-sm font-medium">Nome Completo</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <Input id="fullName" required className="pl-9 focus-visible:ring-[#79A3B1]" value={formData.fullName} onChange={handleChange} />
                      </div>
                    </div>
                    <div className="space-y-2 group">
                      <Label htmlFor="nickname" className="text-sm font-medium">Nome de Guerra</Label>
                      <div className="relative">
                        <Shield className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <Input id="nickname" required className="pl-9 focus-visible:ring-[#79A3B1]" value={formData.nickname} onChange={handleChange} />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="rank" className="text-sm font-medium">Posto/Graduação</Label>
                      <Select onValueChange={(val) => setFormData(prev => ({ ...prev, rank: val }))} value={formData.rank}>
                        <SelectTrigger className="focus:ring-[#79A3B1]">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {RANKS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="jobFunction" className="text-sm font-medium">Função</Label>
                      <Select onValueChange={(val) => setFormData(prev => ({ ...prev, jobFunction: val }))} value={formData.jobFunction}>
                        <SelectTrigger className="focus:ring-[#79A3B1]">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {FUNCTIONS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="workTeam" className="text-sm font-medium">Equipe</Label>
                      <Select onValueChange={(val) => setFormData(prev => ({ ...prev, workTeam: val }))} value={formData.workTeam}>
                        <SelectTrigger className="focus:ring-[#79A3B1]">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {TEAMS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Seção 2: Identificação e Contato */}
              <AccordionItem value="identificacao" className="border-b-0 py-2">
                <AccordionTrigger className="text-lg font-semibold text-[#79A3B1] hover:no-underline">
                  2. Identificação e Contato
                </AccordionTrigger>
                <AccordionContent className="pt-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2 group">
                      <Label htmlFor="taxId" className="text-sm font-medium">CPF</Label>
                      <div className="relative">
                        <CreditCard className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <Input id="taxId" required placeholder="000.000.000-00" className="pl-9 focus-visible:ring-[#79A3B1]" value={formData.taxId} onChange={handleChange} />
                      </div>
                    </div>
                    <div className="space-y-2 group">
                      <Label htmlFor="rg" className="text-sm font-medium">RG Militar</Label>
                      <div className="relative">
                        <CreditCard className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <Input id="rg" required placeholder="00000" className="pl-9 focus-visible:ring-[#79A3B1]" value={formData.rg} onChange={handleChange} />
                      </div>
                    </div>
                    <div className="space-y-2 group">
                      <Label htmlFor="phone" className="text-sm font-medium">Telefone</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <Input id="phone" type="tel" placeholder="(62) 99999-9999" required className="pl-9 focus-visible:ring-[#79A3B1]" value={formData.phone} onChange={handleChange} />
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Seção 3: Acesso */}
              <AccordionItem value="acesso" className="border-b-0 py-2">
                <AccordionTrigger className="text-lg font-semibold text-[#79A3B1] hover:no-underline">
                  3. Dados de Acesso
                </AccordionTrigger>
                <AccordionContent className="pt-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 group">
                      <Label htmlFor="email" className="text-sm font-medium">E-mail</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <Input id="email" type="email" placeholder="email@exemplo.com" required className="pl-9 focus-visible:ring-[#79A3B1]" value={formData.email} onChange={handleChange} />
                      </div>
                    </div>
                    <div className="space-y-2 group">
                      <Label htmlFor="password" className="text-sm font-medium">Senha</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <Input id="password" type="password" placeholder="Mínimo 6 caracteres" required className="pl-9 focus-visible:ring-[#79A3B1]" value={formData.password} onChange={handleChange} />
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <Button 
              type="submit" 
              className="w-full h-11 text-md font-medium transition-all hover:scale-[1.01] hover:shadow-lg active:scale-95" 
              disabled={isLoading}
              style={{ backgroundColor: '#79A3B1', color: 'white' }}
            >
              {isLoading ? "Registrando..." : "Criar Conta"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 pt-4 border-t bg-gray-50/50 rounded-b-xl">
          <div className="text-sm text-center text-gray-500 w-full">
            Já possui uma conta?{" "}
            <Link href="/login" className="font-semibold text-[#79A3B1] hover:text-[#ACC18A] hover:underline transition-colors">
              Fazer login
            </Link>
          </div>
        </CardFooter>
      </Card>
    </main>
  );
}
