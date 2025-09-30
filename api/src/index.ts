import 'dotenv/config';
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import JSZip from "jszip";
import { SpotifyDataArraySchema } from "shared";
import { MongoClient, Db } from "mongodb";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// TODO: split index.ts in multiple files dedicated to

const JWT_SECRET = process.env.JWT_SECRET;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/spotilyze';

if (!JWT_SECRET) {
  console.error('❌ JWT_SECRET environment variable is required');
  console.error('Please create apps/api/.env file with JWT_SECRET=your-secret-key');
  process.exit(1);
}

// MongoDB connection
let db: Db;
const client = new MongoClient(MONGODB_URI);

async function connectToDatabase() {
  try {
    await client.connect();
    db = client.db("spotilyze");
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    process.exit(1);
  }
}

// Connect to database on startup
connectToDatabase();

// Add JWT middleware function
const verifyToken = async (c: any, next: any) => {
  const token = c.req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return c.json({ success: false, message: "No token provided" }, 401);
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    c.set("user", decoded);
    await next();
  } catch (error) {
    return c.json({ success: false, message: "Invalid token" }, 401);
  }
};

// Collection interfaces
interface User {
  _id?: string;
  username: string;
  passwordHash: string;
  createdAt: Date;
}

interface StreamingUpload {
  _id?: string;
  userId: string;
  filename: string;
  uploadedAt: Date;
  recordCount: number;
  fileSize: number;
}

interface StreamingRecord {
  _id?: string;
  userId: string;
  uploadId: string;
  ts: string;
  ms_played: number;
  master_metadata_track_name: string;
  master_metadata_album_artist_name: string;
  master_metadata_album_album_name?: string;
  spotify_track_uri?: string;
}

const app = new Hono();

// Enable CORS for frontend
app.use(
  "/*",
  cors({
    origin: "http://localhost:5173",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["POST", "GET", "OPTIONS", "DELETE"],
  })
);

// Health check endpoint
app.get("/health", (c) => {
  return c.json({ status: "ok", message: "Spotilyze API is running" });
});

// Upload endpoint (Feature 1)
app.post("/upload", verifyToken, async (c) => {
  try {
    const user = c.get("user");
    const body = await c.req.parseBody();
    const zippedFile = body["file"] as File;

    if (!zippedFile) {
      return c.json(
        {
          success: false,
          message: "File does not exist",
        },
        400
      );
    }

    if (zippedFile.size > 250 * 1024 * 1024) {
      return c.json(
        {
          success: false,
          message: "File is bigger than 250MB",
        },
        400
      );
    }

    if (!zippedFile.name.toLowerCase().endsWith(".zip")) {
      return c.json(
        {
          success: false,
          message: "Uploaded File is not a .zip File",
        },
        400
      );
    }

    const zippedFileBuffer = await zippedFile.arrayBuffer();
    const loadedZipFile = await JSZip.loadAsync(zippedFileBuffer);

    const jsonFiles: string[] = [];
    const streamingRecords = [];

    // Iterate through all files in the ZIP
    loadedZipFile.forEach((relativePath, zipEntry) => {
      // Only process JSON files, ignore PDFs and other files
      if (
        relativePath.toLowerCase().endsWith(".json") &&
        !zipEntry.dir &&
        relativePath.toLowerCase().includes("audio")
      ) {
        jsonFiles.push(relativePath);
      }
    });

    // Check if we found any JSON files
    if (jsonFiles.length === 0) {
      return c.json(
        {
          success: false,
          message: "No JSON files found in the ZIP archive",
        },
        400
      );
    }

    // Process each JSON file
    for (const jsonFileName of jsonFiles) {
      const zipEntry = loadedZipFile.file(jsonFileName);
      if (!zipEntry) continue;

      // Extract file content as text
      const jsonContent = await zipEntry.async("text");

      // Parse JSON content
      let jsonData;
      try {
        jsonData = JSON.parse(jsonContent);
      } catch (error) {
        return c.json(
          {
            success: false,
            message: `Invalid JSON format in file: ${jsonFileName}`,
          },
          400
        );
      }

      // Validate JSON Content
      const validationResult = SpotifyDataArraySchema.safeParse(jsonData);
      if (!validationResult.success) {
        return c.json(
          {
            success: false,
            message: `Invalid Spotify streaming history format in file: ${jsonFileName}. ${validationResult.error.message}`,
          },
          400
        );
      }

      const filteredData = jsonData.filter((record: any) => {
        // Must be music (not podcast/audiobook)
        if (!record.master_metadata_track_name || !record.master_metadata_album_artist_name) {
          return false;
        }

        // Must meet minimum stream duration (28 seconds = 28,000 ms)
        if (!record.ms_played || record.ms_played < 28000) {
          return false;
        }

        return true;
      });

      // Add this data to streaming records
      if (Array.isArray(filteredData)) {
        streamingRecords.push(...filteredData);
      }
    }

    // Store in database with authenticated user ID
    const uploadRecord = {
      userId: user.userId.toString(),
      filename: zippedFile.name,
      uploadedAt: new Date(),
      recordCount: streamingRecords.length,
      fileSize: zippedFile.size,
    };

    const uploadResult = await db.collection("uploads").insertOne(uploadRecord);
    const uploadId = uploadResult.insertedId.toString();

    // Store streaming records with reference to upload and user
    const recordsToInsert = streamingRecords.map((record) => ({
      ...record,
      userId: user.userId.toString(),
      uploadId: uploadId,
    }));

    await db.collection("streaming_records").insertMany(recordsToInsert);

    return c.json({
      success: true,
      message: `Successfully stored ${streamingRecords.length} quality music streams in database`,
      totalFiles: jsonFiles.length,
      qualityStreams: streamingRecords.length,
      uploadId: uploadId,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        message: "Upload failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

// Delete all user data endpoint
app.delete("/user/data", verifyToken, async (c) => {
  try {
    const user = c.get("user");
    const userId = user.userId.toString();

    // Delete streaming records
    const streamingResult = await db.collection("streaming_records").deleteMany({ userId });

    // Delete uploads
    const uploadsResult = await db.collection("uploads").deleteMany({ userId });

    return c.json({
      success: true,
      message: `Deleted ${streamingResult.deletedCount} streaming records and ${uploadsResult.deletedCount} uploads`,
      deletedRecords: streamingResult.deletedCount,
      deletedUploads: uploadsResult.deletedCount,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        message: "Failed to delete user data",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

// Stats endpoint - Top Artists
app.get("/stats/top-artists", verifyToken, async (c) => {
  try {
    const user = c.get("user");
    const userId = user.userId.toString();

    const topArtists = await db
      .collection("streaming_records")
      .aggregate([
        { $match: { userId: userId } },
        {
          $group: {
            _id: "$master_metadata_album_artist_name",
            totalPlayTime: { $sum: "$ms_played" },
            playCount: { $sum: 1 },
          },
        },
        { $sort: { totalPlayTime: -1 } },
        { $limit: 10 },
        {
          $project: {
            artist: "$_id",
            totalPlayTime: 1,
            playCount: 1,
            totalHours: { $round: [{ $divide: ["$totalPlayTime", 3600000] }, 1] },
            _id: 0,
          },
        },
      ])
      .toArray();

    return c.json({
      success: true,
      data: topArtists,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        message: "Failed to fetch top artists",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

// Stats endpoint - Top Albums
app.get("/stats/top-albums", verifyToken, async (c) => {
  try {
    const user = c.get("user");
    const userId = user.userId.toString();

    const topAlbums = await db
      .collection("streaming_records")
      .aggregate([
        { $match: { userId: userId } },
        {
          $match: {
            master_metadata_album_album_name: { $ne: null },
          },
        },
        {
          $group: {
            _id: {
              album: "$master_metadata_album_album_name",
              artist: "$master_metadata_album_artist_name",
            },
            totalPlayTime: { $sum: "$ms_played" },
            playCount: { $sum: 1 },
          },
        },
        { $sort: { totalPlayTime: -1 } },
        { $limit: 10 },
        {
          $project: {
            album: "$_id.album",
            artist: "$_id.artist",
            totalPlayTime: 1,
            playCount: 1,
            totalHours: { $round: [{ $divide: ["$totalPlayTime", 3600000] }, 1] },
            _id: 0,
          },
        },
      ])
      .toArray();

    return c.json({
      success: true,
      data: topAlbums,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        message: "Failed to fetch top albums",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

// Stats endpoint - Top Songs
app.get("/stats/top-songs", verifyToken, async (c) => {
  try {
    const user = c.get("user");
    const userId = user.userId.toString();

    const topSongs = await db
      .collection("streaming_records")
      .aggregate([
        { $match: { userId: userId } },
        {
          $match: {
            master_metadata_track_name: { $ne: null },
          },
        },
        {
          $group: {
            _id: {
              track: "$master_metadata_track_name",
              artist: "$master_metadata_album_artist_name",
            },
            totalPlayTime: { $sum: "$ms_played" },
            playCount: { $sum: 1 },
          },
        },
        { $sort: { totalPlayTime: -1 } },
        { $limit: 10 },
        {
          $project: {
            track: "$_id.track",
            artist: "$_id.artist",
            totalPlayTime: 1,
            playCount: 1,
            totalHours: { $round: [{ $divide: ["$totalPlayTime", 3600000] }, 1] },
            _id: 0,
          },
        },
      ])
      .toArray();

    return c.json({
      success: true,
      data: topSongs,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        message: "Failed to fetch top songs",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

// Stats endpoint - Summary
app.get("/stats/summary", verifyToken, async (c) => {
  try {
    const user = c.get("user");
    const userId = user.userId.toString();

    const summary = await db
      .collection("streaming_records")
      .aggregate([
        { $match: { userId: userId } },
        {
          $group: {
            _id: null,
            totalTracks: { $sum: 1 },
            totalListeningTime: { $sum: "$ms_played" },
            uniqueArtists: { $addToSet: "$master_metadata_album_artist_name" },
            uniqueAlbums: { $addToSet: "$master_metadata_album_album_name" },
            earliestDate: { $min: "$ts" },
            latestDate: { $max: "$ts" },
          },
        },
        {
          $project: {
            totalTracks: 1,
            totalHours: { $round: [{ $divide: ["$totalListeningTime", 3600000] }, 1] },
            totalDays: { $round: [{ $divide: ["$totalListeningTime", 86400000] }, 1] },
            uniqueArtists: { $size: "$uniqueArtists" },
            uniqueAlbums: { $size: "$uniqueAlbums" },
            timeSpanYears: {
              $round: [
                {
                  $divide: [
                    {
                      $subtract: [
                        { $dateFromString: { dateString: "$latestDate" } },
                        { $dateFromString: { dateString: "$earliestDate" } },
                      ],
                    },
                    31557600000,
                  ],
                },
                1,
              ],
            },
            _id: 0,
          },
        },
      ])
      .toArray();

    return c.json({
      success: true,
      data: summary[0] || {},
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        message: "Failed to fetch summary stats",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

// Monthly Activity Chart
app.get("/stats/monthly-activity", verifyToken, async (c) => {
  try {
    const user = c.get("user");
    const userId = user.userId.toString();

    const monthlyData = await db
      .collection("streaming_records")
      .aggregate([
        { $match: { userId: userId } },
        {
          $project: {
            year: { $year: { $dateFromString: { dateString: "$ts" } } },
            month: { $month: { $dateFromString: { dateString: "$ts" } } },
            ms_played: 1,
          },
        },
        {
          $group: {
            _id: { year: "$year", month: "$month" },
            streamCount: { $sum: 1 },
            totalHours: { $sum: { $divide: ["$ms_played", 3600000] } },
          },
        },
        {
          $project: {
            date: {
              $dateFromParts: {
                year: "$_id.year",
                month: "$_id.month",
                day: 1,
              },
            },
            streamCount: 1,
            totalHours: { $round: ["$totalHours", 1] },
            _id: 0,
          },
        },
        { $sort: { date: 1 } },
      ])
      .toArray();

    return c.json({ success: true, data: monthlyData });
  } catch (error) {
    return c.json(
      {
        success: false,
        message: "Failed to fetch monthly activity",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

// Daily Patterns Chart
app.get("/stats/daily-patterns", verifyToken, async (c) => {
  try {
    const user = c.get("user");
    const userId = user.userId.toString();

    const dailyData = await db
      .collection("streaming_records")
      .aggregate([
        { $match: { userId: userId } },
        {
          $project: {
            dayOfWeek: { $dayOfWeek: { $dateFromString: { dateString: "$ts" } } },
            hour: { $hour: { $dateFromString: { dateString: "$ts" } } },
            ms_played: 1,
          },
        },
        {
          $group: {
            _id: { dayOfWeek: "$dayOfWeek", hour: "$hour" },
            streamCount: { $sum: 1 },
            avgListening: { $avg: { $divide: ["$ms_played", 60000] } },
          },
        },
        {
          $project: {
            dayOfWeek: "$_id.dayOfWeek",
            hour: "$_id.hour",
            streamCount: 1,
            avgListening: { $round: ["$avgListening", 1] },
            _id: 0,
          },
        },
        { $sort: { dayOfWeek: 1, hour: 1 } },
      ])
      .toArray();

    return c.json({ success: true, data: dailyData });
  } catch (error) {
    return c.json(
      {
        success: false,
        message: "Failed to fetch daily patterns",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

// Artist Distribution Chart
app.get("/stats/artist-distribution", verifyToken, async (c) => {
  try {
    const user = c.get("user");
    const userId = user.userId.toString();

    const artistData = await db
      .collection("streaming_records")
      .aggregate([
        { $match: { userId: userId } },
        {
          $group: {
            _id: "$master_metadata_album_artist_name",
            totalHours: { $sum: { $divide: ["$ms_played", 3600000] } },
            streamCount: { $sum: 1 },
          },
        },
        { $sort: { totalHours: -1 } },
        { $limit: 8 },
        {
          $project: {
            artist: "$_id",
            totalHours: { $round: ["$totalHours", 1] },
            streamCount: 1,
            _id: 0,
          },
        },
      ])
      .toArray();

    return c.json({ success: true, data: artistData });
  } catch (error) {
    return c.json(
      {
        success: false,
        message: "Failed to fetch artist distribution",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

// Auth endpoints
app.post("/auth/register", async (c) => {
  try {
    const { username, email, password } = await c.req.json();

    // Check if user exists
    const existingUser = await db.collection("users").findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      return c.json(
        {
          success: false,
          message: "Username or email already exists",
        },
        400
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = {
      username,
      email,
      passwordHash: hashedPassword,
      createdAt: new Date(),
    };

    const result = await db.collection("users").insertOne(user);

    // Generate token
    const token = jwt.sign(
      { userId: result.insertedId, username },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return c.json({
      success: true,
      token,
      user: {
        id: result.insertedId.toString(),
        username,
        email,
      },
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        message: "Registration failed",
      },
      500
    );
  }
});

app.post("/auth/login", async (c) => {
  try {
    const { username, password } = await c.req.json();

    // Find user
    const user = await db.collection("users").findOne({ username });

    if (!user) {
      return c.json(
        {
          success: false,
          message: "Invalid credentials",
        },
        401
      );
    }

    // Check password
    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      return c.json(
        {
          success: false,
          message: "Invalid credentials",
        },
        401
      );
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return c.json({
      success: true,
      token,
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        message: "Login failed",
      },
      500
    );
  }
});

const port = 3000;
console.log(`🚀 Spotilyze API Server is running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});
