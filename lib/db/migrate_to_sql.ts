import fs from 'fs';
import path from 'path';

const USERS_FILE = path.join(process.cwd(), 'lib', 'db', 'users.json');
const UNITS_FILE = path.join(process.cwd(), 'lib', 'db', 'units.json');
const SETTINGS_FILE = path.join(process.cwd(), 'lib', 'db', 'settings.json');
const SCHEDULES_FILE = path.join(process.cwd(), 'lib', 'db', 'schedules.json');

const OUTPUT_FILE = path.join(process.cwd(), 'lib', 'db', 'seed_data.sql');

function generateSql() {
    let sql = '-- Seed Data for Supabase\n\n';

    // 1. Units
    const units = JSON.parse(fs.readFileSync(UNITS_FILE, 'utf8'));
    sql += '-- Units\n';
    units.forEach((u: any) => {
        sql += `INSERT INTO units (id, name, budget_limit, current_spend) VALUES ('${u.id}', '${u.name.replace(/'/g, "''")}', ${u.budgetLimit}, ${u.currentSpend}) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;\n`;
    });
    sql += '\n';

    // 2. Users
    const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    sql += '-- Users\n';
    users.forEach((u: any) => {
        const role = u.role || 'user';
        const unitId = u.unitId ? `'${u.unitId}'` : 'NULL';
        sql += `INSERT INTO users (id, full_name, nickname, rank, tax_id, rg, email, password_hash, phone, job_function, work_team, sort_order, role, unit_id) VALUES ('${u.id}', '${u.fullName.replace(/'/g, "''")}', '${u.nickname.replace(/'/g, "''")}', '${u.rank}', '${u.taxId}', '${u.rg}', '${u.email}', '${u.passwordHash}', '${u.phone || ''}', '${u.jobFunction || ''}', '${u.workTeam || ''}', ${u.sortOrder || 999}, '${role}', ${unitId}) ON CONFLICT (id) DO NOTHING;\n`;
    });
    sql += '\n';

    // 3. Settings
    const settingsData = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
    const settingsArray = Array.isArray(settingsData) ? settingsData : [settingsData];
    sql += '-- Settings\n';
    
    // Se tivermos apenas uma configurao "global", replicamos para todas as unidades
    if (settingsArray.length === 1 && (settingsArray[0].id === 'global' || !settingsArray[0].unitId)) {
        units.forEach((u: any) => {
            const s = settingsArray[0];
            sql += `INSERT INTO settings (unit_id, ac4_rates, max_monthly_slots, open_date_time, close_date_time, invite_code) VALUES ('${u.id}', '${JSON.stringify(s.ac4Rates)}', ${s.maxMonthlySlots}, '${s.openDateTime}', '${s.closeDateTime}', '${s.inviteCode || 'stiv'}') ON CONFLICT (unit_id) DO NOTHING;\n`;
        });
    } else {
        settingsArray.forEach((s: any) => {
            const unitId = s.unitId || 'global';
            sql += `INSERT INTO settings (unit_id, ac4_rates, max_monthly_slots, open_date_time, close_date_time, invite_code) VALUES ('${unitId}', '${JSON.stringify(s.ac4Rates)}', ${s.maxMonthlySlots}, '${s.openDateTime}', '${s.closeDateTime}', '${s.inviteCode || 'stiv'}') ON CONFLICT (unit_id) DO NOTHING;\n`;
        });
    }
    sql += '\n';

    // 4. Schedules
    const schedules = JSON.parse(fs.readFileSync(SCHEDULES_FILE, 'utf8'));
    sql += '-- Schedules\n';
    schedules.forEach((s: any) => {
        const userIds = s.userIds && s.userIds.length > 0 ? `ARRAY['${s.userIds.join("','")}']::TEXT[]` : "'{}'::TEXT[]";
        sql += `INSERT INTO schedules (id, schedule_name, start_time, end_time, capacity, unit_id, user_ids) VALUES ('${s.id}', '${s.scheduleName.replace(/'/g, "''")}', '${s.startTime}', '${s.endTime}', ${s.capacity}, '${s.unitId}', ${userIds}) ON CONFLICT (id) DO NOTHING;\n`;
    });

    fs.writeFileSync(OUTPUT_FILE, sql);
    console.log(`SQL seed data generated at ${OUTPUT_FILE}`);
}

generateSql();
