# Configuração do WhatsApp com Twilio

Este guia ajudará você a configurar o Twilio para funcionar com o seu Finance Pro 360.

## 1. Criar Conta e Obter Credenciais
1. Acesse [twilio.com](https://www.twilio.com/) e crie uma conta gratuita.
2. No **Twilio Console**, anote seu **Account SID** e **Auth Token**.
3. Você precisará adicionar essas credenciais como variáveis de ambiente no Supabase e no seu arquivo `.env.local` (para testes locais, se necessário).

## 2. Configurar o Sandbox do WhatsApp
Para começar sem pagar e sem verificação de empresa, usaremos o **Twilio Sandbox for WhatsApp**.

1. No menu lateral do Twilio, vá em **Messaging** > **Try it out** > **Send a WhatsApp message**.
2. Siga as instruções para conectar seu número pessoal ao Sandbox (geralmente enviando um código como `join something-something` para o número do Twilio).
3. Isso permitirá que você envie e receba mensagens do seu número para a API.

## 3. Configurar o Webhook
Quando você receber uma mensagem, o Twilio precisa avisar o nosso sistema.

1. No menu do Twilio, vá em **Messaging** > **Settings** > **WhatsApp Sandbox Settings**.
2. No campo **When a message comes in**, coloque a URL da nossa Edge Function:
   
   ```
   https://<SEU_PROJETO_REF>.supabase.co/functions/v1/whatsapp-webhook
   ```
   *(Substitua `<SEU_PROJETO_REF>` pelo ID do seu projeto Supabase, que começa com `v...` ou similar, encontrado em Settings > API no dashboard do Supabase)*.

3. Certifique-se de que o método HTTP está como **POST**.
4. Clique em **Save**.

## 4. Atualizar Banco de Dados
Você precisa adicionar o campo de telefone na tabela de perfis para vincularmos o usuário.
No Dashboard do Supabase, vá em **SQL Editor** e rode:

```sql
ALTER TABLE profiles ADD COLUMN phone text;
-- Opcional: Criar índice para busca rápida
CREATE INDEX idx_profiles_phone ON profiles(phone);
```

## 5. Deploy e Variáveis
1. Faça o deploy da função:
   ```bash
   npx supabase functions deploy whatsapp-webhook --no-verify-jwt
   ```
2. Configure os segredos (variáveis) no Supabase (Settings > Edge Functions):
   - `GEMINI_API_KEY`: Sua chave do Google AI.
   - `SUPABASE_URL`: URL do projeto.
   - `SUPABASE_SERVICE_ROLE_KEY`: Service Role Key (Settings > API).

