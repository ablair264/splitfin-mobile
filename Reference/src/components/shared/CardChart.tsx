import React from 'react';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  PieChart, Pie, Cell, RadialBarChart, RadialBar,
  ResponsiveContainer, XAxis, YAxis, Tooltip, Legend
} from 'recharts';
import styles from './CardChart.module.css';

interface CardChartProps {
  id: string;
  title: string;
  subtitle?: string;
  data: Array<any>;
  type: 'area' | 'line' | 'bar' | 'pie' | 'radial' | 'donut';
  dataKey?: string;
  colors?: string[];
  showLegend?: boolean;
  height?: number;
  design?: 'default' | 'horizontal-bars' | 'pie-with-legend';
  onOptionsClick?: () => void;
  onClick?: () => void;
}

const CardChart: React.FC<CardChartProps> = ({
  id,
  title,
  subtitle,
  data,
  type,
  dataKey = 'value',
  colors = ['#79d5e9', '#4daeac', '#61bc8e', '#fbbf24', '#dc2626'],
  showLegend = false,
  height = 200,
  design = 'default',
  onOptionsClick,
  onClick
}) => {
  const renderChart = () => {
    // Handle pie design for any chart type
    if (design === 'pie-with-legend') {
      return (
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="40%"
              innerRadius={0}
              outerRadius="60%"
              paddingAngle={2}
              dataKey={dataKey}
            >
              {data.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: '#1a1f2a',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                fontSize: '12px'
              }}
              labelStyle={{ color: '#a0a0a0' }}
            />
            <Legend 
              verticalAlign="bottom" 
              height={80}
              iconType="circle"
              wrapperStyle={{
                fontSize: '12px',
                color: '#a0a0a0',
                paddingTop: '10px'
              }}
              formatter={(value, entry, index) => [
                <span style={{ color: colors[index % colors.length] }}>●</span>,
                `${value}: ${data[index]?.[dataKey] || 0}`
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    // Handle horizontal bars for any chart type
    if (design === 'horizontal-bars') {
      return (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart 
            data={data} 
            margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
            layout="vertical"
          >
            <XAxis 
              type="number"
              stroke="#666"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              type="category"
              dataKey="name"
              stroke="#666"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={80}
            />
            <Tooltip
              contentStyle={{
                background: '#1a1f2a',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                fontSize: '12px'
              }}
              labelStyle={{ color: '#a0a0a0' }}
            />
            <Bar dataKey={dataKey} radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      );
    }

    // Default chart rendering
    switch (type) {
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`gradient-${id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors[0]} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={colors[0]} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="name" 
                stroke="#666"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#666"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip
                contentStyle={{
                  background: '#1a1f2a',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  fontSize: '12px'
                }}
                labelStyle={{ color: '#a0a0a0' }}
              />
              <Area
                type="monotone"
                dataKey={dataKey}
                stroke={colors[0]}
                fill={`url(#gradient-${id})`}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
              <XAxis 
                dataKey="name" 
                stroke="#666"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#666"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: '#1a1f2a',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  fontSize: '12px'
                }}
                labelStyle={{ color: '#a0a0a0' }}
              />
              <Line
                type="monotone"
                dataKey={dataKey}
                stroke={colors[0]}
                strokeWidth={2}
                dot={{ fill: colors[0], r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
              <XAxis 
                dataKey="name" 
                stroke="#666"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#666"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: '#1a1f2a',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  fontSize: '12px'
                }}
                labelStyle={{ color: '#a0a0a0' }}
              />
              <Bar dataKey={dataKey} radius={[6, 6, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );

      case 'pie':
      case 'donut':
        const innerRadius = type === 'donut' ? '60%' : 0;
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={innerRadius}
                outerRadius="80%"
                paddingAngle={2}
                dataKey={dataKey}
              >
                {data.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: '#1a1f2a',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  fontSize: '12px'
                }}
                labelStyle={{ color: '#a0a0a0' }}
              />
              {showLegend && (
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  iconType="circle"
                  wrapperStyle={{
                    fontSize: '12px',
                    color: '#a0a0a0'
                  }}
                />
              )}
            </PieChart>
          </ResponsiveContainer>
        );

      case 'radial':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <RadialBarChart cx="50%" cy="50%" innerRadius="10%" outerRadius="90%" data={data}>
              <RadialBar
                dataKey={dataKey}
                cornerRadius={10}
                fill={colors[0]}
              />
              <Tooltip
                contentStyle={{
                  background: '#1a1f2a',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  fontSize: '12px'
                }}
                labelStyle={{ color: '#a0a0a0' }}
              />
            </RadialBarChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  const containerClasses = [
    styles.cardChartContainer,
    type === 'pie' ? styles.pieChart : ''
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses} onClick={onClick}>
      <div className={styles.cardChartHeader}>
        <div className={styles.chartHeaderLeft}>
          <h3 className={styles.chartTitle}>{title}</h3>
          {subtitle && <p className={styles.chartSubtitle}>{subtitle}</p>}
        </div>
        {onOptionsClick && (
          <button className={styles.chartOptionsButton} onClick={(e) => {
            e.stopPropagation();
            onOptionsClick();
          }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <circle cx="10" cy="4" r="1.5" />
              <circle cx="10" cy="10" r="1.5" />
              <circle cx="10" cy="16" r="1.5" />
            </svg>
          </button>
        )}
      </div>
      <div className={styles.chartContent}>
        {renderChart()}
      </div>
    </div>
  );
};

export default CardChart;