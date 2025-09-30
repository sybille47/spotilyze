import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SummaryStats {
  totalTracks: number;
  totalHours: number;
  totalDays: number;
  uniqueArtists: number;
  uniqueAlbums: number;
  timeSpanYears: number;
}

interface SummaryCardProps {
  summary: SummaryStats | null;
  loading: boolean;
}

export function SummaryCard({ summary, loading }: SummaryCardProps) {
  if (loading) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Your Music Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (!summary) {
    return null;
  }

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Your Music Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-6 text-center">
          <div>
            <div className="text-3xl font-bold text-primary">
              {summary.totalTracks.toLocaleString()}
            </div>
            <div className="text-muted-foreground text-sm">Total Tracks</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary">
              {summary.totalHours.toLocaleString()}h
            </div>
            <div className="text-muted-foreground text-sm">Listening Time</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary">{summary.totalDays}</div>
            <div className="text-muted-foreground text-sm">Days of Music</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary">
              {summary.uniqueArtists.toLocaleString()}
            </div>
            <div className="text-muted-foreground text-sm">Unique Artists</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary">
              {summary.uniqueAlbums.toLocaleString()}
            </div>
            <div className="text-muted-foreground text-sm">Unique Albums</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary">{summary.timeSpanYears}</div>
            <div className="text-muted-foreground text-sm">Years of Data</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
