#!/usr/bin/env node
/**
 * Migration runner for house-harmony-desk
 * Usage: DB_URL="postgresql://postgres.ywcaaoakdchfhsydhqbx:PASSWORD@aws-0-us-west-2.pooler.supabase.com:6543/postgres" node scripts/run-migrations.js
 *
 * Get your DB password from: Supabase Dashboard > Project Settings > Database > Connection string
 */
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const DB_URL = process.env.DB_URL;
if (!DB_URL) {
  console.error('Error: DB_URL environment variable is required.');
  console.error('Example: DB_URL="postgresql://postgres.ywcaaoakdchfhsydhqbx:YOUR_PASSWORD@aws-0-us-west-2.pooler.supabase.com:6543/postgres" node scripts/run-migrations.js');
  process.exit(1);
}

const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

async function run() {
  const client = new Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('Connected to database.');

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    console.log(`Running migration: ${file} ...`);
    try {
      await client.query(sql);
      console.log(`  ✓ ${file}`);
    } catch (err) {
      if (err.message.includes('already exists') || err.message.includes('duplicate')) {
        console.log(`  ~ ${file} (skipped - already applied)`);
      } else {
        console.error(`  ✗ ${file}: ${err.message}`);
        // Continue with other migrations
      }
    }
  }

  await client.end();
  console.log('Done.');
}

run().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
