import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";

interface MonthlyData {
  date: string;
  streamCount: number;
  totalHours: number;
}

interface MonthlyActivityChartProps {
  data: MonthlyData[];
  loading: boolean;
}

const chartConfig = {
  streams: {
    label: "Streams",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

export function MonthlyActivityChart({ data, loading }: MonthlyActivityChartProps) {
  if (loading) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Monthly Listening Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center text-muted-foreground">
            Loading chart...
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((item) => ({
    month: new Date(item.date).toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
    streams: item.streamCount,
    hours: item.totalHours,
  }));

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Monthly Listening Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-48 w-full">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line type="monotone" dataKey="streams" stroke="var(--color-streams)" strokeWidth={2} />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
