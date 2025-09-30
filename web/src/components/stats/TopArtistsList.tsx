import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Artist {
  artist: string;
  totalHours: number;
  playCount: number;
}

interface TopArtistsListProps {
  artists: Artist[];
  loading: boolean;
}

export function TopArtistsList({ artists, loading }: TopArtistsListProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top 5 Artists</CardTitle>
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
        <CardTitle>Top 5 Artists</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {artists.slice(0, 5).map((artist, index) => (
            <div key={artist.artist} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                  {index + 1}
                </span>
                <span className="font-medium truncate">{artist.artist}</span>
              </div>
              <span className="text-primary text-sm font-medium">{artist.totalHours}h</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
