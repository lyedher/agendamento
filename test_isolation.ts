import { db } from './lib/db';

async function testIsolation() {
    console.log("=== Iniciando Teste de Isolação Multi-Tenant ===\n");

    const allUsers = await db.users.getAll();
    const unit8bpm = '8bpm';
    const unit41bpm = '41bpm';

    console.log(`Total de usuários no sistema: ${allUsers.length}`);

    const users8bpm = allUsers.filter(u => u.unitId === unit8bpm);
    const users41bpm = allUsers.filter(u => u.unitId === unit41bpm);

    console.log(`Usuários no 8º BPM: ${users8bpm.length}`);
    console.log(`Usuários no 41º BPM: ${users41bpm.length}`);

    // Verificar se há sobreposição
    const intersection = users8bpm.filter(u => users41bpm.includes(u));
    if (intersection.length === 0) {
        console.log("✅ SUCESSO: Nenhuma sobreposição de usuários entre unidades.");
    } else {
        console.log("❌ FALHA: Usuários duplicados ou vazados entre unidades!");
    }

    // Testar as configurações
    const settings8bpm = await db.settings.get(unit8bpm);
    const settings41bpm = await db.settings.get(unit41bpm);

    if (settings8bpm && settings41bpm) {
        console.log("✅ SUCESSO: Configurações carregadas para ambas as unidades.");
        console.log(`8º BPM AC-4: ${JSON.stringify(settings8bpm.ac4Rates)}`);
        console.log(`41º BPM AC-4: ${JSON.stringify(settings41bpm.ac4Rates)}`);
    }

    console.log("\n=== Teste Concluído ===");
}

testIsolation().catch(console.error);
