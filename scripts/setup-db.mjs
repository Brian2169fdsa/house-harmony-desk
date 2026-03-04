/**
 * Setup script: apply all migrations + create storage buckets
 *
 * Usage:
 *   node scripts/setup-db.mjs <DB_PASSWORD>
 *
 * Or set the environment variable:
 *   SUPABASE_DB_PASSWORD=<password> node scripts/setup-db.mjs
 *
 * The DB password can be found in your Supabase project settings under
 * Database → Connection string (the password you set when creating the project).
 */

import { execSync } from "child_process";
import { readdirSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..");
const MIGRATIONS_DIR = join(PROJECT_ROOT, "supabase", "migrations");
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || "ywcaaoakdchfhsydhqbx";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`;

if (!SERVICE_KEY) {
  console.error(
    "ERROR: SUPABASE_SERVICE_ROLE_KEY environment variable is required.\n" +
      "  Set it before running this script:\n" +
      "  SUPABASE_SERVICE_ROLE_KEY=<key> node scripts/setup-db.mjs [DB_PASSWORD]\n\n" +
      "  Find the service_role key in your Supabase project settings under API."
  );
  process.exit(1);
}

const dbPassword = process.argv[2] || process.env.SUPABASE_DB_PASSWORD;

async function createStorageBuckets() {
  const buckets = [
    { id: "maintenance-attachments", name: "maintenance-attachments", public: true },
    { id: "resident-documents", name: "resident-documents", public: true },
  ];

  for (const bucket of buckets) {
    const res = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
      method: "POST",
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: bucket.id,
        name: bucket.name,
        public: bucket.public,
        file_size_limit: 52428800, // 50MB
        allowed_mime_types: null,
      }),
    });

    const data = await res.json();
    if (res.ok) {
      console.log(`✓ Created bucket: ${bucket.id}`);
    } else if (data?.error === "Bucket already exists") {
      console.log(`- Bucket already exists: ${bucket.id}`);
    } else {
      console.error(`✗ Failed to create bucket ${bucket.id}:`, data);
    }
  }
}

async function applyMigrations(password) {
  const migrationFiles = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const dbUrl = `postgresql://postgres:${encodeURIComponent(password)}@db.${PROJECT_REF}.supabase.co:5432/postgres`;

  for (const file of migrationFiles) {
    const sqlPath = join(MIGRATIONS_DIR, file);
    console.log(`Applying migration: ${file}`);
    try {
      execSync(`psql "${dbUrl}" -f "${sqlPath}"`, { stdio: "inherit" });
      console.log(`✓ Applied: ${file}`);
    } catch (err) {
      console.error(`✗ Failed: ${file}`);
      // Continue with other migrations
    }
  }
}

async function main() {
  console.log("=== House Harmony Desk — DB Setup ===\n");

  // Always try to create storage buckets (works with service role key)
  console.log("Creating storage buckets…");
  await createStorageBuckets();
  console.log();

  if (!dbPassword) {
    console.log(
      "⚠️  No DB password provided. Skipping SQL migrations.\n" +
        "   To apply migrations, run:\n" +
        "   node scripts/setup-db.mjs <YOUR_DB_PASSWORD>\n\n" +
        "   Or paste the SQL files from supabase/migrations/ into\n" +
        "   the Supabase dashboard SQL editor manually."
    );
    return;
  }

  console.log("Applying SQL migrations…");
  await applyMigrations(dbPassword);
  console.log("\n✓ Setup complete");
}

main().catch((err) => {
  console.error("Setup failed:", err);
  process.exit(1);
});
