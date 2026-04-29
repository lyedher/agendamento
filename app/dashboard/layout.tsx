"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Calendar, Users, LogOut, Shield, Clock } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const handleLogout = () => {
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F0F4F5]">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-[#79A3B1]" />
            <span className="text-xl font-bold tracking-tight text-[#79A3B1]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Agendamento
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 hidden md:inline-block">
              Conectado como <strong>Operador</strong>
            </span>
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center gap-2 hover:bg-red-50 hover:text-red-600"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 gap-8">
        {/* Sidebar */}
        <aside className="w-64 hidden md:block shrink-0">
          <nav className="space-y-1">
            <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg bg-[#79A3B1]/10 text-[#79A3B1] transition-colors">
              <Clock className="h-5 w-5" />
              Dashboard
            </Link>
            <Link href="#" className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-100 transition-colors">
              <Calendar className="h-5 w-5" />
              Minha Escala
            </Link>
            <Link href="/admin/dashboard" className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-100 transition-colors">
              <Shield className="h-5 w-5" />
              Administração
            </Link>
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 bg-white rounded-2xl shadow-xl border p-6 md:p-8 animate-in fade-in duration-500">
          {children}
        </main>
      </div>
    </div>
  );
}
