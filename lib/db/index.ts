import fs from 'fs';
import path from 'path';

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
}

export interface Schedule {
  id: string;
  scheduleName: string;
  startTime: string;
  endTime: string;
  capacity: number;
  userIds: string[];
}

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://gqdrlkwyxkqklmsjyhfq.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_LSgNyMz2kFxGXpPUcPqVCw_rFNoG55K';

const DB_FILE = path.join(process.cwd(), 'lib', 'db', 'users.json');
const SCHEDULES_FILE = path.join(process.cwd(), 'lib', 'db', 'schedules.json');

const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
};

function getLocalUsers(): User[] {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify([]));
    return [];
  }
  const data = fs.readFileSync(DB_FILE, 'utf8');
  return JSON.parse(data || '[]');
}

function saveLocalUsers(users: User[]) {
  fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2));
}

function getLocalSchedules(): Schedule[] {
  if (!fs.existsSync(SCHEDULES_FILE)) {
    fs.writeFileSync(SCHEDULES_FILE, JSON.stringify([]));
    return [];
  }
  const data = fs.readFileSync(SCHEDULES_FILE, 'utf8');
  return JSON.parse(data || '[]');
}

function saveLocalSchedules(schedules: Schedule[]) {
  fs.writeFileSync(SCHEDULES_FILE, JSON.stringify(schedules, null, 2));
}

export const db = {
  users: {
    async create(user: Omit<User, 'id'>): Promise<User> {
      const newUser = { ...user, id: Math.random().toString(36).substring(7) };
      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
          method: 'POST',
          headers,
          body: JSON.stringify(newUser)
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
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
        return data[0];
      } catch {
        const users = getLocalUsers();
        return users.find(u => u.email.toLowerCase() === email.toLowerCase());
      }
    },
    async findById(id: string): Promise<User | undefined> {
      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${encodeURIComponent(id)}`, {
          headers
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        return data[0];
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
        return await res.json();
      } catch {
        return getLocalUsers();
      }
    },
    async update(id: string, data: Partial<User>): Promise<User | undefined> {
      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${encodeURIComponent(id)}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error();
        const updated = await res.json();
        return updated[0];
      } catch {
        const users = getLocalUsers();
        const index = users.findIndex(u => u.id === id);
        if (index === -1) return undefined;
        users[index] = { ...users[index], ...data };
        saveLocalUsers(users);
        return users[index];
      }
    }
  },
  schedules: {
    async create(schedule: Omit<Schedule, 'id' | 'userIds'>): Promise<Schedule> {
      const newSchedule = { ...schedule, id: Math.random().toString(36).substring(7), userIds: [] };
      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/schedules`, {
          method: 'POST',
          headers,
          body: JSON.stringify(newSchedule)
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        return data[0] || newSchedule;
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
        return await res.json();
      } catch {
        return getLocalSchedules();
      }
    },
    async update(id: string, data: Partial<Schedule>): Promise<Schedule | undefined> {
      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/schedules?id=eq.${encodeURIComponent(id)}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error();
        const updated = await res.json();
        return updated[0];
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
        return true;
      } catch {
        const schedules = getLocalSchedules();
        const filtered = schedules.filter(s => s.id !== id);
        if (filtered.length === schedules.length) return false;
        saveLocalSchedules(filtered);
        return true;
      }
    }
  }
};
