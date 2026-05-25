// Force reload comment - v2
import fs from 'fs';
import path from 'path';

import initialUsers from './users.json';
import initialSchedules from './schedules.json';
import initialUnits from './units.json';
import initialSettings from './settings.json';
import initialAuditLogs from './audit_logs.json';

export interface User {
  id: string;
  email: string;
  fullName: string;
  nickname: string;
  rank: string;
  jobFunction: string;
  workTeam: string;
  taxId: string;
  rg: string;
  phone: string;
  passwordHash?: string; 
  photo?: string;
  sortOrder?: number;
  role?: 'superadmin' | 'admin' | 'user';
  unitId?: string; // ID da unidade à qual o militar pertence
  birthDate?: string; // Para aniversários e antiguidade
  serviceType?: 'OPER' | 'ADM' | 'ARI' | 'ALI' | 'APOIO';
  absenceReason?: string; // Motivo do afastamento (Férias, Licença, etc)
  absenceStartDate?: string; // Data de início do afastamento (YYYY-MM-DD)
  returnDate?: string; // Data de retorno do afastamento (YYYY-MM-DD)
  transferDate?: string; // Data da transferência (YYYY-MM-DD)
  fichaData?: string;
}

export interface Unit {
  id: string;
  name: string;
  budgetLimit: number;
  currentSpend: number;
  status: 'active' | 'inactive';
}

export interface Schedule {
  id: string;
  unitId: string;
  scheduleName: string;
  startTime: string;
  endTime: string;
  capacity: number;
  userIds: string[];
}

export interface AppSettings {
  id: string;
  unitId: string; // Cada unidade tem suas configurações
  ac4Rates: {
    blueDay: number;
    blueNight: number;
    redDay: number;
    redNight: number;
  };
  dutyBaseline?: string; // Data de início do ciclo para Equipe Alpha (ISO ou YYYY-MM-DD)
  maxMonthlySlots: number;
  openDateTime: string; // ISO string
  closeDateTime: string; // ISO string
  inviteCode?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  actorId: string;
  targetId?: string;
  fromValue?: string;
  toValue?: string;
  metadata?: any;
  createdAt: string;
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const isVercel = process.env.VERCEL === '1' || process.env.NOW_BUILDER === '1';
const BASE_DIR = isVercel ? '/tmp' : path.join(process.cwd(), 'lib', 'db');

const DB_FILE = path.join(BASE_DIR, 'users.json');
const SCHEDULES_FILE = path.join(BASE_DIR, 'schedules.json');
const SETTINGS_FILE = path.join(BASE_DIR, 'settings.json');
const UNITS_FILE = path.join(BASE_DIR, 'units.json');
const AUDIT_LOGS_FILE = path.join(BASE_DIR, 'audit_logs.json');

const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
};

function getLocalUsers(): User[] {
  if (!fs.existsSync(DB_FILE)) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(initialUsers, null, 2));
    } catch (e) {
      console.warn("Failed to initialize users file in fallback path:", e);
      return initialUsers as User[];
    }
  }
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data || '[]');
  } catch {
    return initialUsers as User[];
  }
}

function saveLocalUsers(users: User[]) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2));
  } catch (e) {
    console.warn("Failed to save users:", e);
  }
}

function getLocalSchedules(): Schedule[] {
  if (!fs.existsSync(SCHEDULES_FILE)) {
    try {
      fs.writeFileSync(SCHEDULES_FILE, JSON.stringify(initialSchedules, null, 2));
    } catch (e) {
      console.warn("Failed to initialize schedules file in fallback path:", e);
      return initialSchedules as Schedule[];
    }
  }
  try {
    const data = fs.readFileSync(SCHEDULES_FILE, 'utf8');
    return JSON.parse(data || '[]');
  } catch {
    return initialSchedules as Schedule[];
  }
}

function saveLocalSchedules(schedules: Schedule[]) {
  try {
    fs.writeFileSync(SCHEDULES_FILE, JSON.stringify(schedules, null, 2));
  } catch (e) {
    console.warn("Failed to save schedules:", e);
  }
}

function getLocalSettings(): AppSettings[] {
  if (!fs.existsSync(SETTINGS_FILE)) {
    try {
      fs.writeFileSync(SETTINGS_FILE, JSON.stringify(initialSettings, null, 2));
    } catch (e) {
      console.warn("Failed to initialize settings file in fallback path:", e);
      const parsed = initialSettings;
      return Array.isArray(parsed) ? (parsed as AppSettings[]) : ([parsed] as AppSettings[]);
    }
  }
  try {
    const data = fs.readFileSync(SETTINGS_FILE, 'utf8');
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    const parsed = initialSettings;
    return Array.isArray(parsed) ? (parsed as AppSettings[]) : ([parsed] as AppSettings[]);
  }
}

function saveLocalSettings(settings: AppSettings[]) {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
  } catch (e) {
    console.warn("Failed to save settings:", e);
  }
}

function getLocalUnits(): Unit[] {
  if (!fs.existsSync(UNITS_FILE)) {
    try {
      fs.writeFileSync(UNITS_FILE, JSON.stringify(initialUnits, null, 2));
    } catch (e) {
      console.warn("Failed to initialize units file in fallback path:", e);
      return initialUnits as Unit[];
    }
  }
  try {
    const data = fs.readFileSync(UNITS_FILE, 'utf8');
    return JSON.parse(data || '[]');
  } catch {
    return initialUnits as Unit[];
  }
}

function saveLocalUnits(units: Unit[]) {
  try {
    fs.writeFileSync(UNITS_FILE, JSON.stringify(units, null, 2));
  } catch (e) {
    console.warn("Failed to save units:", e);
  }
}

function getLocalAuditLogs(): AuditLog[] {
  if (!fs.existsSync(AUDIT_LOGS_FILE)) {
    try {
      fs.writeFileSync(AUDIT_LOGS_FILE, JSON.stringify(initialAuditLogs, null, 2));
    } catch (e) {
      console.warn("Failed to initialize audit logs file in fallback path:", e);
      return initialAuditLogs as AuditLog[];
    }
  }
  try {
    const data = fs.readFileSync(AUDIT_LOGS_FILE, 'utf8');
    return JSON.parse(data || '[]');
  } catch {
    return initialAuditLogs as AuditLog[];
  }
}

function saveLocalAuditLogs(logs: AuditLog[]) {
  try {
    fs.writeFileSync(AUDIT_LOGS_FILE, JSON.stringify(logs, null, 2));
  } catch (e) {
    console.warn("Failed to save audit logs:", e);
  }
}

export function mapUserToDb(user: Partial<User>) {
  const mapped: any = {};
  if (user.id !== undefined) mapped.id = user.id;
  if (user.email !== undefined) mapped.email = user.email;
  if (user.fullName !== undefined) mapped.full_name = user.fullName;
  if (user.nickname !== undefined) mapped.nickname = user.nickname;
  if (user.rank !== undefined) mapped.rank = user.rank;
  if (user.taxId !== undefined) mapped.tax_id = user.taxId;
  if (user.rg !== undefined) mapped.rg = user.rg;
  if (user.passwordHash !== undefined) mapped.password_hash = user.passwordHash;
  if (user.phone !== undefined) mapped.phone = user.phone;
  if (user.jobFunction !== undefined) mapped.job_function = user.jobFunction;
  if (user.workTeam !== undefined) mapped.work_team = user.workTeam;
  if (user.sortOrder !== undefined) mapped.sort_order = user.sortOrder;
  if (user.role !== undefined) mapped.role = user.role;
  if (user.unitId !== undefined) mapped.unit_id = user.unitId || null;
  if (user.photo !== undefined) mapped.avatar_url = user.photo;
  if (user.birthDate !== undefined) mapped.birth_date = user.birthDate || null;
  if (user.serviceType !== undefined) mapped.service_type = user.serviceType;
  if (user.absenceReason !== undefined) mapped.absence_reason = user.absenceReason || null;
  if (user.absenceStartDate !== undefined) mapped.absence_start_date = user.absenceStartDate || null;
  if (user.returnDate !== undefined) mapped.return_date = user.returnDate || null;
  if (user.transferDate !== undefined) mapped.transfer_date = user.transferDate || null;
  if (user.fichaData !== undefined) mapped.ficha_data = user.fichaData;
  if (user.teamHistory !== undefined) mapped.team_history = user.teamHistory;
  return mapped;
}

export function mapDbToUser(dbUser: any): User {
  if (!dbUser) return dbUser;
  return {
    id: dbUser.id,
    email: dbUser.email,
    fullName: dbUser.full_name,
    nickname: dbUser.nickname,
    rank: dbUser.rank,
    taxId: dbUser.tax_id,
    rg: dbUser.rg,
    passwordHash: dbUser.password_hash,
    phone: dbUser.phone,
    jobFunction: dbUser.job_function,
    workTeam: dbUser.work_team,
    sortOrder: dbUser.sort_order,
    role: dbUser.role,
    unitId: dbUser.unit_id,
    photo: dbUser.avatar_url,
    birthDate: dbUser.birth_date,
    serviceType: dbUser.service_type,
    absenceReason: dbUser.absence_reason,
    absenceStartDate: dbUser.absence_start_date,
    returnDate: dbUser.return_date,
    transferDate: dbUser.transfer_date,
    fichaData: dbUser.ficha_data,
    teamHistory: dbUser.team_history
  };
}

export function mapDbToSettings(dbRow: any): AppSettings {
  if (!dbRow) return dbRow;
  return {
    id: dbRow.unit_id || Math.random().toString(36).substring(7),
    unitId: dbRow.unit_id,
    ac4Rates: dbRow.ac4_rates ? (typeof dbRow.ac4_rates === 'string' ? JSON.parse(dbRow.ac4_rates) : dbRow.ac4_rates) : { blueDay: 26.47, blueNight: 29.8, redDay: 36.41, redNight: 41.38 },
    maxMonthlySlots: dbRow.max_monthly_slots ?? 10,
    openDateTime: dbRow.open_date_time || new Date().toISOString(),
    closeDateTime: dbRow.close_date_time || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    inviteCode: dbRow.invite_code || 'stiv'
  };
}

export function mapSettingsToDb(settings: Partial<AppSettings>): any {
  if (!settings) return settings;
  const dbRow: any = {};
  if (settings.unitId !== undefined) dbRow.unit_id = settings.unitId;
  if (settings.ac4Rates !== undefined) dbRow.ac4_rates = settings.ac4Rates;
  if (settings.maxMonthlySlots !== undefined) dbRow.max_monthly_slots = settings.maxMonthlySlots;
  if (settings.openDateTime !== undefined) dbRow.open_date_time = settings.openDateTime || null;
  if (settings.closeDateTime !== undefined) dbRow.close_date_time = settings.closeDateTime || null;
  if (settings.inviteCode !== undefined) dbRow.invite_code = settings.inviteCode;
  return dbRow;
}

export function mapDbToSchedule(dbRow: any): Schedule {
  if (!dbRow) return dbRow;
  return {
    id: dbRow.id,
    scheduleName: dbRow.schedule_name,
    startTime: dbRow.start_time,
    endTime: dbRow.end_time,
    capacity: dbRow.capacity ?? 1,
    unitId: dbRow.unit_id,
    userIds: dbRow.user_ids || []
  };
}

export function mapScheduleToDb(schedule: Partial<Schedule>): any {
  if (!schedule) return schedule;
  const dbRow: any = {};
  if (schedule.id !== undefined) dbRow.id = schedule.id;
  if (schedule.scheduleName !== undefined) dbRow.schedule_name = schedule.scheduleName;
  if (schedule.startTime !== undefined) dbRow.start_time = schedule.startTime;
  if (schedule.endTime !== undefined) dbRow.end_time = schedule.endTime;
  if (schedule.capacity !== undefined) dbRow.capacity = schedule.capacity;
  if (schedule.unitId !== undefined) dbRow.unit_id = schedule.unitId;
  if (schedule.userIds !== undefined) dbRow.user_ids = schedule.userIds;
  return dbRow;
}

export const db = {
  users: {
    async create(user: Omit<User, 'id'>): Promise<User> {
      const newUser = { ...user, id: Math.random().toString(36).substring(7) };
      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
          method: 'POST',
          headers,
          body: JSON.stringify(mapUserToDb(newUser))
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        try {
          const users = getLocalUsers();
          users.push(newUser);
          saveLocalUsers(users);
        } catch (e) {
          console.warn("Failed to sync local users on create:", e);
        }
        return data[0] || newUser;
      } catch {
        const users = getLocalUsers();
        users.push(newUser);
        saveLocalUsers(users);
        return newUser;
      }
    },
    async findByEmail(email: string): Promise<User | undefined> {
      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(email)}`, {
          headers
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        return mapDbToUser(data[0]);

      } catch {
        const users = getLocalUsers();
        return users.find(u => u.email.toLowerCase() === email.toLowerCase());
      }
    },
    async getById(id: string): Promise<User | undefined> {
      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${encodeURIComponent(id)}`, {
          headers
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        return mapDbToUser(data[0]);

      } catch {
        const users = getLocalUsers();
        return users.find(u => u.id === id);
      }
    },
    async getAll(): Promise<User[]> {
      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
          headers
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        return data.map(mapDbToUser);

      } catch {
        return getLocalUsers();
      }
    },
    async update(id: string, data: Partial<User>): Promise<User | undefined> {
      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${encodeURIComponent(id)}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(mapUserToDb(data))
        });
        if (!res.ok) throw new Error();
        const updated = await res.json();
        try {
          const users = getLocalUsers();
          const index = users.findIndex(u => u.id === id);
          if (index !== -1) {
            users[index] = { ...users[index], ...data };
            saveLocalUsers(users);
          }
        } catch (e) {
          console.warn("Failed to sync local users on update:", e);
        }
        return mapDbToUser(updated[0]);

      } catch {
        const users = getLocalUsers();
        const index = users.findIndex(u => u.id === id);
        if (index === -1) return undefined;
        users[index] = { ...users[index], ...data };
        saveLocalUsers(users);
        return users[index];
      }
    },
    async delete(id: string): Promise<boolean> {
      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${encodeURIComponent(id)}`, {
          method: 'DELETE',
          headers
        });
        if (!res.ok) throw new Error();
        try {
          const users = getLocalUsers();
          const filtered = users.filter(u => String(u.id).trim() !== String(id).trim());
          saveLocalUsers(filtered);
        } catch (e) {
          console.warn("Failed to sync local users on delete:", e);
        }
        return true;
      } catch (err) {
        const users = getLocalUsers();
        const initialCount = users.length;
        const filtered = users.filter(u => String(u.id).trim() !== String(id).trim());
        
        if (filtered.length === initialCount) {
          return false;
        }
        
        saveLocalUsers(filtered);
        return true;
      }
    }
  },
  schedules: {
    async create(schedule: Omit<Schedule, 'id' | 'userIds'>): Promise<Schedule> {
      const newSchedule = { ...schedule, id: Math.random().toString(36).substring(7), userIds: [] as string[] };
      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/schedules`, {
          method: 'POST',
          headers,
          body: JSON.stringify(mapScheduleToDb(newSchedule))
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        try {
          const schedules = getLocalSchedules();
          schedules.push(newSchedule);
          saveLocalSchedules(schedules);
        } catch (e) {
          console.warn("Failed to sync local schedules on create:", e);
        }
        return mapDbToSchedule(data[0]) || newSchedule;
      } catch {
        const schedules = getLocalSchedules();
        schedules.push(newSchedule);
        saveLocalSchedules(schedules);
        return newSchedule;
      }
    },
    async getAll(): Promise<Schedule[]> {
      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/schedules`, {
          headers
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        return data.map(mapDbToSchedule);
      } catch {
        return getLocalSchedules();
      }
    },
    async update(id: string, data: Partial<Schedule>): Promise<Schedule | undefined> {
      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/schedules?id=eq.${encodeURIComponent(id)}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(mapScheduleToDb(data))
        });
        if (!res.ok) throw new Error();
        const updated = await res.json();
        try {
          const schedules = getLocalSchedules();
          const index = schedules.findIndex(s => s.id === id);
          if (index !== -1) {
            schedules[index] = { ...schedules[index], ...data };
            saveLocalSchedules(schedules);
          }
        } catch (e) {
          console.warn("Failed to sync local schedules on update:", e);
        }
        return mapDbToSchedule(updated[0]);
      } catch {
        const schedules = getLocalSchedules();
        const index = schedules.findIndex(s => s.id === id);
        if (index === -1) return undefined;
        schedules[index] = { ...schedules[index], ...data };
        saveLocalSchedules(schedules);
        return schedules[index];
      }
    },
    async delete(id: string): Promise<boolean> {
      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/schedules?id=eq.${encodeURIComponent(id)}`, {
          method: 'DELETE',
          headers
        });
        if (!res.ok) throw new Error();
        try {
          const schedules = getLocalSchedules();
          const filtered = schedules.filter(s => s.id !== id);
          saveLocalSchedules(filtered);
        } catch (e) {
          console.warn("Failed to sync local schedules on delete:", e);
        }
        return true;
      } catch {
        const schedules = getLocalSchedules();
        const filtered = schedules.filter(s => s.id !== id);
        if (filtered.length === schedules.length) return false;
        saveLocalSchedules(filtered);
        return true;
      }
    }
  },
  units: {
    async create(unit: Omit<Unit, 'id'>): Promise<Unit> {
      const newUnit = { ...unit, id: Math.random().toString(36).substring(7) };
      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/units`, {
          method: 'POST',
          headers,
          body: JSON.stringify(newUnit)
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        try {
          const units = getLocalUnits();
          units.push(newUnit);
          saveLocalUnits(units);
        } catch (e) {
          console.warn("Failed to sync local units on create:", e);
        }
        return data[0] || newUnit;
      } catch {
        const units = getLocalUnits();
        units.push(newUnit);
        saveLocalUnits(units);
        return newUnit;
      }
    },
    async getAll(): Promise<Unit[]> {
      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/units`, { headers });
        if (!res.ok) throw new Error();
        return await res.json();
      } catch {
        return getLocalUnits();
      }
    },
    async getById(id: string): Promise<Unit | undefined> {
      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/units?id=eq.${encodeURIComponent(id)}`, { headers });
        if (!res.ok) throw new Error();
        const data = await res.json();
        return data[0];
      } catch {
        return getLocalUnits().find(u => u.id === id);
      }
    },
    async update(id: string, data: Partial<Unit>): Promise<Unit | undefined> {
      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/units?id=eq.${encodeURIComponent(id)}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error();
        const updated = await res.json();
        try {
          const units = getLocalUnits();
          const index = units.findIndex(u => u.id === id);
          if (index !== -1) {
            units[index] = { ...units[index], ...data };
            saveLocalUnits(units);
          }
        } catch (e) {
          console.warn("Failed to sync local units on update:", e);
        }
        return updated[0];
      } catch {
        const units = getLocalUnits();
        const index = units.findIndex(u => u.id === id);
        if (index === -1) return undefined;
        units[index] = { ...units[index], ...data };
        saveLocalUnits(units);
        return units[index];
      }
    }
  },
  settings: {
    async get(unitId: string = '39bpm'): Promise<AppSettings> {
      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/settings?unit_id=eq.${encodeURIComponent(unitId)}`, {
          headers
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (data.length === 0) throw new Error();
        return mapDbToSettings(data[0]);
      } catch {
        const settingsList = getLocalSettings();
        const unitSettings = settingsList.find(s => s.unitId === unitId);
        
        if (unitSettings) return unitSettings;
        
        // Retorno padrão se não existir
        return {
          id: Math.random().toString(36).substring(7),
          unitId,
          ac4Rates: { blueDay: 26.47, blueNight: 29.8, redDay: 36.41, redNight: 41.38 },
          maxMonthlySlots: 10,
          openDateTime: new Date().toISOString(),
          closeDateTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          inviteCode: 'stiv'
        };
      }
    },
    async update(unitId: string, data: Partial<AppSettings>): Promise<AppSettings> {
      try {
        if (!SUPABASE_URL) throw new Error("Supabase URL not configured");
        
        const dbBody = {
          ...mapSettingsToDb(data),
          unit_id: unitId
        };

        const res = await fetch(`${SUPABASE_URL}/rest/v1/settings`, {
          method: 'POST',
          headers: {
            ...headers,
            'Prefer': 'resolution=merge-duplicates,return=representation'
          },
          body: JSON.stringify(dbBody)
        });
        
        if (res.ok) {
          const updated = await res.json();
          try {
            const settingsList = getLocalSettings();
            const index = settingsList.findIndex(s => s.unitId === unitId);
            if (index !== -1) {
              settingsList[index] = { ...settingsList[index], ...data };
              saveLocalSettings(settingsList);
            }
          } catch (e) {
            console.warn("Failed to sync local settings on update:", e);
          }
          if (updated && updated[0]) return mapDbToSettings(updated[0]);
        }
        throw new Error("Supabase request failed or returned empty data");
      } catch (error) {
        console.warn("Using local settings fallback:", error);
        const settingsList = getLocalSettings();
        const index = settingsList.findIndex(s => s.unitId === unitId);
        
        if (index === -1) {
          const newSettings = { 
            id: Math.random().toString(36).substring(7),
            unitId,
            ac4Rates: { blueDay: 26.47, blueNight: 29.8, redDay: 36.41, redNight: 41.38 },
            maxMonthlySlots: 10,
            openDateTime: new Date().toISOString(),
            closeDateTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            ...data 
          } as AppSettings;
          settingsList.push(newSettings);
          saveLocalSettings(settingsList);
          return newSettings;
        } else {
          settingsList[index] = { ...settingsList[index], ...data };
          saveLocalSettings(settingsList);
          return settingsList[index];
        }
      }
    }
  },
  auditLogs: {
    async create(data: Omit<AuditLog, 'id' | 'createdAt'>): Promise<AuditLog> {
      const newLog: AuditLog = {
        id: Math.random().toString(36).substring(7),
        createdAt: new Date().toISOString(),
        ...data
      };

      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/audit_logs`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            action: newLog.action,
            actor_id: newLog.actorId,
            target_id: newLog.targetId,
            from_value: newLog.fromValue,
            to_value: newLog.toValue,
            metadata: newLog.metadata,
            created_at: newLog.createdAt
          })
        });
        
        if (res.ok) {
          const created = await res.json();
          if (created && created[0]) return created[0];
        }
      } catch (error) {
        console.error("Erro ao salvar log no Supabase:", error);
      }

      const logs = getLocalAuditLogs();
      logs.push(newLog);
      saveLocalAuditLogs(logs);
      return newLog;
    },
    async getAll(): Promise<AuditLog[]> {
      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/audit_logs?order=created_at.desc`, {
          headers
        });
        if (res.ok) return await res.json();
      } catch {
        // Fallback para logs locais em caso de falha da API
      }
      return getLocalAuditLogs().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  }
};
