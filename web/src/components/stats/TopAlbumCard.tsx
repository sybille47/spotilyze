import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Album {
  album: string;
  artist: string;
  totalHours: number;
  playCount: number;
}

interface TopAlbumCardProps {
  albums: Album[];
  loading: boolean;
}

export function TopAlbumCard({ albums, loading }: TopAlbumCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Most Streamed Album</CardTitle>
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
        <CardTitle>Most Streamed Album</CardTitle>
      </CardHeader>
      <CardContent>
        {albums[0] && (
          <div className="text-center space-y-2">
            <div className="text-xl font-bold text-primary">{albums[0].album}</div>
            <div className="text-muted-foreground font-medium">by {albums[0].artist}</div>
            <div className="text-muted-foreground text-sm">
              {albums[0].totalHours}h • {albums[0].playCount} plays
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
