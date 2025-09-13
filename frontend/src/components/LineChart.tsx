import React from 'react';

interface Point {
  x: number;
  y: number;
}

interface LineChartProps {
  data: Point[];
  width?: number;
  height?: number;
  stroke?: string;
  strokeWidth?: number;
}

const LineChart: React.FC<LineChartProps> = ({
  data,
  width = 300,
  height = 150,
  stroke = '#3B82F6',
  strokeWidth = 2,
}) => {
  if (!data || data.length < 2) {
    return (
      <div style={{ width, height }} className="flex items-center justify-center text-slate-400 text-sm">
        Not enough data to display chart.
      </div>
    );
  }

  const padding = 20;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const xValues = data.map(p => p.x);
  const yValues = data.map(p => p.y);
  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);
  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);

  const getSvgX = (x: number) => {
    if (maxX === minX) return padding;
    return padding + ((x - minX) / (maxX - minX)) * chartWidth;
  };

  const getSvgY = (y: number) => {
    if (maxY === minY) return height - padding;
    return height - padding - ((y - minY) / (maxY - minY)) * chartHeight;
  };

  const path = data
    .map((p, i) => {
      const x = getSvgX(p.x);
      const y = getSvgY(p.y);
      return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    })
    .join(' ');

  // Create gradient area under the line
  const areaPath = `${path} L ${getSvgX(data[data.length - 1].x)} ${height - padding} L ${getSvgX(data[0].x)} ${height - padding} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
      <defs>
        <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.3" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0.05" />
        </linearGradient>
      </defs>

      {/* Y-axis labels */}
      <text x={padding - 5} y={getSvgY(maxY)} dy="5" textAnchor="end" fill="#94a3b8" fontSize="10">
        {maxY}
      </text>
      <text x={padding - 5} y={getSvgY(minY)} dy="5" textAnchor="end" fill="#94a3b8" fontSize="10">
        {minY}
      </text>

      {/* Grid lines */}
      <line x1={padding} y1={getSvgY(maxY)} x2={width - padding} y2={getSvgY(maxY)} stroke="#e2e8f0" strokeDasharray="2,2" />
      <line x1={padding} y1={getSvgY(minY)} x2={width - padding} y2={getSvgY(minY)} stroke="#e2e8f0" strokeDasharray="2,2" />

      {/* Area under the line */}
      <path d={areaPath} fill="url(#chartGradient)" />

      {/* The line itself */}
      <path d={path} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />

      {/* Data points */}
      {data.map((p, i) => (
        <circle
          key={i}
          cx={getSvgX(p.x)}
          cy={getSvgY(p.y)}
          r="3"
          fill="white"
          stroke={stroke}
          strokeWidth="2"
        />
      ))}
    </svg>
  );
};

export default LineChart;
