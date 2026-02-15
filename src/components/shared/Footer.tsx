import React from 'react';
import Link from 'next/link';

// --- ICONS ---
const Icons = {
  Apple: () => (
    <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.74s2.57-.99 3.87-.82c1.6.15 2.85.81 3.54 1.97-3.11 1.76-2.42 5.86.51 7.15-.65 1.59-1.57 2.94-2.99 3.93zm-3.04-16.7c.66-1.13.43-2.61-.83-3.58-1.28-.96-3.23-.42-3.8.84-.71 1.48.51 3.23 2.1 3.02.94.02 1.84-.28 2.53-1.28z"/>
    </svg>
  ),
  Android: () => (
    <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
      <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.551 0 .9996.4482.9996.9993s-.4486.9997-.9996.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.551 0 .9996.4482.9996.9993s-.4486.9997-.9996.9997m11.4045-6.02l1.9973-3.4592a.415.415 0 00-.052-.5685.4155.4155 0 00-.5689.0524l-2.0298 3.5152c-1.6364-.7493-3.4832-1.168-5.4619-1.168-1.932 0-3.4475.4057-5.068.1132L4.6813 4.2908a.4162.4162 0 00-.5693-.0524.4136.4136 0 00-.052.5685l1.9866 3.4592C2.637 10.3703 0 13.8828 0 17.952h24c0-4.1158-2.684-7.6698-6.1185-9.6306"/>
    </svg>
  ),
  Facebook: () => (
    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.962.925-1.962 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
  ),
  Twitter: () => (
    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.892 3.213 2.241 4.116a4.904 4.904 0 01-2.229-.616c-.054 2.281 1.581 4.415 3.949 4.89a4.935 4.935 0 01-2.224.084 4.928 4.928 0 004.6 3.419A9.9 9.9 0 010 21.54a13.94 13.94 0 007.548 2.212c9.142 0 14.307-7.721 13.995-14.646A10.025 10.025 0 0024 4.557a9.99 9.99 0 01-2.915.356c.205-1.155-.048-2.613.868-3.213z"/></svg>
  ),
  Instagram: () => (
    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
  ),
  Linkedin: () => (
    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
  ),
  ArrowRight: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
  )
};

const Footer = () => {
  return (
    <footer className="bg-white pt-24 pb-12 px-6 border-t border-gray-100">
      <div className="max-w-[1600px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 mb-16">
            
            {/* BRAND COLUMN (Wider) */}
            <div className="lg:col-span-4 flex flex-col items-start">
                <div className="flex items-center gap-3 mb-6">
                    <img src="/android-chrome-512x512.png" alt="GuriUp Logo" className="h-10 w-auto" />
                    <span className="text-2xl font-black text-slate-900 tracking-tight">GuriUp.</span>
                </div>
                
                <p className="text-gray-500 text-sm leading-relaxed mb-8 max-w-sm font-medium">
                    The Horn of Africa's premier digital real estate and hospitality ecosystem. We connect people with places, seamlessly and securely.
                </p>
                
                <div className="flex gap-4">
                  {/* FACEBOOK */}
                  <a href="#" className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-[#1877F2] hover:text-white transition-all duration-300">
                    <Icons.Facebook />
                  </a>
                  {/* TWITTER / X */}
                  <a href="#" className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-black hover:text-white transition-all duration-300">
                    <Icons.Twitter />
                  </a>
                  {/* INSTAGRAM */}
                  <a href="#" className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-[#E1306C] hover:text-white transition-all duration-300">
                    <Icons.Instagram />
                  </a>
                  {/* LINKEDIN */}
                  <a href="#" className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-[#0077B5] hover:text-white transition-all duration-300">
                    <Icons.Linkedin />
                  </a>
                </div>
            </div>

            {/* LINKS COLUMNS */}
            <div className="lg:col-span-2">
                <h4 className="font-black text-slate-900 mb-6 uppercase tracking-widest text-xs">Company</h4>
                <ul className="space-y-4">
                    {['About Us', 'Careers', 'Our Team', 'Blog', 'Press'].map(item => (
                        <li key={item}>
                          <Link href="#" className="text-gray-500 font-bold text-sm hover:text-[#0065eb] transition-colors inline-block hover:translate-x-1 duration-200">
                            {item}
                          </Link>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="lg:col-span-2">
                <h4 className="font-black text-slate-900 mb-6 uppercase tracking-widest text-xs">Explore</h4>
                <ul className="space-y-4">
                    {['Properties', 'Hotels', 'Agents', 'Locations', 'Map View'].map(item => (
                        <li key={item}>
                          <Link href="#" className="text-gray-500 font-bold text-sm hover:text-[#0065eb] transition-colors inline-block hover:translate-x-1 duration-200">
                            {item}
                          </Link>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="lg:col-span-2">
                <h4 className="font-black text-slate-900 mb-6 uppercase tracking-widest text-xs">Support</h4>
                <ul className="space-y-4">
                    {['Help Center', 'Terms of Service', 'Privacy Policy', 'Cookie Policy', 'Contact Us'].map(item => (
                        <li key={item}>
                          <Link href="#" className="text-gray-500 font-bold text-sm hover:text-[#0065eb] transition-colors inline-block hover:translate-x-1 duration-200">
                            {item}
                          </Link>
                        </li>
                    ))}
                </ul>
            </div>

            {/* APP DOWNLOAD COLUMN (Clean & Modern) */}
            <div className="lg:col-span-2">
               <h4 className="font-black text-slate-900 mb-6 uppercase tracking-widest text-xs">Get the App</h4>
               <div className="flex flex-col gap-3">
                  <a 
                    href="https://apps.hiigsitech.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-black text-white px-5 py-3.5 rounded-xl flex items-center gap-3 hover:bg-[#0065eb] transition-all transform hover:-translate-y-1 shadow-lg shadow-black/5 w-full justify-center lg:justify-start"
                  >
                    <Icons.Apple />
                    <div className="text-left leading-none">
                        <div className="text-[9px] font-bold opacity-60 mb-0.5">Download on the</div>
                        <div className="text-sm font-bold">App Store</div>
                    </div>
                  </a>

                  <a 
                    href="https://apps.hiigsitech.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-black text-white px-5 py-3.5 rounded-xl flex items-center gap-3 hover:bg-[#0065eb] transition-all transform hover:-translate-y-1 shadow-lg shadow-black/5 w-full justify-center lg:justify-start"
                  >
                    <Icons.Android />
                    <div className="text-left leading-none">
                        <div className="text-[9px] font-bold opacity-60 mb-0.5">GET IT ON</div>
                        <div className="text-sm font-bold">Google Play</div>
                    </div>
                  </a>
               </div>
            </div>
        </div>

        {/* BOTTOM BAR */}
        <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
             <p className="text-gray-400 font-bold text-xs">© 2026 GuriUp Inc. All rights reserved.</p>
             
             {/* REPLACED "All Systems Operational" WITH "Developed by HiigsiTech" */}
             <a 
               href="https://hiigsitech.com" 
               target="_blank" 
               rel="noopener noreferrer" 
               className="text-xs font-bold text-gray-500 hover:text-[#0065eb] transition-colors cursor-pointer"
             >
                Developed by HiigsiTech
             </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;