import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { CustomTooltip } from './CustomTooltip';

interface CategoryBreakdownProps {
  data: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
}

const COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // yellow
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
];

export function CategoryBreakdown({ data }: CategoryBreakdownProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CategoryTooltipContent = (props: any) => {
    if (!props.active || !props.payload || props.payload.length === 0) return null;
    
    const item = props.payload[0];
    const valueFormatter = (value: number | string) => `${value} (${item.payload?.percentage}%)`;
    
    // Transform props to match CustomTooltip interface
    const customTooltipProps = {
      active: props.active,
      label: props.label,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      payload: props.payload?.map((p: any) => ({
        name: p.dataKey || 'value',
        value: p.value,
        color: p.fill || p.color
      })),
      showLabel: false,
      valueFormatter
    };
    
    return <CustomTooltip {...customTooltipProps} />;
  };

  const renderCustomizedLabel = (props: {
    cx?: number;
    cy?: number;
    midAngle?: number;
    innerRadius?: number;
    outerRadius?: number;
    percent?: number;
  }) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
    if (!cx || !cy || midAngle === undefined || !innerRadius || !outerRadius || !percent) return null;
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null; // Don't show label for small slices

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  interface LegendPayloadItem {
    value: string;
    color: string;
    payload: {
      category: string;
      count: number;
      percentage: number;
    };
  }

  const CustomLegend = (props: { payload?: LegendPayloadItem[] }) => {
    const { payload } = props;
    if (!payload) return null;
    return (
      <ul className="space-y-2">
        {payload.map((entry: LegendPayloadItem, index: number) => (
          <li key={`item-${index}`} className="flex items-center gap-2 text-sm">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-700 dark:text-gray-300">
              {entry.value} ({entry.payload.percentage}%)
            </span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
      <h3 className="text-lg font-semibold mb-4">カテゴリー別分析</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="40%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={100}
            fill="#8884d8"
            dataKey="count"
            nameKey="category"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <Tooltip content={CategoryTooltipContent as any} />
          <Legend
            verticalAlign="middle"
            align="right"
            layout="vertical"
            iconType="circle"
            content={<CustomLegend />}
            wrapperStyle={{ paddingLeft: '20px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}