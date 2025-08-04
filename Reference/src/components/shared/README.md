# Shared Components

This directory contains reusable components that can be used across different parts of the application.

## MetricCard Component

A reusable card component for displaying metrics with trends, icons, and optional mini-charts.

### Features

- **Dark theme design** - Matches the dashboard aesthetic
- **Trend indicators** - Shows percentage changes with directional arrows
- **Mini charts** - Optional area or line charts using Recharts
- **AI insights** - Optional AI insight button for enhanced analytics
- **Click handlers** - Support for drill-down navigation
- **Responsive design** - Works on mobile and desktop
- **Custom formatters** - Flexible value formatting
- **Loading states** - Built-in loading skeleton

### Usage

```tsx
import { MetricCard } from '../components/shared';

// Basic usage
<MetricCard
  title="Total Revenue"
  value={239.94}
  subtitle="Total earnings for the period"
  icon="💰"
  color="#448382"
  trend={{
    direction: 'down',
    percentage: 0.42,
    period: 'last month'
  }}
  onAIInsight={() => console.log('Get AI insights')}
  onClick={() => console.log('Navigate to details')}
/>

// With chart data
const chartData = [
  { date: '01/03', value: 120 },
  { date: '07/03', value: 180 },
  { date: '14/03', value: 150 },
  { date: '21/03', value: 220 },
  { date: '28/03', value: 200 }
];

<MetricCard
  title="Order Trends"
  value={178080}
  subtitle="Orders processed"
  icon="📦"
  chartData={chartData}
  showChart={true}
  chartType="area"
  color="#6c8471"
/>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | - | The metric title |
| `value` | `number \| string` | - | The metric value |
| `subtitle` | `string` | - | Optional subtitle |
| `icon` | `string` | - | Emoji or icon to display |
| `color` | `string` | `'#448382'` | Primary color for the card |
| `trend` | `TrendData` | - | Trend information |
| `chartData` | `ChartData[]` | - | Data for mini chart |
| `showChart` | `boolean` | `false` | Whether to show the chart |
| `chartType` | `'line' \| 'area'` | `'area'` | Chart type |
| `chartColor` | `string` | - | Color for the chart (defaults to `color`) |
| `onClick` | `() => void` | - | Click handler for drill-down |
| `onAIInsight` | `() => void` | - | AI insight button handler |
| `formatter` | `(value: number) => string` | - | Custom value formatter |
| `loading` | `boolean` | `false` | Show loading skeleton |
| `className` | `string` | - | Additional CSS classes |

### Types

```tsx
interface TrendData {
  direction: 'up' | 'down' | 'stable';
  percentage: number;
  period: string;
}

interface ChartData {
  date: string;
  value: number;
}
```

### Grid Layout

Use the provided CSS classes for grid layouts:

```tsx
// 4-column grid
<div className="metrics-grid-4">
  <MetricCard {...props1} />
  <MetricCard {...props2} />
  <MetricCard {...props3} />
  <MetricCard {...props4} />
</div>

// 2-column grid
<div className="metrics-grid-2">
  <MetricCard {...props1} />
  <MetricCard {...props2} />
</div>

// Auto-fit grid
<div className="metrics-grid">
  <MetricCard {...props1} />
  <MetricCard {...props2} />
  {/* ... */}
</div>
```

### Styling

The component uses CSS custom properties for theming. You can override these in your CSS:

```css
.metric-card {
  --primary-color: #448382;
  --success-color: #6c8471;
  --warning-color: #a66b6b;
  --info-color: #4a90e2;
}
```

### Examples

See `MetricCardDemo.tsx` for comprehensive usage examples including:
- Basic metrics
- Trend indicators
- Chart variations
- Compact variants
- Different color schemes

## Future Components

This directory will also contain:
- `ChartWrapper.tsx` - Configurable chart wrapper
- `DataTable.tsx` - Flexible data table component
- `WidgetGrid.tsx` - Dashboard widget grid system 