export interface Ac4Rates {
  blueDay: number;
  blueNight: number;
  redDay: number;
  redNight: number;
}

export const calculateSingleScheduleValue = (s: any, rates: Ac4Rates) => {
  if (!s.startTime || !s.endTime) return 0;
  const start = new Date(s.startTime);
  const end = new Date(s.endTime);
  let total = 0;
  const current = new Date(start);
  
  while (current < end) {
    const hour = current.getHours();
    const dayOfWeek = current.getDay(); 
    
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
    current.setHours(current.getHours() + 1);
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
      const start = new Date(s.startTime);
      return start.getMonth() === targetMonth && start.getFullYear() === targetYear;
    }
    return true;
  });

  filteredSchedules.forEach(s => {
    extraCount++;
    const start = new Date(s.startTime);
    const end = new Date(s.endTime);
    const current = new Date(start);
    
    while (current < end) {
      const hour = current.getHours();
      const dayOfWeek = current.getDay(); 
      
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
      current.setHours(current.getHours() + 1);
    }
  });

  return { totalHours, totalValue, extraCount, blueDayHours, blueNightHours, redDayHours, redNightHours };
};
