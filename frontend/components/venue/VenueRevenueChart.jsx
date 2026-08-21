"use client";

import * as React from "react";
import { TrendingUp } from "lucide-react";

export function VenueRevenueChart({ data = [] }) {
  const [hoveredIdx, setHoveredIdx] = React.useState(null);

  const chartData = (data && data.length > 0) ? data : [
    { month: "Jan", revenue: 0 },
    { month: "Feb", revenue: 0 },
    { month: "Mar", revenue: 0 },
    { month: "Apr", revenue: 0 },
    { month: "May", revenue: 0 },
    { month: "Jun", revenue: 0 }
  ];

  const maxVal = Math.max(...chartData.map(d => Number(d.revenue || 0)), 10000);

  const width = 500;
  const height = 200;
  const paddingLeft = 45;
  const paddingRight = 15;
  const paddingTop = 20;
  const paddingBottom = 25;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const points = chartData.map((d, idx) => {
    const x = paddingLeft + (idx / Math.max(1, chartData.length - 1)) * chartWidth;
    const y = paddingTop + chartHeight - (Number(d.revenue || 0) / maxVal) * chartHeight;
    return { x, y, month: d.month, revenue: Number(d.revenue || 0) };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  
  const areaPath = points.length > 0 
    ? `${linePath} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`
    : "";

  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        borderRadius: "24px",
        border: "1px solid #e2e8f0",
        padding: "24px 28px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.02)",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px" }}>
        <div>
          <h3 style={{ fontSize: "14px", fontWeight: 900, color: "#0a0a0f", margin: 0, display: "flex", alignItems: "center", gap: "6px" }}>
            <TrendingUp style={{ width: "16px", height: "16px", color: "#16a34a" }} />
            <span>Revenue Trajectory</span>
          </h3>
          <p style={{ fontSize: "11px", color: "#64748b", margin: "2px 0 0 0", fontWeight: 500 }}>
            Monthly rental receipts progression
          </p>
        </div>
        <span style={{ fontSize: "11px", fontWeight: 800, backgroundColor: "#f0fdf4", color: "#15803d", padding: "3px 10px", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
          6-Month Period
        </span>
      </div>

      <div style={{ position: "relative" }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto", overflow: "visible" }}>
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#16a34a" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#16a34a" stopOpacity="0.0" />
            </linearGradient>
          </defs>

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
                  stroke="#f1f5f9" 
                  strokeWidth="1" 
                  strokeDasharray="4 4" 
                />
                <text 
                  x={paddingLeft - 8} 
                  y={y + 3} 
                  fill="#94a3b8" 
                  fontSize="8.5" 
                  textAnchor="end"
                  fontWeight="600"
                >
                  ₹{(labelValue / 1000).toFixed(0)}k
                </text>
              </g>
            );
          })}

          {areaPath && (
            <path d={areaPath} fill="url(#chartGradient)" />
          )}

          {linePath && (
            <path 
              d={linePath} 
              fill="none" 
              stroke="#16a34a" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
            />
          )}

          {points.map((p, idx) => (
            <g key={idx}>
              <text 
                x={p.x} 
                y={height - 5} 
                fill="#64748b" 
                fontSize="9" 
                textAnchor="middle"
                fontWeight="700"
              >
                {p.month}
              </text>

              <rect
                x={p.x - chartWidth / (chartData.length * 2)}
                y={paddingTop}
                width={chartWidth / chartData.length}
                height={chartHeight}
                fill="transparent"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                style={{ cursor: "pointer" }}
              />

              {(hoveredIdx === idx) && (
                <circle 
                  cx={p.x} 
                  cy={p.y} 
                  r="5" 
                  fill="#16a34a" 
                  stroke="#ffffff" 
                  strokeWidth="2" 
                />
              )}
            </g>
          ))}
        </svg>

        {hoveredIdx !== null && points[hoveredIdx] && (
          <div 
            style={{
              position: "absolute",
              left: `${(points[hoveredIdx].x / width) * 100}%`,
              top: `${(points[hoveredIdx].y / height) * 100 - 28}%`,
              transform: "translateX(-50%)",
              backgroundColor: "#0a0a0f",
              color: "#ffffff",
              padding: "6px 12px",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              fontSize: "11px",
              fontWeight: 800,
              pointerEvents: "none",
            }}
          >
            <span style={{ color: "#94a3b8", display: "block", fontSize: "9.5px" }}>{points[hoveredIdx].month}</span>
            <span style={{ color: "#c6ff3d", fontSize: "12px", fontWeight: 900 }}>
              ₹{points[hoveredIdx].revenue.toLocaleString("en-IN")}
            </span>
          </div>
        )}
      </div>

    </div>
  );
}
