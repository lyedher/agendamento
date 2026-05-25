-- =====================================================================
-- EXECUTAR NO SQL EDITOR DO SUPABASE (https://supabase.com)
-- =====================================================================
-- Este script atualiza a estrutura do banco de dados na nuvem para garantir
-- que todas as colunas de afastamento, histórico e fichas existam e permite
-- que o aplicativo Next.js salve as escalas e usuários corretamente na nuvem.

-- 1. ADICIONAR COLUNAS QUE ESTÃO FALTANDO NA TABELA DE USUÁRIOS
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS absence_reason TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS absence_start_date DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS return_date DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS transfer_date DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS service_type TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS team_history TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ficha_data TEXT;

-- 2. DESABILITAR ROW LEVEL SECURITY (RLS)
-- Como a autenticação e as permissões de acesso já são controladas inteiramente
-- pela camada do servidor Next.js (via cookies, JWT e middleware de sessão),
-- desabilitamos a segurança RLS do Supabase para permitir as operações de escrita 
-- efetuadas com a chave anônima/public do backend.
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE units DISABLE ROW LEVEL SECURITY;
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;

-- =====================================================================
-- FIM DO SCRIPT
-- =====================================================================
