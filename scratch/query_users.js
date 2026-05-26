const SUPABASE_URL = "https://gqdrlkwyxkqklmsjyhfq.supabase.co";
const SUPABASE_KEY = "sb_publishable_LSgNyMz2kFxGXpPUcPqVCw_rFNoG55K";

async function main() {
  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json'
  };

  const res = await fetch(`${SUPABASE_URL}/rest/v1/users`, { headers });
  if (!res.ok) {
    console.error("Failed to fetch users from Supabase:", await res.text());
    return;
  }
  const users = await res.json();
  console.log(`Fetched ${users.length} users.`);

  // Filtra militares de interesse
  console.log("\n--- MILITARES COM HISTÓRICO ---");
  const allWithHistory = users.filter(u => u.team_history && u.team_history.trim() !== "");
  console.log(`Total de militares com histórico cadastrado: ${allWithHistory.length}`);
  allWithHistory.forEach(u => {
    console.log(`- ${u.rank} ${u.nickname} (${u.id}): ${u.team_history} (Equipe atual do BD: ${u.work_team}, Função atual: ${u.job_function})`);
  });
}

main().catch(console.error);
