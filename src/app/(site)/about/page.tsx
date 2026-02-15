import type { Metadata } from 'next';
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
  MapPin
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'About GuriUp | The Future of African Real Estate',
  description:
    'We are building the digital infrastructure for real estate across Africa. Discover our mission to connect millions to their dream homes and businesses.',
};

// =======================================================================
//  1. HERO SECTION: THE BIG VISION
// =======================================================================
const AboutHero = () => (
  <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
    {/* Background Image with Modern Gradient Overlay */}
    <div className="absolute inset-0 z-0">
      <Image
        src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80"
        alt="Modern African City Skyline"
        fill
        className="object-cover"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-[#0164E5]/90" />
    </div>

    <div className="relative z-10 container mx-auto px-6 text-center">
      <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-1.5 mb-8 animate-fade-in-up">
        <span className="flex h-2 w-2 rounded-full bg-green-400"></span>
        <span className="text-sm font-medium text-white tracking-wide">Live in 12+ African Cities</span>
      </div>
      
      <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white mb-6 leading-[1.1] tracking-tight">
        Building Africa's <br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-white">
          Digital Foundation.
        </span>
      </h1>
      
      <p className="text-lg md:text-2xl text-gray-200 max-w-3xl mx-auto font-light leading-relaxed mb-10">
        GuriUp isn't just an app. It is the operating system for real estate in the Horn of Africa and beyond. We connect the diaspora, locals, and investors to the continent's booming property market.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link href="#our-story" className="bg-white text-black font-bold px-8 py-4 rounded-full hover:bg-gray-100 transition-all flex items-center justify-center gap-2">
          Read Our Story <ArrowRight size={20} />
        </Link>
      </div>
    </div>
  </section>
);

// =======================================================================
//  2. IMPACT METRICS (SOCIAL PROOF)
// =======================================================================
const ImpactMetrics = () => (
  <section className="py-12 bg-white border-b border-gray-100 relative -mt-20 z-20">
    <div className="container mx-auto px-6">
      <div className="bg-white rounded-3xl shadow-xl p-10 grid grid-cols-2 md:grid-cols-4 gap-8">
        {[
          { label: 'Active Users', value: '500K+', icon: <Users className="text-[#0164E5]" /> },
          { label: 'Properties Listed', value: '15,000+', icon: <Building2 className="text-[#0164E5]" /> },
          { label: 'Cities Covered', value: '12+', icon: <MapPin className="text-[#0164E5]" /> },
          { label: 'Transaction Value', value: '$25M+', icon: <TrendingUp className="text-[#0164E5]" /> },
        ].map((stat, idx) => (
          <div key={idx} className="text-center md:text-left md:pl-8 md:border-l border-gray-100 first:border-0">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
              {stat.icon}
              <span className="text-gray-500 text-sm font-bold uppercase tracking-wider">{stat.label}</span>
            </div>
            <h3 className="text-4xl md:text-5xl font-black text-black">{stat.value}</h3>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// =======================================================================
//  3. THE VISION (MODERN SPLIT LAYOUT)
// =======================================================================
const TheVision = () => (
  <section id="our-story" className="py-24 bg-white overflow-hidden">
    <div className="container mx-auto px-6">
      <div className="flex flex-col lg:flex-row items-center gap-16">
        <div className="lg:w-1/2">
          <div className="relative">
            <div className="absolute -top-10 -left-10 w-72 h-72 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
            <div className="absolute -bottom-10 -right-10 w-72 h-72 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
            <Image
              src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80"
              alt="Strategic meeting"
              width={700}
              height={800}
              className="relative rounded-[2rem] shadow-2xl z-10 object-cover"
            />
          </div>
        </div>
        
        <div className="lg:w-1/2">
          <span className="text-[#0164E5] font-bold tracking-widest uppercase text-sm">Our Origin</span>
          <h2 className="text-4xl md:text-5xl font-bold text-black mt-4 mb-6 leading-tight">
            Bridging the Gap Between <br /> Ambition and Reality.
          </h2>
          <div className="space-y-6 text-lg text-gray-600 leading-relaxed">
            <p>
              It started with a simple frustration: trying to rent a safe home in Hargeisa while living in London. The process was fragmented, reliant on word-of-mouth, and lacked transparency.
            </p>
            <p>
              We realized this wasn't just a Somali problem; it was a continental one. Africa's urbanization is happening faster than anywhere else on Earth, yet the digital tools to navigate it were missing.
            </p>
            <p className="font-medium text-black border-l-4 border-[#0164E5] pl-6">
              "We didn't build GuriUp just to list houses. We built it to create trust. We are the bridge connecting the global diaspora to local opportunities, fueling development one booking at a time."
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
);

// =======================================================================
//  4. CORE VALUES (BENTO GRID STYLE)
// =======================================================================
const CoreValues = () => (
  <section className="py-24 bg-slate-50">
    <div className="container mx-auto px-6">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h2 className="text-3xl md:text-5xl font-bold text-black mb-6">Built on Unshakeable Principles</h2>
        <p className="text-gray-600 text-lg">To revolutionize a market, you need more than code. You need a code of ethics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Large Card */}
        <div className="md:col-span-2 bg-white p-10 rounded-[2rem] shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 flex flex-col justify-center">
          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
            <ShieldCheck size={32} className="text-[#0164E5]" />
          </div>
          <h3 className="text-2xl font-bold text-black mb-3">Radical Transparency</h3>
          <p className="text-gray-600 text-lg">
            No hidden fees. No fake listings. We verify every agent and property to ensure that what you see on your screen is exactly what you get on the ground. We are eliminating the "risk premium" of doing business in Africa.
          </p>
        </div>

        {/* Card 2 */}
        <div className="bg-[#0164E5] p-10 rounded-[2rem] shadow-lg text-white flex flex-col justify-center">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
            <Zap size={32} className="text-white" />
          </div>
          <h3 className="text-2xl font-bold mb-3">Velocity</h3>
          <p className="text-blue-100">
            Real estate usually moves slow. We move fast. Instant bookings, real-time chats, and digital contracts.
          </p>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-10 rounded-[2rem] shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100">
          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
            <Globe size={32} className="text-[#0164E5]" />
          </div>
          <h3 className="text-2xl font-bold text-black mb-3">Pan-African Vision</h3>
          <p className="text-gray-600">
            Our roots are in Africa, but our horizon is the continent. We design for scalability across borders.
          </p>
        </div>

        {/* Card 4 */}
        <div className="md:col-span-2 bg-white p-10 rounded-[2rem] shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100">
          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
            <Users size={32} className="text-[#0164E5]" />
          </div>
          <h3 className="text-2xl font-bold text-black mb-3">Community First</h3>
          <p className="text-gray-600 text-lg">
            We don't just serve customers; we build communities. From the local agent building their business to the family returning home, we measure success by their growth.
          </p>
        </div>
      </div>
    </div>
  </section>
);

// =======================================================================
//  5. LEADERSHIP (CLEAN & BOLD)
// =======================================================================
const Leadership = () => (
  <section className="py-24 bg-white">
    <div className="container mx-auto px-6">
      <div className="flex flex-col md:flex-row justify-between items-end mb-16">
        <div>
          <span className="text-[#0164E5] font-bold tracking-widest uppercase text-sm">The Minds Behind GuriUp</span>
          <h2 className="text-4xl font-bold text-black mt-2">Meet Leadership</h2>
        </div>
        <Link href="#" className="hidden md:flex items-center gap-2 text-[#0164E5] font-bold hover:underline">
          View all careers <ArrowRight size={18} />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { name: 'Aisha Hassan', role: 'CEO & Founder', bio: 'Ex-Goldman Sachs. Visionary focused on African prop-tech.', img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80' },
          { name: 'Yusuf Ibrahim', role: 'CTO', bio: 'Systems Architect who scaled platforms for 10M+ users.', img: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?q=80' },
          { name: 'Fatima Omar', role: 'Head of Growth', bio: 'Marketing strategist specializing in emerging markets.', img: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80' },
        ].map((leader) => (
          <div key={leader.name} className="group">
            <div className="relative h-[400px] mb-6 overflow-hidden rounded-2xl">
              <Image 
                src={leader.img} 
                alt={leader.name} 
                fill 
                className="object-cover group-hover:scale-105 transition-transform duration-500" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                <p className="text-white text-sm">{leader.bio}</p>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-black">{leader.name}</h3>
            <p className="text-[#0164E5] font-medium">{leader.role}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// =======================================================================
//  6. THE PRODUCT ECOSYSTEM (APP)
// =======================================================================
const Ecosystem = () => (
  <section className="bg-slate-900 py-24 overflow-hidden relative">
    {/* Background Decorations */}
    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3"></div>
    
    <div className="container mx-auto px-6 relative z-10">
      <div className="flex flex-col lg:flex-row items-center gap-16">
        <div className="lg:w-1/2 text-white">
          <h2 className="text-4xl md:text-6xl font-black mb-6">
            The Power of GuriUp <br /> in Your Pocket.
          </h2>
          <p className="text-gray-400 text-lg mb-8 leading-relaxed">
            Experience the market in real-time. Whether you are in Minneapolis or Mogadishu, our app gives you total control over your property search and management.
          </p>
          
          <ul className="space-y-4 mb-10">
            {[
              'Real-time notifications for price drops',
              'Virtual 3D tours of premium listings',
              'Secure in-app payments and contracts',
              'Direct chat with verified owners'
            ].map(item => (
              <li key={item} className="flex items-center gap-3">
                <div className="bg-green-500/20 p-1 rounded-full">
                  <ShieldCheck size={16} className="text-green-400" />
                </div>
                <span className="text-gray-200">{item}</span>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap gap-4">
            <button className="bg-white text-black px-8 py-3 rounded-xl font-bold flex items-center gap-3 hover:bg-gray-200 transition-colors">
              <Download size={20} /> App Store
            </button>
            <button className="border border-white/30 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-3 hover:bg-white/10 transition-colors">
              <Download size={20} /> Google Play
            </button>
          </div>
        </div>

        <div className="lg:w-1/2 relative">
          <div className="relative z-10 transform lg:rotate-[-6deg] hover:rotate-0 transition-transform duration-500">
             <Image 
                src="https://images.unsplash.com/photo-1616469829941-c7200ed5be2c?q=80"
                alt="App Interface"
                width={350}
                height={700}
                className="rounded-[3rem] border-8 border-slate-800 shadow-2xl mx-auto"
             />
             {/* Floating Badge */}
             <div className="absolute top-1/4 -left-10 bg-white p-4 rounded-2xl shadow-xl flex items-center gap-4 animate-bounce hidden md:flex">
                <div className="bg-green-100 p-3 rounded-full text-green-600">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase">Status</p>
                  <p className="text-lg font-black text-black">Booking Confirmed</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

// =======================================================================
//  7. FINAL CTA
// =======================================================================
const FinalCTA = () => (
  <section className="py-32 bg-[#0164E5] text-white text-center">
    <div className="container mx-auto px-6">
      <h2 className="text-4xl md:text-6xl font-black mb-8">Ready to find your place?</h2>
      <p className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto">
        Join over 500,000 users revolutionizing how Africa lives, works, and stays.
      </p>
      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <Link href="/properties" className="bg-white text-[#0164E5] px-10 py-5 rounded-full font-black text-lg hover:shadow-2xl hover:scale-105 transition-all">
          Browse Properties
        </Link>
        <Link href="/contact" className="bg-[#004bb5] text-white border border-[#004bb5] px-10 py-5 rounded-full font-bold text-lg hover:bg-transparent hover:border-white transition-all">
          Contact Sales
        </Link>
      </div>
    </div>
  </section>
);

// =======================================================================
//  MAIN COMPONENT
// =======================================================================
export default function AboutPage() {
  return (
    <>
      <AboutHero />
      <TheVision />
      <ImpactMetrics />
      <CoreValues />
      <Leadership />
      <Ecosystem />
      <FinalCTA />
    </>
  );
}