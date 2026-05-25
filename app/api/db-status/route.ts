import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;

  const status = {
    supabaseUrlPresent: !!supabaseUrl,
    supabaseUrlValueStart: supabaseUrl ? supabaseUrl.substring(0, 20) + "..." : null,
    supabaseKeyPresent: !!supabaseKey,
    supabaseKeyLength: supabaseKey ? supabaseKey.length : 0,
    connectionTest: "pendente"
  };

  try {
    // Tenta ler as unidades diretamente do Supabase remoto
    const url = `${supabaseUrl}/rest/v1/units`;
    const headers = {
      'apikey': supabaseKey || '',
      'Authorization': `Bearer ${supabaseKey || ''}`,
      'Content-Type': 'application/json'
    };

    console.log("Realizando teste de conexão direta com o Supabase no endpoint /api/db-status...");
    
    if (!supabaseUrl) {
      throw new Error("SUPABASE_URL está ausente do process.env!");
    }

    const res = await fetch(url, { headers });
    if (!res.ok) {
      const errBody = await res.text().catch(() => "Sem corpo");
      throw new Error(`Erro HTTP ${res.status}: ${errBody}`);
    }

    const data = await res.json();
    status.connectionTest = `Sucesso! Conectado ao Supabase remoto. Total de unidades lidas: ${data.length}`;
  } catch (err: any) {
    status.connectionTest = `Falha na conexão com Supabase: ${err.message || err}`;
  }

  return NextResponse.json(status);
}
