import { Metadata } from 'next';

// 1. SEO METADATA (Targeting Africa & Global Infrastructure)
export const metadata: Metadata = {
  title: 'About GuriUp | Revolutionizing Real Estate & Hotels in Africa',
  description: 'GuriUp is the premier digital ecosystem connecting travelers to luxury hotels and families to dream homes across East Africa and the world.',
  keywords: 'GuriUp about, East Africa real estate, African hotels booking, property investment Africa, digital infrastructure hospitality, global property network',
  openGraph: {
    title: 'About GuriUp | Revolutionizing Real Estate & Hotels in Africa',
    description: 'The operating system for hotels and real estate across East Africa and the world. Instant booking, verified trust, and digital ownership.',
    type: 'website',
    url: 'https://guriup.com/about', // Update with your actual domain
    siteName: 'GuriUp',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About GuriUp | Revolutionizing Real Estate & Hotels in Africa',
    description: 'The operating system for hotels and real estate across East Africa and the world.',
  },
  alternates: {
    canonical: 'https://guriup.com/about', // SEO: Prevents duplicate content penalties
  }
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 2. SEO JSON-LD: Organization & AboutPage Schema for Google
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    mainEntity: {
      '@type': 'Organization',
      name: 'GuriUp',
      url: 'https://guriup.com',
      logo: 'https://guriup.com/logo.png', // Replace with your actual logo URL
      description: 'The Operating System for Hotels & Real Estate in East Africa and the world.',
      areaServed: [
        { '@type': 'Continent', name: 'Africa' },
        { '@type': 'Place', name: 'Worldwide' }
      ],
      foundingLocation: {
        '@type': 'Place',
        name: 'Somaliland'
      }
    }
  };

  return (
    <>
      {/* Invisible SEO Script for Google Search */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* This renders your completely untouched Client Component */}
      {children}
    </>
  );
}