-- ═══════════════════════════════════════════════════════════
--  Finance Pro 360 — Bank Accounts Migration
--  Execute no SQL Editor do Supabase
-- ═══════════════════════════════════════════════════════════

-- 1. Criar tabela de contas bancárias
CREATE TABLE IF NOT EXISTS bank_accounts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  initial_balance NUMERIC NOT NULL DEFAULT 0,
  color        TEXT NOT NULL DEFAULT '#6366f1',
  icon         TEXT NOT NULL DEFAULT 'bank',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- 2. Habilitar RLS
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;

-- 3. Policy: usuário vê/gerencia apenas suas próprias contas
DROP POLICY IF EXISTS "Users manage their own bank_accounts" ON bank_accounts;
CREATE POLICY "Users manage their own bank_accounts" ON bank_accounts
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Adicionar coluna bank_account_id na tabela transactions
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL;

-- 5. Índice para performance nas queries de saldo por conta
CREATE INDEX IF NOT EXISTS idx_transactions_bank_account ON transactions(bank_account_id);
