import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Env vars missing.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyData() {
    console.log('📊 Verifying database data...\n');

    // 1. Categories
    const { count: catCount, error: catError } = await supabase
        .from('categories')
        .select('*', { count: 'exact', head: true });

    if (catError) {
        console.error('❌ Error counting categories:', catError);
    } else {
        console.log(`✅ Categories: ${catCount}`);
    }

    // 2. Tools
    const { count: toolCount, error: toolError } = await supabase
        .from('tools')
        .select('*', { count: 'exact', head: true });

    if (toolError) {
        console.error('❌ Error counting tools:', toolError);
    } else {
        console.log(`✅ Tools: ${toolCount}`);
        if (toolCount && toolCount >= 80) {
            console.log(`   🎉 Target met! ${toolCount} >= 80`);
        } else {
            console.log(`   ⚠️  Need more tools. Current: ${toolCount}, Target: 80`);
        }
    }

    // 3. News
    const { count: newsCount, error: newsError } = await supabase
        .from('news')
        .select('*', { count: 'exact', head: true });

    if (newsError) {
        console.error('❌ Error counting news:', newsError);
    } else {
        console.log(`✅ News: ${newsCount}`);
    }

    // 4. Traffic Stats
    const { count: trafficCount, error: trafficError } = await supabase
        .from('traffic_stats')
        .select('*', { count: 'exact', head: true });

    if (trafficError) {
        console.error('❌ Error counting traffic stats:', trafficError);
    } else {
        console.log(`✅ Traffic Stats: ${trafficCount}`);
    }

    // 5. Reviews
    const { count: reviewCount, error: reviewError } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true });

    if (reviewError) {
        console.error('❌ Error counting reviews:', reviewError);
    } else {
        console.log(`✅ Reviews: ${reviewCount}`);
    }

    // 6. Pending Tools
    const { count: pendingCount, error: pendingError } = await supabase
        .from('pending_tools')
        .select('*', { count: 'exact', head: true });

    if (pendingError) {
        console.error('❌ Error counting pending tools:', pendingError);
    } else {
        console.log(`✅ Pending Tools: ${pendingCount}`);
    }

    // 7. Sample tools
    console.log('\n📋 Sample tools:');
    const { data: sampleTools, error: sampleError } = await supabase
        .from('tools')
        .select('name, is_verified, is_domestic')
        .limit(10)
        .order('created_at', { ascending: false });

    if (sampleError) {
        console.error('❌ Error fetching sample tools:', sampleError);
    } else {
        sampleTools?.forEach((tool: any, idx: number) => {
            const badges = [];
            if (tool.is_verified) badges.push('✓');
            if (tool.is_domestic) badges.push('🇰🇷');
            console.log(`   ${idx + 1}. ${tool.name} ${badges.join(' ')}`);
        });
    }

    console.log('\n✅ Verification complete!');
}

verifyData();
