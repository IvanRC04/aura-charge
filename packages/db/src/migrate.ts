import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL missing");
  const sql = neon(url);
  const db = drizzle(sql);
  await migrate(db, { migrationsFolder: path.join(__dirname, "..", "migrations") });
  console.log("Migrations applied.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
