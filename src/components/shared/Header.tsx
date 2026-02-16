'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { onAuthStateChanged, User, signOut } from 'firebase/auth'; 
import { auth } from '@/app/lib/firebase';
// 1. ADD THIS IMPORT
import { LogOut } from 'lucide-react';

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
      toggleNav(); // Close mobile menu if open
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  // --- SCROLL DETECTION (Show UP, Hide DOWN) ---
  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // If scrolling DOWN and not at the very top -> HIDE
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsVisible(false);
      } 
      // If scrolling UP or at the top -> SHOW
      else {
        setIsVisible(true);
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleDownloadClick = () => {
    window.open('https://apps.hiigsitech.com/', '_blank');
  };

  // --- LINKS DATA ---
  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Properties', href: '/properties' },
    { name: 'Hotels', href: '/hotels' },
    { name: 'Agents', href: '/agents' },
    { name: 'Contact', href: '/contact' },
    { name: 'About', href: '/about' },
    { name: 'Referrals', href: '/referral' },
  ];

  return (
    <>
      {/* --- MOBILE NAV OVERLAY (HAMBURGER) --- */}
      <div className={`fixed inset-0 bg-[#0a0c10]/98 backdrop-blur-2xl z-[9999] flex flex-col justify-center transition-transform duration-500 ${isNavOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Close Button */}
        <div className="absolute top-8 right-8 cursor-pointer p-2" onClick={toggleNav}>
          <div className="text-white/50 hover:text-white font-bold uppercase text-xs tracking-widest border border-white/20 px-4 py-2 rounded-full">Close</div>
        </div>

        {/* Mobile Menu List */}
        <div className="pl-8 md:pl-12 flex flex-col space-y-2 overflow-y-auto max-h-[85vh] py-10">
          <span className="text-[#0065eb] font-bold text-sm tracking-widest uppercase mb-4">Menu</span>
          
          {/* 1. Main Pages */}
          {navLinks.map((item) => (
            <Link 
              key={item.name} 
              href={item.href} 
              onClick={toggleNav}
              className={`text-4xl md:text-5xl font-black transition-all duration-300 ${pathname === item.href ? 'text-[#0065eb] stroke-none' : 'text-transparent stroke-white hover:text-[#0065eb]'}`}
              style={pathname === item.href ? {} : { WebkitTextStroke: '1px rgba(255,255,255,0.5)' }}
            >
              {item.name}
            </Link>
          ))}

          {/* 2. Auth Links (Conditional) */}
          <div className="pt-6 flex flex-col space-y-2">
            {!loading && user ? (
              <>
                <Link 
                  href="/dashboard" 
                  onClick={toggleNav}
                  className="text-4xl md:text-5xl font-black text-transparent stroke-white hover:text-[#0065eb] transition-all duration-300"
                  style={{ WebkitTextStroke: '1px rgba(255,255,255,0.5)' }}
                >
                  Dashboard
                </Link>
                {/* 2. UPDATED MOBILE LOGOUT ICON */}
                <button 
                  onClick={handleSignOut}
                  className="text-left transition-all duration-300 opacity-80 hover:opacity-100 text-red-500"
                >
                  <LogOut size={48} />
                </button>
              </>
            ) : (
              <>
                <Link 
                  href="/login" 
                  onClick={toggleNav}
                  className="text-4xl md:text-5xl font-black text-transparent stroke-white hover:text-[#0065eb] transition-all duration-300"
                  style={{ WebkitTextStroke: '1px rgba(255,255,255,0.5)' }}
                >
                  Log In
                </Link>
                <Link 
                  href="/signup" 
                  onClick={toggleNav}
                  className="text-4xl md:text-5xl font-black text-transparent stroke-white hover:text-[#0065eb] transition-all duration-300"
                  style={{ WebkitTextStroke: '1px rgba(255,255,255,0.5)' }}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* 3. Download Link */}
          <button 
            onClick={() => { handleDownloadClick(); toggleNav(); }}
            className="text-left text-4xl md:text-5xl font-black text-[#0065eb] transition-all duration-300 mt-4"
          >
            Download
          </button>
        </div>
      </div>

      {/* --- MAIN DESKTOP HEADER --- */}
      <header 
        className={`fixed top-0 left-0 w-full z-50 transition-transform duration-300 ease-in-out ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}
      >
        <div className="w-full bg-[#0a0c10]/85 backdrop-blur-md border-b border-white/5 shadow-lg">
            <nav className="max-w-[1600px] mx-auto px-4 md:px-10 flex justify-between items-center py-4">
                
                {/* LOGO */}
                <Link href="/" className="cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-1">
                    <img src="/android-chrome-512x512.png" alt="GuriUp" className="h-9 md:h-11 w-auto" />
                    <span className="text-white font-black text-xl md:text-2xl tracking-tight">GuriUp</span>
                </Link>

                {/* DESKTOP NAV LINKS (Hidden on Mobile) */}
                <div className="hidden lg:flex gap-6 xl:gap-8 font-bold text-[15px]">
                  {navLinks.map((link) => (
                    <Link 
                      key={link.name} 
                      href={link.href} 
                      className={`relative py-1 transition-all duration-500 ease-out 
                        bg-left-bottom bg-gradient-to-r from-[#0065eb] to-[#0065eb] bg-no-repeat 
                        ${pathname === link.href 
                          ? 'text-[#0065eb] bg-[length:0%_4px]' 
                          : 'text-gray-300 hover:text-white bg-[length:0%_4px] hover:bg-[length:100%_4px]'
                        }`}
                    >
                      {link.name}
                    </Link>
                  ))}
                </div>

                {/* RIGHT SIDE: AUTH & ACTIONS */}
                <div className="flex items-center gap-3">
                  
                  {/* Desktop Auth Buttons */}
                  <div className="hidden md:flex items-center gap-4">
                    {!loading && user ? (
                      <div className="flex items-center gap-3">
                          <Link 
                            href="/dashboard" 
                            className={`relative text-sm font-bold text-white transition-all duration-500 ease-out 
                              bg-left-bottom bg-gradient-to-r from-[#0065eb] to-[#0065eb] bg-no-repeat 
                              bg-[length:0%_4px] hover:bg-[length:100%_4px] hover:text-[#0065eb]`}
                          >
                            Dashboard
                          </Link>
                          {/* 3. UPDATED DESKTOP LOGOUT ICON */}
                          <button onClick={handleSignOut} className="text-white/50 hover:text-red-400 transition-colors" title="Sign Out">
                            <LogOut size={18} />
                          </button>
                          
                          <Link href="/dashboard">
                          <div className="w-9 h-9 rounded-full bg-[#0065eb] ring-2 ring-white/20 overflow-hidden">
                             {user.photoURL ? (
                               <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
                             ) : (
                               <div className="w-full h-full flex items-center justify-center text-white font-bold">{user.displayName ? user.displayName[0] : 'U'}</div>
                             )}
                          </div>
                          </Link>
                      </div>
                    ) : (
                      <>
                        <Link 
                          href="/login" 
                          className={`relative text-sm font-bold text-white transition-all duration-500 ease-out 
                            bg-left-bottom bg-gradient-to-r from-[#0065eb] to-[#0065eb] bg-no-repeat 
                            bg-[length:0%_4px] hover:bg-[length:100%_4px] hover:text-[#0065eb]`}
                        >
                          Log In
                        </Link>
                        <Link href="/signup">
                          <button className="bg-white/10 hover:bg-white hover:text-black text-white px-5 py-2.5 rounded-full font-bold text-sm transition-all border border-white/10 backdrop-blur-sm">
                            Sign Up
                          </button>
                        </Link>
                      </>
                    )}
                  </div>

                  {/* Download Button (Always Visible) */}
                  <button 
                    onClick={handleDownloadClick}
                    className="bg-[#0065eb] text-white rounded-full px-4 py-2 text-xs md:text-sm font-bold hover:bg-[#0052c1] transition-all flex items-center gap-1.5 shadow-lg shadow-blue-500/20"
                  >
                    <span>Download</span>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
                  </button>

                  {/* Mobile Menu Toggle (Hamburger) */}
                  <button className="lg:hidden p-2 text-white" onClick={toggleNav}>
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                  </button>
                </div>
            </nav>
        </div>
      </header>
    </>
  );
};

export default Header;