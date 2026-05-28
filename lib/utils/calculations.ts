export interface Ac4Rates {
  blueDay: number;
  blueNight: number;
  redDay: number;
  redNight: number;
}

export function getSaoPauloDateParts(date: Date) {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false
    });
    const parts = formatter.formatToParts(date);
    const year = parseInt(parts.find(p => p.type === 'year')?.value || '0');
    const month = parseInt(parts.find(p => p.type === 'month')?.value || '0') - 1; // 0-based
    const day = parseInt(parts.find(p => p.type === 'day')?.value || '0');
    const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0') % 24;
    const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0');
    const second = parseInt(parts.find(p => p.type === 'second')?.value || '0');
    
    const localDate = new Date(year, month, day, hour, minute, second);
    return {
      year,
      month,
      day,
      hour,
      minute,
      second,
      dayOfWeek: localDate.getDay()
    };
  } catch (e) {
    return {
      year: date.getFullYear(),
      month: date.getMonth(),
      day: date.getDate(),
      hour: date.getHours(),
      minute: date.getMinutes(),
      second: date.getSeconds(),
      dayOfWeek: date.getDay()
    };
  }
}

export const calculateSingleScheduleValue = (s: any, rates: Ac4Rates) => {
  if (!s.startTime || !s.endTime) return 0;
  const start = new Date(s.startTime);
  const end = new Date(s.endTime);
  let total = 0;
  let currentMs = start.getTime();
  const endMs = end.getTime();
  
  while (currentMs < endMs) {
    const current = new Date(currentMs);
    const parts = getSaoPauloDateParts(current);
    const hour = parts.hour;
    const dayOfWeek = parts.dayOfWeek;
    
    // Regra: Sexta 06h até Segunda 06h = Escala Vermelha
    let isVermelha = false;
    if (dayOfWeek === 5) { // Sexta
      isVermelha = hour >= 6;
    } else if (dayOfWeek === 6 || dayOfWeek === 0) { // Sábado ou Domingo
      isVermelha = true;
    } else if (dayOfWeek === 1) { // Segunda
      isVermelha = hour < 6;
    }

    // Regra: 06h até 22h = Diurno, 22h até 06h = Noturno
    const isNight = hour >= 22 || hour < 6;

    if (isVermelha) {
      total += isNight ? rates.redNight : rates.redDay;
    } else {
      total += isNight ? rates.blueNight : rates.blueDay;
    }
    currentMs += 3600000;
  }
  return total;
};

export const calculateUserAc4Summary = (userId: string, schedules: any[], rates: Ac4Rates, targetMonth?: number, targetYear?: number) => {
  let totalHours = 0;
  let totalValue = 0;
  let extraCount = 0;
  let blueDayHours = 0;
  let blueNightHours = 0;
  let redDayHours = 0;
  let redNightHours = 0;

  const filteredSchedules = schedules.filter(s => {
    if (!s.userIds || !s.userIds.includes(userId)) return false;
    if (targetMonth !== undefined && targetYear !== undefined) {
      const startParts = getSaoPauloDateParts(new Date(s.startTime));
      return startParts.month === targetMonth && startParts.year === targetYear;
    }
    return true;
  });

  filteredSchedules.forEach(s => {
    extraCount++;
    const start = new Date(s.startTime);
    const end = new Date(s.endTime);
    let currentMs = start.getTime();
    const endMs = end.getTime();
    
    while (currentMs < endMs) {
      const current = new Date(currentMs);
      const parts = getSaoPauloDateParts(current);
      const hour = parts.hour;
      const dayOfWeek = parts.dayOfWeek;
      
      let isVermelha = false;
      if (dayOfWeek === 5) { isVermelha = hour >= 6; }
      else if (dayOfWeek === 6 || dayOfWeek === 0) { isVermelha = true; }
      else if (dayOfWeek === 1) { isVermelha = hour < 6; }

      const isNight = hour >= 22 || hour < 6;

      if (isVermelha) {
        if (isNight) {
          redNightHours += 1;
          totalValue += rates.redNight;
        } else {
          redDayHours += 1;
          totalValue += rates.redDay;
        }
      } else {
        if (isNight) {
          blueNightHours += 1;
          totalValue += rates.blueNight;
        } else {
          blueDayHours += 1;
          totalValue += rates.blueDay;
        }
      }
      totalHours += 1;
      currentMs += 3600000;
    }
  });

  return { totalHours, totalValue, extraCount, blueDayHours, blueNightHours, redDayHours, redNightHours };
};

export const getUserTeamOnDate = (user: any, dateStr: string): string => {
  if (user.teamHistory && user.teamHistory.trim() !== "") {
    try {
      const history = JSON.parse(user.teamHistory);
      if (Array.isArray(history) && history.length > 0) {
        // Ordena decrescente por startDate para priorizar o registro ativo mais recente
        const sortedHistory = [...history].sort((a: any, b: any) => {
          const dateA = a.startDate || "";
          const dateB = b.startDate || "";
          return dateB.localeCompare(dateA);
        });

        for (const entry of sortedHistory) {
          const start = entry.startDate || "";
          const end = entry.endDate || "";
          const afterStart = start === "" || dateStr >= start;
          const beforeEnd = end === "" || dateStr <= end;
          if (afterStart && beforeEnd) {
            return entry.team !== undefined ? entry.team : (user.workTeam || "");
          }
        }
      }
    } catch (e) {
      console.error("Erro ao analisar teamHistory para o militar", user.id, e);
    }
  }
  return user.workTeam || "";
};

export const getUserJobFunctionOnDate = (user: any, dateStr: string): string => {
  if (user.teamHistory && user.teamHistory.trim() !== "") {
    try {
      const history = JSON.parse(user.teamHistory);
      if (Array.isArray(history) && history.length > 0) {
        // Ordena decrescente por startDate para priorizar o registro ativo mais recente
        const sortedHistory = [...history].sort((a: any, b: any) => {
          const dateA = a.startDate || "";
          const dateB = b.startDate || "";
          return dateB.localeCompare(dateA);
        });

        for (const entry of sortedHistory) {
          const start = entry.startDate || "";
          const end = entry.endDate || "";
          const afterStart = start === "" || dateStr >= start;
          const beforeEnd = end === "" || dateStr <= end;
          if (afterStart && beforeEnd) {
            return entry.jobFunction !== undefined ? entry.jobFunction : (user.jobFunction || "");
          }
        }
      }
    } catch (e) {
      console.error("Erro ao analisar teamHistory para função do militar", user.id, e);
    }
  }
  return user.jobFunction || "";
};

export const getUserVtrOnDate = (user: any, dateStr: string): string => {
  if (user.teamHistory && user.teamHistory.trim() !== "") {
    try {
      const history = JSON.parse(user.teamHistory);
      if (Array.isArray(history) && history.length > 0) {
        // Ordena decrescente por startDate para priorizar o registro ativo mais recente
        const sortedHistory = [...history].sort((a: any, b: any) => {
          const dateA = a.startDate || "";
          const dateB = b.startDate || "";
          return dateB.localeCompare(dateA);
        });

        for (const entry of sortedHistory) {
          const start = entry.startDate || "";
          const end = entry.endDate || "";
          const afterStart = start === "" || dateStr >= start;
          const beforeEnd = end === "" || dateStr <= end;
          if (afterStart && beforeEnd) {
            return entry.vtr !== undefined ? entry.vtr : (user.vtr || "");
          }
        }
      }
    } catch (e) {
      console.error("Erro ao analisar teamHistory para VTR do militar", user.id, e);
    }
  }
  return user.vtr || "";
};
