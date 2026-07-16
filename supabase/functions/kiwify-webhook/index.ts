import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const body = await req.json();
    console.log('Kiwify Webhook recebido:', JSON.stringify(body));

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Suporte a múltiplos formatos de webhook da Kiwify
    const event = body.event || body.type || '';
    const customer = body.data?.customer || body.customer || {};
    const email = (customer.email || body.email || '').toLowerCase().trim();
    const orderStatus = body.data?.order_status || body.order_status || body.status || '';
    const subscriptionStatus = body.data?.subscription?.status || body.subscription_status || '';
    const nextPayment = body.data?.subscription?.next_payment || body.next_payment;

    if (!email) {
      console.error('Email não encontrado no webhook');
      return new Response(JSON.stringify({ error: 'Email ausente' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Busca o usuário pelo email
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (profileError || !profile) {
      console.warn(`Usuário não encontrado para email: ${email}`);
      // Retorna 200 para a Kiwify não retentar
      return new Response(JSON.stringify({ message: 'Usuário não encontrado, ignorado' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const userId = profile.id;
    const isPaid =
      orderStatus === 'paid' ||
      orderStatus === 'approved' ||
      event === 'order_paid' ||
      event === 'purchase_approved';

    const isCanceled =
      orderStatus === 'refunded' ||
      orderStatus === 'canceled' ||
      subscriptionStatus === 'canceled' ||
      event === 'order_refunded' ||
      event === 'subscription_canceled';

    if (isPaid) {
      // Usa a data do próximo pagamento da Kiwify, ou hoje + 32 dias como segurança
      const expiresAt = nextPayment
        ? new Date(nextPayment).toISOString()
        : new Date(Date.now() + 32 * 24 * 60 * 60 * 1000).toISOString();

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          license_status: 'active',
          plan_type: 'monthly',
          subscription_expires_at: expiresAt
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      console.log(`✅ Licença ATIVADA para ${email}, expira em ${expiresAt}`);
      return new Response(
        JSON.stringify({ success: true, action: 'activated', email, expiresAt }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (isCanceled) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          license_status: 'inactive',
          subscription_expires_at: null
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      console.log(`❌ Licença REVOGADA para ${email}`);
      return new Response(
        JSON.stringify({ success: true, action: 'revoked', email }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Evento não reconhecido — retorna 200 para Kiwify não retentar
    console.log(`ℹ️ Evento ignorado: ${event} / status: ${orderStatus}`);
    return new Response(
      JSON.stringify({ message: 'Evento ignorado' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (err: any) {
    console.error('Erro no webhook:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
