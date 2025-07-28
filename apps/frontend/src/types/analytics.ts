export interface TimeRange {
  start: Date;
  end: Date;
  label: string;
}

export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string;
    borderWidth?: number;
    fill?: boolean;
  }>;
}

export interface StatCard {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  color?: string;
}

export interface ProductivityFactor {
  name: string;
  score: number;
  maxScore: number;
  description: string;
}

export interface HeatmapData {
  date: string;
  value: number;
}

export interface ActivityHeatmap {
  data: HeatmapData[];
  startDate: Date;
  endDate: Date;
  colorScale: string[];
}