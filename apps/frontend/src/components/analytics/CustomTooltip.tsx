interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  valueFormatter?: (value: any) => string;
  showLabel?: boolean;
}

export function CustomTooltip({ 
  active, 
  payload, 
  label, 
  valueFormatter = (value) => String(value),
  showLabel = true 
}: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-900 text-white p-3 rounded shadow-lg border border-gray-700">
      {showLabel && label && (
        <p className="text-sm font-medium mb-1">{label}</p>
      )}
      {payload.map((entry: any, index: number) => (
        <p key={index} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: {valueFormatter(entry.value)}
        </p>
      ))}
    </div>
  );
}