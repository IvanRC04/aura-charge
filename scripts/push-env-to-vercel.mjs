#!/usr/bin/env node
// Pushes selected vars from root .env.local to the currently-linked Vercel project.
// Usage: node scripts/push-env-to-vercel.mjs [--target production|preview|development]
//        [--keys "DATABASE_URL,UPSTASH_REDIS_REST_URL,..."]
import { execSync, spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(root, ".env.local");

if (!existsSync(envPath)) {
  console.error("[push-env] .env.local no existe en la raíz.");
  process.exit(1);
}

// Parse args
const args = process.argv.slice(2);
const targetIdx = args.indexOf("--target");
const target = targetIdx >= 0 ? args[targetIdx + 1] : "production";
const keysIdx = args.indexOf("--keys");
const onlyKeys = keysIdx >= 0 ? args[keysIdx + 1].split(",").map((k) => k.trim()) : null;

// Simple .env parser
const env = {};
for (const rawLine of readFileSync(envPath, "utf8").split(/\r?\n/)) {
  const line = rawLine.trim();
  if (!line || line.startsWith("#")) continue;
  const eq = line.indexOf("=");
  if (eq < 0) continue;
  const key = line.slice(0, eq).trim();
  let value = line.slice(eq + 1).trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  if (value.length === 0) continue;
  env[key] = value;
}

const allKeys = Object.keys(env);
const keysToPush = (onlyKeys ?? allKeys).filter((k) => env[k]);

if (keysToPush.length === 0) {
  console.error("[push-env] No hay keys con valor en .env.local");
  process.exit(1);
}

console.log(`[push-env] target=${target} · ${keysToPush.length} keys`);

for (const key of keysToPush) {
  const value = env[key];
  // Remove existing var first (silently) so add doesn't conflict
  spawnSync("vercel", ["env", "rm", key, target, "--yes"], {
    stdio: ["ignore", "ignore", "ignore"],
    shell: true,
  });
  // Add the new value via stdin so it never appears on argv
  const result = spawnSync("vercel", ["env", "add", key, target], {
    input: value,
    stdio: ["pipe", "inherit", "inherit"],
    shell: true,
  });
  if (result.status !== 0) {
    console.error(`[push-env] FAILED key=${key}`);
    process.exit(result.status ?? 1);
  }
  console.log(`[push-env] ✓ ${key}`);
}

console.log("[push-env] done");
