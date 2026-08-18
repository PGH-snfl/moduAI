
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('Testing connection to:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
    const { error, count } = await supabase
        .from('tools')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.error('❌ Error requesting data:', error.message);
    } else {
        console.log(`✅ Success! Found ${count} records visible with Anon Key.`);
    }
}

test();
