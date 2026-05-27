#!/usr/bin/env node
// Copia .env.local de la raíz a apps/web, apps/crm y packages/db
// para que Next + drizzle-kit + tsx (seed) lo vean.
import { copyFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const src = resolve(root, ".env.local");

if (!existsSync(src)) {
  console.error("[sync-env] No existe .env.local en la raíz. Cópialo de .env.example y rellénalo.");
  process.exit(1);
}

const targets = [
  resolve(root, "apps/web/.env.local"),
  resolve(root, "apps/crm/.env.local"),
  resolve(root, "packages/db/.env.local"),
];

for (const t of targets) {
  copyFileSync(src, t);
  console.log("[sync-env] →", t.replace(root + "\\", "").replace(root + "/", ""));
}

console.log("[sync-env] OK");
