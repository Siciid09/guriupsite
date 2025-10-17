import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Download, Eye, Target, Heart, Users, Phone } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About GuriUp',
  description: 'Learn about our mission to revolutionize the real estate and hotel booking market across Somalia.',
};

// =======================================================================
//  1. ABOUT US HERO SECTION
// =======================================================================
const AboutHero = () => (
    <section className="relative h-[50vh] min-h-[400px] flex items-center justify-center text-center text-white">
        <div className="absolute inset-0 bg-black">
            <Image 
              src="https://images.unsplash.com/photo-1521791136064-7986c2920216?q=80"
              alt="GuriUp team collaborating"
              fill
              className="object-cover opacity-40"
              priority
            />
        </div>
        <div className="relative z-10 px-6">
            <h1 className="text-4xl md:text-6xl font-extrabold font-sans mb-4 tracking-tight">We're Reimagining Real Estate in Somalia</h1>
            <p className="text-lg md:text-xl max-w-3xl mx-auto text-blue-100">GuriUp is more than an app; it's a movement to make finding a home or a hotel simple, secure, and accessible for all Somalis.</p>
        </div>
    </section>
);

// =======================================================================
//  2. OUR STORY & MISSION SECTION
// =======================================================================
const OurStory = () => (
    <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div className="text-left">
                    <h2 className="text-3xl font-bold text-black mb-6">Our Story</h2>
                    <p className="text-gray-600 mb-4 leading-relaxed">
                        GuriUp was founded by a team of Somali professionals who experienced firsthand the challenges of finding reliable property and hotel information. We saw a need for a central, trustworthy platform that connects people to places, whether it's a family home in Hargeisa, a business office in Mogadishu, or a hotel in Kismayo.
                    </p>
                    <h3 className="text-2xl font-bold text-black mt-8 mb-4">Our Mission</h3>
                    <p className="text-gray-600 leading-relaxed">
                        Our mission is to empower every Somali, at home and abroad, with the tools and information they need to find their perfect space. We are committed to building a transparent, efficient, and user-friendly ecosystem for the Somali real estate market.
                    </p>
                </div>
                <div>
                    <Image 
                        src="https://images.unsplash.com/photo-1600585152220-90363fe7e115?q=80"
                        alt="Modern architectural home"
                        width={800}
                        height={900}
                        className="rounded-2xl shadow-xl w-full object-cover"
                    />
                </div>
            </div>
        </div>
    </section>
);

// =======================================================================
//  3. OUR VALUES SECTION
// =======================================================================
const OurValues = () => (
  <section className="py-20 bg-slate-50">
    <div className="container mx-auto px-6">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-black">Our Core Values</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {[
          { icon: <Eye size={32} />, title: "Transparency", desc: "Clear, honest information on every listing." },
          { icon: <Heart size={32} />, title: "Trust", desc: "Verified listings and secure transactions you can rely on." },
          { icon: <Target size={32} />, title: "Innovation", desc: "Continuously improving our technology to serve you better." },
        ].map((item) => (
          <div key={item.title} className="text-center p-6 bg-white rounded-lg shadow-sm">
            <div className="text-[#0164E5] w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">{item.icon}</div>
            <h3 className="font-bold text-lg text-black mb-2">{item.title}</h3>
            <p className="text-gray-600 text-sm">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);


// =======================================================================
//  4. MEET THE TEAM SECTION
// =======================================================================
const MeetTheTeam = () => (
    <section className="py-20 bg-white">
        <div className="container mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold text-black mb-12">Meet Our Leaders</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10 max-w-4xl mx-auto">
                {[
                    { name: 'Aisha Hassan', role: 'Founder & CEO', image: 'https://i.pravatar.cc/150?u=aisha-ceo' },
                    { name: 'Yusuf Ibrahim', role: 'Head of Technology', image: 'https://i.pravatar.cc/150?u=yusuf-cto' },
                    { name: 'Fatima Omar', role: 'Head of Operations', image: 'https://i.pravatar.cc/150?u=fatima-coo' },
                ].map(member => (
                    <div key={member.name}>
                        <Image src={member.image} alt={member.name} width={150} height={150} className="rounded-full mx-auto mb-4 shadow-md" />
                        <h3 className="font-bold text-xl text-black">{member.name}</h3>
                        <p className="text-gray-500">{member.role}</p>
                    </div>
                ))}
            </div>
        </div>
    </section>
);


// =======================================================================
//  5. DOWNLOAD APP SECTION
// =======================================================================
const DownloadApp = () => (
  <section className="bg-[#0164E5] text-white">
    <div className="container mx-auto px-6 py-20 text-center">
      <h2 className="text-4xl font-bold mb-4">Your Next Home, in Your Pocket</h2>
      <p className="text-blue-200 mb-8 max-w-md mx-auto">Get exclusive deals, manage bookings, and find properties faster with the free GuriUp mobile app.</p>
      <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
        <Link href="#" className="bg-black text-white w-52 px-6 py-3 rounded-lg flex items-center justify-center gap-3 hover:bg-gray-800 transition-colors">
          <Download size={20} />
          <div><p className="text-xs text-left">Download on the</p><p className="text-lg font-semibold">App Store</p></div>
        </Link>
        <Link href="#" className="bg-black text-white w-52 px-6 py-3 rounded-lg flex items-center justify-center gap-3 hover:bg-gray-800 transition-colors">
          <Download size={20} />
          <div><p className="text-xs text-left">GET IT ON</p><p className="text-lg font-semibold">Google Play</p></div>
        </Link>
      </div>
    </div>
  </section>
);


// =======================================================================
//  6. CONTACT US / GET IN TOUCH SECTION
// =======================================================================
const GetInTouch = () => (
    <section className="py-20 bg-white">
        <div className="container mx-auto px-6 text-center max-w-3xl">
            <Users size={48} className="mx-auto text-[#0164E5] mb-4" />
            <h2 className="text-3xl font-bold text-black mb-4">We'd Love to Hear From You</h2>
            <p className="text-gray-600 mb-8">Whether you're a potential customer, an interested agent, or a future partner, we're ready to answer your questions.</p>
            <Link href="/contact" className="bg-[#0164E5] text-white font-bold px-8 py-3.5 rounded-full shadow-md hover:shadow-lg transition-all duration-300 inline-flex items-center gap-2">
                <Phone size={20} /> Contact Us Today
            </Link>
        </div>
    </section>
);


// =======================================================================
//  MAIN ABOUT US PAGE COMPONENT
// =======================================================================
export default function AboutPage() {
  return (
    <>
        <AboutHero />
        <OurStory />
        <OurValues />
        <MeetTheTeam />
        <DownloadApp />
        <GetInTouch />
    </>
  );
}