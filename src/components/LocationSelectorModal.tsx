'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/app/lib/firebase'; // Adjust to your actual Firebase config path
import { X, ChevronLeft, ChevronRight, CheckCircle, MapPin, AlertCircle, Loader2 } from 'lucide-react';

// ============================================================================
// 1. TRANSLATION DICTIONARY (i18n Ready)
// ============================================================================
const translations = {
  en: {
    select_country: 'Select Country',
    select_city: 'Select City',
    select_district: 'Select District',
    where_looking: 'Where are you looking?',
    in_location: 'In',
    unknown: 'Unknown',
    error_load_countries: 'Failed to load countries.',
    error_load_cities: 'Failed to load cities.',
    error_load_districts: 'Failed to load districts.',
    retry: 'Retry',
    no_items_found: 'No items found.'
  },
  so: {
    select_country: 'Dooro Dalka',
    select_city: 'Dooro Magaalada',
    select_district: 'Dooro Degmada',
    where_looking: 'Xageed ka raadinaysaa?',
    in_location: 'Gudaha',
    unknown: 'Lama yaqaan',
    error_load_countries: 'Kuma guuleysan in la soo saaro dalalka.',
    error_load_cities: 'Kuma guuleysan in la soo saaro magaalooyinka.',
    error_load_districts: 'Kuma guuleysan in la soo saaro degmooyinka.',
    retry: 'Isku day markale',
    no_items_found: 'Waxba lama helin.'
  },
  ar: {
    select_country: 'اختر الدولة',
    select_city: 'اختر المدينة',
    select_district: 'اختر المنطقة',
    where_looking: 'أين تبحث؟',
    in_location: 'في',
    unknown: 'غير معروف',
    error_load_countries: 'فشل في تحميل الدول.',
    error_load_cities: 'فشل في تحميل المدن.',
    error_load_districts: 'فشل في تحميل المناطق.',
    retry: 'إعادة المحاولة',
    no_items_found: 'لم يتم العثور على شيء.'
  }
};

type Language = keyof typeof translations;

// ============================================================================
// 2. TYPES & ENUMS
// ============================================================================
export interface LocationResult {
  country?: string;
  city?: string;
  district?: string;
}

interface LocationItem {
  id: string;
  name: string;
}

interface LocationSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (result: LocationResult) => void;
  lang?: Language; // Pass 'en', 'so', or 'ar' here
}

enum Step {
  COUNTRY = 0,
  CITY = 1,
  DISTRICT = 2
}

// ============================================================================
// 3. MAIN COMPONENT
// ============================================================================
export default function LocationSelectorModal({ isOpen, onClose, onSelect, lang = 'en' }: LocationSelectorModalProps) {
  const t = translations[lang] || translations['en'];

  // State
  const [currentStep, setCurrentStep] = useState<Step>(Step.COUNTRY);
  const [items, setItems] = useState<LocationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Selections
  const [selectedCountry, setSelectedCountry] = useState<{ id: string, name: string } | null>(null);
  const [selectedCity, setSelectedCity] = useState<{ id: string, name: string } | null>(null);

  // --- DATA FETCHING (Matching Flutter Logic) ---
  const fetchCountries = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const snap = await getDocs(collection(db, 'countries'));
      setItems(snap.docs.map(doc => ({ id: doc.id, name: doc.data().name || t.unknown })));
      setCurrentStep(Step.COUNTRY);
    } catch (e) {
      setErrorMessage(t.error_load_countries);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCities = async (countryId: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const snap = await getDocs(collection(db, 'countries', countryId, 'cities'));
      setItems(snap.docs.map(doc => ({ id: doc.id, name: doc.data().name || t.unknown })));
      setCurrentStep(Step.CITY);
    } catch (e) {
      setErrorMessage(t.error_load_cities);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDistricts = async (countryId: string, cityId: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const snap = await getDocs(collection(db, 'countries', countryId, 'cities', cityId, 'districts'));
      
      // If no districts exist for this city, finish selection immediately (matching Flutter)
      if (snap.empty) {
        handleFinish(null);
        return;
      }

      setItems(snap.docs.map(doc => ({ id: doc.id, name: doc.data().name || t.unknown })));
      setCurrentStep(Step.DISTRICT);
    } catch (e) {
      setErrorMessage(t.error_load_districts);
    } finally {
      setIsLoading(false);
    }
  };

  // --- LIFECYCLE ---
  useEffect(() => {
    if (isOpen) {
      // Reset state when opened
      setSelectedCountry(null);
      setSelectedCity(null);
      fetchCountries();
    }
  }, [isOpen]);

  // --- HANDLERS ---
  const handleSelection = (item: LocationItem) => {
    if (currentStep === Step.COUNTRY) {
      setSelectedCountry(item);
      fetchCities(item.id);
    } else if (currentStep === Step.CITY) {
      setSelectedCity(item);
      fetchDistricts(selectedCountry!.id, item.id);
    } else if (currentStep === Step.DISTRICT) {
      handleFinish(item.name);
    }
  };

  const handleBack = () => {
    if (currentStep === Step.DISTRICT && selectedCountry) {
      fetchCities(selectedCountry.id);
    } else if (currentStep === Step.CITY) {
      fetchCountries();
    }
  };

  const handleFinish = (districtName: string | null) => {
    onSelect({
      country: selectedCountry?.name,
      city: selectedCity?.name,
      district: districtName || undefined
    });
    onClose();
  };

  const handleRetry = () => {
    if (currentStep === Step.COUNTRY) fetchCountries();
    else if (currentStep === Step.CITY && selectedCountry) fetchCities(selectedCountry.id);
    else if (currentStep === Step.DISTRICT && selectedCountry && selectedCity) fetchDistricts(selectedCountry.id, selectedCity.id);
  };

  // --- UI HELPERS ---
  const getHeaderTitle = () => {
    if (currentStep === Step.COUNTRY) return t.select_country;
    if (currentStep === Step.CITY) return t.select_city;
    return t.select_district;
  };

  const getHeaderSubtitle = () => {
    if (currentStep === Step.COUNTRY) return t.where_looking;
    if (currentStep === Step.CITY) return `${t.in_location} ${selectedCountry?.name}`;
    return `${t.in_location} ${selectedCity?.name}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      
      {/* Bottom Sheet / Modal */}
      <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-[2rem] max-h-[85vh] sm:max-h-[80vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-4 duration-300">
        
        {/* Drag Handle (Mobile only) */}
        <div className="w-full flex justify-center pt-3 sm:hidden pb-1">
          <div className="w-12 h-1.5 bg-slate-200 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-3">
            {currentStep !== Step.COUNTRY && (
              <button onClick={handleBack} className="p-2 -ml-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-600 transition-colors">
                <ChevronLeft size={20} />
              </button>
            )}
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight leading-tight">{getHeaderTitle()}</h2>
              <p className="text-xs font-bold text-slate-400 mt-0.5">{getHeaderSubtitle()}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-50 hover:bg-red-50 hover:text-red-500 rounded-full text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Loader2 className="w-10 h-10 animate-spin text-[#0065eb] mb-4" />
              <p className="text-sm font-bold uppercase tracking-widest">Loading...</p>
            </div>
          ) : errorMessage ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                 <AlertCircle size={32} />
              </div>
              <p className="text-slate-600 font-bold mb-6">{errorMessage}</p>
              <button onClick={handleRetry} className="bg-slate-900 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-lg hover:bg-black transition-colors">
                {t.retry}
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <MapPin size={40} className="mb-4 opacity-50" />
              <p className="text-sm font-bold">{t.no_items_found}</p>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {items.map(item => (
                <button
                  key={item.id}
                  onClick={() => handleSelection(item)}
                  className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-colors group text-left"
                >
                  <span className="font-bold text-slate-700 group-hover:text-slate-900">{item.name}</span>
                  {currentStep === Step.DISTRICT ? (
                    <CheckCircle size={18} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
                  ) : (
                    <ChevronRight size={18} className="text-slate-300 group-hover:text-[#0065eb] transition-colors group-hover:translate-x-1" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}