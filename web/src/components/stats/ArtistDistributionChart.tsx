import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import { PieChart, Pie, Cell } from "recharts";

interface ArtistData {
  artist: string;
  totalHours: number;
  streamCount: number;
}

interface ArtistDistributionChartProps {
  data: ArtistData[];
  loading: boolean;
}

const chartConfig = {
  hours: {
    label: "Hours",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

const COLORS = [
  "hsl(var(--primary))",
  "hsl(152 100% 60%)",
  "hsl(152 100% 70%)",
  "hsl(152 80% 50%)",
  "hsl(152 60% 40%)",
  "hsl(152 40% 30%)",
  "hsl(152 20% 20%)",
  "hsl(152 10% 15%)",
];

export function ArtistDistributionChart({ data, loading }: ArtistDistributionChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Artist Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center text-muted-foreground">
            Loading chart...
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((item) => ({
    name: item.artist,
    value: item.totalHours,
    streams: item.streamCount,
  }));

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle>Top Artist Distribution</CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <ChartContainer config={chartConfig} className="h-60 w-full">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={120}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <ChartTooltip content={<ChartTooltipContent />} />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
