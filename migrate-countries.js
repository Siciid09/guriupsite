import 'dotenv/config';
import fs from 'fs';
import pkg from 'pg';
const { Client } = pkg;

async function migrateCountries() {
  const client = new Client({
    connectionString: process.env.SUPABASE_DB_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to Supabase PostgreSQL.');

    console.log('Loading countries.json...');
    const rawData = fs.readFileSync('countries.json', 'utf8');
    const countries = JSON.parse(rawData);

    // Create table with _id and JSONB support for nested arrays (cities/districts)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "countries" (
        "_id" TEXT PRIMARY KEY,
        "name" TEXT,
        "cities" JSONB
      );
    `);
    console.log('✅ Table "countries" schema verified.');

    let successCount = 0;
    for (const country of countries) {
      const query = `
        INSERT INTO "countries" ("_id", "name", "cities")
        VALUES ($1, $2, $3)
        ON CONFLICT ("_id") 
        DO UPDATE SET "name" = EXCLUDED."name", "cities" = EXCLUDED."cities";
      `;
      
      const values = [
        country._id || country.id,
        country.name || null,
        country.cities ? JSON.stringify(country.cities) : null
      ];

      await client.query(query, values);
      successCount++;
    }

    console.log(`✅ Successfully migrated ${successCount} country records into Supabase PostgreSQL.`);

  } catch (err) {
    console.error('❌ Country migration failed:', err.message);
  } finally {
    await client.end();
  }
}

migrateCountries();