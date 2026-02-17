import { Metadata } from 'next';
import { 
  getFeaturedProperties, 
  getLatestProperties, 
  getFeaturedHotels, 
  getLatestHotels 
} from '../lib/data';
import HomeUI from '@/components/HomeUI';

// =========================================================
// 1. SEO METADATA (Your Manually Adjusted Version)
// =========================================================
export const metadata: Metadata = {
  title: "GuriUp | Buy, Rent & Book Properties Across Africa",
  description:
    "The #1 Platform for Real Estate & Hotels Across Africa. Find houses, apartments, villas for sale or rent, and book luxury hotels instantly.",
  keywords: [
    "GuriUp", "GuriApp", "Guri Up",
    "Real Estate Africa", "Property Listings Africa", "Buy House Africa", "Rent Apartment Africa",
    "Villas for Sale Africa", "Apartments for Rent Africa", "Hotels Africa", "Hotel Booking Africa",
    "Luxury Hotels Africa", "Somaliland Real Estate", "Somalia Property", "Somali Real Estate",
    "Hargeisa Real Estate", "Berbera Real Estate", "Mogadishu Real Estate", "Muqdisho Real Estate",
    "Jigjiga Real Estate", "Ethiopia Property", "East Africa Real Estate", "Kenya Real Estate",
    "Uganda Property", "Tanzania Real Estate", "Djibouti Property",
  ],
  authors: [{ name: "GuriUp Team" }],
  metadataBase: new URL("https://guriup.com"),

  openGraph: {
    title: 'GuriUp | The Best Real Estate & Hotel App',
    description: "Discover African's finest real estate and luxury stays. From bustling cities to coastal retreats, GuriUp is the premier platform to find your dream home or book a weekend getaway across the continent. Buy, rent, and explore with confidence. Download the GuriUp app today.",
    url: 'https://guriup.com',
    siteName: 'GuriUp',
    images: [
      {
        url: '/images/og-home.jpg',
        width: 1200,
        height: 630,
        alt: 'GuriUp Platform Preview',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'GuriUp | Real Estate & Hotels',
    description: 'Buy, Rent, and Book with GuriUp in Somaliland.',
    images: ['/images/og-home.jpg'],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

// =========================================================
// 2. MAIN PAGE COMPONENT
// =========================================================
export default async function HomePage() {
  // Fetch dynamic data from your updated lib/data.ts
  const [
    featuredProperties,
    latestProperties,
    featuredHotels,
    latestHotels,
  ] = await Promise.all([
    getFeaturedProperties(),
    getLatestProperties(),
    getFeaturedHotels(),
    getLatestHotels(),
  ]);

  // 3. STRUCTURED DATA (JSON-LD)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: 'GuriUp',
    image: 'https://guriup.com/images/og-home.jpg',
    description: 'The leading real estate and hotel booking platform in Somaliland.',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Road 1, Jigjiga Yar',
      addressLocality: 'Hargeisa',
      addressCountry: 'SO'
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 9.562385,
      longitude: 44.077011
    },
    url: 'https://guriup.com',
    telephone: '+252653227084',
    priceRange: '$$',
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        opens: '08:00',
        closes: '22:00'
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <HomeUI 
        featuredProperties={featuredProperties as any} 
        featuredHotels={featuredHotels as any} 
        latestProperties={latestProperties as any} 
        latestHotels={latestHotels as any} 
      />
    </>
  );
}