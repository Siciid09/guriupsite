import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import fs from 'fs';
import pkg from 'pg';
const { Client } = pkg;

async function flattenRelations() {
  const client = new Client({
    connectionString: process.env.SUPABASE_DB_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to Supabase PostgreSQL.');

    console.log('Reading my_complete_database.json...');
    const rawData = fs.readFileSync('my_complete_database.json', 'utf8');
    const dbData = JSON.parse(rawData);

    const hotels = dbData.hotels || [];
    console.log(`Found ${hotels.length} hotels to scan for rooms and restaurants.\n`);

    // 1. Create clean standalone tables with foreign key constraints
    await client.query(`
      CREATE TABLE IF NOT EXISTS "rooms" (
        "_id" TEXT PRIMARY KEY,
        "hotelId" TEXT
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "restaurants" (
        "_id" TEXT PRIMARY KEY,
        "hotelId" TEXT
      );
    `);

    let roomCount = 0;
    let restaurantCount = 0;

    // 2. Loop through hotels and extract nested arrays
    for (const hotel of hotels) {
      const hotelId = hotel._id;
      if (!hotelId) continue;

      // Process Rooms
      if (Array.isArray(hotel.rooms) && hotel.rooms.length > 0) {
        for (const room of hotel.rooms) {
          if (!room._id) {
            room._id = room.id || Math.random().toString(36).substring(2, 15);
          }
          room.hotelId = hotelId; // Bind foreign key

          const keys = Object.keys(room);
          const values = Object.values(room).map(val => 
            (typeof val === 'object' && val !== null) ? JSON.stringify(val) : val
          );

          // Dynamically add columns if missing
          for (const key of keys) {
            if (key === '_id') continue;
            const val = room[key];
            let pgType = 'TEXT';
            if (typeof val === 'boolean') pgType = 'BOOLEAN';
            if (typeof val === 'number') pgType = Number.isInteger(val) ? 'BIGINT' : 'DOUBLE PRECISION';
            if (typeof val === 'object') pgType = 'JSONB';

            try {
              await client.query(`ALTER TABLE "rooms" ADD COLUMN IF NOT EXISTS "${key}" ${pgType};`);
            } catch (e) {}
          }

          const cols = keys.map(k => `"${k}"`).join(', ');
          const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
          const updateSet = keys.filter(k => k !== '_id').map(k => `"${k}" = EXCLUDED."${k}"`).join(', ');

          const query = `
            INSERT INTO "rooms" (${cols}) VALUES (${placeholders})
            ON CONFLICT ("_id") DO UPDATE SET ${updateSet};
          `;

          await client.query(query, values);
          roomCount++;
        }
      }

      // Process Restaurants
      if (Array.isArray(hotel.restaurants) && hotel.restaurants.length > 0) {
        for (const rest of hotel.restaurants) {
          if (!rest._id) {
            rest._id = rest.id || Math.random().toString(36).substring(2, 15);
          }
          rest.hotelId = hotelId; // Bind foreign key

          const keys = Object.keys(rest);
          const values = Object.values(rest).map(val => 
            (typeof val === 'object' && val !== null) ? JSON.stringify(val) : val
          );

          for (const key of keys) {
            if (key === '_id') continue;
            const val = rest[key];
            let pgType = 'TEXT';
            if (typeof val === 'boolean') pgType = 'BOOLEAN';
            if (typeof val === 'number') pgType = Number.isInteger(val) ? 'BIGINT' : 'DOUBLE PRECISION';
            if (typeof val === 'object') pgType = 'JSONB';

            try {
              await client.query(`ALTER TABLE "restaurants" ADD COLUMN IF NOT EXISTS "${key}" ${pgType};`);
            } catch (e) {}
          }

          const cols = keys.map(k => `"${k}"`).join(', ');
          const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
          const updateSet = keys.filter(k => k !== '_id').map(k => `"${k}" = EXCLUDED."${k}"`).join(', ');

          const query = `
            INSERT INTO "restaurants" (${cols}) VALUES (${placeholders})
            ON CONFLICT ("_id") DO UPDATE SET ${updateSet};
          `;

          await client.query(query, values);
          restaurantCount++;
        }
      }
    }

    console.log(`🎉 Flattening Complete!`);
    console.log(`- Extracted ${roomCount} rows into the "rooms" table.`);
    console.log(`- Extracted ${restaurantCount} rows into the "restaurants" table.`);

  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

flattenRelations();