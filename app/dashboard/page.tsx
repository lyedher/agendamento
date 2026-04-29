"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, ClipboardList, Clock, UserCheck, Calculator } from "lucide-react";
import { getUsers, getSchedules } from "@/lib/actions";

export default function DashboardPage() {
  const [usersList, setUsersList] = useState<any[]>([]);
  const [schedulesList, setSchedulesList] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const [resU, resS] = await Promise.all([getUsers(), getSchedules()]);
      if (resU.success) setUsersList(resU.users);
      if (resS.success) setSchedulesList(resS.schedules);
    }
    load();
  }, []);

  const currentUser = usersList.find(u => u.email === 'lyedher@gmail.com') || usersList[0] || { id: "" };

  const calculateAc4ForUser = (userId: string) => {
    const rates = { blueDay: 35.0, blueNight: 42.0, redDay: 45.0, redNight: 52.0 };
    let totalHours = 0, totalValue = 0;

    const userSchedules = schedulesList.filter(s => s.userIds && s.userIds.includes(userId));
    userSchedules.forEach(s => {
      if (!s.startTime || !s.endTime) return;
      const start = new Date(s.startTime), end = new Date(s.endTime);
      let current = new Date(start);
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
        totalValue += isVermelha ? (isNight ? rates.redNight : rates.redDay) : (isNight ? rates.blueNight : rates.blueDay);
        totalHours += 1;
        current.setHours(current.getHours() + 1);
      }
    });
    return { totalHours, totalValue };
  };

  const ac4 = calculateAc4ForUser(currentUser.id);
  const mySchedulesCount = schedulesList.filter(s => s.userIds && s.userIds.includes(currentUser.id)).length;

  const stats = [
    { title: "Minhas Escalas", value: `${mySchedulesCount}`, icon: Calendar, description: "Serviços escalados" },
    { title: "Horas Acumuladas", value: `${ac4.totalHours}h`, icon: Clock, description: "Serviço Extraordinário" },
    { title: "Previsão AC-4", value: ac4.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), icon: Calculator, description: "Valores a receber" },
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
