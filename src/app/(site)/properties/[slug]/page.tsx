'use client';

import { useState, useEffect } from 'react';
import { getPropertyBySlug, getAgentDetails, getRelatedProperties } from '../../../lib/data';
import type { Property, Agent } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { BedDouble, Bath, Car, CheckCircle, MapPin, MessageSquare, Calendar, Home, ChevronLeft, ChevronRight, Expand, X, ShieldCheck, Droplets, Download } from 'lucide-react';
import ListingCard from '@/components/shared/ListingCard';

// =======================================================================
//  1. Interactive Image Gallery Component
// =======================================================================
const ImageGallery = ({ images, title }: { images: string[], title: string }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      if (images && images.length > 1) {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
      }
    }, 5000); // Change image every 5 seconds
    return () => clearInterval(timer);
  }, [images]);

  const goToPrevious = () => {
    if (!images) return;
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };

  const goToNext = () => {
    if (!images) return;
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  if (!images || images.length === 0) {
    return <div className="w-full h-[400px] bg-slate-200 flex items-center justify-center"><p>No Image Available</p></div>;
  }

  return (
    <>
      <div className="relative w-full h-[300px] md:h-[500px] bg-slate-200 overflow-hidden group">
        <Image 
          src={images[currentIndex]}
          alt={`${title} - image ${currentIndex + 1}`}
          fill
          className="object-cover transition-all duration-500 ease-in-out"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        
        {images.length > 1 && (
          <>
            <button onClick={goToPrevious} className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"><ChevronLeft size={24} /></button>
            <button onClick={goToNext} className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"><ChevronRight size={24} /></button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
              {images.map((_, index) => (
                <button key={index} onClick={() => setCurrentIndex(index)} className={`w-2 h-2 rounded-full transition-colors ${currentIndex === index ? 'bg-white' : 'bg-white/50'}`}></button>
              ))}
            </div>
          </>
        )}
        
        <button onClick={() => setIsFullScreen(true)} className="absolute top-4 right-4 bg-black/40 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <Expand size={20} />
        </button>
      </div>

      {isFullScreen && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center" onClick={() => setIsFullScreen(false)}>
          <button className="absolute top-6 right-6 text-white z-50"><X size={32} /></button>
          <div className="relative w-full h-full max-w-5xl max-h-[90vh]"><Image src={images[currentIndex]} alt={title} fill className="object-contain" /></div>
        </div>
      )}
    </>
  );
};

// =======================================================================
//  2. All Other Helper Components for the Page
// =======================================================================

const FeaturesGrid = ({ property }: { property: Property }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center bg-slate-50 p-6 rounded-2xl">
    <div className="flex flex-col items-center"><Home size={28} className="text-[#0164E5] mb-2"/> <span className="font-bold text-black">{property.type}</span></div>
    <div className="flex flex-col items-center"><BedDouble size={28} className="text-[#0164E5] mb-2"/> <span className="font-bold text-black">{property.features.bedrooms} Beds</span></div>
    <div className="flex flex-col items-center"><Bath size={28} className="text-[#0164E5] mb-2"/> <span className="font-bold text-black">{property.features.bathrooms} Baths</span></div>
    <div className="flex flex-col items-center"><Car size={28} className="text-[#0164E5] mb-2"/> <span className="font-bold text-black">{property.features.size} m²</span></div>
  </div>
);

const AmenitiesList = ({ property }: { property: Property }) => {
    const allFeatures = {
      'Furnished': { value: property.features.isFurnished, icon: <BedDouble size={20} /> },
      'Gated': { value: property.features.hasGate, icon: <ShieldCheck size={20} /> },
      'Pool': { value: property.features.hasPool, icon: <Droplets size={20} /> },
      'Parking': { value: property.features.hasParking, icon: <Car size={20} /> },
    };
    const availableFeatures = Object.entries(allFeatures).filter(([, data]) => data.value);
    if (availableFeatures.length === 0) return null;

    return (
        <div className="mt-12">
            <h3 className="text-2xl font-bold text-black mb-6">Amenities</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {availableFeatures.map(([label, data]) => (
                    <div key={label} className="flex items-center gap-3 bg-slate-50 p-4 rounded-lg">
                        <div className="text-[#0164E5]">{data.icon}</div>
                        <span className="font-semibold text-black">{label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const LocationMap = ({ coords, title }: { coords: string, title: string }) => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    // FIX: This is the correct Google Maps Embed URL format
    const embedUrl = `https://www.google.com/maps/embed/v1/view?key=${apiKey}&center=${coords.replace(/\s/g, '')}&zoom=15`;

    return (
        <div className="mt-12">
            <h3 className="text-2xl font-bold text-black mb-6">Location</h3>
            <div className="w-full h-80 rounded-2xl overflow-hidden shadow-md border">
                <iframe width="100%" height="100%" style={{ border: 0 }} src={embedUrl} allowFullScreen title={`Map location for ${title}`}></iframe>
            </div>
            {!apiKey && <p className="text-xs text-red-500 mt-2">Note: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is missing from .env.local. The map will not display correctly.</p>}
        </div>
    );
};

const AgentCard = ({ agent, property }: { agent: Agent | null, property: Property }) => {
    const chatMessage = `Salaam, I am interested in your property listing: '${property.title}'.`;
    const whatsappLink = `https://wa.me/${agent?.phoneNumber}?text=${encodeURIComponent(chatMessage)}`;

    return (
        <div className="mt-12">
            <h3 className="text-2xl font-bold text-black mb-6">Contact Agent</h3>
            <div className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {/* FIX: Only render image if photoURL exists */}
                    {agent?.photoURL && (
                        <Image src={agent.photoURL} alt={agent.displayName || 'Agent'} width={64} height={64} className="rounded-full object-cover" />
                    )}
                    <div>
                        <p className="font-bold text-lg text-black">{agent?.displayName || property.agentName}</p>
                        <p className="text-sm text-gray-600">Your Trusted Real Estate Partner</p>
                    </div>
                </div>
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="p-4 bg-blue-100 rounded-full text-[#0164E5] hover:bg-blue-200 transition-colors">
                    <MessageSquare size={24} />
                </a>
            </div>
        </div>
    );
};

const RelatedProperties = ({ properties }: { properties: Property[] }) => {
    if (!properties || properties.length === 0) {
        return (
            <section className="py-20 bg-slate-50">
                <div className="container mx-auto px-6">
                    <h2 className="text-3xl font-bold text-black mb-8">Similar Properties</h2>
                    <p className="text-gray-600">No similar properties found in this area.</p>
                </div>
            </section>
        );
    }
    return (
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-black mb-8">Similar Properties</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {properties.map(prop => <ListingCard key={prop.id} listing={prop} />)}
          </div>
        </div>
      </section>
    );
};

const FloatingActionBar = ({ property }: { property: Property }) => {
  const tourMessage = `Salaam, I would like to request a tour for the property: '${property.title}'. Please let me know the available times.`;
  const whatsappLink = `https://wa.me/?text=${encodeURIComponent(tourMessage)}`;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white shadow-top p-3 border-t z-40 lg:hidden">
      <div className="flex items-center gap-4 max-w-lg mx-auto">
        <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="flex-1 text-center bg-blue-100 text-[#0164E5] font-bold py-3 rounded-xl flex items-center justify-center gap-2">
          <MessageSquare size={20} /> Chat
        </a>
        <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="flex-1 text-center bg-[#0164E5] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2">
          <Calendar size={20} /> Request a Tour
        </a>
      </div>
    </div>
  );
};

// =======================================================================
//  3. MAIN PROPERTY DETAIL PAGE (CLIENT COMPONENT)
// =======================================================================
export default function PropertyDetailPage({ params }: { params: { slug: string } }) {
  const [property, setProperty] = useState<Property | null>(null);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [related, setRelated] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('About');

  useEffect(() => {
    const fetchData = async () => {
      // FIX: The params.slug is used correctly inside useEffect, resolving the warning.
      setLoading(true);
      const prop = await getPropertyBySlug(params.slug);
      if (prop) {
        setProperty(prop);
        const [agentData, relatedData] = await Promise.all([
          prop.agentId ? getAgentDetails(prop.agentId) : null,
          getRelatedProperties(prop),
        ]);
        setAgent(agentData);
        setRelated(relatedData);
      }
      setLoading(false);
    };
    fetchData();
  }, [params.slug]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen"><p>Loading Property...</p></div>;
  }

  if (!property) {
    return <div className="flex items-center justify-center h-screen"><p>Property not found.</p></div>;
  }

  return (
    <>
      <div className="bg-white pb-24 lg:pb-12">
        <div className="relative">
          <ImageGallery images={property.images} title={property.title} />
          <div className="absolute bottom-6 left-6 md:bottom-10 md:left-10 text-white z-10">
            <h1 className="text-3xl md:text-5xl font-extrabold font-sans">{property.title}</h1>
            <p className="text-lg flex items-center gap-2 mt-2">
              <MapPin size={20} /> {property.location.area}, {property.location.city}
            </p>
          </div>
        </div>
        
        <div className="container mx-auto px-6 py-8">
          <div className="border-b mb-8">
              <nav className="flex space-x-8 -mb-px">
                  {['About', 'Gallery'].map(tabName => (
                      <button 
                          key={tabName} 
                          onClick={() => setActiveTab(tabName)}
                          className={`py-4 px-1 font-semibold text-lg transition-colors ${activeTab === tabName ? 'border-b-2 border-[#0164E5] text-[#0164E5]' : 'text-gray-500 hover:text-black'}`}
                      >
                          {tabName}
                      </button>
                  ))}
              </nav>
          </div>
          
          {activeTab === 'About' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2">
                    <FeaturesGrid property={property} />
                    <div className="mt-12">
                        <h3 className="text-2xl font-bold text-black mb-4">Description</h3>
                        <p className="text-gray-700 leading-relaxed whitespace-pre-line">{property.description}</p>
                    </div>
                    <AmenitiesList property={property} />
                    <LocationMap coords={property.location.gpsCoordinates} title={property.title} />
                    <AgentCard agent={agent} property={property} />
                </div>
                <aside className="hidden lg:block lg:col-span-1">
                    <div className="sticky top-28 bg-slate-50 p-6 rounded-2xl shadow-sm border">
                        <p className="text-sm text-gray-600">{property.isForSale ? 'Asking Price' : 'Rent Price'}</p>
                        <p className="text-4xl font-bold text-[#0164E5] mt-1">{property.isForSale ? `$${property.price.toLocaleString()}` : `$${property.price.toLocaleString()}/mo`}</p>
                        <div className="border-t my-6"></div>
                        <h4 className="font-bold text-black mb-4">Request Information</h4>
                        <a href={`https://wa.me/?text=${encodeURIComponent(`I'm interested in the property: '${property.title}'`)}`} target="_blank" rel="noopener noreferrer" className="w-full block text-center bg-[#0164E5] text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors">
                          Contact via WhatsApp
                        </a>
                        <div className="border-t my-6"></div>
                        <Link href="#" className="w-full flex justify-center items-center gap-2 text-sm font-semibold text-gray-700 hover:text-black">
                          <Download size={16} /> Download GuriUp App
                        </Link>
                    </div>
                </aside>
            </div>
          )}

          {activeTab === 'Gallery' && (
            <div>
                <h2 className="text-3xl font-bold text-black mb-8">Photo Gallery</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {property.images.map((img, index) => (
                    <div key={index} className="relative aspect-video rounded-lg overflow-hidden cursor-pointer" onClick={() => {/* Can add fullscreen click here */}}>
                      <Image src={img} alt={`${property.title} gallery image ${index+1}`} fill className="object-cover" />
                    </div>
                  ))}
                </div>
            </div>
          )}
        </div>
      </div>
      <RelatedProperties properties={related} />
      <FloatingActionBar property={property} />
    </>
  );
}