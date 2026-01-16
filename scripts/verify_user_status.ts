
import { createClient } from '@supabase/supabase-js';

const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzcGp2a2FhZ3psbWlzZ21yZnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDcyMjg4NywiZXhwIjoyMDgwMjk4ODg3fQ.wXhvC-rDL6HVXIUFSiIvRFoXi6vV3y8WtW7tdWme2g0';
const SUPABASE_URL = 'https://dspjvkaagzlmisgmrfsn.supabase.co';

const adminClient = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function verify() {
    const email = 'mauricionascimento58@gmail.com';
    console.log(`\n🔎 Verificando status para: ${email}...\n`);

    const { data: users, error: authError } = await adminClient.auth.admin.listUsers();
    const userAuth = users.users.find(u => u.email?.toLowerCase().includes('mauricionascimento58'));

    if (!userAuth) {
        console.log("❌ USER NOT FOUND IN AUTH LIST (Tried fuzzy search)");
        // Debug: print count
        console.log(`Total users fetched: ${users.users.length}`);
        return;
    }

    console.log("✅ Autenticação: OK (Usuário existe)");
    console.log(`   ID: ${userAuth.id}`);
    console.log(`   Criado em: ${userAuth.created_at}`);

    const { data: profile, error: dbError } = await adminClient
        .from('profiles')
        .select('*')
        .eq('id', userAuth.id)
        .single();

    if (dbError || !profile) {
        console.log("❌ ERRO: Perfil não encontrado no banco de dados.");
        console.log(dbError);
        return;
    }

    console.log("\n📋 Status da Licença (Banco de Dados):");
    console.log(`   Nome: ${profile.username}`);
    console.log(`   Status: ${profile.license_status === 'active' ? '✅ ATIVO' : '❌ INATIVO'}`);
    console.log(`   Plano: ${profile.plan_type?.toUpperCase() || 'NÃO DEFINIDO'}`);
    console.log(`   Ciclo: ${profile.plan_cycle || 'N/A'}`);

    if (profile.license_status === 'active') {
        console.log("\n🎉 CONCLUSÃO: O usuário tem acesso TOTAL liberado.");
    } else {
        console.log("\n⚠️ CONCLUSÃO: O usuário está BLOQUEADO.");
    }
}

verify();
