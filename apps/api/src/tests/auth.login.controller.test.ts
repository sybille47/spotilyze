// apps/api/src/tests/auth.login.controller.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";
import { startApiWithEnv } from "./testServer";

let mongod: MongoMemoryServer;
let uri: string;
let client: MongoClient;
let stopServer: () => Promise<void>;

const JWT = `jwt-${Date.now()}`;

describe.sequential("Controller: POST /auth/login (seeded DB)", () => {
  beforeAll(async () => {
    
    mongod = await MongoMemoryServer.create();
    uri = mongod.getUri();
    client = await MongoClient.connect(uri);
    const db = client.db("spotilyze");

    
    const passwordHash = await bcrypt.hash("pw", 12);
    await db.collection("users").insertOne({
      
      username: "alice",
      email: "a@a.com",
      passwordHash,
      createdAt: new Date(),
    });

    
    stopServer = await startApiWithEnv({
      MONGODB_URI: uri,
      JWT_SECRET: JWT,
      VITEST_DEBUG_API: process.env.VITEST_DEBUG_API ?? "", 
    });
  });

  afterAll(async () => {
    await stopServer?.();
    await client?.close();
    await mongod?.stop();
  });

  it.skip("returns 200 with token on valid credentials", async () => {
    const res = await fetch("http://localhost:3000/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username: "alice", password: "pw" }),
    });

    
    if (process.env.VITEST_DEBUG_API === "1") {
      const text = await res.clone().text();
      console.log("[test] /auth/login status:", res.status, "body:", text);
    }

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.token).toBeTypeOf("string");
    expect(body.user?.username).toBe("alice");
  });

  it("returns 401 when user not found", async () => {
    const res = await fetch("http://localhost:3000/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username: "ghost", password: "pw" }),
    });

    if (process.env.VITEST_DEBUG_API === "1") {
      const text = await res.clone().text();
      console.log("[test] /auth/login (ghost) status:", res.status, "body:", text);
    }

    expect(res.status).toBe(401);
  });
});
