"use server";

import { db, User } from "./db";
import { createSession, verifySession, clearSession } from "./auth";
import { toZonedTime, formatInTimeZone } from 'date-fns-tz';
import { calculateSingleScheduleValue } from "./utils/calculations";

export async function validateInviteCode(inviteCode: string) {
  try {
    const units = await db.units.getAll();
    for (const unit of units) {
      const settings = await db.settings.get(unit.id);
      if (settings.inviteCode === inviteCode) {
        return { success: true, unitName: unit.name };
      }
    }
    return { success: false };
  } catch (error) {
    return { success: false };
  }
}

export async function publicRegisterUser(formData: any, inviteCode?: string) {
  try {
    let targetUnitId = formData.unitId;
    
    if (!targetUnitId && inviteCode) {
      // Buscar todas as unidades para validar o convite
      const units = await db.units.getAll();
      for (const unit of units) {
        const unitSettings = await db.settings.get(unit.id);
        if (unitSettings.inviteCode && unitSettings.inviteCode === inviteCode) {
          targetUnitId = unit.id;
          break;
        }
      }
    }

    if (!targetUnitId) {
      throw new Error("Por favor, selecione a qual Batalhão/Unidade você pertence.");
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
      role: 'user',
      unitId: targetUnitId
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
    
    // Ensure unitId is set, defaulting to the admin's unitId
    const finalUnitId = userData.unitId || session?.unitId;
    
    const newUser = await db.users.create({ 
      ...userData, 
      unitId: finalUnitId,
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
    if (user.passwordHash !== passwordHash) {
      return { success: false, message: "Senha incorreta." };
    }

    await createSession({ id: user.id, email: user.email, role: user.role, unitId: user.unitId });
    return { success: true, user };
  } catch (error: any) {
    return { success: false, message: error.message || "Erro no login." };
  }
}

export async function logout() {
  await clearSession();
}

export async function getUsers(unitId?: string) {
  try {
    const session = await verifySession();
    const allUsers = await db.users.getAll();
    
    // Prioridade para o unitId passado como argumento (usado pelo superadmin)
    const targetUnitId = unitId || session?.unitId;

    if (!targetUnitId) {
      // Se não houver unitId (superadmin no dashboard global sem filtro), retorna tudo
      return { success: true, users: allUsers };
    }

    // Retorna apenas usuários da unidade alvo
    const unitUsers = allUsers.filter(u => u.unitId === targetUnitId);
    return { success: true, users: unitUsers };
  } catch (error: any) {
    return { success: false, users: [], message: error.message || "Erro ao carregar usuários." };
  }
}

export async function getGlobalStats() {
  try {
    const session = await verifySession();
    if (session?.role !== 'superadmin') {
      throw new Error("Acesso negado. Apenas Super-Admins podem ver estatísticas globais.");
    }

    const units = await db.units.getAll();
    const allUsers = await db.users.getAll();
    const allSchedules = await db.schedules.getAll();

    // Enriquecer unidades com contagem de usuários
    const unitsWithStats = units.map(unit => ({
      ...unit,
      userCount: allUsers.filter(u => u.unitId === unit.id).length,
      awayCount: allUsers.filter(u => u.unitId === unit.id && (u.workTeam === "Afastado" || u.workTeam === "Transferido")).length
    }));

    const totalUnits = units.length;
    const totalUsers = allUsers.length;
    const totalBudget = units.reduce((acc, unit) => acc + (unit.budgetLimit || 0), 0);
    const totalSpent = units.reduce((acc, unit) => acc + (unit.currentSpend || 0), 0);
    
    // Contagem de escalas e voluntários
    const totalSchedules = allSchedules.length;
    const totalVolunteers = allSchedules.reduce((acc, s) => acc + (s.userIds?.length || 0), 0);

    const serviceDistribution = allUsers.reduce((acc: any, u: any) => {
      let type = u.serviceType;
      if (!type) {
        if (u.workTeam === "ADM") type = "ADM";
        else if (u.workTeam === "Afastado" || u.workTeam === "Transferido") return acc;
        else type = "OPER";
      }
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, { OPER: 0, ADM: 0, ARI: 0, ALI: 0, APOIO: 0 });

    const currentMonth = new Date().getMonth();
    const birthdays = allUsers.filter(u => {
      if (!u.birthDate) return false;
      const birthMonth = new Date(u.birthDate).getMonth();
      return birthMonth === currentMonth;
    }).map(u => ({
      id: u.id,
      fullName: u.fullName,
      nickname: u.nickname,
      birthDate: u.birthDate,
      unitName: units.find(un => un.id === u.unitId)?.name || 'Sem Unidade'
    }));

    const awayCount = allUsers.filter(u => u.workTeam === "Afastado" || u.workTeam === "Transferido").length;

    return {
      success: true,
      stats: {
        totalUnits,
        totalUsers,
        totalBudget,
        totalSpent,
        totalSchedules,
        totalVolunteers,
        serviceDistribution,
        awayCount,
        birthdays,
        units: unitsWithStats
      }
    };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function transferUser(userId: string, newUnitId: string) {
  try {
    const session = await verifySession();
    if (session?.role !== 'superadmin' && session?.email !== 'stivnil@hotmail.com') {
      throw new Error("Apenas Super-Admins podem transferir militares entre unidades.");
    }

    const userBefore = await db.users.getById(userId);
    const updated = await db.users.update(userId, { unitId: newUnitId });
    if (!updated) throw new Error("Militar não encontrado.");

    await db.auditLogs.create({
      action: "TRANSFER_USER",
      actorId: session?.id || "unknown",
      targetId: userId,
      fromValue: userBefore?.unitId || "unknown",
      toValue: newUnitId,
      metadata: { 
        reason: "Transferência administrativa",
        adminEmail: session?.email
      }
    });

    return { success: true, user: updated };
  } catch (error: any) {
    return { success: false, message: error.message || "Erro ao transferir militar." };
  }
}

export async function getUnits() {
  try {
    const units = await db.units.getAll();
    return { success: true, units };
  } catch (error: any) {
    return { success: false, units: [], message: error.message || "Erro ao carregar unidades." };
  }
}

export async function getGlobalUsers() {
  try {
    const session = await verifySession();
    if (session?.role !== 'superadmin') {
      throw new Error("Acesso negado.");
    }
    const users = await db.users.getAll();
    const units = await db.units.getAll();
    
    // Mapear unitId para nome da unidade
    const usersWithUnitName = users.map(u => ({
      ...u,
      unitName: units.find(unit => unit.id === u.unitId)?.name || 'Sem Unidade'
    }));

    return { success: true, users: usersWithUnitName };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function createUnit(data: { id: string; name: string; budgetLimit: number }) {
  try {
    const session = await verifySession();
    if (session?.role !== 'superadmin') {
      throw new Error("Acesso negado.");
    }
    const unit = await db.units.create(data);
    // Inicializar configurações para a nova unidade
    await db.settings.update(unit.id, {
      inviteCode: Math.random().toString(36).substring(7).toUpperCase(),
      maxMonthlySlots: 5,
      ac4Rates: { blueDay: 30, blueNight: 35, redDay: 40, redNight: 45 },
      openDateTime: new Date().toISOString(),
      closeDateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
    return { success: true, unit };
  } catch (error: any) {
    return { success: false, message: error.message };
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
export async function createSchedule(data: { scheduleName: string; startTime: string; endTime: string; capacity: number }, unitId?: string) {
  try {
    const session = await verifySession();
    const targetUnitId = unitId || session?.unitId;
    if (!targetUnitId) throw new Error("Unidade não definida.");

    if (session?.role !== 'admin' && session?.role !== 'superadmin') {
      throw new Error("Apenas administradores podem criar escalas.");
    }
    const schedule = await db.schedules.create({ ...data, unitId: targetUnitId });
    return { success: true, schedule };
  } catch (error: any) {
    return { success: false, message: error.message || "Erro ao criar escala." };
  }
}

export async function getSchedules(unitId?: string) {
  try {
    const session = await verifySession();
    const targetUnitId = unitId || session?.unitId;
    
    let schedules = await db.schedules.getAll();
    if (targetUnitId) {
      schedules = schedules.filter(s => s.unitId === targetUnitId);
    }
    
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

function isUserOnDuty(team: string, targetDateString: string, baselineString?: string): boolean {
  if (team === "ADM") return false;
  
  const timeZone = 'America/Sao_Paulo';
  const effectiveBaseline = baselineString || '2026-05-01T07:00:00-03:00'; 
  const baseline = toZonedTime(effectiveBaseline, timeZone);
  
  const teamOffsets: Record<string, number> = {
    "Alpha": 0,
    "Bravo": 1,
    "Charlie": 2,
    "Delta": 3
  };
  
  if (!(team in teamOffsets)) return false;
  
  const target = toZonedTime(targetDateString, timeZone);
  target.setHours(7, 0, 0, 0); // Consider start of duty
  
  const diffTime = target.getTime() - baseline.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return false;
  return (diffDays % 4) === teamOffsets[team];
}

/**
 * Valida a janela de descanso de 5 horas para um policial.
 * Deve haver 5 horas de descanso entre escalas (ordinária/extra e extra/extra).
 */
export async function validateUserRestWindow(
  userId: string,
  targetScheduleId: string,
  startTimeStr: string,
  endTimeStr: string
): Promise<{ valid: boolean; message?: string }> {
  const timeZone = 'America/Sao_Paulo';
  const extraStart = new Date(startTimeStr);
  const extraEnd = new Date(endTimeStr);

  const user = await db.users.getById(userId);
  if (!user) {
    return { valid: true };
  }

  // 1. Validar contra escala ordinária (plantão ordinário das 07:00 às 07:00)
  if (user.workTeam && user.workTeam !== "ADM" && user.workTeam !== "Afastado" && user.workTeam !== "Transferido" && user.workTeam !== "Externo") {
    const unitSettings = await db.settings.get(user.unitId);
    const dutyBaseline = unitSettings?.dutyBaseline;

    // Verificar os dias ao redor da escala extra (2 dias antes e 2 dias depois)
    const startDay = new Date(extraStart.getTime() - 2 * 24 * 60 * 60 * 1000);
    const endDay = new Date(extraEnd.getTime() + 2 * 24 * 60 * 60 * 1000);

    for (let d = new Date(startDay); d <= endDay; d.setDate(d.getDate() + 1)) {
      const dateStrForCheck = formatInTimeZone(d, timeZone, "yyyy-MM-dd'T'12:00:00");
      if (isUserOnDuty(user.workTeam, dateStrForCheck, dutyBaseline)) {
        // O plantão ordinário começa às 07:00 AM do dia d e termina às 07:00 AM do dia d+1
        const ordStart = toZonedTime(formatInTimeZone(d, timeZone, "yyyy-MM-dd'T'07:00:00"), timeZone);
        const ordEnd = new Date(ordStart.getTime() + 24 * 60 * 60 * 1000);

        // Janela proibida com as 5 horas de descanso antes e depois:
        const forbiddenStart = new Date(ordStart.getTime() - 5 * 60 * 60 * 1000);
        const forbiddenEnd = new Date(ordEnd.getTime() + 5 * 60 * 60 * 1000);

        // Se a escala extra sobrepõe a janela proibida:
        if (extraStart < forbiddenEnd && extraEnd > forbiddenStart) {
          const ordStartFormatted = formatInTimeZone(ordStart, timeZone, "dd/MM/yyyy HH:mm");
          const ordEndFormatted = formatInTimeZone(ordEnd, timeZone, "dd/MM/yyyy HH:mm");
          return {
            valid: false,
            message: `Intervalo de descanso insuficiente em relação ao plantão ordinário da equipe ${user.workTeam} das ${ordStartFormatted} às ${ordEndFormatted}. É necessária uma janela de descanso de 5 horas antes e depois.`
          };
        }
      }
    }
  }

  // 2. Validar contra outras escalas extras
  const schedules = await db.schedules.getAll();
  for (const s of schedules) {
    if (s.id !== targetScheduleId && s.userIds?.includes(userId)) {
      const existingStart = new Date(s.startTime);
      const existingEnd = new Date(s.endTime);

      // Janela proibida ao redor da escala extra existente:
      const forbiddenStart = new Date(existingStart.getTime() - 5 * 60 * 60 * 1000);
      const forbiddenEnd = new Date(existingEnd.getTime() + 5 * 60 * 60 * 1000);

      if (extraStart < forbiddenEnd && extraEnd > forbiddenStart) {
        const existingStartFormatted = formatInTimeZone(existingStart, timeZone, "dd/MM/yyyy HH:mm");
        const existingEndFormatted = formatInTimeZone(existingEnd, timeZone, "dd/MM/yyyy HH:mm");
        return {
          valid: false,
          message: `Conflito com outra escala extra agendada (${s.scheduleName} das ${existingStartFormatted} às ${existingEndFormatted}). É necessária uma janela de descanso de 5 horas entre escalas extras.`
        };
      }
    }
  }

  return { valid: true };
}

export async function getSettings(unitId?: string) {
  try {
    const session = await verifySession();
    // Se não passar unitId, tenta pegar da sessão
    const targetUnitId = unitId || session?.unitId || '39bpm';
    const settings = await db.settings.get(targetUnitId);
    return { success: true, settings };
  } catch (error: any) {
    return { success: false, message: error.message || "Erro ao carregar configurações." };
  }
}

export async function updateSettings(data: any, unitId?: string) {
  try {
    const session = await verifySession();
    const targetUnitId = unitId || session?.unitId;

    if (!targetUnitId) throw new Error("Unidade não identificada.");

    if (session?.role !== 'admin' && session?.role !== 'superadmin') {
      throw new Error("Apenas administradores podem alterar configurações.");
    }
    const settings = await db.settings.update(targetUnitId, data);
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
      const newAddedUserIds = data.userIds.filter((uid: string) => !currentSchedule.userIds.includes(uid));
      const settings = await db.settings.get(currentSchedule.unitId);

      for (const newUserId of newAddedUserIds) {
        const user = await db.users.getById(newUserId);
        if (user) {
          // Validar a janela de descanso de 5 horas (abrange escala ordinária e extras)
          const restValidation = await validateUserRestWindow(newUserId, id, currentSchedule.startTime, currentSchedule.endTime);
          if (!restValidation.valid) {
            throw new Error(restValidation.message);
          }
          
          // Rule 2: Max monthly slots
          const userSchedules = schedules.filter(s => 
            s.id !== id &&
            s.userIds?.includes(user.id) &&
            new Date(s.startTime).getMonth() === new Date(currentSchedule.startTime).getMonth() &&
            new Date(s.startTime).getFullYear() === new Date(currentSchedule.startTime).getFullYear()
          );
          
          if (userSchedules.length >= settings.maxMonthlySlots) {
            throw new Error(`O policial já atingiu o limite mensal de ${settings.maxMonthlySlots} agendamentos.`);
          }
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
    const schedules = await db.schedules.getAll();
    const s = schedules.find(x => x.id === scheduleId);
    if (!s) throw new Error("Escala não encontrada.");

    // Pegar configurações DA UNIDADE da escala
    const settings = await db.settings.get(s.unitId);
    const now = new Date();
    
    // Check window
    if (now < new Date(settings.openDateTime)) {
      throw new Error(`O agendamento ainda não está aberto para esta unidade. Abre em: ${new Date(settings.openDateTime).toLocaleString('pt-BR')}`);
    }
    if (now > new Date(settings.closeDateTime)) {
      throw new Error("O período de agendamento desta unidade já foi encerrado.");
    }
    
    if (s.userIds.includes(userId)) {
      throw new Error("Você já está voluntariado nesta escala.");
    }
    
    if (s.userIds.length >= s.capacity) {
      throw new Error("Esta escala já está com as vagas preenchidas.");
    }

    // Verificar Verba da Unidade (Simulação de trava básica)
    const unit = await db.units.getById(s.unitId);
    const scheduleValue = calculateSingleScheduleValue(s, settings.ac4Rates);
    
    if (unit) {
      if (unit.currentSpend + scheduleValue > unit.budgetLimit) {
        throw new Error(`Limite de verba da unidade atingido (${unit.name}). Não é possível se voluntariar.`);
      }
    }

    const user = await db.users.getById(userId);
    if (user) {
      // Validar a janela de descanso de 5 horas (abrange escala ordinária e extras)
      const restValidation = await validateUserRestWindow(userId, scheduleId, s.startTime, s.endTime);
      if (!restValidation.valid) {
        throw new Error(restValidation.message);
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

    // Tenta atualizar a escala primeiro
    const newUserIds = [...s.userIds, userId];
    const updated = await db.schedules.update(scheduleId, { userIds: newUserIds });
    
    if (updated && unit) {
      // Somente se a escala foi atualizada, debitamos a verba
      await db.units.update(unit.id, { currentSpend: unit.currentSpend + scheduleValue });
    }

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
    
    // Atualizar verba da unidade (reverter gasto)
    const settingsRes = await getSettings(s.unitId);
    if (settingsRes.success) {
      const unit = await db.units.getById(s.unitId);
      if (unit) {
        const scheduleValue = calculateSingleScheduleValue(s, settingsRes.settings.ac4Rates);
        await db.units.update(unit.id, { currentSpend: Math.max(0, unit.currentSpend - scheduleValue) });
      }
    }

    const newUserIds = s.userIds.filter(id => id !== userId);
    await db.schedules.update(scheduleId, { userIds: newUserIds });
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message || "Erro ao remover voluntariado." };
  }
}

export async function getCurrentUser() {
  try {
    const session = await verifySession();
    if (!session) return { success: false };
    const user = await db.users.getById(session.id as string);
    if (!user) return { success: false };
    return { success: true, user };
  } catch (error) {
    return { success: false };
  }
}

export async function getAuditLogs() {
  try {
    const session = await verifySession();
    if (session?.role !== 'superadmin' && session?.email !== 'stivnil@hotmail.com') {
      throw new Error("Acesso negado.");
    }

    const logs = await db.auditLogs.getAll();
    const units = await db.units.getAll();

    const logsWithUnitNames = logs.map(log => ({
      ...log,
      fromValue: units.find(u => u.id === log.fromValue)?.name || log.fromValue,
      toValue: units.find(u => u.id === log.toValue)?.name || log.toValue
    }));

    return { success: true, logs: logsWithUnitNames };
  } catch (error: any) {
    return { success: false, logs: [], message: error.message };
  }
}

export async function promoteUserToAdmin(userId: string) {
  try {
    const session = await verifySession();
    if (!session || (session.role !== 'admin' && session.role !== 'superadmin' && session.email !== 'stivnil@hotmail.com')) {
      throw new Error("Acesso negado para promoção.");
    }

    const user = await db.users.getById(userId);
    if (!user) throw new Error("Militar não encontrado.");

    // Admin de unidade só pode promover quem é da sua unidade
    if (session.role === 'admin' && user.unitId !== session.unitId) {
      throw new Error("Você só pode promover militares vinculados à sua unidade.");
    }

    await db.users.update(userId, { role: 'admin' });
    
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message || "Erro ao promover militar." };
  }
}

export async function deleteUser(userId: string) {
  try {
    const session = await verifySession();
    if (!session || (session.role !== 'admin' && session.role !== 'superadmin' && session.email !== 'stivnil@hotmail.com')) {
      throw new Error("Acesso negado para exclusão.");
    }

    // Impedir que o próprio admin se delete
    if (session.id === userId) {
      throw new Error("Você não pode excluir seu próprio cadastro.");
    }

    const deleted = await db.users.delete(userId);
    if (!deleted) throw new Error(`Militar com ID ${userId} não encontrado.`);
    
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message || "Erro ao excluir militar." };
  }
}
