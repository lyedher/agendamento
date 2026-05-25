-- Schema para o Dashboard de Pessoal CRPM

-- 1. Unidades
CREATE TABLE units (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    budget_limit DECIMAL(12, 2) DEFAULT 5000.00,
    current_spend DECIMAL(12, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Usuários / Militares
CREATE TABLE users (
    id TEXT PRIMARY KEY, -- Mantendo IDs do JSON (ex: 'yaphob')
    full_name TEXT NOT NULL,
    nickname TEXT NOT NULL,
    rank TEXT NOT NULL,
    tax_id TEXT UNIQUE NOT NULL,
    rg TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    phone TEXT,
    job_function TEXT,
    work_team TEXT,
    sort_order INTEGER DEFAULT 999,
    role TEXT DEFAULT 'user',
    unit_id TEXT REFERENCES units(id),
    avatar_url TEXT,
    birth_date DATE,
    absence_reason TEXT,
    return_date DATE,
    service_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Configurações por Unidade
CREATE TABLE settings (
    unit_id TEXT PRIMARY KEY REFERENCES units(id),
    ac4_rates JSONB DEFAULT '{"blueDay": 35, "blueNight": 42, "redDay": 45, "redNight": 52}',
    max_monthly_slots INTEGER DEFAULT 10,
    open_date_time TIMESTAMP WITH TIME ZONE,
    close_date_time TIMESTAMP WITH TIME ZONE,
    invite_code TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Escalas
CREATE TABLE schedules (
    id TEXT PRIMARY KEY,
    schedule_name TEXT NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    capacity INTEGER DEFAULT 1,
    unit_id TEXT REFERENCES units(id),
    user_ids TEXT[] DEFAULT '{}', -- Usando TEXT[] para IDs do JSON
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Audit Logs (para transferências e ações críticas)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL,
    actor_id TEXT NOT NULL, -- ID do administrador que realizou a ação
    target_id TEXT,         -- ID do usuário ou recurso afetado
    from_value TEXT,        -- Valor original (ex: unitId anterior)
    to_value TEXT,          -- Novo valor (ex: unitId novo)
    metadata JSONB,         -- Informações extras
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX idx_users_unit ON users(unit_id);
CREATE INDEX idx_schedules_unit ON schedules(unit_id);
CREATE INDEX idx_users_team ON users(work_team);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_target ON audit_logs(target_id);
