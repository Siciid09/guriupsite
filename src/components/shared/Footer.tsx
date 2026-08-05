import React from "react";
import Link from "next/link";

// --- SOCIAL ICONS ---
const Icons = {
  Facebook: () => (
    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.962.925-1.962 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  ),
  Twitter: () => (
    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.892 3.213 2.241 4.116a4.904 4.904 0 01-2.229-.616c-.054 2.281 1.581 4.415 3.949 4.89a4.935 4.935 0 01-2.224.084 4.928 4.928 0 004.6 3.419A9.9 9.9 0 010 21.54a13.94 13.94 0 007.548 2.212c9.142 0 14.307-7.721 13.995-14.646A10.025 10.025 0 0024 4.557a9.99 9.99 0 01-2.915.356c.205-1.155-.048-2.613.868-3.213z" />
    </svg>
  ),
  Instagram: () => (
    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  ),
  Linkedin: () => (
    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
    </svg>
  )
};

const Footer = () => {
  return (
    <footer className="bg-white pt-20 pb-10 px-6 mt-10 rounded-t-[3rem] shadow-[0_-15px_40px_-15px_rgba(0,0,0,0.05)] border-t border-slate-100 relative z-10 font-sans">
      
      <div className="max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 mb-16">
          
          {/* ================= BRAND COLUMN ================= */}
          <div className="lg:col-span-4 flex flex-col items-start">
            <div className="flex items-center gap-3 mb-6">
              <img
                src="/android-chrome-512x512.png"
                alt="GuriUp Logo"
                className="h-12 w-auto"
              />
              <span className="text-3xl font-black text-slate-900 tracking-tight">
                GuriUp.
              </span>
            </div>

            <p className="text-slate-500 text-sm leading-relaxed mb-8 max-w-sm font-medium">
              The Horn of Africa’s premier digital real estate and hospitality ecosystem. We
              connect people with places through a seamless, secure, and trusted
              platform—making it easier to discover, book, buy, and invest with confidence.
            </p>

            <div className="flex gap-3">
              <a href="#" className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-[#1877F2] hover:text-white hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300">
                <Icons.Facebook />
              </a>
              <a href="#" className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-black hover:text-white hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                <Icons.Twitter />
              </a>
              <a href="#" className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-[#E1306C] hover:text-white hover:-translate-y-1 hover:shadow-lg hover:shadow-pink-500/20 transition-all duration-300">
                <Icons.Instagram />
              </a>
              <a href="#" className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-[#0077B5] hover:text-white hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300">
                <Icons.Linkedin />
              </a>
            </div>
          </div>

          {/* ================= LINKS COLUMNS ================= */}
          <div className="lg:col-span-2">
            <h4 className="font-black text-slate-900 mb-6 uppercase tracking-widest text-xs">
              Company
            </h4>
            <ul className="space-y-4">
              {["About Us", "Careers", "Our Team", "Blog", "Press"].map((item) => (
                <li key={item}>
                  <Link href="#" className="text-slate-500 font-bold text-sm hover:text-[#0065eb] transition-colors inline-block hover:translate-x-1.5 duration-300">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h4 className="font-black text-slate-900 mb-6 uppercase tracking-widest text-xs">
              Explore
            </h4>
            <ul className="space-y-4">
              {["Properties", "Hotels", "Agents", "Locations", "Map View"].map((item) => (
                <li key={item}>
                  <Link href="#" className="text-slate-500 font-bold text-sm hover:text-[#0065eb] transition-colors inline-block hover:translate-x-1.5 duration-300">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h4 className="font-black text-slate-900 mb-6 uppercase tracking-widest text-xs">
              Support
            </h4>
            <ul className="space-y-4">
              {["Help Center", "Terms of Service", "Privacy Policy", "Cookie Policy", "Contact Us"].map((item) => (
                <li key={item}>
                  <Link href="#" className="text-slate-500 font-bold text-sm hover:text-[#0065eb] transition-colors inline-block hover:translate-x-1.5 duration-300">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ================= APP DOWNLOAD ================= */}
          <div className="lg:col-span-2">
            <h4 className="font-black text-slate-900 mb-6 uppercase tracking-widest text-xs">
              Get the App
            </h4>

            <div className="flex flex-col gap-4">
              
              {/* Modern App Store Button with Required Image Link */}
              <a
                href="https://apps.hiigsitech.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-[170px] h-[54px] bg-slate-900 rounded-2xl flex items-center justify-center px-4 gap-3 hover:bg-black hover:scale-105 hover:shadow-xl hover:shadow-slate-900/20 transition-all duration-300 group border border-slate-800"
              >
                <img 
                   src="https://static.vecteezy.com/system/resources/thumbnails/070/730/255/small/computer-logo-white-phone-icon-in-transparent-background-free-png.png" 
                   alt="Apple Store" 
                   className="w-7 h-7 object-contain group-hover:-translate-y-0.5 transition-transform" 
                />
                <div className="flex flex-col items-start leading-none">
                   <span className="text-[10px] text-slate-300 font-medium tracking-wide">Download on the</span>
                   <span className="text-[16px] text-white font-bold tracking-tight mt-0.5">App Store</span>
                </div>
              </a>

              {/* Modern Google Play Button with Required Local Image Link */}
              <a
                href="https://apps.hiigsitech.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-[170px] h-[54px] bg-slate-900 rounded-2xl flex items-center justify-center px-4 gap-3 hover:bg-black hover:scale-105 hover:shadow-xl hover:shadow-slate-900/20 transition-all duration-300 group border border-slate-800"
              >
                <img 
                   src="/images/play.png" 
                   alt="Google Play" 
                   className="w-6 h-6 object-contain group-hover:-translate-y-0.5 transition-transform" 
                />
                <div className="flex flex-col items-start leading-none">
                   <span className="text-[10px] text-slate-300 font-medium uppercase tracking-wide">Get it on</span>
                   <span className="text-[16px] text-white font-bold tracking-tight mt-0.5">Google Play</span>
                </div>
              </a>

            </div>
          </div>
        </div>

        {/* ================= BOTTOM BAR ================= */}
        <div className="border-t border-slate-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-400 font-bold text-xs tracking-wide">
            © 2026 GuriUp Inc. All rights reserved.
          </p>

          <a
            href="https://hiigsitech.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-slate-400 hover:text-[#0065eb] transition-colors cursor-pointer tracking-wide"
          >
            Developed by HiigsiTech
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;