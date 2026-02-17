import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '../app/providers'; 

const inter = Inter({ subsets: ['latin'] });

// =========================================================
//  GLOBAL SEO CONFIGURATION
// =========================================================
export const metadata: Metadata = {
  // 1. BASE URL (Important for Social Images to work)
  // Replace with your actual domain when you deploy
  metadataBase: new URL('https://guriup.com'), 

  // 2. SMART TITLE TEMPLATE
  // If a page has a title (e.g., "Ambassador Hotel"), it becomes "Ambassador Hotel | GuriUp"
  // If a page has no title, it uses the default.
  title: {
    default: 'GuriUp - Hargeisa Real Estate & Hotels',
    template: '%s | GuriUp', 
  },

  // 3. YOUR CHOSEN DESCRIPTION
  description: "Discover Africa's finest real estate and luxury stays. From bustling cities to coastal retreats, GuriUp is the premier platform to find your dream home or book a weekend getaway across the continent. Buy, rent, and explore with confidence.",

  // 4. KEYWORDS (Helps Google categorize you)
  keywords: ['Real Estate Somaliland', 'Hargeisa Properties', 'Mogadishu Hotels', 'Buy House Africa', 'Rent Apartment Hargeisa', 'GuriUp App'],

  // 5. SOCIAL SHARING (Facebook / WhatsApp / LinkedIn)
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://guriup.com',
    siteName: 'GuriUp',
    images: [
      {
        url: '/images/og-default.jpg', // Make sure you add this image to public/images/
        width: 1200,
        height: 630,
        alt: 'GuriUp Real Estate Platform',
      },
    ],
  },

  // 6. TWITTER CARDS
  twitter: {
    card: 'summary_large_image',
    title: 'GuriUp | Real Estate & Hotels',
    description: "Discover Africa's finest real estate and luxury stays.",
    images: ['/images/og-default.jpg'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50 text-gray-800 flex flex-col min-h-screen`}>
        <Providers>
          {/* GLOBAL FIX: 
              The 'pt-10' (padding-top) pushes content down to clear the fixed Navbar. 
              'flex-1' ensures this section expands to fill space.
          */}
          <main className="flex-1 pt-10 w-full">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}