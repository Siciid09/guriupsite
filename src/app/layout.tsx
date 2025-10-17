import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '../app/providers'; // Correctly import the Providers component

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
          {children}
        </Providers>
      </body>
    </html>
  );
}