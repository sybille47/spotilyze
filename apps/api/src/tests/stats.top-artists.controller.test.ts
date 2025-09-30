// apps/api/src/tests/stats.top-artists.controller.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient } from "mongodb";
import jwt from "jsonwebtoken";
import { startApiWithEnv } from "./testServer";

let mongod: MongoMemoryServer;
let uri: string;
let client: MongoClient;
let stopServer: () => Promise<void>;

const JWT = `jwt-${Date.now()}`;
const userId = "u1";
const bearer = () => ({
  Authorization: "Bearer " + jwt.sign({ userId }, JWT),
});

describe.sequential("Controller: GET /stats/top-artists (seeded DB)", () => {
  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    uri = mongod.getUri();
    client = await MongoClient.connect(uri);
    const db = client.db("spotilyze");

    await db.collection("streaming_records").insertMany([
      {
        userId,
        uploadId: "x",
        ts: "2024-01-01T00:00:00Z",
        ms_played: 300000,
        master_metadata_track_name: "Song A",
        master_metadata_album_artist_name: "Artist A",
        master_metadata_album_album_name: "Album A",
      },
      {
        userId,
        uploadId: "x",
        ts: "2024-01-02T00:00:00Z",
        ms_played: 180000,
        master_metadata_track_name: "Song B",
        master_metadata_album_artist_name: "Artist B",
        master_metadata_album_album_name: "Album B",
      },
    ]);

    stopServer = await startApiWithEnv({ MONGODB_URI: uri, JWT_SECRET: JWT });
  });

  afterAll(async () => {
    await stopServer?.();
    await client?.close();
    await mongod?.stop();
  });

  it.skip("returns 200 with aggregation data", async () => {
    const res = await fetch("http://localhost:3000/stats/top-artists", {
      headers: bearer(),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data[0]).toHaveProperty("artist");
    expect(body.data[0]).toHaveProperty("totalHours");
  });

  it("401 if no token", async () => {
    const res = await fetch("http://localhost:3000/stats/top-artists");
    expect(res.status).toBe(401);
  });
});
