const SUPABASE_URL = "https://gqdrlkwyxkqklmsjyhfq.supabase.co";
const SUPABASE_KEY = "sb_publishable_LSgNyMz2kFxGXpPUcPqVCw_rFNoG55K";

const RANKS = ["Soldado", "Cabo", "3º Sargento", "2º Sargento", "1º Sargento", "Subtenente", "Aspirante", "2º Tenente", "1º Tenente", "Capitão", "Major", "Tenente-Coronel", "Coronel"];
const dutyBaseline = "2026-05-01";

const getUserTeamOnDate = (user, dateStr) => {
  if (user.team_history && user.team_history.trim() !== "") {
    try {
      const history = JSON.parse(user.team_history);
      if (Array.isArray(history) && history.length > 0) {
        // Ordena decrescente por startDate
        const sortedHistory = [...history].sort((a, b) => {
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
            return entry.team;
          }
        }
      }
    } catch (e) {
      console.error("Erro ao analisar teamHistory para o militar", user.id, e);
    }
  }
  return user.work_team || "";
};

const isUserOnDutyMatrix = (team, year, month, day) => {
  if (team === "ADM") return false;
  const target = new Date(year, month, day, 8, 0, 0);
  const baseline = new Date(dutyBaseline + 'T08:00:00');
  const diffTime = target.getTime() - baseline.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return false;
  const remainder = ((diffDays % 4) + 4) % 4;

  const teamOffsets = { "Alpha": 0, "Bravo": 1, "Charlie": 2, "Delta": 3 };
  return remainder === teamOffsets[team];
};

async function main() {
  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json'
  };

  const res = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.5cqk37`, { headers });
  const users = await res.json();
  const saulo = users[0];

  console.log(`Militar: ${saulo.rank} ${saulo.nickname}`);
  console.log(`Histórico do BD: ${saulo.team_history}`);

  const checkDays = [
    { year: 2026, month: 4, day: 30, label: "30/05/2026" },
    { year: 2026, month: 4, day: 31, label: "31/05/2026" },
    { year: 2026, month: 5, day: 1, label: "01/06/2026" },
    { year: 2026, month: 5, day: 2, label: "02/06/2026" },
    { year: 2026, month: 5, day: 3, label: "03/06/2026" }
  ];

  console.log("\n--- SIMULAÇÃO DE DIAS ---");
  checkDays.forEach(d => {
    const pad = (n) => n.toString().padStart(2, '0');
    const dateStr = `${d.year}-${pad(d.month + 1)}-${pad(d.day)}`;
    
    const teamOnDate = getUserTeamOnDate(saulo, dateStr);
    const teams = ["Alpha", "Bravo", "Charlie", "Delta"];
    const teamOnDuty = teams.find(team => isUserOnDutyMatrix(team, d.year, d.month, d.day));

    const isWorkingThisDay = teamOnDate === teamOnDuty;

    console.log(`Data: ${d.label} | Equipe de Serviço: ${teamOnDuty || "Nenhuma"} | Equipe do Saulo na Data: ${teamOnDate} | Trabalha? ${isWorkingThisDay ? "SIM" : "NÃO"}`);
  });
}

main().catch(console.error);
