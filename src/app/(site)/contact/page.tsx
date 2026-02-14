import type { Metadata } from 'next';
import Image from 'next/image';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import ContactForm from '@/components/features/ContactForm';

export const metadata: Metadata = {
  title: 'Contact GuriUp',
  description: 'Get in touch with the GuriUp team. We are here to help with your property and hotel needs in Somalia.',
};

// =======================================================================
//  1. CONTACT HERO SECTION
// =======================================================================
const ContactHero = () => (
  <section className="relative h-[40vh] min-h-[300px] flex items-center justify-center text-center text-white">
    <div className="absolute inset-0 bg-black">
      <Image 
        src="https://images.unsplash.com/photo-1556740738-b6a63e27c4df?q=80"
        alt="Customer service representative"
        fill
        className="object-cover opacity-30"
        priority
      />
    </div>
    <div className="relative z-10 px-6">
      <h1 className="text-4xl md:text-6xl font-extrabold font-sans mb-4 tracking-tight">Contact Us</h1>
      <p className="text-lg md:text-xl max-w-3xl mx-auto text-blue-100">
        We&apos;re here to help. Reach out to us with any questions or inquiries.
      </p>
    </div>
  </section>
);

// =======================================================================
//  2. MAIN CONTACT SECTION (DETAILS + FORM)
// =======================================================================
const ContactSection = () => (
  <section className="py-20 bg-white">
    <div className="container mx-auto px-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        
        {/* Left Side: Contact Details */}
        <div>
          <h2 className="text-3xl font-bold text-black mb-6">Get in Touch</h2>
          <p className="text-gray-600 mb-8">
            Our team is available to assist you. Whether you&apos;re looking for your dream home, 
            need help with a hotel booking, or want to partner with us, don&apos;t hesitate to reach out.
          </p>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <MapPin className="text-[#0164E5] mt-1 flex-shrink-0" size={24} />
              <div>
                <h3 className="font-bold text-lg text-black">Our Headquarters</h3>
                <p className="text-gray-600">Khayriyada Memorial Square, Hargeisa, Somalia</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Phone className="text-[#0164E5] mt-1 flex-shrink-0" size={24} />
              <div>
                <h3 className="font-bold text-lg text-black">Phone</h3>
                <p className="text-gray-600">+252 2 521866</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Mail className="text-[#0164E5] mt-1 flex-shrink-0" size={24} />
              <div>
                <h3 className="font-bold text-lg text-black">Email</h3>
                <p className="text-gray-600">contact@guriup.so</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Clock className="text-[#0164E5] mt-1 flex-shrink-0" size={24} />
              <div>
                <h3 className="font-bold text-lg text-black">Business Hours</h3>
                <p className="text-gray-600">Saturday - Thursday: 9:00 AM – 5:00 PM</p>
                <p className="text-gray-600">Friday: Closed</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Contact Form */}
        <div className="bg-slate-50 p-8 rounded-2xl shadow-sm">
          <h3 className="text-2xl font-bold text-black mb-2">Send Us a Message</h3>
          <p className="text-gray-600 mb-6 text-sm">Can&apos;t find what you&apos;re looking for? Let us know.</p>
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
  <section className="bg-slate-100">
    <div className="container mx-auto px-6 py-20 text-center">
      <h2 className="text-3xl font-bold text-black mb-8">Our Location</h2>
      <div className="w-full h-[400px] rounded-xl overflow-hidden shadow-lg">
        <iframe 
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3941.1234567890!2d44.0621!3d9.5600!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zOcKwMzMnMzYuMCJOIDQ0wrAwMyc0My42IkU!5e0!3m2!1sen!2sso!4v1234567890"
          width="100%" 
          height="100%" 
          style={{ border: 0 }} 
          allowFullScreen={false} 
          loading="lazy" 
          referrerPolicy="no-referrer-when-downgrade"
          title="GuriUp Office Location"
        ></iframe>
      </div>
    </div>
  </section>
);

export default function ContactPage() {
  return (
    <main>
      <ContactHero />
      <ContactSection />
      <MapSection />
    </main>
  );
}