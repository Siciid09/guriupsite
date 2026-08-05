import type { Metadata } from 'next';
import Image from 'next/image';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Zap, 
  ArrowRight
} from 'lucide-react';
import ContactForm from '@/components/features/ContactForm'; // Ensure this component has 'use client' at the top of its own file

// =========================================================
//  1. 100% SEO METADATA
// =========================================================
export const metadata: Metadata = {
  title: 'Contact GuriUp | Support for Real Estate in Hargeisa & Mogadishu',
  description: 'Get 24/7 support for GuriUp. Contact our team for hotel bookings in Hargeisa, property management in Mogadishu, or real estate investment across East Africa.',
  keywords: ['Contact GuriUp', 'GuriApp Support', 'Real Estate Hargeisa', 'Somalia Hotel Booking', 'Mogadishu Property Help', 'Somaliland Tech Support'],
  openGraph: {
    title: 'Contact GuriUp | Global Support',
    description: 'Need help buying, renting, or booking? Our team in Hargeisa is ready to assist you 24/7.',
    url: 'https://guriup.com/contact',
    type: 'website',
    images: ['/images/contact-og.jpg'], // Make sure you have this image
  },
};

// =========================================================
//  2. HERO SECTION
// =========================================================
const ContactHero = () => (
  <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden bg-slate-950">
    <div className="absolute inset-0 z-0">
      <Image 
        src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80" 
        alt="GuriUp Global Support Center"
        fill
        className="object-cover opacity-30 scale-105"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent" />
    </div>

    <div className="relative z-10 container mx-auto px-6 text-center">
      <div className="inline-flex items-center gap-2 bg-blue-500/10 backdrop-blur-xl border border-blue-500/20 rounded-full px-4 py-2 mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
        <span className="text-xs font-black text-blue-100 uppercase tracking-[0.2em]">Global Support Active</span>
      </div>
      
      <h1 className="text-6xl md:text-8xl font-black text-white mb-8 tracking-tighter leading-[0.9]">
        We’re Here <br /> 
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0164E5] to-cyan-400">
          To Help You.
        </span>
      </h1>
      
      <p className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed">
        Whether you’re booking a luxury suite in Hargeisa or listing a villa in Mogadishu, our team ensures your journey is seamless.
      </p>
    </div>
  </section>
);

// =========================================================
//  3. INFO & FORM SECTION
// =========================================================
const ContactSection = () => (
  <section className="py-32 bg-slate-950 relative">
    <div className="container mx-auto px-6 max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Side: Information Bento */}
        <div className="lg:col-span-5 grid grid-cols-1 gap-6">
          
          {/* Headquarters Card */}
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] group hover:border-blue-500/50 transition-all">
            <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 transition-transform">
              <MapPin size={28} />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">HQ Hargeisa</h3>
            <p className="text-slate-400 leading-relaxed text-lg">
              Khayriyada Memorial Square,<br />
              Hargeisa, Somaliland
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Call Card */}
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] group hover:border-blue-500/50 transition-all">
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center text-green-400 mb-6">
                <Phone size={24} />
              </div>
              <h4 className="font-bold text-white mb-1">Direct Line</h4>
              <a href="tel:+2522521866" className="text-slate-400 hover:text-blue-400 transition-colors">+252 65 3227084</a>
            </div>

            {/* Email Card */}
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] group hover:border-blue-500/50 transition-all">
              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-400 mb-6">
                <Mail size={24} />
              </div>
              <h4 className="font-bold text-white mb-1">Email Us</h4>
              <a href="mailto:contact@guriup.so" className="text-slate-400 hover:text-blue-400 transition-colors text-sm">info@guriup.com</a>
            </div>
          </div>

          {/* Availability Card */}
          <div className="bg-gradient-to-br from-[#0164E5] to-blue-700 p-10 rounded-[2.5rem] text-white overflow-hidden relative group">
            <Zap className="absolute -right-4 -bottom-4 w-32 h-32 opacity-20 group-hover:scale-110 transition-transform" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <Clock size={20} />
                <span className="font-black uppercase tracking-widest text-sm">Operating Hours</span>
              </div>
              <h3 className="text-3xl font-bold mb-2">Always On.</h3>
              <p className="text-blue-100 text-lg">
                Sat - Thu: 9:00 AM – 5:00 PM <br />
                <span className="opacity-60 italic">Emergency support available 24/7.</span>
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Form Card */}
        <div className="lg:col-span-7 bg-white rounded-[3.5rem] p-10 md:p-16 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-[100px]"></div>
          <div className="relative z-10">
            <span className="text-[#0164E5] font-black tracking-widest uppercase text-sm mb-4 block">Drop us a line</span>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-8 tracking-tight">Send a Message</h2>
            <ContactForm />
          </div>
        </div>

      </div>
    </div>
  </section>
);

// =========================================================
//  4. MAP SECTION (FIXED SRC)
// =========================================================
const MapSection = () => (
  <section className="bg-slate-950 pb-32">
    <div className="container mx-auto px-6 max-w-7xl">
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-[#0164E5] to-cyan-500 rounded-[3.5rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
        <div className="relative bg-slate-900 rounded-[3rem] p-4 border border-slate-800">
          <div className="w-full h-[500px] rounded-[2.5rem] overflow-hidden grayscale contrast-125 hover:grayscale-0 transition-all duration-1000 ease-in-out relative">
            
            {/* --- FIX: Real Hargeisa Map Embed --- */}
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15730.076937666243!2d44.06423165!3d9.5623855!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1628bf1614e8250b%3A0x6e765360341762!2sHargeisa%2C%20Somaliland!5e0!3m2!1sen!2s!4v1700000000000!5m2!1sen!2s" 
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen={false} 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              title="GuriUp Hargeisa Headquarters"
              className="w-full h-full"
            ></iframe>
            
            {/* Floating Glass Card */}
            <div className="absolute top-10 right-10 bg-slate-900/80 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl max-w-sm hidden md:block">
               <div className="flex items-center gap-3 mb-4">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]"></div>
                  <span className="text-xs font-black text-white uppercase tracking-widest">Office Open</span>
               </div>
               <h4 className="font-bold text-white text-xl mb-2">Visit the Lab</h4>
               <p className="text-slate-300 text-sm mb-6">Our tech team is always brewing fresh ideas (and Somali tea). Come by for a demo.</p>
               <button className="w-full py-4 bg-white text-slate-900 font-black rounded-xl hover:bg-blue-500 hover:text-white transition-all flex items-center justify-center gap-2 group">
                 Get Directions <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

// =========================================================
//  5. MAIN PAGE & STRUCTURED DATA
// =========================================================
export default function ContactPage() {
  
  // JSON-LD for Local Business SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: 'GuriUp',
    image: 'https://guriup.com/images/logo.png',
    '@id': 'https://guriup.com',
    url: 'https://guriup.com/contact',
    telephone: '+252653227084',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Khayriyada Memorial Square',
      addressLocality: 'Hargeisa',
      addressCountry: 'SO'
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 9.5623855,
      longitude: 44.06423165
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
        opens: '09:00',
        closes: '17:00'
      }
    ]
  };

  return (
    <main className="font-sans selection:bg-blue-500 selection:text-white">
      {/* Inject Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <ContactHero />
      <ContactSection />
      <MapSection />
    </main>
  );
}