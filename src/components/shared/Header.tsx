'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { onAuthStateChanged, User, signOut } from 'firebase/auth'; // Added signOut
// Update the import path below if your firebase config is in a different location, e.g. '../../lib/firebase'
import { auth } from '@/app/lib/firebase';

const Header = () => {
  const pathname = usePathname();
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  
  // --- AUTH STATE ---
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const toggleNav = () => {
    setIsNavOpen(!isNavOpen);
  };

  // --- AUTH LISTENER ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- SIGN OUT HANDLER ---
  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  // --- SCROLL DETECTION LOGIC ---
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY < 50) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Helper to handle the download link
  const handleDownloadClick = () => {
    window.open('https://apps.hiigsitech.com/', '_blank');
  };

  // Helper for Desktop Active Class
  const getLinkClass = (path: string) => {
    return pathname === path 
      ? "text-[#0065eb] nav-link" 
      : "nav-link hover:text-white transition-colors";
  };

  return (
    <>
      <style jsx>{`
        /* Custom Hover Underline Effect */
        .nav-link { position: relative; font-weight: 700; font-size: 16.5px; letter-spacing: 0.3px; }
        .nav-link::after {
          content: '';
          position: absolute;
          width: 0;
          height: 4px; /* Thick line */
          bottom: -6px;
          left: 0;
          background-color: #0065eb;
          transition: width 0.3s ease;
          border-radius: 2px;
        }
        .nav-link:hover::after { width: 100%; }
      `}</style>

      {/* --- MOBILE NAV OVERLAY --- */}
      <div className={`fixed inset-0 bg-[#0a0c10]/98 backdrop-blur-xl z-[9999] flex flex-col justify-center transition-transform duration-500 ${isNavOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="absolute top-8 right-8 cursor-pointer" onClick={toggleNav}>
          <div className="text-white/50 hover:text-white font-bold uppercase text-xs tracking-widest">Close</div>
        </div>
        <div className="pl-8 md:pl-12 flex flex-col space-y-4">
          <span className="text-[#0065eb] font-bold text-sm tracking-widest uppercase mb-4">Menu</span>
          {[
            { name: 'Home', href: '/' },
            { name: 'Hotels', href: '/hotels' },
            { name: 'Agents', href: '/agents' },
            { name: 'Referrals', href: '/referral' },
            // Mobile Auth Links
            ...(user 
              ? [{ name: 'Dashboard', href: '/dashboard' }] 
              : [{ name: 'Log In', href: '/login' }]
            ),
          ].map((item) => (
            <Link 
              key={item.name} 
              href={item.href} 
              onClick={toggleNav}
              className={`text-4xl md:text-6xl font-black transition-all duration-300 ${pathname === item.href ? 'text-[#0065eb] stroke-none' : 'text-transparent stroke-white hover:text-[#0065eb]'}`}
              style={pathname === item.href ? {} : { WebkitTextStroke: '1px rgba(255,255,255,0.5)' }}
            >
              {item.name}
            </Link>
          ))}
          {/* Mobile Logout Button */}
          {user && (
            <button 
              onClick={() => { handleSignOut(); toggleNav(); }}
              className="text-left text-4xl md:text-6xl font-black text-red-500 transition-all duration-300"
              style={{ WebkitTextStroke: '1px rgba(239,68,68,0.5)' }}
            >
              Log Out
            </button>
          )}
          <button 
            onClick={handleDownloadClick}
            className="text-left text-4xl md:text-6xl font-black text-[#0065eb] transition-all duration-300"
          >
            Download App
          </button>
        </div>
      </div>

      {/* --- MAIN NAVBAR --- */}
      <header 
        className={`fixed top-0 left-0 w-full z-50 transition-transform duration-300 ease-in-out ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}
      >
        <div className="w-full bg-[#0a0c10]/60 backdrop-blur-xl border-b border-white/10">
            <nav className="max-w-[1600px] mx-auto px-4 md:px-10 flex justify-between items-center py-3">
                
                {/* LOGO */}
                <Link href="/" className="cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-1">
                    <img src="/android-chrome-512x512.png" alt="GuriUp" className="h-9 md:h-11 w-auto" />
                    <span className="text-white font-black text-xl md:text-2xl tracking-tight">GuriUp</span>
                </Link>

                {/* DESKTOP LINKS */}
                <div className="hidden lg:flex gap-8 font-bold text-gray-300">
                  <Link href="/" className={getLinkClass('/')}>Home</Link>
                  <Link href="/properties" className={getLinkClass('/properties')}>Properties</Link>
                  <Link href="/hotels" className={getLinkClass('/hotels')}>Hotels</Link>
                  <Link href="/agents" className={getLinkClass('/agents')}>Agents</Link>
                  <Link href="/contact" className={getLinkClass('/contact')}>Contact</Link>
                  <Link href="/about" className={getLinkClass('/about')}>About</Link>
                  <Link href="/referral" className={getLinkClass('/referral')}>Referrals</Link>
                </div>

                {/* AUTH BUTTONS (CONDITIONAL) */}
                <div className="flex items-center gap-2 md:gap-4">
                  
                  {!loading && user ? (
                    // --- LOGGED IN STATE ---
                    <div className="flex items-center gap-4">
                      <Link href="/dashboard" className="hidden md:flex items-center gap-2 text-white font-bold hover:text-[#0065eb] transition-colors nav-link">
                          Dashboard
                      </Link>
                      <Link href="/dashboard">
                        <div className="w-9 h-9 rounded-full bg-[#0065eb] flex items-center justify-center text-white font-bold border-2 border-white/20 cursor-pointer">
                           {user.photoURL ? (
                             <img src={user.photoURL} alt="User" className="w-full h-full rounded-full object-cover" />
                           ) : (
                             user.displayName ? user.displayName[0].toUpperCase() : 'U'
                           )}
                        </div>
                      </Link>
                      {/* Logout Icon Button */}
                      <button 
                        onClick={handleSignOut}
                        className="text-white/70 hover:text-red-500 transition-colors p-2"
                        title="Sign Out"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                          <polyline points="16 17 21 12 16 7"></polyline>
                          <line x1="21" y1="12" x2="9" y2="12"></line>
                        </svg>
                      </button>
                    </div>
                  ) : (
                    // --- GUEST STATE ---
                    <>
                      <Link href="/login" className="text-white text-sm font-bold hidden md:block hover:text-[#0065eb] transition-colors">Log In</Link>
                      <div className="flex items-center gap-2">
                        <Link href="/signup">
                          <button className="hidden md:block bg-white/10 text-white rounded-full px-6 py-2.5 text-[14px] font-bold hover:bg-white hover:text-black transition-all backdrop-blur-sm border border-white/10">
                            Sign Up
                          </button>
                        </Link>
                      </div>
                    </>
                  )}
                  
                  {/* DOWNLOAD BUTTON (ALWAYS VISIBLE) */}
                  <button 
                    onClick={handleDownloadClick}
                    className="bg-[#0065eb] text-white rounded-full px-3 py-1.5 md:px-5 md:py-2.5 text-xs md:text-[14px] font-bold hover:bg-[#0052c1] transition-all flex items-center gap-1 shadow-lg shadow-blue-500/20"
                  >
                    Download
                    <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
                  </button>
                  
                  {/* MOBILE HAMBURGER */}
                  <div className="lg:hidden cursor-pointer p-1" onClick={toggleNav}>
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                  </div>
                </div>
            </nav>
        </div>
      </header>
    </>
  );
};

export default Header;