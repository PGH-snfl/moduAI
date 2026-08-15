import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Get environment variables
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing required environment variables');
    Deno.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface TrafficStat {
    tool_id: string;
    date: string;
    visitors: number;
    page_views: number;
}

interface AggregatedStats {
    total_visitors: number;
    total_page_views: number;
    unique_days: number;
}

/**
 * Aggregate daily traffic data for all tools
 * This function should be run daily via Supabase Cron Jobs
 */
async function aggregateDailyTraffic(date: string): Promise<void> {
    console.log(`Aggregating traffic for date: ${date}`);

    try {
        // 1. Get all traffic stats for the given date
        const { data: trafficStats, error: fetchError } = await supabase
            .from('traffic_stats')
            .select('tool_id, visitors, page_views')
            .eq('date', date);

        if (fetchError) {
            console.error('Error fetching traffic stats:', fetchError);
            return;
        }

        if (!trafficStats || trafficStats.length === 0) {
            console.log(`No traffic data found for date: ${date}`);
            return;
        }

        console.log(`Found ${trafficStats.length} traffic records to aggregate`);

        // 2. Aggregate stats by tool
        const aggregationMap = new Map<string, AggregatedStats>();

        trafficStats.forEach((stat: TrafficStat) => {
            const existing = aggregationMap.get(stat.tool_id);
            if (existing) {
                aggregationMap.set(stat.tool_id, {
                    total_visitors: existing.total_visitors + stat.visitors,
                    total_page_views: existing.total_page_views + stat.page_views,
                    unique_days: existing.unique_days + 1
                });
            } else {
                aggregationMap.set(stat.tool_id, {
                    total_visitors: stat.visitors,
                    total_page_views: stat.page_views,
                    unique_days: 1
                });
            }
        });

        // 3. Update tools table with aggregated stats
        let updateCount = 0;
        for (const [toolId, stats] of aggregationMap) {
            const { error: updateError } = await supabase
                .from('tools')
                .update({
                    visit_count: stats.total_visitors
                    // We don't store aggregated page views in tools table,
                    // only total visit count for ranking purposes
                })
                .eq('id', toolId);

            if (updateError) {
                console.error(`Error updating tool ${toolId}:`, updateError);
            } else {
                updateCount++;
            }
        }

        console.log(`Updated ${updateCount} tools with aggregated traffic stats`);

        // 4. Optional: Archive or delete old raw traffic data
        // Uncomment if you want to keep raw traffic for only N days
        /*
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 90); // Keep 90 days

        const { error: deleteError } = await supabase
            .from('traffic_stats')
            .delete()
            .lt('date', cutoffDate.toISOString().split('T')[0]);

        if (deleteError) {
            console.error('Error archiving old traffic:', deleteError);
        } else {
            console.log(`Archived traffic data older than 90 days`);
        }
        */

    } catch (error) {
        console.error('Error in aggregateDailyTraffic:', error);
        throw error;
    }
}

/**
 * Calculate week-over-week growth rate for a tool
 */
async function calculateWeeklyGrowth(toolId: string): Promise<number> {
    const today = new Date();
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Get last 7 days traffic
    const { data: last7Days } = await supabase
        .from('traffic_stats')
        .select('visitors')
        .eq('tool_id', toolId)
        .gte('date', lastWeek.toISOString().split('T')[0]);

    // Get previous 7 days traffic
    const { data: previous7Days } = await supabase
        .from('traffic_stats')
        .select('visitors')
        .eq('tool_id', toolId)
        .gte('date', twoWeeksAgo.toISOString().split('T')[0])
        .lt('date', lastWeek.toISOString().split('T')[0]);

    const last7DaysTotal = last7Days?.reduce((sum, stat) => sum + (stat?.visitors || 0), 0) || 0;
    const previous7DaysTotal = previous7Days?.reduce((sum, stat) => sum + (stat?.visitors || 0), 0) || 0;

    if (previous7DaysTotal === 0) return 0;

    const growthRate = ((last7DaysTotal - previous7DaysTotal) / previous7DaysTotal) * 100;
    return Math.round(growthRate * 100) / 100;
}

/**
 * Get top trending tools based on traffic growth
 */
async function getTrendingTools(limit: number = 10): Promise<any[]> {
    const { data: tools } = await supabase
        .from('tools')
        .select('id, name')
        .limit(100)
        .order('visit_count', { ascending: false });

    if (!tools || tools.length === 0) return [];

    // Calculate growth for each tool
    const toolsWithGrowth = await Promise.all(
        tools.slice(0, limit).map(async (tool) => {
            const growthRate = await calculateWeeklyGrowth(tool.id);
            return {
                ...tool,
                growth_rate: growthRate
            };
        })
    );

    return toolsWithGrowth
        .sort((a, b) => b.growth_rate - a.growth_rate);
}

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'authorization, content-type',
            },
        });
    }

    try {
        // Verify authorization
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(
                JSON.stringify({ error: 'Unauthorized' }),
                { status: 401, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const token = authHeader.replace('Bearer ', '');
        if (token !== Deno.env.get('AGGREGATION_SECRET_KEY')) {
            return new Response(
                JSON.stringify({ error: 'Invalid token' }),
                { status: 403, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const { method } = req;
        if (method !== 'POST') {
            return new Response(
                JSON.stringify({ error: 'Method not allowed' }),
                { status: 405, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const body = await req.json();
        const { date, action } = body;

        console.log(`Received request: action=${action}, date=${date || 'today'}`);

        const targetDate = date || new Date().toISOString().split('T')[0];

        let result: any = {};

        switch (action) {
            case 'aggregate':
                await aggregateDailyTraffic(targetDate);
                result = { message: 'Traffic aggregation complete', date: targetDate };
                break;

            case 'trending': {
                const trending = await getTrendingTools();
                result = { trending };
                break;
            }

            case 'full_report': {
                await aggregateDailyTraffic(targetDate);
                const trendingTools = await getTrendingTools();
                result = {
                    message: 'Full traffic report complete',
                    date: targetDate,
                    trending_tools: trendingTools.length,
                    aggregated_date: targetDate
                };
                break;
            }

            default:
                return new Response(
                    JSON.stringify({ error: 'Invalid action. Use: aggregate, trending, or full_report' }),
                    { status: 400, headers: { 'Content-Type': 'application/json' } }
                );
        }

        return new Response(
            JSON.stringify({ success: true, ...result }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('Error processing request:', error);
        return new Response(
            JSON.stringify({ error: 'Internal server error', details: error.message }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
});
