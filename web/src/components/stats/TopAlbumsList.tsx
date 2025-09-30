import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Album {
  album: string;
  artist: string;
  totalHours: number;
  playCount: number;
}

interface TopAlbumsListProps {
  albums: Album[];
  loading: boolean;
}

export function TopAlbumsList({ albums, loading }: TopAlbumsListProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top 5 Albums</CardTitle>
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
        <CardTitle>Top 5 Albums</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {albums.slice(0, 5).map((album, index) => (
            <div
              key={`${album.album}-${album.artist}`}
              className="flex items-center justify-between"
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center flex-shrink-0">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{album.album}</div>
                  <div className="text-muted-foreground text-xs truncate">{album.artist}</div>
                </div>
              </div>
              <span className="text-primary text-sm font-medium">{album.totalHours}h</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
