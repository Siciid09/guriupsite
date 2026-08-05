import { MetadataRoute } from 'next';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Base URL of your production website
  const baseUrl = 'https://guriup.com'; // Update this if your domain is different

  try {
    // 1. Fetch all dynamic routes concurrently to keep generation fast
    const [hotelsSnap, propertiesSnap] = await Promise.all([
      getDocs(collection(db, 'hotels')),
      getDocs(collection(db, 'property'))
    ]);

    // 2. Map Hotels (View Pages) to Sitemap Format
    const hotelUrls = hotelsSnap.docs.map((doc) => {
      const data = doc.data();
      const slug = data.slug || doc.id;
      return {
        url: `${baseUrl}/hotels/${slug}`,
        lastModified: data.updatedAt?.toDate() || new Date(),
        // Hotels update prices/availability often, so 'daily' encourages faster re-indexing
        changeFrequency: 'daily' as const, 
        priority: 0.8,
      };
    });

    // 3. Map Properties (View Pages) to Sitemap Format
    const propertyUrls = propertiesSnap.docs.map((doc) => {
      const data = doc.data();
      const slug = data.slug || doc.id;
      return {
        url: `${baseUrl}/properties/${slug}`,
        lastModified: data.updatedAt?.toDate() || new Date(),
        // Properties status changes (Sold/Rented), so 'daily' is best here too
        changeFrequency: 'daily' as const,
        priority: 0.8,
      };
    });

    // 4. Define your Core Static Routes (Fully Expanded)
    const staticUrls = [
      {
        url: `${baseUrl}`,
        lastModified: new Date(),
        changeFrequency: 'always' as const, // Homepage changes constantly
        priority: 1.0, // Absolute highest priority
      },
      {
        url: `${baseUrl}/hotels`,
        lastModified: new Date(),
        changeFrequency: 'hourly' as const, // Main directories get new listings constantly
        priority: 0.9, 
      },
      {
        url: `${baseUrl}/properties`,
        lastModified: new Date(),
        changeFrequency: 'hourly' as const, // Main directories get new listings constantly
        priority: 0.9, 
      },
      {
        url: `${baseUrl}/about`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const, // About page rarely changes
        priority: 0.7,
      },
      {
        url: `${baseUrl}/contact`,
        lastModified: new Date(),
        changeFrequency: 'yearly' as const, // Contact info is static
        priority: 0.7,
      },
      {
        url: `${baseUrl}/referrals`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const, // Referral programs might have changing promos
        priority: 0.7,
      },
      {
        url: `${baseUrl}/join/agent`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      },
      {
        url: `${baseUrl}/join/hotel`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      }
    ];

    // 5. Combine and return the massive map to Google
    return [...staticUrls, ...hotelUrls, ...propertyUrls];

  } catch (error) {
    console.error("Error generating sitemap:", error);
    
    // Fallback: If DB fails, serve ALL static routes so Google doesn't drop your ranking
    return [
      { url: baseUrl, lastModified: new Date(), priority: 1.0 },
      { url: `${baseUrl}/hotels`, lastModified: new Date(), priority: 0.9 },
      { url: `${baseUrl}/properties`, lastModified: new Date(), priority: 0.9 },
      { url: `${baseUrl}/about`, lastModified: new Date(), priority: 0.7 },
      { url: `${baseUrl}/contact`, lastModified: new Date(), priority: 0.7 },
      { url: `${baseUrl}/referrals`, lastModified: new Date(), priority: 0.7 },
      { url: `${baseUrl}/join/agent`, lastModified: new Date(), priority: 0.6 },
      { url: `${baseUrl}/join/hotel`, lastModified: new Date(), priority: 0.6 },
    ];
  }
}