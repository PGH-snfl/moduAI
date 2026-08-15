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

async function testPendingTools() {
    console.log('🧪 Testing pending_tools table functionality...\n');

    // 1. Insert a test pending tool
    console.log('1️⃣  Inserting test pending tool...');
    const testTool = {
        url: 'https://test-new-ai-tool.example.com',
        name: 'Test New AI Tool',
        description: 'This is a test tool submission',
        logo_url: 'https://example.com/logo.png',
        submitted_by: 'test@example.com'
    };

    const { data: insertedTool, error: insertError } = await supabase
        .from('pending_tools')
        .insert(testTool)
        .select()
        .single();

    if (insertError) {
        console.error('❌ Error inserting pending tool:', insertError);
        return;
    }
    console.log(`✅ Test tool inserted successfully with ID: ${insertedTool.id}`);

    // 2. Query pending tools
    console.log('\n2️⃣  Querying all pending tools...');
    const { data: allPendingTools, error: queryError } = await supabase
        .from('pending_tools')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (queryError) {
        console.error('❌ Error querying pending tools:', queryError);
    } else {
        console.log(`✅ Found ${allPendingTools?.length || 0} pending tools`);
        allPendingTools?.forEach((tool: any, idx: number) => {
            console.log(`   ${idx + 1}. ${tool.name || 'Unnamed'} - ${tool.status} (${tool.submitted_by})`);
        });
    }

    // 3. Test status update (approve/reject workflow simulation)
    console.log('\n3️⃣  Testing status update...');
    const { data: updatedTool, error: updateError } = await supabase
        .from('pending_tools')
        .update({
            status: 'approved',
            admin_notes: 'Test approval - verified tool meets criteria',
            reviewed_at: new Date().toISOString()
        })
        .eq('id', insertedTool.id)
        .select()
        .single();

    if (updateError) {
        console.error('❌ Error updating tool status:', updateError);
    } else {
        console.log(`✅ Tool status updated to: ${updatedTool?.status}`);
        console.log(`   Admin notes: ${updatedTool?.admin_notes}`);
    }

    // 4. Test filtering by status
    console.log('\n4️⃣  Filtering pending tools by status...');
    const { data: approvedTools, error: filterError } = await supabase
        .from('pending_tools')
        .select('*')
        .eq('status', 'approved');

    if (filterError) {
        console.error('❌ Error filtering by status:', filterError);
    } else {
        console.log(`✅ Found ${approvedTools?.length || 0} approved tools`);
    }

    // 5. Cleanup - remove test data
    console.log('\n5️⃣  Cleaning up test data...');
    const { error: deleteError } = await supabase
        .from('pending_tools')
        .delete()
        .eq('id', insertedTool.id);

    if (deleteError) {
        console.error('❌ Error deleting test tool:', deleteError);
    } else {
        console.log('✅ Test tool cleaned up successfully');
    }

    console.log('\n✅ Pending tools table functionality test complete!');
}

testPendingTools();
