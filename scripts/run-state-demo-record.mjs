#!/usr/bin/env node
/**
 * Build production app, record state portal demo video with Playwright (npm only).
 * Output: e2e/results/.../video.webm and e2e/demo/state-portal-demo.webm
 */
import { spawn } from "node:child_process";
import { copyFileSync, mkdirSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      stdio: "inherit",
      shell: false,
      ...options,
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`));
    });
  });
}

function findLatestVideo(dir) {
  let newest = null;
  let newestTime = 0;

  function walk(current) {
    for (const entry of readdirSync(current)) {
      const full = path.join(current, entry);
      const stats = statSync(full);
      if (stats.isDirectory()) {
        walk(full);
      } else if (entry === "video.webm" && stats.mtimeMs > newestTime) {
        newest = full;
        newestTime = stats.mtimeMs;
      }
    }
  }

  walk(dir);
  return newest;
}

async function main() {
  console.log("\n=== Khel Setu state portal demo recorder ===\n");

  mkdirSync(path.join(root, "e2e", "demo", "downloads"), { recursive: true });

  if (process.env.DEMO_FRESH_SEED === "1") {
    console.log("→ npm run db:seed (DEMO_FRESH_SEED=1)");
    await run("npm", ["run", "db:seed"]);
  }

  console.log("→ npm run build");
  await run("npm", ["run", "build"]);

  console.log("\n→ npx playwright test e2e/state-portal-demo.spec.ts");
  await run("npx", ["playwright", "test", "e2e/state-portal-demo.spec.ts"], {
    env: { ...process.env },
  });

  const resultsDir = path.join(root, "e2e", "results");
  const latestVideo = findLatestVideo(resultsDir);
  if (latestVideo) {
    const outDir = path.join(root, "e2e", "demo");
    mkdirSync(outDir, { recursive: true });
    const dest = path.join(outDir, "state-portal-demo.webm");
    copyFileSync(latestVideo, dest);
    console.log(`\n✓ Demo video saved to ${dest}`);
  } else {
    console.warn("\n⚠ No video.webm found under e2e/results — check test output.");
  }

  console.log("\nDone.\n");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
