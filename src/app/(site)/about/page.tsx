'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Download, 
  Globe, 
  ShieldCheck, 
  Zap, 
  Users, 
  ArrowRight, 
  Building2, 
  TrendingUp,
  MapPin,
  CheckCircle2,
  BedDouble,
  Home,
  BrainCircuit,
  Lock,
  Smartphone,
  Quote
} from 'lucide-react';

// =======================================================================
//  HELPER: ANIMATED COUNTER COMPONENT
// =======================================================================
const Counter = ({ end, duration = 2000, prefix = '', suffix = '' }: { end: number, duration?: number, prefix?: string, suffix?: string }) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    });
    
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    let startTime: number | null = null;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = currentTime - startTime;
      const percentage = Math.min(progress / duration, 1);
      
      // Easing function: easeOutExpo
      const ease = (x: number) => (x === 1 ? 1 : 1 - Math.pow(2, -10 * x));
      
      setCount(Math.floor(ease(percentage) * end));

      if (progress < duration) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [end, duration, isVisible]);

  return <span ref={ref}>{prefix}{count}{suffix}</span>;
};

// =======================================================================
//  1. HERO SECTION (Tighter & Smaller)
// =======================================================================
// =======================================================================
//  1. HERO SECTION (Balanced 2% Adjustment)
// =======================================================================
const AboutHero = () => (
  // CHANGED: pt-24 (Balanced top spacing)
  // CHANGED: pb-40 (Balanced bottom spacing for the card)
  <section className="relative pt-13 pb-40 flex items-center justify-center overflow-hidden bg-[#0a0c10]">
    <div className="absolute inset-0 z-0">
      <Image
        src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80"
        alt="East Africa City Skyline"
        fill
        className="object-cover opacity-60"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-[#0a0c10]" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
    </div>

    <div className="relative z-10 container mx-auto px-6 text-center flex flex-col items-center">
      {/* Badge: Restored standard margin mb-6 */}
      <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full pl-2 pr-4 py-1.5 mb-6 hover:bg-white/10 transition-all cursor-default animate-fade-in-up">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
        </span>
        <span className="text-[10px] font-bold text-white tracking-widest uppercase">Live across East Africa</span>
      </div>
      
      {/* Title: Restored standard margin mb-6 */}
      <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight tracking-tight max-w-4xl">
        The Operating System for <br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0164E5] via-blue-400 to-white">
          Hotels & Real Estate.
        </span>
      </h1>
      
      {/* Description: Restored standard margin mb-10 */}
      <p className="text-sm md:text-base text-gray-300 max-w-2xl mx-auto font-medium leading-relaxed mb-10">
        GuriUp is the premier digital ecosystem for <strong className="text-white">East Africa</strong>. We seamlessly connect travelers to <strong className="text-white">luxury hotels</strong> and families to their <strong className="text-white">dream homes</strong>. From Nairobi to Mogadishu, Addis Ababa to Djibouti—we are the bridge.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center w-full sm:w-auto">
        <Link href="#dual-world" className="bg-[#0164E5] text-white font-bold px-8 py-3.5 rounded-full hover:bg-blue-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/50 hover:scale-105 transform duration-200 text-sm">
          How It Works <ArrowRight size={18} />
        </Link>
        <Link href="/properties" className="bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold px-8 py-3.5 rounded-full hover:bg-white hover:text-black transition-all flex items-center justify-center gap-2 text-sm">
           Explore Listings
        </Link>
      </div>
    </div>
    
    {/* Fade Effect at bottom */}
    <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#0a0c10] to-transparent z-20"></div>
  </section>
);

// =======================================================================
//  2. IMPACT METRICS (Animated & Moved Up)
// =======================================================================
const ImpactMetrics = () => (
  <section className="relative z-30 -mt-32 px-6">
    <div className="container mx-auto">
      <div className="bg-white/90 backdrop-blur-xl rounded-[2.5rem] shadow-2xl p-8 md:p-10 border border-white/50 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 items-center">
        {[
          { label: 'Travelers Served', end: 500, suffix: 'K+', icon: <Users className="w-5 h-5" /> },
          { label: 'Hotels & Homes', end: 15, suffix: 'k+', icon: <Building2 className="w-5 h-5" /> },
          { label: 'East African Cities', end: 15, suffix: '+', icon: <MapPin className="w-5 h-5" /> },
          { label: 'Booking Value', end: 25, prefix: '$', suffix: 'M+', icon: <TrendingUp className="w-5 h-5" /> },
        ].map((stat, idx) => (
          <div key={idx} className="flex flex-col items-center md:items-start text-center md:text-left relative md:last:border-0">
            {idx !== 3 && <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-[1px] h-12 bg-gray-200 -mr-6"></div>}
            <div className="bg-blue-50 p-3 rounded-2xl text-[#0164E5] mb-4">
              {stat.icon}
            </div>
            <h3 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight mb-1">
              <Counter end={stat.end} prefix={stat.prefix} suffix={stat.suffix} />
            </h3>
            <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">{stat.label}</span>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// =======================================================================
//  3. THE VISION
// =======================================================================
const TheVision = () => (
  <section id="our-story" className="py-24 bg-white overflow-hidden relative">
    <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-blue-100/50 rounded-full blur-[100px] -translate-x-1/2"></div>
    <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-100/50 rounded-full blur-[100px] translate-x-1/3 translate-y-1/3"></div>

    <div className="container mx-auto px-6 relative z-10">
      <div className="flex flex-col lg:flex-row items-center gap-20">
        <div className="lg:w-1/2 relative">
          <div className="relative z-10 grid grid-cols-2 gap-4">
             <div className="space-y-4 translate-y-12">
                <div className="relative h-64 w-full rounded-2xl overflow-hidden shadow-xl">
                   <Image src="https://images.unsplash.com/photo-1577412647305-991150c7d163?q=80" alt="East Africa Real Estate" fill className="object-cover" />
                </div>
                <div className="relative h-48 w-full rounded-2xl overflow-hidden shadow-xl bg-blue-600 flex items-center justify-center p-6 text-white">
                   <p className="font-black text-xl leading-tight">Serving the Whole Region.</p>
                </div>
             </div>
             <div className="space-y-4">
                <div className="relative h-48 w-full rounded-2xl overflow-hidden shadow-xl bg-slate-900 flex items-center justify-center p-6 text-white text-center">
                   <div>
                     <div className="text-3xl font-black text-blue-500 mb-1">1 App</div>
                     <div className="text-xs font-bold uppercase tracking-wider text-gray-400">For Homes & Hotels</div>
                   </div>
                </div>
                <div className="relative h-80 w-full rounded-2xl overflow-hidden shadow-xl">
                   <Image src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80" alt="Luxury Hotel East Africa" fill className="object-cover" />
                </div>
             </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/10 to-transparent transform rotate-6 rounded-[3rem] -z-10 scale-105"></div>
        </div>
        
        <div className="lg:w-1/2">
          <div className="inline-block bg-blue-50 text-[#0164E5] px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-6">
             Our Mission
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-8 leading-tight tracking-tight">
            Connecting East Africa to <br /> <span className="text-[#0164E5]">Global Standards.</span>
          </h2>
          <div className="space-y-6 text-base md:text-lg text-slate-600 leading-relaxed font-medium">
            <p>
              Finding a reliable hotel in Nairobi or purchasing land in Hargeisa shouldn't be a gamble. For too long, the East African market has been fragmented—split between informal brokers and cash-only transactions.
            </p>
            <p>
              We built GuriUp to be the <strong>unified digital infrastructure</strong> for the entire region. Whether you are booking a weekend getaway in Djibouti or investing in a commercial property in Addis Ababa, we provide a single, verified platform to make it happen.
            </p>
            <div className="pl-6 border-l-4 border-[#0164E5] mt-6">
              <p className="text-slate-900 italic font-serif text-lg">
                "We don't just list buildings. We unlock potential. By digitizing hotels and real estate, we are opening East Africa to the world."
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

// =======================================================================
//  4. CORE VALUES
// =======================================================================
const CoreValues = () => (
  <section className="py-24 bg-[#0B1121] text-white">
    <div className="container mx-auto px-6">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h2 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight">Built on Unshakeable Principles</h2>
        <p className="text-gray-400 text-lg font-medium">Revolutionizing hospitality and real estate requires a code of ethics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white/5 backdrop-blur-sm p-8 rounded-[2rem] border border-white/10 hover:bg-white/10 transition-all duration-300 flex flex-col justify-center group">
          <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
            <ShieldCheck size={28} className="text-blue-400" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">Verified Trust</h3>
          <p className="text-gray-300 text-base leading-relaxed">
            We verify every hotel room and property listing. Our team performs physical checks to ensure that the amenities, location, and ownership details are 100% accurate. No catfishing, no scams.
          </p>
        </div>

        <div className="bg-[#0164E5] p-8 rounded-[2rem] shadow-xl text-white flex flex-col justify-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md group-hover:rotate-12 transition-transform duration-300">
            <Zap size={28} className="text-white" />
          </div>
          <h3 className="text-xl font-bold mb-3">Instant Booking</h3>
          <p className="text-blue-100 text-base leading-relaxed">
            Forget "Call for Price". We bring instant, digital booking to East Africa. Secure your hotel room or schedule a house tour in seconds.
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-sm p-8 rounded-[2rem] border border-white/10 hover:bg-white/10 transition-all duration-300 group">
          <div className="w-14 h-14 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
            <Globe size={28} className="text-purple-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-3">Regional Network</h3>
          <p className="text-gray-300 text-base leading-relaxed">
            We operate across borders. Our platform seamlessly handles different currencies and languages, making regional travel and investment effortless.
          </p>
        </div>

        <div className="md:col-span-2 bg-white p-8 rounded-[2rem] shadow-2xl text-slate-900 flex flex-col justify-center group">
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                <Users size={28} className="text-slate-900" />
            </div>
            <div>
                <h3 className="text-xl font-bold mb-2">Empowering Owners</h3>
                <p className="text-slate-600 text-base leading-relaxed">
                We give tools to hotel managers and landlords to run their businesses better. Analytics, booking management, and marketing—all in one dashboard.
                </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

// =======================================================================
//  5. NEW SECTION: SMART INFRASTRUCTURE (Tech Focus)
// =======================================================================
const TechStack = () => (
  <section className="py-24 bg-white relative overflow-hidden">
     <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:40px_40px]"></div>
     
     <div className="container mx-auto px-6 relative z-10">
        <div className="mb-16 md:w-1/2">
           <span className="text-[#0164E5] font-bold tracking-widest uppercase text-xs mb-2 block">Innovation</span>
           <h2 className="text-4xl md:text-5xl font-black text-slate-900">Engineering <br />The Future.</h2>
           <p className="text-slate-500 text-lg mt-4">We aren't just a website. We are a deep-tech platform solving the hardest problems in African real estate infrastructure.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           {[
             {
               title: "AI Market Valuation",
               desc: "Our algorithms analyze thousands of data points to give you accurate property valuations, removing speculation from the market.",
               icon: <BrainCircuit size={32} />
             },
             {
               title: "Secure Escrow",
               desc: "Payments are held safely until keys are handed over. We built a proprietary financial layer to protect both buyers and sellers.",
               icon: <Lock size={32} />
             },
             {
               title: "Digital Ownership",
               desc: "We are piloting blockchain-verified property records to create an immutable history of ownership for land assets.",
               icon: <Smartphone size={32} />
             }
           ].map((item, i) => (
             <div key={i} className="bg-slate-50 hover:bg-white p-8 rounded-[2rem] border border-slate-100 hover:shadow-xl hover:border-blue-100 transition-all duration-300 group">
                <div className="bg-white w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm mb-6 text-slate-900 group-hover:bg-[#0164E5] group-hover:text-white transition-colors">
                   {item.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                <p className="text-slate-500 leading-relaxed text-sm">{item.desc}</p>
             </div>
           ))}
        </div>
     </div>
  </section>
);

// =======================================================================
//  6. ONE APP, TWO WORLDS
// =======================================================================
const DualFocus = () => (
  <section id="dual-world" className="py-24 bg-slate-50">
    <div className="container mx-auto px-6">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <span className="text-[#0164E5] font-bold tracking-widest uppercase text-xs mb-2 block">The GuriUp Ecosystem</span>
        <h2 className="text-4xl md:text-5xl font-black text-slate-900">One App. Two Worlds.</h2>
        <p className="text-slate-500 text-lg mt-4">We are the only platform in East Africa that seamlessly integrates short-term hospitality with long-term real estate.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Hotels Card */}
        <div className="relative group overflow-hidden rounded-[2.5rem] h-[500px]">
           <Image src="https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80" alt="Hotels" fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
           <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
           <div className="absolute bottom-0 left-0 p-10 text-white">
              <div className="bg-blue-600 w-fit p-3 rounded-xl mb-4">
                 <BedDouble size={28} />
              </div>
              <h3 className="text-3xl font-bold mb-2">Hotels & Stays</h3>
              <p className="text-gray-300 leading-relaxed mb-6">
                 From boutique resorts to city business hotels. Book your stay instantly with guaranteed availability and transparent pricing.
              </p>
              <Link href="/hotels" className="text-white font-bold underline decoration-blue-500 underline-offset-4 hover:text-blue-400">Find a Hotel</Link>
           </div>
        </div>

        {/* Real Estate Card */}
        <div className="relative group overflow-hidden rounded-[2.5rem] h-[500px]">
           <Image 
              src="https://images.unsplash.com/photo-1554995207-c18c203602cb?w=600&auto=format&fit=crop&q=60" 
              alt="Modern House for Sale" 
              fill 
              className="object-cover transition-transform duration-700 group-hover:scale-110" 
           />
           <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
           <div className="absolute bottom-0 left-0 p-10 text-white">
              <div className="bg-green-600 w-fit p-3 rounded-xl mb-4">
                 <Home size={28} />
              </div>
              <h3 className="text-3xl font-bold mb-2">Buy, Rent & Sell</h3>
              <p className="text-gray-300 leading-relaxed mb-6">
                 Browse verified lands, houses, and apartments. Connect directly with agents and owners to secure your next asset.
              </p>
              <Link href="/properties" className="text-white font-bold underline decoration-green-500 underline-offset-4 hover:text-green-400">View Properties</Link>
           </div>
        </div>
      </div>
    </div>
  </section>
);

// =======================================================================
//  7. TESTIMONIALS
// =======================================================================
const Testimonials = () => (
  <section className="py-24 bg-white overflow-hidden">
    <div className="container mx-auto px-6">
      <div className="flex flex-col md:flex-row justify-between items-end mb-12">
         <div>
           <h2 className="text-4xl font-black text-slate-900">Voices of East Africa</h2>
           <p className="text-slate-500 mt-2">Trusted by the people building the region's future.</p>
         </div>
         <div className="hidden md:flex gap-2">
            <button className="p-3 rounded-full border border-slate-200 hover:bg-slate-50 transition-colors"><ArrowRight className="rotate-180" size={20}/></button>
            <button className="p-3 rounded-full bg-slate-900 text-white hover:bg-slate-800 transition-colors"><ArrowRight size={20}/></button>
         </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
         {/* Review 1 */}
         <div className="flex-1 bg-slate-50 p-8 rounded-[2rem] relative">
            <Quote className="text-blue-200 absolute top-8 right-8" size={60} />
            <p className="text-slate-700 text-lg font-medium leading-relaxed mb-6 relative z-10">
               "As a diaspora investor living in London, I was terrified of sending money back home for land. GuriUp's verified listings and transparent process gave me total peace of mind. I bought my family home entirely through the app."
            </p>
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">AH</div>
               <div>
                  <h4 className="font-bold text-slate-900">Ahmed Hassan</h4>
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Investor, London</p>
               </div>
            </div>
         </div>

         {/* Review 2 */}
         <div className="flex-1 bg-slate-50 p-8 rounded-[2rem] relative">
            <Quote className="text-purple-200 absolute top-8 right-8" size={60} />
            <p className="text-slate-700 text-lg font-medium leading-relaxed mb-6 relative z-10">
               "GuriUp completely transformed our hotel booking system. We used to rely on phone calls; now 80% of our guests book digitally. It is the professional standard we needed in Mogadishu."
            </p>
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">SO</div>
               <div>
                  <h4 className="font-bold text-slate-900">Sarah Olad</h4>
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Hotel Manager, Mogadishu</p>
               </div>
            </div>
         </div>
      </div>
    </div>
  </section>
);

// =======================================================================
//  8. MOBILE APP SECTION
// =======================================================================
const Ecosystem = () => (
  <section className="bg-[#0a0c10] py-32 overflow-hidden relative">
    <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#0164E5]/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3"></div>
    <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px] translate-y-1/3 -translate-x-1/4"></div>
    
    <div className="container mx-auto px-6 relative z-10">
      <div className="flex flex-col lg:flex-row items-center gap-20">
        
        <div className="lg:w-1/2 text-white">
          <div className="inline-block bg-blue-900/30 border border-blue-500/30 text-blue-400 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-6">
             Go Mobile
          </div>
          <h2 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
            Managing Assets <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0164E5] to-white">On The Go.</span>
          </h2>
          <p className="text-gray-400 text-lg mb-10 leading-relaxed max-w-lg">
            Manage your hotel bookings, schedule property viewings, and communicate with clients—all from your pocket. Designed for the dynamic East African market.
          </p>
          
          <ul className="space-y-5 mb-12">
            {['Instant booking confirmations', 'GPS-guided property locations', 'Mobile money integration (Zaad, M-Pesa, etc.)', 'Direct chat with hosts & agents'].map(item => (
              <li key={item} className="flex items-center gap-4 group">
                <div className="bg-green-500/10 p-2 rounded-full group-hover:bg-green-500/20 transition-colors">
                  <CheckCircle2 size={20} className="text-green-400" />
                </div>
                <span className="text-gray-300 font-medium text-lg">{item}</span>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap gap-4">
            <a href="https://apps.hiigsitech.com" target="_blank" rel="noopener noreferrer" className="bg-white text-black px-8 py-4 rounded-2xl font-bold flex items-center gap-3 hover:bg-gray-200 transition-colors group">
              <Download size={24} className="group-hover:translate-y-1 transition-transform" /> 
              <div className="text-left leading-none">
                 <div className="text-[10px] uppercase font-bold text-gray-500 mb-1">Download on the</div>
                 <div className="text-lg">App Store</div>
              </div>
            </a>
            <a href="https://apps.hiigsitech.com" target="_blank" rel="noopener noreferrer" className="bg-white/10 backdrop-blur border border-white/10 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 hover:bg-white/20 transition-colors group">
              <Download size={24} className="group-hover:translate-y-1 transition-transform" /> 
              <div className="text-left leading-none">
                 <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Get it on</div>
                 <div className="text-lg">Google Play</div>
              </div>
            </a>
          </div>
        </div>

        <div className="lg:w-1/2 flex justify-center lg:justify-end relative mt-32 lg:mt-0">
          <div className="relative z-10 transform lg:rotate-[-6deg] hover:rotate-0 transition-transform duration-700 ease-out">
              <div className="relative mx-auto border-gray-900 bg-gray-900 border-[14px] rounded-[3rem] h-[650px] w-[320px] shadow-2xl flex flex-col overflow-hidden ring-1 ring-white/20">
                  <div className="absolute top-0 w-full flex justify-center z-20 pt-4">
                      <div className="h-7 w-28 bg-black rounded-full"></div>
                  </div>
                  <div className="h-full w-full bg-slate-800 relative">
                    <Image src="/images/mobile.jpg" alt="GuriUp Mobile App" fill className="object-cover" />
                    <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-black/80 to-transparent"></div>
                  </div>
              </div>

              <div className="absolute -top-28 left-1/2 -translate-x-1/2 md:top-1/4 md:-left-[40%] md:translate-x-0 bg-white/90 backdrop-blur-md p-5 rounded-3xl shadow-2xl flex items-center gap-4 animate-bounce z-20 w-max border border-white/50">
                <div className="bg-green-100 p-3 rounded-full text-green-600">
                  <ShieldCheck size={28} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Status</p>
                  <p className="text-xl font-black text-slate-900">Booking Confirmed</p>
                </div>
              </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

// =======================================================================
//  9. FINAL CTA
// =======================================================================
const FinalCTA = () => (
  <section className="py-32 bg-[#0164E5] relative overflow-hidden">
    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]"></div>
    
    <div className="container mx-auto px-6 text-center relative z-10">
      <h2 className="text-4xl md:text-6xl font-black text-white mb-8 tracking-tight">Ready to start?</h2>
      <p className="text-lg md:text-xl text-blue-100 mb-12 max-w-3xl mx-auto leading-relaxed font-medium">
        Join the fastest growing property and hospitality network in East Africa.
      </p>
      <div className="flex flex-col sm:flex-row justify-center gap-6">
        <Link href="/properties" className="bg-white text-[#0164E5] px-12 py-5 rounded-full font-black text-lg hover:shadow-[0_0_40px_-10px_rgba(255,255,255,0.7)] hover:scale-105 transition-all">
          Browse Properties
        </Link>
        <Link href="/hotels" className="bg-[#004bb5] text-white border border-blue-400 px-12 py-5 rounded-full font-bold text-lg hover:bg-transparent hover:border-white transition-all">
          Book a Hotel
        </Link>
      </div>
    </div>
  </section>
);

export default function AboutPage() {
  return (
    <>
      <style jsx global>{`
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
        }
      `}</style>

      <AboutHero />
      <ImpactMetrics />
      <TheVision />
      <CoreValues />
      <TechStack />
      <DualFocus /> 
      <Testimonials />
      <Ecosystem />
      <FinalCTA />
    </>
  );
}