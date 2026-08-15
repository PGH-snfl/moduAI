import { useMemo, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { Tool } from '@/hooks/useTools';

export interface TrafficPoint {
    name: string;
    value: number;
    label?: string;
}

export interface TrafficStats {
    recent: number;
    avg: number;
    max: number;
    min: number;
}

export const useTrafficData = (tool: Tool | null) => {
    const [trafficData, setTrafficData] = useState<{
        weekly: TrafficPoint[];
        monthly: TrafficPoint[];
        stats: TrafficStats;
    } | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!tool) {
            setIsLoading(false);
            return;
        }

        const fetchTrafficData = async () => {
            setIsLoading(true);
            try {
                // Get last 7 days of traffic data
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

                const { data: weeklyData, error } = await supabase
                    .from('traffic_stats')
                    .select('*')
                    .eq('tool_id', tool.id)
                    .gte('date', sevenDaysAgo.toISOString().split('T')[0])
                    .order('date', { ascending: true });

                if (error) {
                    console.error('Error fetching traffic data:', error);
                    // Fall back to mock data if error
                    generateMockData();
                    return;
                }

                // Format date helper
                const formatDate = (dateStr: string) => {
                    const d = new Date(dateStr);
                    return `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
                };

                // Generate weekly data (last 7 days)
                const today = new Date();
                const weekly: TrafficPoint[] = [];
                
                // Create a map of existing data
                const dataMap = new Map();
                weeklyData?.forEach((record: any) => {
                    dataMap.set(record.date, record.visitors || 0);
                });

                // Fill in data for last 7 days
                for (let i = 6; i >= 0; i--) {
                    const d = new Date(today);
                    d.setDate(today.getDate() - i);
                    const dateStr = d.toISOString().split('T')[0];
                    const visitors = dataMap.get(dateStr) || 0;
                    
                    weekly.push({
                        name: formatDate(dateStr),
                        value: visitors
                    });
                }

                // Get last 12 months for monthly data
                const { data: monthlyData } = await supabase
                    .from('traffic_stats')
                    .select('date, visitors')
                    .eq('tool_id', tool.id)
                    .gte('date', new Date(today.getFullYear() - 1, today.getMonth(), 1).toISOString().split('T')[0])
                    .order('date', { ascending: true });

                // Aggregate monthly data
                const monthlyMap = new Map();
                monthlyData?.forEach((record: any) => {
                    const d = new Date(record.date);
                    const monthKey = `${d.getFullYear().toString().slice(2)}.${String(d.getMonth() + 1).padStart(2, '0')}`;
                    const current = monthlyMap.get(monthKey) || 0;
                    monthlyMap.set(monthKey, current + (record.visitors || 0));
                });

                // Generate last 12 months
                const monthly: TrafficPoint[] = [];
                for (let i = 11; i >= 0; i--) {
                    const d = new Date(today);
                    d.setMonth(today.getMonth() - i);
                    const monthKey = `${d.getFullYear().toString().slice(2)}.${String(d.getMonth() + 1).padStart(2, '0')}`;
                    
                    monthly.push({
                        name: monthKey,
                        value: monthlyMap.get(monthKey) || 0
                    });
                }

                // Calculate stats
                const values = weekly.map(d => d.value);
                const totalVisitors = values.reduce((a, b) => a + b, 0);
                
                // If no traffic data exists, use mock data
                if (totalVisitors === 0) {
                    console.log('No traffic data for tool:', tool.name, '- using mock data');
                    generateMockData();
                    return;
                }
                
                const max = Math.max(...values);
                const min = Math.min(...values);
                const avg = Math.floor(totalVisitors / values.length);
                const recent = values[values.length - 1];

                setTrafficData({
                    weekly,
                    monthly,
                    stats: { recent, avg, max, min }
                });
            } catch (err) {
                console.error('Error in useTrafficData:', err);
                generateMockData();
            } finally {
                setIsLoading(false);
            }
        };

        const generateMockData = () => {
            // Fallback to mock data if real data fetch fails
            const baseValue = tool?.name?.length * 1000 + 5000 || 5000;
            const rand = (base: number, variance: number) => Math.floor(base + Math.random() * variance - variance / 2);
            
            const today = new Date();
            const formatDate = (date: Date) => {
                return `${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
            };

            const weekly: TrafficPoint[] = Array.from({ length: 7 }).map((_, i) => {
                const d = new Date(today);
                d.setDate(today.getDate() - (6 - i));
                return {
                    name: formatDate(d),
                    value: rand(baseValue, 2000)
                };
            });

            const monthly: TrafficPoint[] = Array.from({ length: 12 }).map((_, i) => {
                const d = new Date(today);
                d.setMonth(today.getMonth() - (11 - i));
                return {
                    name: `${d.getFullYear().toString().slice(2)}.${String(d.getMonth() + 1).padStart(2, '0')}`,
                    value: rand(baseValue * 1.5 + (i * 100), 4000)
                };
            });

            const values = weekly.map(d => d.value);
            const stats = {
                recent: values[values.length - 1],
                avg: Math.floor(values.reduce((a, b) => a + b, 0) / values.length),
                max: Math.max(...values),
                min: Math.min(...values)
            };

            setTrafficData({ weekly, monthly, stats });
        };

        fetchTrafficData();
    }, [tool]);

    return useMemo(() => {
        if (!tool || !trafficData) {
            return { 
                weekly: [], 
                monthly: [], 
                stats: { recent: 0, avg: 0, max: 0, min: 0 },
                isLoading 
            };
        }

        return {
            ...trafficData,
            isLoading
        };
    }, [trafficData, tool, isLoading]);
};
