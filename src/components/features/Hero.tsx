import Link from 'next/link';

export default function Hero() {
  return (
    <section id="home" className="relative h-[70vh] min-h-[500px] flex items-center justify-center text-white">
      <div className="absolute inset-0 bg-black">
        <img
          src="https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=2574&auto=format&fit=crop"
          className="w-full h-full object-cover opacity-40"
          alt="Modern luxury house in Hargeisa"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-[#0164E5]/60 to-transparent"></div>
      <div className="relative z-10 text-center px-6">
        <h1 className="text-4xl md:text-6xl font-extrabold font-sans mb-4 tracking-tight">
          Your Perfect Space is Waiting in Hargeisa
        </h1>
        <p className="text-lg md:text-xl max-w-3xl mx-auto mb-8 text-blue-100">
          Discover Hargeisa's finest properties and hotels. Find, book, and experience your next home or stay.
        </p>
        <Link 
          href="/properties" 
          className="bg-white text-[#0164E5] font-bold px-8 py-3.5 rounded-full shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300"
        >
          Explore Listings
        </Link>
      </div>
    </section>
  );
}