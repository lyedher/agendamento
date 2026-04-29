import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const SUPABASE_URL = process.env.SUPABASE_URL || 'https://gqdrlkwyxkqklmsjyhfq.supabase.co';
  const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_LSgNyMz2kFxGXpPUcPqVCw_rFNoG55K';
  
  const DB_FILE = path.join(process.cwd(), 'lib', 'db', 'users.json');
  
  if (!fs.existsSync(DB_FILE)) {
    return NextResponse.json({ error: 'JSON file not found' });
  }
  
  const users = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  let migrated = 0;
  let errors: string[] = [];

  for (const u of users) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(u)
      });
      if (res.ok) {
        migrated++;
      } else {
        const text = await res.text();
        errors.push(`Falha para ${u.email}: ${res.status} - ${text}`);
      }
    } catch (e: any) {
      errors.push(`Exceção para ${u.email}: ${e.message}`);
    }
  }

  return NextResponse.json({ success: true, migrated, errors });
}
