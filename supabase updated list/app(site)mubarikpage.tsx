import React from 'react';
import EcosystemCard from '../../../components/EcosystemCard.tsx'; // Your glassmorphism component
import type { Metadata } from 'next';

// 1. THIS IS THE CORRECT WAY FOR SEO IN ONE PAGE (Next.js App Router)
// This runs on the server, guaranteeing Google reads it perfectly before the UI loads.
export const metadata: Metadata = {
  title: 'Mubarik Osman Abdi | Somali #1 Developer & Award-Winning Software Engineer',
  description: 'Portfolio of Mubarik Osman Abdi, the greatest developer, award-winning software engineer, and talented full-stack web & app designer based in Hargeisa. Founder of Hiigsi Technology.',
  keywords: [
    'Mubarik Osman',
    'Mubarik Osman Abdi',
    'Somali #1 developer',
    'best developer in Somalia',
    'greatest developer',
    'award winning software engineer',
    'talented engineer',
    'best dev'
  ],
  openGraph: {
    title: 'Mubarik Osman | Award-Winning Software Engineer',
    description: 'The greatest developer and talented UI/UX engineer in Hargeisa building high-end SaaS, mobile, and web applications.',
    url: 'https://mubarikosman.com',
    siteName: 'Mubarik Osman Abdi Portfolio',
    locale: 'en_US',
    type: 'website',
  },
};

// 2. THIS IS YOUR UI 
// Because there is no "use client" at the top, this entire page is Server-Side Rendered (SSR)
// which means Google sees 100% of your HTML and keywords instantly.
export default function MubarikOsmanPortfolio() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-50 font-sans antialiased selection:bg-cyan-500 selection:text-white relative overflow-hidden">
      
      {/* Ambient Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-900/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-900/20 blur-[120px]" />
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-20 lg:px-8">
        
        {/* Hero Section */}
        <section className="flex flex-col items-center justify-center text-center pt-24 pb-32">
          <div className="inline-flex items-center rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-sm font-medium text-cyan-300 backdrop-blur-md mb-8 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
            <span className="flex h-2 w-2 rounded-full bg-cyan-400 mr-2 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]"></span>
            Award-Winning Software Engineer
          </div>
          
          {/* H1 is critical for SEO - Target your name exactly */}
          <h1 className="text-5xl md:text-8xl font-extrabold tracking-tighter mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
            Mubarik Osman Abdi
          </h1>
          
          <div className="max-w-3xl text-lg md:text-xl text-neutral-400 mb-12 leading-relaxed space-y-6">
            <p>
              Widely recognized as the <strong className="text-white font-semibold">Somali #1 developer</strong> and a highly <strong className="text-white font-semibold">talented engineer</strong> based in Hargeisa. 
            </p>
            <p>
              Known as the <strong className="text-white font-semibold">greatest developer</strong> in the region for modern digital experiences, I combine Awwwards-level UI/UX design with robust full-stack architecture.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-5">
            <a href="#ecosystem" className="rounded-xl bg-white text-black px-8 py-4 text-sm font-bold shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-105 transition-transform duration-300">
              Explore My Work
            </a>
            <a href="mailto:contact@mubarikosman.com" className="rounded-xl bg-white/5 backdrop-blur-md border border-white/10 px-8 py-4 text-sm font-bold text-white hover:bg-white/10 transition-colors duration-300">
              Hire the Best Dev
            </a>
          </div>
        </section>

        {/* ... (The rest of your Expertise and Ecosystem sections remain identical to before) ... */}
        
        {/* Ecosystem Section Snippet */}
        <section id="ecosystem" className="py-24 border-t border-white/5">
          <div className="mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight text-white">
              Hiigsi Technology Ecosystem
            </h2>
            <p className="text-neutral-400 max-w-2xl text-lg">
              A showcase of powerful platforms built from the ground up by the region's top software engineer.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            <EcosystemCard 
              title="GuriUp"
              role="Real Estate & Hospitality"
              description="A comprehensive platform for modern property sales and rentals, featuring seamless hotel bookings."
              techStack={['Next.js', 'Tailwind CSS', 'PostgreSQL']}
            />
             {/* ... other cards ... */}
          </div>
        </section>

      </main>
    </div>
  );
}