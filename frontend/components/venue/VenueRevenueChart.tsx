"use client";

import * as React from "react";
import { MonthlyRevenuePoint } from "@/types/earnings";

interface VenueRevenueChartProps {
  data: MonthlyRevenuePoint[];
}

export function VenueRevenueChart({ data }: VenueRevenueChartProps) {
  const [hoveredIdx, setHoveredIdx] = React.useState<number | null>(null);

  // Default fallback data if empty
  const chartData = data.length > 0 ? data : [
    { month: "Jan", revenue: 0 },
    { month: "Feb", revenue: 0 },
    { month: "Mar", revenue: 0 },
    { month: "Apr", revenue: 0 },
    { month: "May", revenue: 0 },
    { month: "Jun", revenue: 0 }
  ];

  const maxVal = Math.max(...chartData.map(d => d.revenue), 10000);

  // SVG parameters
  const width = 500;
  const height = 200;
  const paddingLeft = 45;
  const paddingRight = 15;
  const paddingTop = 20;
  const paddingBottom = 25;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Generate coordinates
  const points = chartData.map((d, idx) => {
    const x = paddingLeft + (idx / (chartData.length - 1)) * chartWidth;
    const y = paddingTop + chartHeight - (d.revenue / maxVal) * chartHeight;
    return { x, y, month: d.month, revenue: d.revenue };
  });

  // SVG path generation
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  
  // Closed area path for gradient fill
  const areaPath = points.length > 0 
    ? `${linePath} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`
    : "";

  return (
    <div className="p-5 border border-border/80 bg-bg-card/45 backdrop-blur-md rounded-2xl shadow-lg text-text-primary space-y-4">
      
      <div className="flex justify-between items-center border-b border-border/30 pb-2.5">
        <div className="space-y-0.5">
          <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Revenue Trend</span>
          <h4 className="text-xs font-bold text-text-primary">Last 6 Months Performance</h4>
        </div>
      </div>

      <div className="relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = paddingTop + chartHeight * ratio;
            const labelValue = Math.round(maxVal * (1 - ratio));
            return (
              <g key={idx}>
                <line 
                  x1={paddingLeft} 
                  y1={y} 
                  x2={width - paddingRight} 
                  y2={y} 
                  stroke="var(--color-border)" 
                  strokeWidth="0.8" 
                  strokeDasharray="4 4" 
                />
                <text 
                  x={paddingLeft - 8} 
                  y={y + 3} 
                  fill="#6b7280" 
                  fontSize="8" 
                  textAnchor="end"
                  className="font-mono"
                >
                  ₹{(labelValue / 1000).toFixed(0)}k
                </text>
              </g>
            );
          })}

          {/* Area under curve */}
          {areaPath && (
            <path d={areaPath} fill="url(#chartGradient)" />
          )}

          {/* Line curve */}
          {linePath && (
            <path 
              d={linePath} 
              fill="none" 
              stroke="#10b981" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
            />
          )}

          {/* X Axis Labels & Interactive Bars */}
          {points.map((p, idx) => (
            <g key={idx}>
              <text 
                x={p.x} 
                y={height - 5} 
                fill="#6b7280" 
                fontSize="8.5" 
                textAnchor="middle"
                className="font-sans font-medium"
              >
                {p.month}
              </text>

              {/* Hover Trigger zones */}
              <rect
                x={p.x - chartWidth / (chartData.length * 2)}
                y={paddingTop}
                width={chartWidth / chartData.length}
                height={chartHeight}
                fill="transparent"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer"
              />

              {/* Hover dot highlights */}
              {(hoveredIdx === idx) && (
                <circle 
                  cx={p.x} 
                  cy={p.y} 
                  r="4" 
                  fill="#10b981" 
                  stroke="var(--color-bg-card)" 
                  strokeWidth="1.5" 
                />
              )}
            </g>
          ))}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredIdx !== null && points[hoveredIdx] && (
          <div 
            className="absolute bg-bg-elevated border border-border p-2.5 rounded-xl shadow-2xl text-text-primary text-[10px] pointer-events-none transition-all duration-75"
            style={{
              left: `${(points[hoveredIdx].x / width) * 100}%`,
              top: `${(points[hoveredIdx].y / height) * 100 - 25}%`,
              transform: "translateX(-50%)"
            }}
          >
            <p className="font-bold text-text-muted">{points[hoveredIdx].month}</p>
            <p className="text-primary font-black text-xs pt-0.5">
              ₹{points[hoveredIdx].revenue.toLocaleString("en-IN")}
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
