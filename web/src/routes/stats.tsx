import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { TopArtistCard } from "@/components/stats/TopArtistCard";
import { TopArtistsList } from "@/components/stats/TopArtistsList";
import { TopAlbumCard } from "@/components/stats/TopAlbumCard";
import { TopAlbumsList } from "@/components/stats/TopAlbumsList";
import { TopSongCard } from "@/components/stats/TopSongCard";
import { TopSongsList } from "@/components/stats/TopSongsList";
import { SummaryCard } from "@/components/stats/SummaryCard";
import { MonthlyActivityChart } from "@/components/stats/MonthlyActivityChart";
import { DailyPatternsChart } from "@/components/stats/DailyPatternsChart";
import { ArtistDistributionChart } from "@/components/stats/ArtistDistributionChart";
import { SummarySkeleton } from "@/components/stats/skeletons/SummarySkeleton";
import { ChartSkeleton } from "@/components/stats/skeletons/ChartSkeleton";

// TODO: Create Skeletons for UI

export const Route = createFileRoute("/stats")({
  component: StatsComponent,
});

interface SummaryStats {
  totalTracks: number;
  totalHours: number;
  totalDays: number;
  uniqueArtists: number;
  uniqueAlbums: number;
  timeSpanYears: number;
}

interface TopArtist {
  artist: string;
  totalHours: number;
  playCount: number;
}

interface TopAlbum {
  album: string;
  artist: string;
  totalHours: number;
  playCount: number;
}

interface TopSong {
  track: string;
  artist: string;
  totalHours: number;
  playCount: number;
}

interface MonthlyData {
  date: string;
  streamCount: number;
  totalHours: number;
}

interface DailyData {
  dayOfWeek: number;
  hour: number;
  streamCount: number;
  avgListening: number;
}

interface ArtistData {
  artist: string;
  totalHours: number;
  streamCount: number;
}

function StatsComponent() {
  const [hasData, setHasData] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [topArtists, setTopArtists] = useState<TopArtist[]>([]);
  const [topAlbums, setTopAlbums] = useState<TopAlbum[]>([]);
  const [topSongs, setTopSongs] = useState<TopSong[]>([]);
  const [summary, setSummary] = useState<SummaryStats | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [artistData, setArtistData] = useState<ArtistData[]>([]);

  const { token } = useAuth();

  useEffect(() => {
    checkForData();
  }, []);

  const checkForData = async () => {
    try {
      const response = await fetch("/api/stats/summary", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const result = await response.json();

      if (result.success && result.data && result.data.totalTracks > 0) {
        setHasData(true);
        fetchAllStats(); // Only fetch if data exists
      } else {
        setHasData(false);
        setLoading(false);
      }
    } catch (err) {
      setHasData(false);
      setLoading(false);
    }
  };

  const fetchAllStats = async () => {
    try {
      const [artistsRes, albumsRes, songsRes, summaryRes, monthlyRes, dailyRes, artistDistRes] =
        await Promise.all([
          fetch("/api/stats/top-artists", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("/api/stats/top-albums", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("/api/stats/top-songs", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("/api/stats/summary", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("/api/stats/monthly-activity", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("/api/stats/daily-patterns", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("/api/stats/artist-distribution", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

      const [
        artistsData,
        albumsData,
        songsData,
        summaryData,
        monthlyData,
        dailyData,
        artistDistData,
      ] = await Promise.all([
        artistsRes.json(),
        albumsRes.json(),
        songsRes.json(),
        summaryRes.json(),
        monthlyRes.json(),
        dailyRes.json(),
        artistDistRes.json(),
      ]);

      if (summaryData.success) setSummary(summaryData.data);
      if (artistsData.success) setTopArtists(artistsData.data);
      if (albumsData.success) setTopAlbums(albumsData.data);
      if (songsData.success) setTopSongs(songsData.data);
      if (monthlyData.success) setMonthlyData(monthlyData.data);
      if (dailyData.success) setDailyData(dailyData.data);
      if (artistDistData.success) setArtistData(artistDistData.data);
    } catch (err) {
      console.error("Failed to fetch stats");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-7xl py-12 space-y-8">
        <h1 className="text-4xl font-bold text-center text-primary mb-12">Your Music Statistics</h1>
        <SummarySkeleton />
        <div className="space-y-6">
          <ChartSkeleton title="Monthly Activity" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ChartSkeleton title="Daily Patterns" />
            <ChartSkeleton title="Artist Distribution" />
          </div>
        </div>
        
        {/* Add skeletons for other sections too */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ChartSkeleton title="Top Artist" />
          <ChartSkeleton title="Top Album" />
          <ChartSkeleton title="Top Song" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ChartSkeleton title="Top Artists List" />
          <ChartSkeleton title="Top Albums List" />
          <ChartSkeleton title="Top Songs List" />
        </div>
      </div>
    );
  }

  // No data state
  if (hasData === false) {
    return (
      <div className="container mx-auto max-w-4xl py-12 space-y-8">
        <Card className="text-center">
          <CardHeader>
            <CardTitle className="text-3xl text-primary mb-4">Welcome to Spotilyze</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <p className="text-xl text-muted-foreground">
                You haven't uploaded any Spotify data yet.
              </p>
              <p className="text-muted-foreground">
                Upload your Spotify streaming history to see detailed analytics about your music
                taste.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">What you'll get:</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                <div>
                  <div className="text-primary font-medium">Top Artists & Songs</div>
                  <div>Your most played music</div>
                </div>
                <div>
                  <div className="text-primary font-medium">Listening Patterns</div>
                  <div>When and how you listen</div>
                </div>
                <div>
                  <div className="text-primary font-medium">Visual Charts</div>
                  <div>Beautiful data visualizations</div>
                </div>
              </div>
            </div>

            <Link to="/upload">
              <Button size="lg" className="mt-6">
                Upload Spotify Data
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Tutorial Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-primary">How to Get Your Spotify Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Step 1 */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <h3 className="text-xl font-semibold">Request your data from Spotify</h3>
              </div>

              <div className="ml-11 space-y-3 text-muted-foreground">
                <p>
                  To request your extended streaming history files, follow these steps on the
                  Spotify website:
                </p>

                <ol className="space-y-2 list-decimal list-inside">
                  <li>
                    Open the{" "}
                    <a
                      href="https://www.spotify.com/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Privacy page
                    </a>{" "}
                    on the Spotify website
                  </li>
                  <li>Scroll down to the "Download your data" section</li>
                  <li>
                    Configure your request:
                    <ul className="ml-6 mt-2 space-y-1 list-disc list-inside">
                      <li>
                        <strong>Untick</strong> the "Account data" checkbox
                      </li>
                      <li>
                        <strong>Tick</strong> the "Extended streaming history" checkbox
                      </li>
                    </ul>
                  </li>
                  <li>Press the "Request data" button</li>
                </ol>

                <div className="bg-muted/30 p-4 rounded-lg mt-4">
                  <p className="text-sm">
                    <strong>Important:</strong> Make sure to select "Extended streaming history"
                    rather than just "Account data" to get detailed analytics.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <h3 className="text-xl font-semibold">Confirm your request</h3>
              </div>

              <div className="ml-11 space-y-3 text-muted-foreground">
                <p>After submitting your request:</p>

                <ol className="space-y-2 list-decimal list-inside">
                  <li>Check your email for a confirmation link from Spotify</li>
                  <li>Click the confirmation link to verify your request</li>
                  <li>Spotify will begin gathering your streaming history data</li>
                </ol>
              </div>
            </div>

            {/* Step 3 */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">
                  3
                </div>
                <h3 className="text-xl font-semibold">Download your data</h3>
              </div>

              <div className="ml-11 space-y-3 text-muted-foreground">
                <p>Wait for Spotify to prepare your data:</p>

                <ol className="space-y-2 list-decimal list-inside">
                  <li>Processing typically takes 1-3 days</li>
                  <li>You'll receive another email when your data is ready</li>
                  <li>Click the download link in the email</li>
                  <li>Save the ZIP file to your computer</li>
                </ol>

                <div className="bg-muted/30 p-4 rounded-lg mt-4">
                  <p className="text-sm">
                    <strong>Note:</strong> The download link expires after a few days, so download
                    your data promptly when you receive the email.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">
                  4
                </div>
                <h3 className="text-xl font-semibold">Upload to Spotilyze</h3>
              </div>

              <div className="ml-11 space-y-3 text-muted-foreground">
                <p>Once you have your data:</p>

                <ol className="space-y-2 list-decimal list-inside">
                  <li>Keep the ZIP file as downloaded (don't extract it)</li>
                  <li>
                    Go to the{" "}
                    <Link to="/upload" className="text-primary hover:underline">
                      Upload page
                    </Link>
                  </li>
                  <li>Drag and drop the ZIP file or click to browse</li>
                  <li>Wait for processing (usually under a minute)</li>
                  <li>View your personalized music analytics</li>
                </ol>
              </div>
            </div>

            {/* Final CTA */}
            <div className="text-center pt-6 border-t border-border">
              <p className="text-muted-foreground mb-4">Already have your Spotify data file?</p>
              <Link to="/upload">
                <Button size="lg">Upload Now</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl py-12 space-y-8">
      <h1 className="text-4xl font-bold text-center text-primary mb-12">Your Music Statistics</h1>

      <SummaryCard summary={summary} loading={false} />

      {/* Charts Row */}
      <div className="space-y-6">
        <MonthlyActivityChart data={monthlyData} loading={false} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DailyPatternsChart data={dailyData} loading={false} />
          <ArtistDistributionChart data={artistData} loading={false} />
        </div>
      </div>

      {/* Single Items Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <TopArtistCard artists={topArtists} loading={false} />
        <TopAlbumCard albums={topAlbums} loading={false} />
        <TopSongCard songs={topSongs} loading={false} />
      </div>

      {/* Top 5 Lists Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <TopArtistsList artists={topArtists} loading={false} />
        <TopAlbumsList albums={topAlbums} loading={false} />
        <TopSongsList songs={topSongs} loading={false} />
      </div>
    </div>
  );
}
