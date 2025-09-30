import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Artist {
  artist: string;
  totalHours: number;
  playCount: number;
}

interface TopArtistCardProps {
  artists: Artist[];
  loading: boolean;
}

export function TopArtistCard({ artists, loading }: TopArtistCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Most Streamed Artist</CardTitle>
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
        <CardTitle>Most Streamed Artist</CardTitle>
      </CardHeader>
      <CardContent>
        {artists[0] && (
          <div className="text-center space-y-2">
            <div className="text-2xl font-bold text-primary">{artists[0].artist}</div>
            <div className="text-muted-foreground">
              {artists[0].totalHours}h • {artists[0].playCount} plays
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
