// apps/api/src/tests/auth.integration.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { startApiWithEnv } from "./testServer";
import jwt from "jsonwebtoken";

let mongod: MongoMemoryServer;
let uri: string;
let stopServer: () => Promise<void>;
const JWT = `jwt-${Date.now()}`;

describe.sequential("Integration: auth register -> login", () => {
  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    uri = mongod.getUri();
    stopServer = await startApiWithEnv({ MONGODB_URI: uri, JWT_SECRET: JWT });
  });

  afterAll(async () => {
    await stopServer?.();
    await mongod?.stop();
  });

  it("registers then logs in", async () => {
    const uname = `bob_${Math.random().toString(36).slice(2)}`;
    const email = `${uname}@example.com`;

    const r1 = await fetch("http://localhost:3000/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username: uname, email, password: "pw" }),
    });
    expect(r1.status).toBe(200);
    const body1 = await r1.json();
    expect(body1.success).toBe(true);
    expect(body1.token).toBeTypeOf("string");

    const r2 = await fetch("http://localhost:3000/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username: uname, password: "pw" }),
    });
    expect(r2.status).toBe(200);
    const body2 = await r2.json();
    expect(body2.success).toBe(true);
    expect(body2.token).toBeTypeOf("string");
  });
});
