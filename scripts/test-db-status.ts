
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('--- DB Diagnostic ---');
console.log('URL:', supabaseUrl);

async function check() {
    // 1. Check with Admin Key
    const adminClient = createClient(supabaseUrl, serviceKey);
    const { count: adminCount, error: adminError } = await adminClient
        .from('tools')
        .select('*', { count: 'exact', head: true });

    if (adminError) console.error('Admin Error:', adminError.message);
    else console.log(`[Admin Key] Total Tools: ${adminCount}`);

    // 2. Check with Anon Key
    const anonClient = createClient(supabaseUrl, anonKey);
    const { count: anonCount, error: anonError } = await anonClient
        .from('tools')
        .select('*', { count: 'exact', head: true });

    if (anonError) console.error('Anon Error:', anonError.message);
    else console.log(`[Anon Key] Visible Tools: ${anonCount}`);

    if (adminCount > 0 && anonCount === 0) {
        console.log('CONCLUSION: RLS is blocking public access. Run the Policy SQL.');
    } else if (adminCount === 0) {
        console.log('CONCLUSION: Table is empty. Seeding failed.');
    } else {
        console.log('CONCLUSION: Data is visible. Issue might be frontend caching or Env vars.');
    }
}

check();
