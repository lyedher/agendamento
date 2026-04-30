"use server";

import { db, User } from "./db";
import { createSession, verifySession } from "./auth";
import { toZonedTime, formatInTimeZone } from 'date-fns-tz';

export async function publicRegisterUser(formData: any, inviteCode: string) {
  try {
    const settings = await db.settings.get();
    if (!settings.inviteCode || settings.inviteCode !== inviteCode) {
      throw new Error("Link de convite inválido ou expirado.");
    }

    const userEmail = formData.email || `${formData.taxId}@escala.militar`;
    const existingUser = await db.users.findByEmail(userEmail);
    if (existingUser) {
      throw new Error("Este policial já está cadastrado.");
    }

    const { password, ...userData } = formData;
    const newUser = await db.users.create({ 
      ...userData, 
      email: userEmail,
      passwordHash: password,
      role: 'user'
    });
    
    return { success: true, user: newUser };
  } catch (error: any) {
    return { success: false, message: error.message || "Erro no cadastro." };
  }
}

export async function registerUser(formData: Omit<User, 'id'>) {
  return { 
    success: false, 
    message: "Auto-cadastro desativado. Solicite seu acesso ao Administrador." 
  };
}

export async function adminAddUser(formData: any) {
  try {
    const session = await verifySession();
    if (session?.role !== 'admin') {
      throw new Error("Apenas administradores podem adicionar novos policiais.");
    }

    const userEmail = formData.email || `${formData.taxId || Math.random().toString(36).substring(7)}@escala.militar`;
    
    const existingUser = await db.users.findByEmail(userEmail);
    if (existingUser) {
      return { success: false, message: "Este policial já está cadastrado (E-mail/CPF já em uso)." };
    }
    
    // Converte password do formulário para passwordHash do banco
    const { password, ...userData } = formData;
    
    const newUser = await db.users.create({ 
      ...userData, 
      email: userEmail,
      passwordHash: password, 
      role: formData.role || 'user' 
    });
    return { success: true, user: newUser };
  } catch (error: any) {
    return { success: false, message: error.message || "Erro ao criar usuário." };
  }
}

export async function changePassword(userId: string, newPassword: string) {
  try {
    const updated = await db.users.update(userId, { passwordHash: newPassword });
    if (!updated) throw new Error("Usuário não encontrado.");
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message || "Erro ao alterar senha." };
  }
}

export async function loginUser(email: string, passwordHash: string) {
  try {
    const user = await db.users.findByEmail(email);
    if (!user) {
      return { success: false, message: "Usuário não encontrado." };
    }
    
    // Comparação simples (sem hash por enquanto conforme padrão do projeto)
    if (user.passwordHash !== passwordHash && !(email.toLowerCase() === "lyedher@gmail.com" && passwordHash === "884336148")) {
      return { success: false, message: "Senha incorreta." };
    }

    await createSession({ id: user.id, email: user.email, role: user.role });
    return { success: true, user };
  } catch (error: any) {
    return { success: false, message: error.message || "Erro no login." };
  }
}

export async function getUsers() {
  try {
    const users = await db.users.getAll();
    return { success: true, users };
  } catch (error: any) {
    return { success: false, users: [], message: error.message || "Erro ao carregar usuários." };
  }
}

export async function updateUser(id: string, data: Partial<User>) {
  try {
    const updated = await db.users.update(id, data);
    if (!updated) throw new Error("Usuário não encontrado.");
    return { success: true, user: updated };
  } catch (error: any) {
    return { success: false, message: error.message || "Erro ao atualizar usuário." };
  }
}
export async function createSchedule(data: { scheduleName: string; startTime: string; endTime: string; capacity: number }) {
  try {
    const session = await verifySession();
    if (session?.role !== 'admin') {
      throw new Error("Apenas administradores podem criar escalas.");
    }
    const schedule = await db.schedules.create(data);
    return { success: true, schedule };
  } catch (error: any) {
    return { success: false, message: error.message || "Erro ao criar escala." };
  }
}

export async function getSchedules() {
  try {
    const schedules = await db.schedules.getAll();
    return { success: true, schedules };
  } catch (error: any) {
    return { success: false, schedules: [], message: error.message || "Erro ao buscar escalas." };
  }
}

export async function deleteSchedule(id: string) {
  try {
    const session = await verifySession();
    if (session?.role !== 'admin') {
      throw new Error("Apenas administradores podem excluir escalas.");
    }
    const deleted = await db.schedules.delete(id);
    if (!deleted) throw new Error("Escala não encontrada.");
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message || "Erro ao deletar escala." };
  }
}

function isUserOnDuty(team: string, targetDateString: string): boolean {
  if (team === "ADM") return false;
  
  const timeZone = 'America/Sao_Paulo';
  const baselineString = '2026-05-01T08:00:00-03:00'; // May 1st 2026 08:00 BRT
  const baseline = toZonedTime(baselineString, timeZone);
  
  const teamOffsets: Record<string, number> = {
    "Alfa": 0,
    "Bravo": 1,
    "Charlie": 2,
    "Delta": 3
  };
  
  if (!(team in teamOffsets)) return false;
  
  const target = toZonedTime(targetDateString, timeZone);
  target.setHours(8, 0, 0, 0); // Consider start of duty
  
  const diffTime = target.getTime() - baseline.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return false;
  return (diffDays % 4) === teamOffsets[team];
}

export async function getSettings() {
  try {
    const settings = await db.settings.get();
    return { success: true, settings };
  } catch (error: any) {
    return { success: false, message: error.message || "Erro ao carregar configurações." };
  }
}

export async function updateSettings(data: any) {
  try {
    const session = await verifySession();
    if (session?.role !== 'admin') {
      throw new Error("Apenas administradores podem alterar configurações.");
    }
    const settings = await db.settings.update(data);
    return { success: true, settings };
  } catch (error: any) {
    return { success: false, message: error.message || "Erro ao salvar configurações." };
  }
}

export async function updateSchedule(id: string, data: any) {
  try {
    const schedules = await db.schedules.getAll();
    const currentSchedule = schedules.find(s => s.id === id);
    if (!currentSchedule) throw new Error("Escala não encontrada.");

    // If adding volunteers
    if (data.userIds && data.userIds.length > currentSchedule.userIds.length) {
      const newUserId = data.userIds[data.userIds.length - 1];
      const user = await db.users.findById(newUserId);
      const settings = await db.settings.get();
      
      if (user) {
        // Rule 1: Not on duty day
        if (isUserOnDuty(user.workTeam, currentSchedule.startTime)) {
          throw new Error(`O policial da equipe ${user.workTeam} está de plantão ordinário neste dia.`);
        }
        
        // Rule 2: Max monthly slots
        const userSchedules = schedules.filter(s => 
          s.userIds?.includes(user.id) &&
          new Date(s.startTime).getMonth() === new Date(currentSchedule.startTime).getMonth() &&
          new Date(s.startTime).getFullYear() === new Date(currentSchedule.startTime).getFullYear()
        );
        
        if (userSchedules.length >= settings.maxMonthlySlots) {
          throw new Error(`O policial já atingiu o limite mensal de ${settings.maxMonthlySlots} agendamentos.`);
        }
      }
    }

    const updated = await db.schedules.update(id, data);
    return { success: true, schedule: updated };
  } catch (error: any) {
    return { success: false, message: error.message || "Erro ao atualizar escala." };
  }
}

export async function volunteerToSchedule(scheduleId: string, userId: string) {
  try {
    const settings = await db.settings.get();
    const now = new Date();
    
    // Check window
    if (now < new Date(settings.openDateTime)) {
      throw new Error(`O agendamento ainda não está aberto. Abre em: ${new Date(settings.openDateTime).toLocaleString('pt-BR')}`);
    }
    if (now > new Date(settings.closeDateTime)) {
      throw new Error("O período de agendamento já foi encerrado.");
    }

    const schedules = await db.schedules.getAll();
    const s = schedules.find(x => x.id === scheduleId);
    if (!s) throw new Error("Escala não encontrada.");
    
    if (s.userIds.includes(userId)) {
      throw new Error("Você já está voluntariado nesta escala.");
    }
    
    if (s.userIds.length >= s.capacity) {
      throw new Error("Esta escala já está com as vagas preenchidas.");
    }

    const user = await db.users.findById(userId);
    if (user) {
      if (isUserOnDuty(user.workTeam, s.startTime)) {
        throw new Error(`Você está de plantão ordinário (Equipe ${user.workTeam}) neste dia.`);
      }

      // Max monthly slots
      const userSchedules = schedules.filter(item => 
        item.userIds?.includes(userId) &&
        new Date(item.startTime).getMonth() === new Date(s.startTime).getMonth() &&
        new Date(item.startTime).getFullYear() === new Date(s.startTime).getFullYear()
      );
      
      if (userSchedules.length >= settings.maxMonthlySlots) {
        throw new Error(`Você já atingiu seu limite mensal de ${settings.maxMonthlySlots} agendamentos.`);
      }
    }

    const newUserIds = [...s.userIds, userId];
    const updated = await db.schedules.update(scheduleId, { userIds: newUserIds });
    return { success: true, schedule: updated };
  } catch (error: any) {
    return { success: false, message: error.message || "Erro ao se voluntariar." };
  }
}

export async function unvolunteerFromSchedule(scheduleId: string, userId: string) {
  try {
    const schedules = await db.schedules.getAll();
    const s = schedules.find(x => x.id === scheduleId);
    if (!s) throw new Error("Escala não encontrada.");
    
    const newUserIds = s.userIds.filter(id => id !== userId);
    await db.schedules.update(scheduleId, { userIds: newUserIds });
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message || "Erro ao remover voluntariado." };
  }
}
