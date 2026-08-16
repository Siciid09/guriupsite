const admin = require('firebase-admin');
const fs = require('fs');

const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function backup() {
  console.log('Fetching countries and nested cities...');
  let result = {};
  const countries = await db.collection('countries').get();
  
  for (let c of countries.docs) {
    result[c.id] = c.data();
    result[c.id].cities = {};
    
    // Fetch the nested 'cities' subcollection for each country
    const cities = await db.collection('countries/' + c.id + '/cities').get();
    cities.forEach(city => {
      result[c.id].cities[city.id] = city.data();
    });
  }
  
  fs.writeFileSync('countries_backup.json', JSON.stringify(result, null, 2));
  console.log('? Success! Data saved to countries_backup.json');
}
backup().catch(console.error);
