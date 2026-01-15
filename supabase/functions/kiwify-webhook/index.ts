// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

console.log("Kiwify Webhook Handler Started")

serve(async (req) => {
    try {
        // 1. Validar Método
        if (req.method !== 'POST') {
            return new Response('Method not allowed', { status: 405 })
        }

        // 2. Ler Payload da Kiwify
        const payload = await req.json()
        console.log("Payload recebido:", JSON.stringify(payload))

        // Estrutura básica do payload da Kiwify:
        // { order_status: 'paid', Customer: { email: '...' }, ... }
        // Normalização para evitar erros de case-sensitivity ou variações da API
        const status = payload.order_status || payload.status
        const customer = payload.Customer || payload.customer || {}
        const email = customer.email

        if (!email) {
            return new Response(JSON.stringify({ error: 'Email not found in payload' }), {
                headers: { "Content-Type": "application/json" },
                status: 400,
            })
        }

        // 3. Inicializar Supabase Admin
        // Precisamos do SERVICE_ROLE_KEY para ignorar RLS e escrever no banco como admin
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SERVICE_ROLE_KEY') ?? ''
        )

        // 4. Lógica de Liberação
        // Aceita 'paid' ou 'approved' para maior robustez
        if (status === 'paid' || status === 'approved') {
            // Buscar usuário pelo email
            const { data: profiles, error: findError } = await supabaseAdmin
                .from('profiles')
                .select('id')
                .eq('email', email)
                .limit(1)

            if (findError) {
                console.error("Erro ao buscar usuário:", findError)
                throw findError
            }

            if (profiles && profiles.length > 0) {
                // 4.1 Detectar Plano pelo Valor Pago
                // Kiwify payload geralmente tem 'order_total_amount' em centavos (ex: 4790) ou 'commissions.charge_amount'
                // Vamos tentar ser robustos e checar algumas variações comuns
                const amount = payload.order_total_amount || 0 // Default to 0

                let planType = 'semiannual' // Default Fallback
                let planCycle = 'semiannual'
                let monthsToAdd = 6

                // Lógica de Preço
                // 80.00 (8000 cents) = Anual
                if (amount === 8000 || amount === 80.00) {
                    planType = 'annual'
                    planCycle = 'annual'
                    monthsToAdd = 12
                }
                // 47.90 (4790 cents) = Semestral
                else if (amount === 4790 || amount === 47.90) {
                    planType = 'semiannual'
                    planCycle = 'semiannual'
                    monthsToAdd = 6
                }

                // Calcular Próxima Cobrança
                const nextBillingDate = new Date()
                nextBillingDate.setMonth(nextBillingDate.getMonth() + monthsToAdd)

                // Usuário existe, atualizar status
                const userId = profiles[0].id
                const { error: updateError } = await supabaseAdmin
                    .from('profiles')
                    .update({
                        license_status: 'active',
                        license_key: 'KIWIFY-AUTO',
                        plan_type: planType,
                        plan_cycle: planCycle,
                        next_billing_date: nextBillingDate.toISOString()
                    })
                    .eq('id', userId)

                if (updateError) {
                    console.error("Erro ao atualizar licença:", updateError)
                    throw updateError
                }

                console.log(`Sucesso: Acesso liberado para ${email} (${userId})`)
            } else {
                console.log(`Usuário não encontrado. Criando conta e enviando convite para ${email}...`)

                // 1. Criar usuário e enviar email de convite da Supabase
                const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email)

                if (inviteError) {
                    console.error("Erro ao convidar usuário:", inviteError)
                    throw inviteError
                }

                // 2. Garantir que o perfil tenha a licença ativa
                const newUserId = inviteData.user.id
                console.log(`Convite enviado. ID gerado: ${newUserId}. Ativando licença...`)

                // Opcional: Aguardar um pouco para garantir que triggers de criação de perfil rodem (se existirem)
                // 4.1 Detectar Plano (Mesma lógica acima)
                const amount = payload.order_total_amount || 0
                let planType = 'semiannual'
                let planCycle = 'semiannual'
                let monthsToAdd = 6

                if (amount === 8000 || amount === 80.00) {
                    planType = 'annual'
                    planCycle = 'annual'
                    monthsToAdd = 12
                } else if (amount === 4790 || amount === 47.90) {
                    planType = 'semiannual'
                    planCycle = 'semiannual'
                    monthsToAdd = 6
                }

                const nextBillingDate = new Date()
                nextBillingDate.setMonth(nextBillingDate.getMonth() + monthsToAdd)

                // Usamos upsert para garantir que o registro exista com a licença correta
                const { error: upsertError } = await supabaseAdmin
                    .from('profiles')
                    .upsert({
                        id: newUserId,
                        email: email,
                        license_status: 'active',
                        plan_type: planType,
                        plan_cycle: planCycle,
                        next_billing_date: nextBillingDate.toISOString(),
                        license_key: 'KIWIFY-AUTO-INVITE'
                    })

                if (upsertError) {
                    console.error("Erro ao configurar perfil do novo usuário:", upsertError)
                    throw upsertError
                }

                console.log(`Sucesso: Usuário convidado e ativado: ${email}`)
            }
        } else if (status === 'refunded' || status === 'chargedback') {
            // Bloquear acesso em caso de reembolso
            const { error: blockError } = await supabaseAdmin
                .from('profiles')
                .update({ license_status: 'inactive' })
                .eq('email', email)

            if (blockError) console.error("Erro ao bloquear usuário:", blockError)
            else console.log(`Acesso revogado para ${email} devido a reembolso via Kiwify.`)
        }

        return new Response(
            JSON.stringify({ message: 'Webhook processed successfully' }),
            { headers: { "Content-Type": "application/json" } },
        )

    } catch (error) {
        console.error("Critical Error:", error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { "Content-Type": "application/json" }, status: 500 },
        )
    }
})
