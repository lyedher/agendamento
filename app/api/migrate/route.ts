import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { mapUserToDb, mapScheduleToDb, mapSettingsToDb } from '@/lib/db';

// Helper local para mapear Units de camelCase para snake_case
function mapUnitToDb(unit: any) {
  return {
    id: unit.id,
    name: unit.name,
    budget_limit: unit.budgetLimit ?? 5000.00,
    current_spend: unit.currentSpend ?? 0.00
  };
}

export async function GET() {
  const SUPABASE_URL = process.env.SUPABASE_URL || 'https://gqdrlkwyxkqklmsjyhfq.supabase.co';
  const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_LSgNyMz2kFxGXpPUcPqVCw_rFNoG55K';
  
  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'resolution=merge-duplicates'
  };

  const dir = path.join(process.cwd(), 'lib', 'db');
  const errors: string[] = [];
  
  let unitsCount = 0;
  let usersCount = 0;
  let settingsCount = 0;
  let schedulesCount = 0;

  // 1. MIGRAR UNIDADES PRIMEIRO
  const unitsFile = path.join(dir, 'units.json');
  if (fs.existsSync(unitsFile)) {
    const units = JSON.parse(fs.readFileSync(unitsFile, 'utf8'));
    for (const unit of units) {
      try {
        const payload = mapUnitToDb(unit);
        const res = await fetch(`${SUPABASE_URL}/rest/v1/units`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          unitsCount++;
        } else {
          const txt = await res.text();
          errors.push(`Erro Unidade ${unit.id}: ${txt}`);
        }
      } catch (e: any) {
        errors.push(`Exceção Unidade ${unit.id}: ${e.message}`);
      }
    }
  }

  // 2. MIGRAR USUÁRIOS
  const usersFile = path.join(dir, 'users.json');
  if (fs.existsSync(usersFile)) {
    const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
    for (const u of users) {
      try {
        const cleanUser = { ...u };
        
        // Tratar restrições obrigatórias da tabela users do Supabase
        if (!cleanUser.passwordHash || cleanUser.passwordHash.trim() === "") {
          cleanUser.passwordHash = "123456"; // senha padrão
        }
        if (!cleanUser.taxId || cleanUser.taxId.trim() === "") {
          cleanUser.taxId = cleanUser.id || Math.random().toString(36).substring(7);
        }
        if (!cleanUser.rg || cleanUser.rg.trim() === "") {
          cleanUser.rg = cleanUser.id || Math.random().toString(36).substring(7);
        }
        if (cleanUser.unitId === "") {
          cleanUser.unitId = null;
        }

        const res = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
          method: 'POST',
          headers,
          body: JSON.stringify(mapUserToDb(cleanUser))
        });
        if (res.ok) {
          usersCount++;
        } else {
          const txt = await res.text();
          errors.push(`Erro Usuário ${u.email || u.id}: ${txt}`);
        }
      } catch (e: any) {
        errors.push(`Exceção Usuário ${u.email || u.id}: ${e.message}`);
      }
    }
  }

  // 3. MIGRAR CONFIGURAÇÕES (com replicação de config global para cada unidade)
  const settingsFile = path.join(dir, 'settings.json');
  if (fs.existsSync(settingsFile) && fs.existsSync(unitsFile)) {
    const settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
    const units = JSON.parse(fs.readFileSync(unitsFile, 'utf8'));
    const settingsList = Array.isArray(settings) ? settings : [settings];
    
    // Se for configuração global única, replicamos para cada unidade existente
    if (settingsList.length === 1 && (settingsList[0].id === 'global' || !settingsList[0].unitId)) {
      for (const u of units) {
        try {
          const s = { ...settingsList[0], unitId: u.id };
          const payload = mapSettingsToDb(s);
          const res = await fetch(`${SUPABASE_URL}/rest/v1/settings`, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
          });
          if (res.ok) {
            settingsCount++;
          } else {
            const txt = await res.text();
            errors.push(`Erro Config ${u.id}: ${txt}`);
          }
        } catch (e: any) {
          errors.push(`Exceção Config ${u.id}: ${e.message}`);
        }
      }
    } else {
      // Caso contrário, migramos cada um da lista
      for (const s of settingsList) {
        try {
          const payload = mapSettingsToDb(s);
          const res = await fetch(`${SUPABASE_URL}/rest/v1/settings`, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
          });
          if (res.ok) {
            settingsCount++;
          } else {
            const txt = await res.text();
            errors.push(`Erro Config ${s.unitId}: ${txt}`);
          }
        } catch (e: any) {
          errors.push(`Exceção Config ${s.unitId}: ${e.message}`);
        }
      }
    }
  }

  // 4. MIGRAR ESCALAS
  const schedulesFile = path.join(dir, 'schedules.json');
  if (fs.existsSync(schedulesFile)) {
    const schedules = JSON.parse(fs.readFileSync(schedulesFile, 'utf8'));
    for (const s of schedules) {
      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/schedules`, {
          method: 'POST',
          headers,
          body: JSON.stringify(mapScheduleToDb(s))
        });
        if (res.ok) {
          schedulesCount++;
        } else {
          const txt = await res.text();
          errors.push(`Erro Escala ${s.id}: ${txt}`);
        }
      } catch (e: any) {
        errors.push(`Exceção Escala ${s.id}: ${e.message}`);
      }
    }
  }

  return NextResponse.json({
    success: true,
    migrated: {
      units: unitsCount,
      users: usersCount,
      settings: settingsCount,
      schedules: schedulesCount
    },
    errors
  });
}
