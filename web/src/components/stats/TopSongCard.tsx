import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Song {
  track: string;
  artist: string;
  totalHours: number;
  playCount: number;
}

interface TopSongCardProps {
  songs: Song[];
  loading: boolean;
}

export function TopSongCard({ songs, loading }: TopSongCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Most Streamed Song</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Most Streamed Song</CardTitle>
      </CardHeader>
      <CardContent>
        {songs[0] && (
          <div className="text-center space-y-2">
            <div className="text-xl font-bold text-primary">{songs[0].track}</div>
            <div className="text-muted-foreground font-medium">by {songs[0].artist}</div>
            <div className="text-muted-foreground text-sm">
              {songs[0].totalHours}h • {songs[0].playCount} plays
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
