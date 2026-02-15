import type { Metadata } from 'next';
import Image from 'next/image';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import ContactForm from '@/components/features/ContactForm'; // Ensure you have this component created

export const metadata: Metadata = {
  title: 'Contact GuriUp - We are here to help',
  description: 'Get in touch with the GuriUp team for support, partnerships, or inquiries about properties and hotels in Africa.',
};

// =======================================================================
//  1. CONTACT HERO SECTION
// =======================================================================
const ContactHero = () => (
  <section className="relative h-[50vh] min-h-[400px] flex items-center justify-center text-center text-white">
    {/* Background Image with Overlay */}
    <div className="absolute inset-0 bg-black">
      <Image 
        src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2000" // Modern office/support image
        alt="Customer support team"
        fill
        className="object-cover opacity-40"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-transparent" />
    </div>

    {/* Hero Content */}
    <div className="relative z-10 px-6 max-w-4xl mx-auto animate-in fade-in zoom-in duration-700">
      <span className="inline-block py-1 px-3 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-bold uppercase tracking-wider mb-4 backdrop-blur-md">
        24/7 Support
      </span>
      <h1 className="text-5xl md:text-7xl font-black font-sans mb-6 tracking-tight leading-tight">
        Let's Start a <br /> Conversation.
      </h1>
      <p className="text-lg md:text-xl text-gray-200 font-medium leading-relaxed max-w-2xl mx-auto">
        Have a question about a property? Need help with your account? Our team is ready to assist you every step of the way.
      </p>
    </div>
  </section>
);

// =======================================================================
//  2. MAIN CONTACT SECTION (DETAILS + FORM)
// =======================================================================
const ContactSection = () => (
  <section className="py-24 bg-white relative">
    <div className="container mx-auto px-6 max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
        
        {/* Left Side: Contact Information */}
        <div className="space-y-12">
          <div>
            <h2 className="text-4xl font-black text-slate-900 mb-6 tracking-tight">Get in Touch</h2>
            <p className="text-lg text-slate-500 leading-relaxed">
              Our team is available to assist you. Whether you're looking for your dream home, 
              need help with a hotel booking, or want to partner with us, don't hesitate to reach out.
            </p>
          </div>
          
          <div className="grid gap-8">
            {/* Address */}
            <div className="flex items-start gap-5 group">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-[#0065eb] group-hover:bg-[#0065eb] group-hover:text-white transition-colors duration-300 shadow-sm">
                <MapPin size={24} />
              </div>
              <div>
                <h3 className="font-bold text-xl text-slate-900 mb-1">Our Headquarters</h3>
                <p className="text-slate-500">Khayriyada Memorial Square,<br />Hargeisa, Somaliland</p>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-start gap-5 group">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-[#0065eb] group-hover:bg-[#0065eb] group-hover:text-white transition-colors duration-300 shadow-sm">
                <Phone size={24} />
              </div>
              <div>
                <h3 className="font-bold text-xl text-slate-900 mb-1">Phone Support</h3>
                <p className="text-slate-500 mb-1">Mon-Fri from 8am to 5pm.</p>
                <a href="tel:+2522521866" className="text-[#0065eb] font-bold hover:underline">+252 2 521866</a>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-start gap-5 group">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-[#0065eb] group-hover:bg-[#0065eb] group-hover:text-white transition-colors duration-300 shadow-sm">
                <Mail size={24} />
              </div>
              <div>
                <h3 className="font-bold text-xl text-slate-900 mb-1">Email</h3>
                <p className="text-slate-500 mb-1">Our friendly team is here to help.</p>
                <a href="mailto:contact@guriup.so" className="text-[#0065eb] font-bold hover:underline">contact@guriup.so</a>
              </div>
            </div>

            {/* Hours */}
            <div className="flex items-start gap-5 group">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-[#0065eb] group-hover:bg-[#0065eb] group-hover:text-white transition-colors duration-300 shadow-sm">
                <Clock size={24} />
              </div>
              <div>
                <h3 className="font-bold text-xl text-slate-900 mb-1">Business Hours</h3>
                <p className="text-slate-500">Saturday - Thursday: 9:00 AM – 5:00 PM</p>
                <p className="text-slate-400 text-sm font-medium mt-1">Friday: Closed</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Contact Form Card */}
        <div className="bg-slate-50 p-8 md:p-10 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
          <div className="mb-8">
            <h3 className="text-2xl font-black text-slate-900 mb-2">Send us a Message</h3>
            <p className="text-slate-500">We usually respond within 24 hours.</p>
          </div>
          <ContactForm />
        </div>

      </div>
    </div>
  </section>
);

// =======================================================================
//  3. MAP SECTION
// =======================================================================
const MapSection = () => (
  <section className="bg-white pb-24">
    <div className="container mx-auto px-6 max-w-7xl">
      <div className="bg-slate-900 rounded-[2.5rem] p-4 shadow-2xl">
        <div className="w-full h-[450px] rounded-[2rem] overflow-hidden relative grayscale hover:grayscale-0 transition-all duration-700">
          <iframe 
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3923.472793792623!2d44.0626353749547!3d9.560647182220796!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1628bf0a07205a25%3A0x6295537552553955!2sKhayriyada%20Memorial%20Square!5e0!3m2!1sen!2sso!4v1708092837492!5m2!1sen!2sso"
            width="100%" 
            height="100%" 
            style={{ border: 0 }} 
            allowFullScreen={false} 
            loading="lazy" 
            referrerPolicy="no-referrer-when-downgrade"
            title="GuriUp Office Location"
            className="w-full h-full"
          ></iframe>
          
          {/* Custom Overlay Card on Map */}
          <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-lg max-w-xs hidden md:block">
             <div className="flex items-center gap-3 mb-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-black text-slate-900 uppercase tracking-widest">Open Now</span>
             </div>
             <h4 className="font-bold text-slate-900 text-lg">Visit our Office</h4>
             <p className="text-slate-500 text-sm mt-1">Come say hello! We have coffee.</p>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default function ContactPage() {
  return (
    <main className="font-sans">
      <ContactHero />
      <ContactSection />
      <MapSection />
    </main>
  );
}