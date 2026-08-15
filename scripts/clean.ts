
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function clean() {
    console.log('🧹 Cleaning DB...');
    const { error: e1 } = await supabase.from('traffic_stats').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete All
    const { error: e2 } = await supabase.from('news').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    const { error: e3 } = await supabase.from('tools').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    // Categories referential integrity? tools refer categories? No foreign key in schema for now (just slug match in logic)
    const { error: e4 } = await supabase.from('categories').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    console.log('Cleanup done. Errors (if any):', e1, e2, e3, e4);
}
clean();
