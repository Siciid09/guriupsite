import { ShieldCheck, Zap, Award, Headphones, Smartphone, MapPin, Star, Download } from 'lucide-react';

const WhyChooseUs = () => (
  <section className="py-16 bg-white">
    <div className="container mx-auto px-6">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold">Your Trusted Partner in Property</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {[
          { icon: <ShieldCheck size={28} />, title: "Verified Listings", desc: "Every property is vetted for quality and authenticity." },
          { icon: <Zap size={28} />, title: "Instant Booking", desc: "Book your desired space in just a few simple clicks." },
          { icon: <Award size={28} />, title: "Best Price Guarantee", desc: "We ensure you get unbeatable value across all listings." },
        ].map((item, i) => (
          <div key={i} className="bg-slate-50 p-6 rounded-2xl flex items-start gap-5">
            <div className="bg-blue-100 text-[#0164E5] w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0">{item.icon}</div>
            <div>
              <h3 className="font-bold text-lg mb-1">{item.title}</h3>
              <p className="text-gray-500 text-sm">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const Testimonials = () => (
  <section className="py-16 bg-slate-50">
    <div className="container mx-auto px-6 text-center">
      <h2 className="text-3xl font-bold mb-8">What Our Clients Say</h2>
      <div className="max-w-2xl mx-auto">
        <img src="https://i.pravatar.cc/150?u=fatima" alt="Fatima Omar" className="w-20 h-20 rounded-full mx-auto mb-4" />
        <div className="flex justify-center text-amber-500 mb-4">{[...Array(5)].map((_, i) => <Star key={i} size={20} className="fill-current" />)}</div>
        <p className="text-gray-600 italic text-lg mb-4">"Using GuriUp was a game-changer. I found the perfect apartment in Mogadishu in less than a week. Highly recommended!"</p>
        <h4 className="font-bold text-lg">Fatima Omar</h4>
      </div>
    </div>
  </section>
);

const DownloadApp = () => (
  <section className="bg-[#0164E5] text-white">
    <div className="container mx-auto px-6 py-20 text-center">
      <h2 className="text-4xl font-bold mb-4">Your Next Home, in Your Pocket</h2>
      <p className="text-blue-200 mb-8 max-w-md mx-auto">Get exclusive deals, manage bookings, and find properties faster with the free GuriUp mobile app.</p>
      <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
        <a href="#" className="bg-black text-white px-6 py-3 rounded-lg flex items-center gap-3 hover:bg-gray-800"><Download size={20} /> App Store</a>
        <a href="#" className="bg-black text-white px-6 py-3 rounded-lg flex items-center gap-3 hover:bg-gray-800"><Download size={20} /> Google Play</a>
      </div>
    </div>
  </section>
);


export default function BottomSections() {
  return (
    <>
      <WhyChooseUs />
      <Testimonials />
      <DownloadApp />
    </>
  );
}