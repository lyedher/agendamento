"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, ClipboardList, Clock, UserCheck } from "lucide-react";

export default function DashboardPage() {
  const stats = [
    { title: "Minhas Escalas", value: "3", icon: Calendar, description: "Neste mês" },
    { title: "Plantões Cumpridos", value: "12", icon: UserCheck, description: "Este ano" },
    { title: "Horas Acumuladas", value: "144h", icon: Clock, description: "Total" },
    { title: "Pendências", value: "0", icon: ClipboardList, description: "Nenhuma ação necessária" },
  ];

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx} className="border-0 shadow-md bg-gradient-to-br from-white to-gray-50">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-gray-500">
                  {stat.title}
                </CardTitle>
                <Icon className="h-5 w-5 text-[#79A3B1]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Placeholder for actual schedule */}
      <Card className="border shadow-sm mt-8">
        <CardHeader>
          <CardTitle style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#79A3B1' }}>
            Próximos Agendamentos
          </CardTitle>
          <CardDescription>
            Sua escala para os próximos 7 dias.
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[200px] flex items-center justify-center border-t bg-gray-50/50">
          <p className="text-gray-400 text-sm">Nenhuma escala atribuída para o período.</p>
        </CardContent>
      </Card>
    </div>
  );
}
