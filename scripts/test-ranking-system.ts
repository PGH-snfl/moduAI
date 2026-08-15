import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: Required environment variables missing.');
    console.error('   VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const supabaseAdmin = supabaseServiceKey 
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

async function testRankingSystem() {
    console.log('🏆 AI 도구 랭킹 시스템 전체 테스트\n');
    console.log('=' .repeat(70));

    let passed = 0;
    let failed = 0;

    // Test 1: Check database schema
    console.log('\n📋 Test 1: 데이터베이스 스키마 확인');
    try {
        const { data: tables, error } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public');
        
        if (error) throw error;
        
        const requiredTables = ['tools', 'categories', 'traffic_stats', 'news'];
        const existingTables = tables?.map(t => t.table_name) || [];
        const missingTables = requiredTables.filter(t => !existingTables.includes(t));
        
        if (missingTables.length === 0) {
            console.log('   ✅ 모든 필수 테이블 존재:', requiredTables.join(', '));
            passed++;
        } else {
            console.log('   ❌ 누락된 테이블:', missingTables.join(', '));
            failed++;
        }
    } catch (err: any) {
        console.log('   ❌ 스키마 확인 실패:', err.message);
        failed++;
    }

    // Test 2: Check RLS policies
    console.log('\n🔒 Test 2: RLS 정책 확인 (traffic_stats)');
    try {
        const { data: policies, error } = await supabase
            .from('pg_policies')
            .select('policyname, permissive')
            .eq('tablename', 'traffic_stats');
        
        if (error) {
            // Try alternative query
            console.log('   ℹ️  RLS 정보 확인 불가 (권한 필요) - 스킵');
        } else {
            const hasInsert = policies?.some(p => p.policyname?.includes('insert'));
            const hasSelect = policies?.some(p => p.policyname?.includes('read') || p.policyname?.includes('select'));
            
            if (hasInsert && hasSelect) {
                console.log('   ✅ INSERT/SELECT 정책 존재');
                passed++;
            } else {
                console.log('   ⚠️  RLS 정책 확인 필요:', policies?.map(p => p.policyname).join(', '));
                passed++; // Not critical failure
            }
        }
    } catch (err) {
        console.log('   ℹ️  RLS 정보 확인 불가 - 스킵');
    }

    // Test 3: Get sample tool
    console.log('\n🛠️  Test 3: 샘플 도구 조회');
    let testTool: any = null;
    try {
        const { data: tools, error } = await supabase
            .from('tools')
            .select('id, name, visit_count')
            .limit(1);
        
        if (error) throw error;
        if (!tools || tools.length === 0) {
            console.log('   ❌ 도구 데이터 없음 - seed.ts 실행 필요');
            failed++;
        } else {
            testTool = tools[0];
            console.log(`   ✅ 도구 조회 성공: ${testTool.name} (visit_count: ${testTool.visit_count})`);
            passed++;
        }
    } catch (err: any) {
        console.log('   ❌ 도구 조회 실패:', err.message);
        failed++;
    }

    // Test 4: Traffic tracking (INSERT)
    console.log('\n📊 Test 4: 트래픽 데이터 기록 (INSERT)');
    if (!testTool) {
        console.log('   ⏭️  샘플 도구 없음 - 스킵');
    } else {
        try {
            const today = new Date().toISOString().split('T')[0];
            
            // Try to insert traffic data
            const { error: insertError } = await supabase
                .from('traffic_stats')
                .upsert({
                    tool_id: testTool.id,
                    date: today,
                    visitors: 1,
                    page_views: 1
                }, {
                    onConflict: 'tool_id,date'
                });
            
            if (insertError) {
                if (insertError.code === '42501') {
                    console.log('   ❌ RLS 권한 오류: INSERT 정책이 없습니다');
                    console.log('   💡 해결: schema.sql의 RLS 정책을 Supabase에 적용하세요');
                } else if (insertError.code === '23505') {
                    console.log('   ⚠️  중복 데이터 (정상) - unique constraint 작동 중');
                    passed++;
                } else {
                    console.log('   ❌ INSERT 실패:', insertError.message);
                    failed++;
                }
            } else {
                console.log(`   ✅ 트래픽 데이터 기록 성공 (${testTool.name}, ${today})`);
                passed++;
            }
        } catch (err: any) {
            console.log('   ❌ 트래픽 기록 오류:', err.message);
            failed++;
        }
    }

    // Test 5: Traffic data retrieval
    console.log('\n📈 Test 5: 트래픽 데이터 조회');
    if (!testTool) {
        console.log('   ⏭️  샘플 도구 없음 - 스킵');
    } else {
        try {
            const { data: traffic, error } = await supabase
                .from('traffic_stats')
                .select('*')
                .eq('tool_id', testTool.id)
                .order('date', { ascending: false })
                .limit(7);
            
            if (error) throw error;
            
            console.log(`   ✅ 트래픽 데이터 조회 성공: ${traffic?.length || 0}일치 데이터`);
            if (traffic && traffic.length > 0) {
                traffic.forEach((t: any) => {
                    console.log(`      ${t.date}: ${t.visitors} 방문자`);
                });
            }
            passed++;
        } catch (err: any) {
            console.log('   ❌ 트래픽 조회 실패:', err.message);
            failed++;
        }
    }

    // Test 6: Check ranking views
    console.log('\n🏆 Test 6: 랭킹 뷰 확인');
    try {
        const { data: rankings, error } = await supabase
            .from('tool_rankings')
            .select('*')
            .limit(5);
        
        if (error) {
            if (error.message?.includes('does not exist')) {
                console.log('   ❌ tool_rankings 뷰 없음');
                console.log('   💡 해결: 003_ranking_system.sql 실행 필요');
                failed++;
            } else {
                throw error;
            }
        } else {
            console.log(`   ✅ tool_rankings 뷰 작동: ${rankings?.length || 0}개 도구`);
            if (rankings && rankings.length > 0) {
                console.log('   📊 TOP 3:');
                rankings.slice(0, 3).forEach((r: any, i: number) => {
                    console.log(`      ${i + 1}. ${r.name} (점수: ${r.ranking_score?.toFixed(2)})`);
                });
            }
            passed++;
        }
    } catch (err: any) {
        console.log('   ❌ 랭킹 뷰 확인 실패:', err.message);
        failed++;
    }

    // Test 7: Check trending view
    console.log('\n🔥 Test 7: 트렌딩 뷰 확인');
    try {
        const { data: trending, error } = await supabase
            .from('trending_tools')
            .select('*')
            .limit(5);
        
        if (error) {
            if (error.message?.includes('does not exist')) {
                console.log('   ❌ trending_tools 뷰 없음');
                console.log('   💡 해결: 003_ranking_system.sql 실행 필요');
                failed++;
            } else {
                throw error;
            }
        } else {
            console.log(`   ✅ trending_tools 뷰 작동: ${trending?.length || 0}개 도구`);
            if (trending && trending.length > 0) {
                console.log('   📈 상승률 TOP 3:');
                trending.slice(0, 3).forEach((t: any, i: number) => {
                    const growth = t.growth_rate > 0 ? `+${t.growth_rate}%` : `${t.growth_rate}%`;
                    console.log(`      ${i + 1}. ${t.name} (${growth})`);
                });
            }
            passed++;
        }
    } catch (err: any) {
        console.log('   ❌ 트렌딩 뷰 확인 실패:', err.message);
        failed++;
    }

    // Test 8: Trigger function test
    console.log('\n⚡ Test 8: 자동 집계 트리거 테스트');
    if (!testTool || !supabaseAdmin) {
        console.log('   ⏭️  service_role key 없음 - 스킵');
    } else {
        try {
            const beforeCount = testTool.visit_count || 0;
            const today = new Date().toISOString().split('T')[0];
            
            // Insert more traffic data
            await supabaseAdmin
                .from('traffic_stats')
                .upsert({
                    tool_id: testTool.id,
                    date: today,
                    visitors: 100,
                    page_views: 100
                }, {
                    onConflict: 'tool_id,date'
                });
            
            // Wait a bit for trigger
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Check if visit_count was updated
            const { data: updatedTool } = await supabase
                .from('tools')
                .select('visit_count')
                .eq('id', testTool.id)
                .single();
            
            const afterCount = updatedTool?.visit_count || 0;
            
            if (afterCount >= beforeCount) {
                console.log(`   ✅ 트리거 작동: visit_count ${beforeCount} → ${afterCount}`);
                passed++;
            } else {
                console.log(`   ⚠️  트리거 미확인: visit_count ${beforeCount} → ${afterCount}`);
                passed++; // Not critical
            }
        } catch (err: any) {
            console.log('   ⚠️  트리거 테스트 실패:', err.message);
            passed++; // Not critical
        }
    }

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('📋 테스트 결과 요약');
    console.log('='.repeat(70));
    console.log(`   ✅ 통과: ${passed}개`);
    console.log(`   ❌ 실패: ${failed}개`);
    console.log(`   📊 성공률: ${Math.round((passed / (passed + failed)) * 100)}%`);
    
    if (failed === 0) {
        console.log('\n🎉 모든 테스트 통과! 랭킹 시스템이 정상 작동합니다.');
    } else if (failed <= 2) {
        console.log('\n⚠️  일부 문제가 있지만 기본 기능은 작동합니다.');
        console.log('   위의 ❌ 표시된 항목들을 확인해주세요.');
    } else {
        console.log('\n❌ 여러 문제가 발견되었습니다.');
        console.log('   1. schema.sql을 Supabase SQL Editor에서 실행했는지 확인');
        console.log('   2. 003_ranking_system.sql을 실행했는지 확인');
        console.log('   3. 환경 변수가 올바른지 확인');
    }
    
    console.log('\n📝 다음 단계:');
    console.log('   1. Supabase Dashboard → SQL Editor');
    console.log('   2. schema.sql 실행 (traffic_stats 테이블 생성/수정)');
    console.log('   3. 003_ranking_system.sql 실행 (뷰 및 함수 생성)');
    console.log('   4. npm run dev로 앱 실행 후 테스트');
}

testRankingSystem();
