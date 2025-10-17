'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Building, Menu, X } from 'lucide-react';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Prevent scrolling when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/properties', label: 'Properties' },
    { href: '/hotels', label: 'Hotels' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
  ];

  return (
    <header className="bg-white/80 backdrop-blur-lg sticky top-0 z-50 transition-all duration-300 shadow-sm">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-3xl font-bold text-[#0164E5] font-sans flex items-center gap-2">
            <Building /> GuriUp
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8 text-sm font-medium text-gray-700">
            {navLinks.map((link) => (
              <Link key={link.label} href={link.href} className="relative group">
                <span>{link.label}</span>
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#0164E5] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out"></span>
              </Link>
            ))}
          </nav>

          <div className="flex items-center space-x-3">
            <Link href="/properties" className="hidden md:inline-block bg-[#0164E5] text-white px-5 py-2.5 rounded-full font-semibold hover:bg-blue-700 transition-all duration-300 shadow text-sm">
              Book Now
            </Link>
            <button
              className="lg:hidden text-gray-700 z-50"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`lg:hidden fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMenuOpen(false)}
      ></div>
      <div
        className={`lg:hidden fixed top-0 right-0 h-full w-72 bg-white z-40 shadow-lg transform transition-transform duration-300 ease-in-out ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <nav className="flex flex-col items-start p-8 pt-20">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setIsMenuOpen(false)}
              className="py-3 text-gray-700 font-medium text-lg w-full hover:text-[#0164E5]"
            >
              {link.label}
            </Link>
          ))}
          <div className="flex flex-col space-y-3 mt-6 w-full">
            <Link
              href="/properties"
              onClick={() => setIsMenuOpen(false)}
              className="bg-[#0164E5] text-white px-5 py-3 rounded-full font-semibold text-sm text-center"
            >
              Book Now
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}