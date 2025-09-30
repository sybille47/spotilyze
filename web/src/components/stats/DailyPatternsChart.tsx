import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

interface DailyData {
  dayOfWeek: number;
  hour: number;
  streamCount: number;
  avgListening: number;
}

interface DailyPatternsChartProps {
  data: DailyData[];
  loading: boolean;
}

const chartConfig = {
  streams: {
    label: "Streams",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

export function DailyPatternsChart({ data, loading }: DailyPatternsChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Daily Listening Patterns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center text-muted-foreground">
            Loading chart...
          </div>
        </CardContent>
      </Card>
    );
  }

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayData = Array.from({ length: 7 }, (_, i) => {
    const dayStreams = data
      .filter((item) => item.dayOfWeek === i + 1)
      .reduce((sum, item) => sum + item.streamCount, 0);

    return {
      day: dayNames[i],
      streams: dayStreams,
    };
  });

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle>Daily Listening Patterns</CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <ChartContainer config={chartConfig} className="h-60 w-full">
          <BarChart data={dayData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="streams" fill="var(--color-streams)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
