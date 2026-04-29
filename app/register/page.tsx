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
  "CPU", 
  "Auxiliar de Seção", 
  "Chefe de Seção", 
  "Comandante de UPM", 
  "Subcomandante de UPM"
];
const TEAMS = ["Alfa", "Bravo", "Charlie", "Delta", "ADM"];

import { registerUser } from "@/lib/actions";

export default function RegisterPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen flex items-center justify-center p-4 py-12" style={{ background: 'linear-gradient(135deg, #79A3B1 0%, #F0F4F5 100%)' }}>
      <Card className="w-full max-w-md border-0 shadow-2xl bg-white/90 backdrop-blur-xl relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <CardHeader className="space-y-2 text-center pb-6">
          <AlertCircle className="h-12 w-12 text-[#79A3B1] mx-auto mb-2 animate-pulse" />
          <CardTitle className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#79A3B1' }}>
            Cadastro Restrito
          </CardTitle>
          <CardDescription className="text-md">
            Apenas administradores podem adicionar novos policiais ao sistema.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-gray-600 pb-6">
          <p className="text-sm mb-4">
            Se você é um policial recém-chegado, solicite o seu cadastramento diretamente com a seção de escalas da Unidade.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 pt-4 border-t bg-gray-50/50 rounded-b-xl">
          <div className="text-sm text-center text-gray-500 w-full">
            <Link href="/login" className="font-semibold text-[#79A3B1] hover:text-[#ACC18A] hover:underline transition-colors">
              Voltar para o Login
            </Link>
          </div>
        </CardFooter>
      </Card>
    </main>
  );
}
