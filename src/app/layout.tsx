import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '../app/providers'; 

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'GuriUp - Hargeisa Real Estate',
  description: 'Find your perfect property or hotel in Hargeisa.',
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
            The 'pt-24' (padding-top: 6rem/96px) pushes ALL page content down 
            so it clears your fixed Navbar. 
            
            'flex-1' ensures this section expands to fill space (good for footers).
          */}
          <main className="flex-1 pt-10 w-full">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}