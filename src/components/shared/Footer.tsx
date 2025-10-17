import React from 'react';
import Link from 'next/link';
import { Building, Facebook, Twitter, Instagram } from 'lucide-react';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-6 py-16">
        <div className="flex flex-wrap justify-between gap-12 text-center md:text-left">
          <div className="w-full md:w-1/4">
            <h3 className="text-3xl font-bold text-white mb-4 font-sans flex items-center gap-2 justify-center md:justify-start">
              <Building /> GuriUp
            </h3>
            <p className="text-gray-400 text-sm">
              Your one-stop platform for finding properties and hotels in Hargeisa, Somaliland.
            </p>
          </div>

          <div className="flex flex-wrap justify-center md:justify-end gap-12 w-full md:w-auto text-sm">
            <div>
              <h4 className="font-bold text-white mb-4">Company</h4>
              <ul className="space-y-2">
                <li><Link href="/about" className="hover:text-white">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
                <li><Link href="/terms" className="hover:text-white">Terms & Conditions</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Sitemap</h4>
              <ul className="space-y-2">
                <li><Link href="/" className="hover:text-white">Home</Link></li>
                <li><Link href="/properties" className="hover:text-white">Properties</Link></li>
                <li><Link href="/hotels" className="hover:text-white">Hotels</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Follow Us</h4>
              <div className="flex justify-center md:justify-start space-x-4">
                <a href="#" className="text-gray-400 hover:text-white" aria-label="Facebook"><Facebook size={20}/></a>
                <a href="#" className="text-gray-400 hover:text-white" aria-label="Twitter"><Twitter size={20}/></a>
                <a href="#" className="text-gray-400 hover:text-white" aria-label="Instagram"><Instagram size={20}/></a>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-16 border-t border-gray-800 pt-8 text-center text-gray-500 text-sm">
          <p>&copy; {year} GuriUp. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}