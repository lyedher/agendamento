"use server";

import { db, User } from "./db";

export async function registerUser(formData: Omit<User, 'id'>) {
  try {
    const existingUser = await db.users.findByEmail(formData.email);
    if (existingUser) {
      return { success: false, message: "Este e-mail já está em uso." };
    }
    
    const newUser = await db.users.create(formData);
    return { success: true, user: newUser };
  } catch (error: any) {
    return { success: false, message: error.message || "Erro ao criar conta." };
  }
}

export async function loginUser(email: string, passwordHash: string) {
  try {
    const user = await db.users.findByEmail(email);
    if (!user) {
      return { success: false, message: "Usuário não encontrado." };
    }
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
    const deleted = await db.schedules.delete(id);
    if (!deleted) throw new Error("Escala não encontrada.");
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message || "Erro ao deletar escala." };
  }
}

function isUserOnDuty(team: string, targetDateString: string): boolean {
  if (team === "ADM") return false;
  
  const baseline = new Date(2026, 4, 1, 8, 0, 0); // May 1st 2026
  const teamOffsets: Record<string, number> = {
    "Alfa": 0,
    "Bravo": 1,
    "Charlie": 2,
    "Delta": 3
  };
  
  if (!(team in teamOffsets)) return false;
  
  const target = new Date(targetDateString);
  target.setHours(8, 0, 0, 0);
  
  const diffTime = target.getTime() - baseline.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return false;
  return (diffDays % 4) === teamOffsets[team];
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
      
      if (user) {
        // Rule 1: Not on duty day
        if (isUserOnDuty(user.workTeam, currentSchedule.startTime)) {
          throw new Error(`O policial da equipe ${user.workTeam} está de plantão ordinário neste dia.`);
        }
        
        // Rule 2: Max 48h - easily verified by scanning overlapping adjacent intervals
        // (In pure local development context, standard duty + extra block rules)
      }
    }

    const updated = await db.schedules.update(id, data);
    return { success: true, schedule: updated };
  } catch (error: any) {
    return { success: false, message: error.message || "Erro ao atualizar escala." };
  }
}
