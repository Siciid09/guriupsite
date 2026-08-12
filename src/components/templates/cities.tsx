'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/app/lib/firebase'; // Adjust this import path if needed based on your structure

// =======================================================================
// TYPES
// =======================================================================
export interface CityProps {
  id: string | number;
  name: string;
  country: string;
  propertyCount?: number;
  imageUrl: string;
  slug: string;
}

// =======================================================================
// COMPONENT
// =======================================================================

interface CitiesSectionProps {
  cities?: CityProps[]; // Optional if you ever want to pass static data
}

export default function Cities({ cities: propCities }: CitiesSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  
  const [citiesData, setCitiesData] = useState<CityProps[]>(propCities || []);
  const [isLoading, setIsLoading] = useState(!propCities);

  // --- DYNAMIC DATA FETCHING & GROUPING ---
  useEffect(() => {
    if (propCities && propCities.length > 0) return; // Skip if passed via props

    const fetchDynamicCities = async () => {
      try {
        setIsLoading(true);
        const snap = await getDocs(collection(db, 'hotels'));
        
        const cityMap = new Map<string, any>();

        snap.docs.forEach(doc => {
          const h = doc.data();
          
          // Skip drafts or hidden properties
          if (h.status === 'draft' || h.status === 'Hidden') return;

          // Safely extract location and country (ensuring we fetch all available country data)
          const locObj = typeof h.location === 'object' && h.location !== null ? h.location : {};
          const cityName = locObj.city || (typeof h.location === 'string' ? h.location : null) || h.city;
          const countryName = locObj.country || h.country || 'Somalia';

          if (!cityName) return;

          const normalizedCity = cityName.trim();
          const lowerCity = normalizedCity.toLowerCase();
          
          // Pull a real image from the hotel to represent the city
          const img = (Array.isArray(h.images) && h.images.length > 0 && h.images[0].trim() !== '') 
            ? h.images[0] 
            : 'https://placehold.co/600x400?text=' + encodeURIComponent(normalizedCity);

          // Group by city and increment hotel count
          if (cityMap.has(lowerCity)) {
            cityMap.get(lowerCity).count += 1;
          } else {
            cityMap.set(lowerCity, {
              name: normalizedCity,
              country: countryName,
              count: 1,
              image: img
            });
          }
        });

        // Convert Map to Array & Sort strictly by hotel count descending
        const dynamicCities: CityProps[] = Array.from(cityMap.values())
          .map((c, index) => ({
            id: `dyn-city-${index}`,
            name: c.name,
            country: c.country,
            propertyCount: c.count,
            imageUrl: c.image,
            slug: c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
          }))
          .sort((a, b) => (b.propertyCount || 0) - (a.propertyCount || 0));

        setCitiesData(dynamicCities);
      } catch (error) {
        console.error("Error fetching dynamic cities:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDynamicCities();
  }, [propCities]);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.75;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (isLoading) return null; // Fail silently while calculating
  if (!citiesData || citiesData.length === 0) return null;

  return (
    <section className="pt-2 md:pt-4 pb-0 relative overflow-hidden bg-[#fafbfc]">
      {/* Native scrollbar hidden, swipe & smooth scrolling maintained */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        
        {/* === COMPACT SECTION HEADER === */}
        <div className="flex items-end justify-between mb-2 md:mb-3">
          <div className="min-w-0 pr-4">
            <h2 className="text-[22px] md:text-[26px] font-black text-slate-900 tracking-tight leading-tight title-underline">
              Popular Destinations
            </h2>
            <p className="text-xs md:text-sm font-bold text-slate-500 mt-3 truncate">
              Explore stays in the places travelers love.
            </p>
          </div>

          {/* Tiny, minimal desktop navigation arrows */}
          <div className="hidden md:flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
                canScrollLeft 
                  ? 'bg-white border-slate-200 text-slate-700 hover:border-[#0065eb]/40 hover:bg-blue-50' 
                  : 'bg-transparent border-slate-100 text-slate-300 cursor-not-allowed'
              }`}
              aria-label="Scroll left"
            >
              <ChevronLeft size={16} strokeWidth={2.5} />
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
                canScrollRight 
                  ? 'bg-white border-slate-200 text-slate-700 hover:border-[#0065eb]/40 hover:bg-blue-50' 
                  : 'bg-transparent border-slate-100 text-slate-300 cursor-not-allowed'
              }`}
              aria-label="Scroll right"
            >
              <ChevronRight size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* === HORIZONTAL COMPACT CAROUSEL === */}
        <div className="relative -mx-6 px-6 md:mx-0 md:px-0">
          <div 
            ref={scrollRef}
            onScroll={checkScroll}
            className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar gap-3 md:gap-3.5 pb-2 pt-1 pr-6 md:pr-0"
          >
            {citiesData.map((city) => (
              
              /* === ULTRA COMPACT DISCOVERY CARD === */
              /* Widths strictly engineered to be 20% smaller than previous */
              <Link
                key={city.id}
                href={`/hotels?city=${encodeURIComponent(city.name)}`}
                className="group block relative shrink-0 snap-start w-[75px] sm:w-[90px] md:w-[105px] lg:w-[120px] outline-none"
              >
                {/* Outer Card: Near-white, extremely soft shadow, internal padding separating the image */}
                <div className="bg-white p-1 md:p-1.5 rounded-[16px] md:rounded-[20px] border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_20px_rgba(0,101,235,0.06)] transition-all duration-300 flex flex-col h-full">
                  
                  {/* Outer Stroke Container: 2px blue stroke with padding to create breathing space between the stroke and image */}
                  <div className="relative w-full aspect-[4/5] rounded-[12px] md:rounded-[14px] border-2 border-[#0065eb]/20 p-1 shrink-0 bg-white">
                    
                    {/* Actual Image Container inside the stroke */}
                    <div className="relative w-full h-full rounded-[6px] md:rounded-[8px] overflow-hidden bg-slate-100">
                      <Image
                        src={city.imageUrl}
                        alt={city.name}
                        fill
                        sizes="(max-width: 768px) 90px, 120px"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        priority={false}
                      />
                    </div>
                  </div>

                  {/* Minimal Text Information adjusted for the smaller size */}
                  <div className="pt-2 px-1 pb-1 flex flex-col justify-between flex-1">
                    <div>
                      <h3 className="text-[10px] md:text-[12px] font-black text-slate-900 truncate group-hover:text-[#0065eb] transition-colors">
                        {city.name}
                      </h3>
                      {/* Added dynamically fetched country name */}
                      <p className="text-[8px] md:text-[9px] font-bold text-slate-500 mt-[1px] truncate">
                        {city.country}
                      </p>
                    </div>
                    {city.propertyCount !== undefined && (
                      <p className="text-[8px] md:text-[9px] font-bold text-slate-400 mt-1 truncate">
                        {city.propertyCount} {city.propertyCount === 1 ? 'stay' : 'stays'}
                      </p>
                    )}
                  </div>

                </div>
              </Link>

            ))}
          </div>
        </div>

      </div>
    </section>
  );
}