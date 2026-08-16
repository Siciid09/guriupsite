// scripts/export-countries.js
//
// Exports the Firestore 'countries' collection (with its 'cities' and
// 'districts' subcollections) to a plain JSON file, using the SAME
// firebase-admin credentials already configured in app/lib/firebase-admin.ts
// (FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY).
//
// Run from your Next.js project root:
//   node scripts/export-countries.js
//
// Output: scripts/countries-export.json

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Load .env.local manually since this runs outside Next.js's own env loader
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

async function exportCountries() {
  console.log('🔵 Reading countries collection...');
  const countriesSnap = await db.collection('countries').get();

  const result = { countries: [] };

  for (const countryDoc of countriesSnap.docs) {
    const countryData = countryDoc.data();
    console.log(`  → ${countryDoc.id} (${countryData.name || 'no name field'})`);

    const country = {
      _id: countryDoc.id,
      name: countryData.name || countryDoc.id,
      cities: [],
    };

    const citiesSnap = await db
      .collection('countries')
      .doc(countryDoc.id)
      .collection('cities')
      .get();

    for (const cityDoc of citiesSnap.docs) {
      const cityData = cityDoc.data();
      console.log(`      ↳ ${cityDoc.id} (${cityData.name || 'no name field'})`);

      const city = {
        _id: cityDoc.id,
        name: cityData.name || cityDoc.id,
        districts: [],
      };

      const districtsSnap = await db
        .collection('countries')
        .doc(countryDoc.id)
        .collection('cities')
        .doc(cityDoc.id)
        .collection('districts')
        .get();

      for (const districtDoc of districtsSnap.docs) {
        const districtData = districtDoc.data();
        city.districts.push({
          _id: districtDoc.id,
          name: districtData.name || districtDoc.id,
        });
      }

      country.cities.push(city);
    }

    result.countries.push(country);
  }

  const outPath = path.resolve(process.cwd(), 'scripts', 'countries-export.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2));

  const totalCities = result.countries.reduce((n, c) => n + c.cities.length, 0);
  const totalDistricts = result.countries.reduce(
    (n, c) => n + c.cities.reduce((m, ci) => m + ci.districts.length, 0),
    0
  );

  console.log('');
  console.log('🟢 Export complete:', outPath);
  console.log(`   Countries: ${result.countries.length}`);
  console.log(`   Cities: ${totalCities}`);
  console.log(`   Districts: ${totalDistricts}`);
}

exportCountries()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('🔴 Export failed:', err);
    process.exit(1);
  });
