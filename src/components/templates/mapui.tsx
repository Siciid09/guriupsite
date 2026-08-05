'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  MapPin, Search, CheckCircle, ExternalLink, Loader2, Compass, Layers 
} from 'lucide-react';

export default function MapUI() {
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<'all' | 'property' | 'hotel'>('all');
  const [markers, setMarkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedMarker, setSelectedMarker] = useState<any | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);

  // Auto-select tab depending on URL path
  useEffect(() => {
    if (pathname?.includes('/hotels')) {
      setActiveTab('hotel');
    } else if (pathname?.includes('/properties')) {
      setActiveTab('property');
    } else {
      setActiveTab('all');
    }
  }, [pathname]);

  // Fetch markers from API
  useEffect(() => {
    let isMounted = true;
    async function loadMarkers() {
      setLoading(true);
      try {
        const res = await fetch(`/api/maps?type=${activeTab}`);
        const data = await res.json();
        if (isMounted && data.success) {
          setMarkers(data.markers || []);
        }
      } catch (error) {
        console.error("Failed to load map markers:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadMarkers();
    return () => { isMounted = false; };
  }, [activeTab]);

  // Initialize Leaflet Map with Tile & Satellite Layers
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!(window as any).L) {
      const leafletCSS = document.createElement('link');
      leafletCSS.rel = 'stylesheet';
      leafletCSS.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(leafletCSS);

      const leafletScript = document.createElement('script');
      leafletScript.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      leafletScript.async = true;
      leafletScript.onload = () => initMap();
      document.body.appendChild(leafletScript);
    } else {
      initMap();
    }

    function initMap() {
      const L = (window as any).L;
      if (!L || !mapContainerRef.current) return;

      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          zoomControl: false
        }).setView([9.5624, 44.0773], 13);

        // Define Base Tile Layers
        const voyagerLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
          maxZoom: 19
        });

        const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19
        });

        const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
          maxZoom: 19
        });

        // Add default layer
        voyagerLayer.addTo(map);

        // Add Layer Control Switcher
        const baseLayers = {
          "Clean Map": voyagerLayer,
          "Street View": streetLayer,
          "Satellite": satelliteLayer
        };

        L.control.layers(baseLayers, {}, { position: 'topright' }).addTo(map);
        L.control.zoom({ position: 'topright' }).addTo(map);

        mapInstanceRef.current = map;
        markersLayerRef.current = L.layerGroup().addTo(map);
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {
          console.error("Map cleanup error:", e);
        }
        mapInstanceRef.current = null;
        markersLayerRef.current = null;
      }
    };
  }, []);

  const filteredMarkers = markers.filter(m => {
    const matchesSearch = (m.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (m.area || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (m.city || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCity = selectedCity === 'all' || (m.city || '').toLowerCase() === selectedCity.toLowerCase();
    return matchesSearch && matchesCity;
  });

  // Update Markers & Bounds Safely
  useEffect(() => {
    const L = (window as any).L;
    if (!L || !mapInstanceRef.current || !markersLayerRef.current) return;

    const layerGroup = markersLayerRef.current;
    try {
      layerGroup.clearLayers();
    } catch (e) {
      return;
    }

    const validPoints: [number, number][] = [];

    filteredMarkers.forEach(m => {
      const lat = parseFloat(m.lat);
      const lng = parseFloat(m.lng);

      if (!isNaN(lat) && !isNaN(lng) && isFinite(lat) && isFinite(lng)) {
        validPoints.push([lat, lng]);

        const isHotel = m.category === 'hotel';
        const pinColor = isHotel ? '#8b5cf6' : '#0065eb';
        
        const customIcon = L.divIcon({
          className: 'custom-map-pin',
          html: `
            <div style="
              background: ${pinColor};
              color: white;
              padding: 6px 12px;
              border-radius: 9999px;
              font-weight: 900;
              font-size: 11px;
              box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              gap: 6px;
              border: 2px solid white;
              white-space: nowrap;
              cursor: pointer;
            ">
              <span>${isHotel ? '🏨' : '🏠'}</span>
              <span>${m.formattedPrice || '$0'}</span>
            </div>
          `,
          iconSize: [90, 36],
          iconAnchor: [45, 18]
        });

        const marker = L.marker([lat, lng], { icon: customIcon });

        marker.on('click', () => {
          setSelectedMarker(m);
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([lat, lng], 16, { animate: true });
          }
        });

        layerGroup.addLayer(marker);
      }
    });

    if (mapInstanceRef.current) {
      if (validPoints.length > 0) {
        try {
          const bounds = L.latLngBounds(validPoints);
          if (bounds.isValid()) {
            mapInstanceRef.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
          }
        } catch (err) {
          console.warn("Could not fit bounds:", err);
        }
      } else {
        mapInstanceRef.current.setView([9.5624, 44.0773], 13);
      }
    }
  }, [filteredMarkers]);

  const availableCities = Array.from(new Set(markers.map(m => m.city))).filter(Boolean);

  return (
    <div className="w-full h-[calc(100vh-80px)] mt-[80px] flex flex-col lg:flex-row bg-[#FAFBFC] font-sans relative z-30">
      
      {/* SIDEBAR LISTINGS */}
      <div className="w-full lg:w-[460px] xl:w-[520px] h-full flex flex-col bg-white border-r border-slate-200 z-20 shadow-xl">
        <div className="p-6 pb-4 border-b border-slate-100 bg-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0065eb] flex items-center justify-center font-black shadow-sm">
                <Compass size={22} />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight">Interactive Map</h1>
                <p className="text-xs text-slate-400 font-bold">Discover verified properties & hotels</p>
              </div>
            </div>
            <div className="px-3 py-1 bg-slate-100 rounded-full text-slate-600 font-black text-xs shadow-inner">
              {filteredMarkers.length} Results
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-2xl mb-4">
            <button 
              onClick={() => setActiveTab('all')}
              className={`py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'all' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
            >
              All
            </button>
            <button 
              onClick={() => setActiveTab('property')}
              className={`py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'property' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Properties
            </button>
            <button 
              onClick={() => setActiveTab('hotel')}
              className={`py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'hotel' ? 'bg-white text-purple-600 shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Hotels
            </button>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search location, title..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 focus:bg-white border-2 border-slate-100 focus:border-[#0065eb] rounded-xl pl-10 pr-4 py-3 text-xs font-bold outline-none transition-all"
              />
            </div>
            <select 
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="bg-slate-50 border-2 border-slate-100 focus:border-[#0065eb] rounded-xl px-4 py-3 text-xs font-bold outline-none transition-all text-slate-700 cursor-pointer"
            >
              <option value="all">All Cities</option>
              {availableCities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-slate-50/50">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
              <Loader2 className="animate-spin text-[#0065eb]" size={32} />
              <p className="text-xs font-bold">Scanning map coordinates...</p>
            </div>
          ) : filteredMarkers.length === 0 ? (
            <div className="text-center py-20 px-4 bg-white rounded-3xl border border-slate-100 shadow-sm">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                <MapPin size={24} />
              </div>
              <h3 className="font-black text-slate-800 text-sm mb-1">No listings found</h3>
              <p className="text-xs text-slate-400">Try adjusting your filters or search terms.</p>
            </div>
          ) : (
            filteredMarkers.map((m) => (
              <div 
                key={m.id}
                onClick={() => {
                  setSelectedMarker(m);
                  const lat = parseFloat(m.lat);
                  const lng = parseFloat(m.lng);
                  if (mapInstanceRef.current && !isNaN(lat) && !isNaN(lng)) {
                    mapInstanceRef.current.setView([lat, lng], 16, { animate: true });
                  }
                }}
                className={`group flex gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer bg-white ${selectedMarker?.id === m.id ? 'border-[#0065eb] shadow-lg ring-2 ring-blue-500/10' : 'border-slate-100 hover:border-slate-300 shadow-sm'}`}
              >
                <div className="w-24 h-24 rounded-xl relative overflow-hidden bg-slate-100 shrink-0 shadow-inner">
                  <Image src={m.image || 'https://placehold.co/400x300'} alt={m.title || 'Listing'} fill sizes="96px" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  <span className={`absolute top-2 left-2 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider text-white shadow-md ${m.category === 'hotel' ? 'bg-purple-600' : 'bg-blue-600'}`}>
                    {m.category}
                  </span>
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <h4 className="font-black text-slate-900 text-sm truncate group-hover:text-[#0065eb] transition-colors">{m.title}</h4>
                      {m.isVerified && <CheckCircle size={14} className="text-[#0065eb] shrink-0" fill="#e0f2fe" />}
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1 truncate">
                      <MapPin size={10} className="text-[#0065eb]" /> {m.area}, {m.city}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <span className="font-black text-slate-900 text-sm">{m.formattedPrice}</span>
                    <Link 
                      href={m.link || '#'} 
                      className="px-3 py-1.5 bg-slate-900 hover:bg-[#0065eb] text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors flex items-center gap-1 shadow-sm"
                    >
                      View <ExternalLink size={10} />
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MAP CONTAINER VIEW */}
      <div className="flex-1 h-full relative z-10 bg-slate-100">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* FLOATING CARD PREVIEW ON MAP MARKER CLICK */}
        {selectedMarker && (
          <div className="absolute bottom-10 left-6 z-[1000] bg-white rounded-[2rem] p-5 shadow-2xl border border-slate-100 max-w-sm w-full animate-in slide-in-from-bottom duration-300">
            <button 
              onClick={() => setSelectedMarker(null)}
              className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600 transition-colors"
            >
              ✕
            </button>
            <div className="flex gap-4 items-center">
              <div className="w-20 h-20 rounded-2xl relative overflow-hidden shrink-0 shadow-inner">
                <Image src={selectedMarker.image || 'https://placehold.co/400x300'} alt="" fill sizes="80px" className="object-cover" />
              </div>
              <div className="min-w-0 pr-6">
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider text-white mb-1 shadow-sm ${selectedMarker.category === 'hotel' ? 'bg-purple-600' : 'bg-blue-600'}`}>
                  {selectedMarker.category}
                </span>
                <h4 className="font-black text-slate-900 text-sm truncate">{selectedMarker.title}</h4>
                <p className="text-xs font-black text-[#0065eb] mt-0.5">{selectedMarker.formattedPrice}</p>
              </div>
            </div>
            <Link 
              href={selectedMarker.link || '#'}
              className="mt-4 w-full py-3.5 bg-[#0065eb] hover:bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-blue-500/20 transition-all"
            >
              Explore Listing <ExternalLink size={14} />
            </Link>
          </div>
        )}
      </div>

    </div>
  );
}