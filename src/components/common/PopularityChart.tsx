import React, { useMemo, useState, useEffect } from 'react';
import type { TrafficPoint } from '../../hooks/useTrafficData';

interface PopularityChartProps {
    data: TrafficPoint[];
    color?: string;
}

// Helper: Moving Average
const calculateSMA = (data: number[], window: number) => {
    return data.map((_, i) => {
        const start = Math.max(0, i - window + 1);
        const subset = data.slice(start, i + 1);
        const sum = subset.reduce((a, b) => a + b, 0);
        return sum / subset.length;
    });
};

// Helper: Simple Catmull-Rom to SVG Path
const catmullRom2bezier = (points: { x: number, y: number }[]) => {
    // A primitive smoothing function for visual flair
    // If n < 2, return straight line
    if (points.length < 2) return "";

    let path = `M ${points[0].x},${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i === 0 ? 0 : i - 1];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[i + 2] || p2; // Duplicate last logic

        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;

        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;

        path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }
    return path;
}


export const PopularityChart: React.FC<PopularityChartProps> = ({ data, color = "#ef4444" }) => { // Default to Red like Silgga
    const [hoverIndex, setHoverIndex] = useState<number | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    // Dimensions
    const width = 300; // Increased resolution calculation
    const height = 150;
    const padding = 20;

    const pathLength = 1000;

    useEffect(() => {
        setIsVisible(false);
        const timer = setTimeout(() => setIsVisible(true), 50);
        return () => clearTimeout(timer);
    }, [data]);

    const { rawPoints, trendPoints, linePath, areaPath, maxPoint, minPoint } = useMemo(() => {
        if (!data || data.length === 0) return { rawPoints: [], trendPoints: [], linePath: '', areaPath: '', maxPoint: null, minPoint: null };

        const values = data.map(d => d.value);

        // Calculate SMA for Trend
        const smaValues = calculateSMA(values, 3); // 3-day smoothing

        // Axis Ranges - DYNAMIC SCALING (Zoom in to make curve dramatic)
        const allValues = [...values, ...smaValues];
        const dataMax = Math.max(...allValues);
        const dataMin = Math.min(...allValues);

        // Add 20% padding to top/bottom of the range
        // If flat line (max === min), force a range
        const range = dataMax - dataMin || (dataMax * 0.1);
        const maxVal = dataMax + (range * 0.2);
        const minVal = Math.max(0, dataMin - (range * 0.2));
        const renderRange = maxVal - minVal;

        // Map function
        const getXY = (val: number, i: number) => ({
            x: padding + (i / (data.length - 1)) * (width - 2 * padding),
            y: height - padding - ((val - minVal) / renderRange) * (height - 2 * padding),
            value: val,
            name: data[i].name,
            originalIndex: i
        });

        const rawPoints = values.map((v, i) => getXY(v, i));
        const trendPoints = smaValues.map((v, i) => getXY(v, i));

        // Find Max/Min from Trend? Or Raw? 
        // Silgga shows Max Transaction (Raw).
        const sortedRaw = [...rawPoints].sort((a, b) => b.value - a.value);
        const maxP = sortedRaw[0];
        const minP = sortedRaw[sortedRaw.length - 1];

        // Generate Smooth Path for Trend
        const curve = catmullRom2bezier(trendPoints);

        const area = `
            ${curve} 
            L ${trendPoints[trendPoints.length - 1].x},${height} 
            L ${trendPoints[0].x},${height} 
            Z
        `;

        return { rawPoints, trendPoints, linePath: curve, areaPath: area, maxPoint: maxP, minPoint: minP };
    }, [data]);

    if (!data || data.length === 0) return <div className="h-[200px] flex items-center justify-center text-muted-foreground">No Data</div>;

    return (
        <div className="w-full h-[240px] relative select-none bg-slate-50 dark:bg-slate-900 rounded-lg p-2 border border-slate-100 dark:border-slate-800">
            {/* Title Legend */}
            <div className="absolute top-3 left-4 flex items-center gap-3 z-10">
                <div className="flex items-center gap-1.5">
                    <div className="size-2 rounded-full bg-red-500"></div>
                    <span className="text-[10px] text-slate-500 font-bold">평균 관심도</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="size-2 rounded-full bg-slate-300"></div>
                    <span className="text-[10px] text-slate-500 font-bold">일별 관심도</span>
                </div>
            </div>

            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                <defs>
                    <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.15" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>
                </defs>

                {/* Grid Lines (More Frequent) */}
                <line x1={padding} y1={padding} x2={width - padding} y2={padding} className="stroke-slate-200 dark:stroke-slate-800 stroke-[0.5] stroke-dasharray-4" />
                <line x1={padding} y1={height * 0.33} x2={width - padding} y2={height * 0.33} className="stroke-slate-200 dark:stroke-slate-800 stroke-[0.5] stroke-dasharray-4" />
                <line x1={padding} y1={height * 0.66} x2={width - padding} y2={height * 0.66} className="stroke-slate-200 dark:stroke-slate-800 stroke-[0.5] stroke-dasharray-4" />
                <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} className="stroke-slate-200 dark:stroke-slate-800 stroke-[0.5] stroke-dasharray-4" />


                {/* Area Fill (Trend) */}
                <path
                    d={areaPath}
                    fill="url(#trendGradient)"
                    className="transition-opacity duration-1000"
                    style={{ opacity: isVisible ? 1 : 0 }}
                />

                {/* Raw Scatter Points (Behind Line) */}
                {rawPoints.map((p, i) => (
                    <circle
                        key={`raw-${i}`}
                        cx={p.x} cy={p.y} r={2}
                        className="fill-slate-300 dark:fill-slate-700 transition-all duration-300"
                        style={{ opacity: isVisible ? 1 : 0, transitionDelay: `${i * 30}ms` }}
                    />
                ))}

                {/* Trend Line (Smooth) */}
                <path
                    d={linePath}
                    fill="none"
                    stroke={color}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="drop-shadow-sm"
                    style={{
                        strokeDasharray: pathLength,
                        strokeDashoffset: isVisible ? 0 : pathLength,
                        transition: isVisible ? 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)' : 'none'
                    }}
                />

                {/* Max/Min Markers (Silgga Style) */}
                <g className="transition-opacity duration-500 delay-1000" style={{ opacity: isVisible ? 1 : 0 }}>
                    {maxPoint && (
                        <g>
                            {/* Line connecting point to label? Optional, Silgga puts label directly above/near */}
                            <circle cx={maxPoint.x} cy={maxPoint.y} r={3} className="fill-red-500 stroke-white stroke-[1.5]" />
                            <foreignObject x={maxPoint.x - 30} y={maxPoint.y - 28} width={60} height={24}>
                                <div className="flex justify-center">
                                    <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                                        최고 {Math.round(maxPoint.value / 1000)}k
                                    </span>
                                </div>
                            </foreignObject>
                        </g>
                    )}
                    {minPoint && minPoint !== maxPoint && (
                        <g>
                            <circle cx={minPoint.x} cy={minPoint.y} r={3} className="fill-blue-500 stroke-white stroke-[1.5]" />
                            <foreignObject x={minPoint.x - 30} y={minPoint.y + 8} width={60} height={24}>
                                <div className="flex justify-center">
                                    <span className="bg-blue-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                                        최저 {Math.round(minPoint.value / 1000)}k
                                    </span>
                                </div>
                            </foreignObject>
                        </g>
                    )}
                </g>

                {/* Interaction Overlay (Invisible Rects) */}
                {rawPoints.map((p, i) => (
                    <g key={i} onMouseEnter={() => setHoverIndex(i)} onMouseLeave={() => setHoverIndex(null)}>
                        <rect x={p.x - (width / data.length / 2)} y={0} width={width / data.length} height={height} fill="transparent" />
                        {/* Highlights on Hover */}
                        <circle
                            cx={p.x} cy={p.y} r={3.5}
                            className={`fill-white stroke-slate-900 stroke-[1.5] transition-opacity duration-200 pointer-events-none ${hoverIndex === i ? 'opacity-100' : 'opacity-0'}`}
                        />
                        {/* Corresponding Trend Point Highlight */}
                        <circle
                            cx={trendPoints[i].x} cy={trendPoints[i].y} r={3}
                            className={`fill-red-500 stroke-white stroke-[1.5] transition-opacity duration-200 pointer-events-none ${hoverIndex === i ? 'opacity-100' : 'opacity-0'}`}
                        />
                    </g>
                ))}
            </svg>

            {/* X-Axis Labels */}
            <div className="flex justify-between px-4 mt-[-5px]">
                {data.map((d, i) => (
                    (data.length <= 6 || i % Math.ceil(data.length / 5) === 0) && (
                        <span key={i} className="text-[9px] text-slate-400 font-medium font-sans">
                            {d.name.split('.')[1] || d.name}
                        </span>
                    )
                ))}
            </div>

            {/* Tooltip */}
            {hoverIndex !== null && rawPoints[hoverIndex] && (
                <div
                    className="absolute pointer-events-none z-20 transform -translate-x-1/2 -translate-y-full"
                    style={{
                        left: `${(rawPoints[hoverIndex].x / width) * 100}%`,
                        top: `${(rawPoints[hoverIndex].y / height) * 100}%`,
                        marginTop: '-12px'
                    }}
                >
                    <div className="bg-slate-900/90 text-white px-2 py-1 rounded shadow-xl border border-slate-700 backdrop-blur-sm flex flex-col items-center">
                        <span className="text-[10px] font-bold font-mono">{Math.round(rawPoints[hoverIndex].value).toLocaleString()} Visit</span>
                        <span className="text-[8px] text-slate-300">Trend: {Math.round(trendPoints[hoverIndex].value).toLocaleString()}</span>
                    </div>
                    {/* Arrow */}
                    <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-slate-900 mx-auto opacity-90"></div>
                </div>
            )}
        </div>
    );
};
