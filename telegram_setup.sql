-- ============================================================
-- Finance Pro 360 — Integração Telegram
-- Execute este script no Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Tabela de vínculos Telegram ↔ usuário Finance Pro 360
CREATE TABLE IF NOT EXISTS public.telegram_links (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  telegram_chat_id BIGINT NOT NULL,
  telegram_username TEXT,
  linked_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id),
  UNIQUE(telegram_chat_id)
);

-- RLS: somente o próprio usuário lê/escreve seu vínculo
ALTER TABLE public.telegram_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own telegram link"
  ON public.telegram_links FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own telegram link"
  ON public.telegram_links FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own telegram link"
  ON public.telegram_links FOR DELETE
  USING (auth.uid() = user_id);

-- Service role pode fazer tudo (Edge Function usa service role key)
CREATE POLICY "Service role full access to telegram_links"
  ON public.telegram_links FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================

-- 2. Tabela de códigos temporários de vínculo
CREATE TABLE IF NOT EXISTS public.telegram_link_codes (
  code       TEXT PRIMARY KEY,               -- ex: "FP-4A7X9Z"
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '10 minutes'),
  used       BOOLEAN DEFAULT FALSE
);

-- RLS: somente o próprio usuário pode ler/criar seus códigos
ALTER TABLE public.telegram_link_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own link codes"
  ON public.telegram_link_codes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access to telegram_link_codes"
  ON public.telegram_link_codes FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================

-- 3. Limpeza automática de códigos expirados (opcional, roda diariamente)
-- Execute separadamente se quiser o cron job:
-- SELECT cron.schedule('cleanup-expired-telegram-codes', '0 3 * * *',
--   $$DELETE FROM public.telegram_link_codes WHERE expires_at < NOW()$$);
