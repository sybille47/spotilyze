// apps/api/src/tests/testServer.ts
import { spawn, ChildProcessWithoutNullStreams } from "node:child_process";


export async function startApiWithEnv(env: NodeJS.ProcessEnv): Promise<() => Promise<void>> {
  const DEBUG = process.env.VITEST_DEBUG_API === "1";

 
  const cmd = process.execPath;
  
  const args = ["--import", "tsx", "src/index.ts"];

  const child: ChildProcessWithoutNullStreams = spawn(cmd, args, {
    env: { ...process.env, ...env },
    stdio: ["ignore", "pipe", "pipe"],
    cwd: process.cwd(),
  });

  let resolved = false;
  let outBuf = "";
  let errBuf = "";

  const ready = new Promise<void>((resolve, reject) => {
    const onData = (buf: Buffer, isErr = false) => {
      const s = buf.toString();
      if (DEBUG) process.stdout.write(`[api] ${s}`);
      if (isErr) errBuf += s;
      else outBuf += s;

      
      if (!resolved && s.includes("Spotilyze API Server is running")) {
        resolved = true;
        resolve();
      }

      if (s.toLowerCase().includes("failed to connect to mongodb")) {
        reject(
          new Error(
            `API failed to connect to MongoDB\n\nSTDOUT:\n${outBuf}\n\nSTDERR:\n${errBuf}`
          )
        );
      }
    };

    child.stdout.on("data", (b) => onData(b, false));
    child.stderr.on("data", (b) => onData(b, true));

    child.on("exit", (code) => {
      if (DEBUG) console.log(`[api] child exited with code ${code}`);
      if (!resolved) {
        reject(
          new Error(
            `API exited early with code ${code}\n\n=== Captured STDOUT ===\n${outBuf}\n\n=== Captured STDERR ===\n${errBuf}\n`
          )
        );
      }
    });
  });

  await ready;

  return async () => {
    if (!child.killed) {
      try {
        child.kill("SIGTERM");
      } catch {
        
      }
    }
  };
}
