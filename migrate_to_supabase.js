require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const { Client } = require('pg');

// 1. Helper to determine PostgreSQL column types from JavaScript data
function getPgType(value) {
  if (value === null || value === undefined) return 'TEXT';
  if (typeof value === 'boolean') return 'BOOLEAN';
  if (typeof value === 'number') {
    return Number.isInteger(value) ? 'BIGINT' : 'DOUBLE PRECISION';
  }
  if (typeof value === 'object') return 'JSONB'; // Handles arrays and objects
  return 'TEXT';
}

async function runMigration() {
  const client = new Client({
    connectionString: process.env.SUPABASE_DB_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to Supabase PostgreSQL.\n');

    console.log('Loading JSON database from my_complete_database.json...');
    const rawData = fs.readFileSync('my_complete_database.json', 'utf8');
    
    // Flattening/Parsing logic
    console.log('Flattening subcollections into independent root arrays...');
    const dbData = JSON.parse(rawData);

    // 2. Loop through every collection (table)
    for (const [tableName, records] of Object.entries(dbData)) {
      console.log(`\nProcessing table: ${tableName}`);

      if (!records || records.length === 0) {
        console.log(`⏭️  Skipping schema for ${tableName} (No sample data to build columns from)`);
        continue;
      }

      // 3. Scan ALL documents in this collection to find every possible column
      const columnDefs = {};
      for (const doc of records) {
        for (const [key, value] of Object.entries(doc)) {
          if (key === '_id') continue; // _id is our primary key
          // Update type if it's currently undefined/null in our definition
          if (!columnDefs[key] && value !== null && value !== undefined) {
            columnDefs[key] = getPgType(value);
          }
        }
      }

      // 4. Create the base table (only applying if it doesn't exist yet)
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS "${tableName}" (
          "_id" TEXT PRIMARY KEY
        );
      `;
      await client.query(createTableQuery);

      // 5. Safely add any missing columns without destroying existing data
      for (const [colName, colType] of Object.entries(columnDefs)) {
        const fallbackType = colType || 'TEXT';
        try {
          await client.query(`ALTER TABLE "${tableName}" ADD COLUMN IF NOT EXISTS "${colName}" ${fallbackType};`);
        } catch (err) {
          console.error(`⚠️ Could not add column "${colName}" to "${tableName}":`, err.message);
        }
      }
      console.log(`✅ Table "${tableName}" schema verified and updated.`);

      // 6. Insert Data with UPSERT (ON CONFLICT) to prevent duplicates
      let successCount = 0;
      let failCount = 0;

      console.log(`⏳ Translating and inserting ${records.length} records into ${tableName}...`);

      for (const doc of records) {
        // Ensure every document has an _id (fallback to 'id', 'uid', or generate one)
        if (!doc._id) {
          doc._id = doc.id || doc.uid || Math.random().toString(36).substring(2, 15);
        }

        const keys = Object.keys(doc);
        const values = Object.values(doc).map(val => 
          (typeof val === 'object' && val !== null) ? JSON.stringify(val) : val
        );

        // Prepare parameterized columns and placeholders ($1, $2, etc.) for SQL injection safety
        const cols = keys.map(k => `"${k}"`).join(', ');
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');

        // Create the ON CONFLICT DO UPDATE logic
        const updateSet = keys
          .filter(k => k !== '_id') // Never overwrite the primary key
          .map(k => `"${k}" = EXCLUDED."${k}"`)
          .join(', ');

        let insertQuery = `INSERT INTO "${tableName}" (${cols}) VALUES (${placeholders})`;
        
        // If the document has more than just an _id, update the existing row with the new data
        if (keys.length > 1) {
          insertQuery += ` ON CONFLICT ("_id") DO UPDATE SET ${updateSet};`;
        } else {
          insertQuery += ` ON CONFLICT ("_id") DO NOTHING;`; // Just skip if it's completely empty
        }

        try {
          await client.query(insertQuery, values);
          successCount++;
        } catch (err) {
          console.error(`❌ Error inserting document ${doc._id} into ${tableName}: ${err.message}`);
          failCount++;
        }
      }

      console.log(`✅ Finished writing ${successCount} active rows into ${tableName}. ${failCount > 0 ? `(Failed: ${failCount})` : ''}`);
    }

    console.log('\n🎉 Supabase Database Migration Complete!');

  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

runMigration();