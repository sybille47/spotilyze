import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Song {
  track: string;
  artist: string;
  totalHours: number;
  playCount: number;
}

interface TopSongsListProps {
  songs: Song[];
  loading: boolean;
}

export function TopSongsList({ songs, loading }: TopSongsListProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top 5 Songs</CardTitle>
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
        <CardTitle>Top 5 Songs</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {songs.slice(0, 5).map((song, index) => (
            <div key={`${song.track}-${song.artist}`} className="flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center flex-shrink-0">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{song.track}</div>
                  <div className="text-muted-foreground text-xs truncate">{song.artist}</div>
                </div>
              </div>
              <span className="text-primary text-sm font-medium">{song.totalHours}h</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
