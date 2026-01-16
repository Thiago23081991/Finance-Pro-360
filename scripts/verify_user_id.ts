
import { createClient } from '@supabase/supabase-js';

const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzcGp2a2FhZ3psbWlzZ21yZnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDcyMjg4NywiZXhwIjoyMDgwMjk4ODg3fQ.wXhvC-rDL6HVXIUFSiIvRFoXi6vV3y8WtW7tdWme2g0';
const SUPABASE_URL = 'https://dspjvkaagzlmisgmrfsn.supabase.co';

const adminClient = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function verifyById() {
    const userId = '0a6f2111-3f77-4da0-b185-f239c4d918ae';
    console.log(`\n🔎 Verificando status direto pelo ID: ${userId}...\n`);

    // 1. Check Auth
    const { data: { user }, error: authError } = await adminClient.auth.admin.getUserById(userId);

    if (authError || !user) {
        console.log("❌ Autenticação: ERRO (Usuário não encontrado pelo ID)");
        console.log(authError);
        return;
    }
    console.log(`✅ Autenticação: OK (${user.email})`);

    // 2. Check Profile (DB)
    const { data: profile, error: dbError } = await adminClient
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (dbError || !profile) {
        console.log("❌ Banco de Dados: ERRO (Perfil não existe).");
        console.log(dbError);
        return;
    }

    // 3. Print Report
    console.log("\n📋 Relatório do Banco de Dados:");
    console.log(`   Nome: ${profile.username}`);
    console.log(`   Status Licença: ${profile.license_status === 'active' ? 'ACTIVE (ATIVO)' : 'INACTIVE (INATIVO)'}`);
    console.log(`   Plano: ${profile.plan_type}`);
    console.log(`   Ciclo: ${profile.plan_cycle}`);

    if (profile.license_status === 'active') {
        console.log("\n✨ RESULTADO FINAL: O usuário está ATIVO e LIBERADO.");
    } else {
        console.log("\n⚠️ RESULTADO FINAL: O usuário ainda consta como BLOQUEADO.");
    }
}

verifyById();
