'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, ShieldCheck, CheckCircle2, AlertTriangle, 
  MessageCircle, Phone, Lock, Sparkles, Building2, 
  Briefcase, CreditCard, ChevronRight, Zap, ExternalLink,
  Copy, Check, Info, HelpCircle
} from 'lucide-react';

// ============================================================================
// PAYMENT PROVIDERS DATA
// ============================================================================
interface PaymentProvider {
  id: string;
  name: string;
  sub: string;
  type: string;
  tag: string;
  badgeColor: string;
  accentColor: string;
}

interface CountryCategory {
  id: 'somalia' | 'ethiopia' | 'kenya' | 'djibouti';
  label: string;
  flag: string;
  currency: string;
  providers: PaymentProvider[];
}

const PAYMENT_COUNTRIES: CountryCategory[] = [
  {
    id: 'somalia',
    label: 'Somalia & Somaliland',
    flag: '🇸🇴',
    currency: 'USD / SLSH / SOS',
    providers: [
      {
        id: 'zaad',
        name: 'ZAAD Service',
        sub: 'Telesom Merchant Services',
        type: 'STK Push / USSD',
        tag: 'Instant Mobile Money',
        badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        accentColor: 'from-emerald-600 to-teal-700'
      },
      {
        id: 'edahab',
        name: 'eDahab',
        sub: 'Somtel / Dahabshiil Group',
        type: 'REST API & STK Push',
        tag: 'Fast Checkout',
        badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
        accentColor: 'from-amber-600 to-yellow-700'
      },
      {
        id: 'evc',
        name: 'EVC Plus',
        sub: 'Hormuud Telecom',
        type: 'Direct Mobile Merchant API',
        tag: 'Zero Fee',
        badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
        accentColor: 'from-blue-600 to-indigo-700'
      },
      {
        id: 'sahal',
        name: 'SAHAL Service',
        sub: 'Golis Telecom (Puntland)',
        type: 'Merchant USSD & Web API',
        tag: 'Puntland Regional',
        badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        accentColor: 'from-indigo-600 to-purple-700'
      },
      {
        id: 'waafi',
        name: 'Waafi / WaafiPay',
        sub: 'Premier Wallet Aggregator',
        type: 'Unified Cards & Wallets',
        tag: 'All-in-One Gateway',
        badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200',
        accentColor: 'from-cyan-600 to-blue-700'
      },
      {
        id: 'premier',
        name: 'Premier Bank',
        sub: 'Premier Wallet API',
        type: 'Direct Bank Account & Mastercard',
        tag: 'Bank Transfer',
        badgeColor: 'bg-violet-50 text-violet-700 border-violet-200',
        accentColor: 'from-violet-600 to-purple-800'
      },
      {
        id: 'ibs',
        name: 'IBS Bank',
        sub: 'IBS M-Book / Merchant Corporate',
        type: 'Core Internet Banking Gateway',
        tag: 'Corporate Settlement',
        badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
        accentColor: 'from-rose-600 to-red-700'
      },
      {
        id: 'salaam',
        name: 'Salaam African Bank',
        sub: 'Salaam-Direct Merchant Gateway',
        type: 'Direct Merchant Settlement',
        tag: 'Islamic Banking',
        badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-300',
        accentColor: 'from-emerald-700 to-green-900'
      }
    ]
  },
  {
    id: 'ethiopia',
    label: 'Ethiopia',
    flag: '🇪🇹',
    currency: 'ETB / USD',
    providers: [
      {
        id: 'telebirr',
        name: 'Telebirr',
        sub: 'Ethio Telecom SuperApp',
        type: 'H5 Web Checkout & STK Push',
        tag: 'Nationwide Gateway',
        badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
        accentColor: 'from-blue-600 to-sky-700'
      },
      {
        id: 'cbe',
        name: 'CBE Birr',
        sub: 'Commercial Bank of Ethiopia',
        type: 'Core Banking Wallet Gateway',
        tag: 'Official Bank Wallet',
        badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
        accentColor: 'from-purple-700 to-indigo-800'
      },
      {
        id: 'ebirr',
        name: 'E-Birr Fintech',
        sub: 'E-Birr Unified Payment Hub',
        type: 'Merchant Integration REST API',
        tag: 'Multi-Bank Wallet',
        badgeColor: 'bg-orange-50 text-orange-700 border-orange-200',
        accentColor: 'from-orange-600 to-amber-700'
      },
      {
        id: 'awash',
        name: 'Awash Birr',
        sub: 'Awash Bank Open Banking API',
        type: 'Merchant Wallet API',
        tag: 'Direct Bank Checkout',
        badgeColor: 'bg-blue-50 text-blue-800 border-blue-300',
        accentColor: 'from-blue-700 to-indigo-900'
      },
      {
        id: 'amole',
        name: 'Amole (Dashen Bank)',
        sub: 'Dashen Bank Corporate Gateway',
        type: 'Digital Wallet & Card Processing',
        tag: 'Amole Fintech',
        badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
        accentColor: 'from-teal-600 to-emerald-800'
      }
    ]
  },
  {
    id: 'kenya',
    label: 'Kenya',
    flag: '🇰🇪',
    currency: 'KES / USD',
    providers: [
      {
        id: 'mpesa',
        name: 'M-Pesa (Daraja API)',
        sub: 'Safaricom Kenya PLC',
        type: 'OAuth 2.0 / STK Push / C2B',
        tag: 'Instant Lipa Na M-Pesa',
        badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        accentColor: 'from-emerald-600 to-green-700'
      },
      {
        id: 'airtel',
        name: 'Airtel Money',
        sub: 'Airtel Kenya',
        type: 'Airtel Developer REST API',
        tag: 'Mobile Commerce',
        badgeColor: 'bg-red-50 text-red-700 border-red-200',
        accentColor: 'from-red-600 to-rose-700'
      },
      {
        id: 'tkash',
        name: 'T-Kash',
        sub: 'Telkom Kenya Business',
        type: 'Merchant Payment API',
        tag: 'Digital Wallet',
        badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
        accentColor: 'from-blue-600 to-indigo-700'
      },
      {
        id: 'equity',
        name: 'Equity Bank (Jenga API)',
        sub: 'Equitel / Equity Group Holdings',
        type: 'Jenga Open Banking Gateway',
        tag: 'Card & Bank Integration',
        badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
        accentColor: 'from-amber-700 to-red-800'
      }
    ]
  },
  {
    id: 'djibouti',
    label: 'Djibouti',
    flag: '🇩🇯',
    currency: 'DJF / USD',
    providers: [
      {
        id: 'dmoney',
        name: 'D-Money',
        sub: 'Djibouti Telecom',
        type: 'Mobile Merchant Integration API',
        tag: 'National Wallet',
        badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200',
        accentColor: 'from-cyan-600 to-blue-700'
      },
      {
        id: 'waafi_dj',
        name: 'Waafi Djibouti',
        sub: 'Multi-Currency Regional Gateway',
        type: 'Cross-Border REST API',
        tag: 'Regional Exchange',
        badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        accentColor: 'from-indigo-600 to-blue-800'
      },
      {
        id: 'cac',
        name: 'CAC Pay',
        sub: 'CAC International Bank',
        type: 'Merchant Payment Gateway API',
        tag: 'Corporate Bank Gateway',
        badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
        accentColor: 'from-amber-600 to-yellow-800'
      }
    ]
  }
];

// ============================================================================
// MAIN CHECKOUT COMPONENT
// ============================================================================
function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL Query Parameters
  const planId = searchParams.get('planId') || 'hotel_premium';
  const planName = searchParams.get('planName') || (planId.includes('hotel') ? 'Hotel Business' : 'Real Estate Pro');
  const amountParam = searchParams.get('amount') || (planId.includes('hotel') ? '25.00' : '20.00');
  const amount = parseFloat(amountParam).toFixed(2);

  // States
  const [selectedCountry, setSelectedCountry] = useState<'somalia' | 'ethiopia' | 'kenya' | 'djibouti'>('somalia');
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider>(PAYMENT_COUNTRIES[0].providers[0]);
  const [copied, setCopied] = useState(false);

  const isHotel = planId.toLowerCase().includes('hotel');
  const activeCountryData = PAYMENT_COUNTRIES.find(c => c.id === selectedCountry) || PAYMENT_COUNTRIES[0];

  const supportPhone = '+252633227084';
  const cleanPhone = '252633227084';

  const generateWhatsAppMessage = () => {
    const text = `Hello GuriUp Support! 👋%0A%0AI would like to activate my subscription:%0A• *Plan:* ${encodeURIComponent(planName)} (${planId})%0A• *Amount:* $${amount} / month%0A• *Selected Payment Method:* ${encodeURIComponent(selectedProvider.name)} (${encodeURIComponent(selectedProvider.sub)})%0A• *Region:* ${encodeURIComponent(activeCountryData.label)}%0A%0APlease provide the payment account details for instant verification. Thank you!`;
    return `https://wa.me/${cleanPhone}?text=${text}`;
  };

  const copyPhoneNumber = () => {
    navigator.clipboard.writeText(cleanPhone);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#FAFBFC] font-sans text-slate-900 pb-28 selection:bg-blue-100 selection:text-blue-900">
      
      {/* --- TOP NAVBAR --- */}
      <header className="bg-white/90 backdrop-blur-xl border-b border-slate-200/80 sticky top-0 z-50 px-4 sm:px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.back()} 
              className="p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition-all hover:scale-105"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-lg font-black text-slate-900 leading-tight">Secure Checkout</h1>
              <p className="text-[11px] font-bold text-slate-400">GuriUp Verified Billing Portal</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200/80 px-3.5 py-1.5 rounded-full text-emerald-700 font-black text-xs">
            <ShieldCheck size={16} /> 256-bit Encrypted
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        
        {/* ====================================================================
            🔥 SUPER MODERN NOTICE BANNER (DIGITAL GATEWAY UPDATE)
        ==================================================================== */}
        <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white p-6 sm:p-10 shadow-2xl border border-white/10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-amber-500/10 rounded-full blur-2xl pointer-events-none translate-y-1/3 -translate-x-1/4"></div>
          
          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="space-y-4 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/20 border border-amber-400/30 text-amber-300 text-xs font-black uppercase tracking-wider backdrop-blur-md">
                <Sparkles size={14} className="text-amber-400 animate-pulse" /> Gateway Upgrade Notice
              </div>
              
              <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
                Automated Gateway is Updating. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-blue-200 to-teal-200">
                  Instant Manual Activation via WhatsApp
                </span>
              </h2>

              <p className="text-sm sm:text-base font-medium text-slate-300 leading-relaxed">
                Direct in-app merchant APIs are undergoing scheduled security upgrades. You can instantly activate your <strong className="text-white font-bold">{planName}</strong> plan right now with 0% delay by contacting our verified 24/7 priority support team.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                  <CheckCircle2 size={15} className="text-emerald-400" /> Instant Activation
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                  <CheckCircle2 size={15} className="text-emerald-400" /> Manual Payment Slip
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                  <CheckCircle2 size={15} className="text-emerald-400" /> Official Tax Receipt
                </span>
              </div>
            </div>

            {/* Direct Quick WhatsApp Action Box */}
            <div className="w-full lg:w-auto shrink-0 bg-white/10 backdrop-blur-xl border border-white/15 p-6 rounded-[2rem] flex flex-col gap-4 shadow-xl">
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-300">Dedicated VIP Desk</p>
                <p className="text-xl font-black text-white mt-0.5">{supportPhone}</p>
              </div>

              <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5">
                <a 
                  href={generateWhatsAppMessage()} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-6 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-500/30"
                >
                  <MessageCircle size={18} className="fill-slate-950" /> Pay via WhatsApp Chat
                </a>

                <div className="flex gap-2">
                  <a 
                    href={`tel:${cleanPhone}`} 
                    className="flex-1 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-2 border border-white/10 transition-colors"
                  >
                    <Phone size={14} /> Call Direct
                  </a>
                  <button 
                    onClick={copyPhoneNumber}
                    className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-white/10 transition-colors"
                    title="Copy Phone Number"
                  >
                    {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ====================================================================
            MAIN GRID: PLAN SUMMARY + ALL PAYMENT NETWORKS
        ==================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: PAYMENT METHODS BY REGION (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-[2rem] border border-slate-200/80 p-6 sm:p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 mb-6">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Select Payment Method</h3>
                  <p className="text-xs font-semibold text-slate-500 mt-1">Available native gateways across East Africa</p>
                </div>

                {/* Country Tab Switcher */}
                <div className="flex overflow-x-auto gap-1 bg-slate-100 p-1.5 rounded-2xl no-scrollbar">
                  {PAYMENT_COUNTRIES.map(country => (
                    <button
                      key={country.id}
                      onClick={() => {
                        setSelectedCountry(country.id);
                        setSelectedProvider(country.providers[0]);
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                        selectedCountry === country.id 
                          ? 'bg-white text-slate-900 shadow-sm font-black' 
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      <span>{country.flag}</span>
                      <span>{country.label.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Providers Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {activeCountryData.providers.map(provider => {
                  const isSelected = selectedProvider.id === provider.id;
                  return (
                    <div
                      key={provider.id}
                      onClick={() => setSelectedProvider(provider)}
                      className={`relative p-5 rounded-[1.75rem] border-2 cursor-pointer transition-all duration-300 flex flex-col justify-between ${
                        isSelected 
                          ? 'border-[#0065eb] bg-blue-50/40 shadow-lg shadow-blue-500/10 scale-[1.02]' 
                          : 'border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${provider.badgeColor}`}>
                          {provider.tag}
                        </span>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                          isSelected ? 'border-[#0065eb] bg-[#0065eb]' : 'border-slate-300 bg-white'
                        }`}>
                          {isSelected && <Check size={12} className="text-white stroke-[3]" />}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-black text-slate-900 text-base">{provider.name}</h4>
                        <p className="text-xs font-semibold text-slate-500 mt-0.5">{provider.sub}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">{provider.type}</p>
                      </div>

                      {isSelected && (
                        <div className="mt-4 pt-3 border-t border-blue-200/60 flex items-center justify-between text-xs font-bold text-[#0065eb]">
                          <span>Selected Method</span>
                          <ChevronRight size={14} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Instructions on Click */}
              <div className="mt-8 p-5 bg-slate-50 rounded-2xl border border-slate-200/60 flex items-start gap-3.5">
                <Info size={20} className="text-[#0065eb] shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed text-slate-600 font-medium space-y-1">
                  <p className="font-bold text-slate-900">
                    How it works with {selectedProvider.name}:
                  </p>
                  <p>
                    Click the <strong>Proceed to WhatsApp Activation</strong> button below. Your order details, plan ID, and selected provider ({selectedProvider.name}) will be pre-filled so our billing operator can verify and activate your dashboard within 2 minutes.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: ORDER SUMMARY & DIRECT ACTION (4 Cols) */}
          <div className="lg:col-span-4 sticky top-24 space-y-6">
            
            <div className="bg-white rounded-[2.2rem] border border-slate-200/80 p-6 sm:p-7 shadow-xl overflow-hidden relative">
              <div className="flex items-center justify-between pb-5 border-b border-slate-100 mb-5">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400">Order Summary</span>
                <span className="p-2 bg-blue-50 text-[#0065eb] rounded-xl">
                  {isHotel ? <Building2 size={18} /> : <Briefcase size={18} />}
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#0065eb] bg-blue-50 px-2.5 py-1 rounded-md">
                    Subscription Tier
                  </span>
                  <h3 className="text-2xl font-black text-slate-900 mt-2">{planName}</h3>
                  <p className="text-xs text-slate-500 font-medium">Billed monthly • Instant activation</p>
                </div>

                <div className="space-y-2.5 py-4 border-y border-slate-100 text-sm font-semibold">
                  <div className="flex justify-between text-slate-600">
                    <span>Base Subscription</span>
                    <span className="font-bold text-slate-900">${amount}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Selected Gateway</span>
                    <span className="font-bold text-[#0065eb]">{selectedProvider.name}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Gateway Processing Fee</span>
                    <span className="font-bold text-emerald-600">$0.00 (Waived)</span>
                  </div>
                </div>

                <div className="flex justify-between items-baseline pt-1">
                  <div>
                    <span className="text-xs font-black uppercase text-slate-400 block">Total Due Today</span>
                    <span className="text-3xl font-black text-slate-900">${amount}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-500">/ month</span>
                </div>

                {/* Primary CTA */}
                <a
                  href={generateWhatsAppMessage()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-4 bg-gradient-to-r from-[#0065eb] to-indigo-600 hover:from-[#0052c1] hover:to-indigo-700 text-white rounded-2xl font-black text-sm transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-blue-500/25 flex items-center justify-center gap-2 mt-4"
                >
                  <MessageCircle size={18} className="fill-white" /> Complete on WhatsApp
                </a>

                <a
                  href={`tel:${cleanPhone}`}
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2"
                >
                  <Phone size={14} /> Call Support ({supportPhone})
                </a>
              </div>

              <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center gap-2 text-slate-400 text-[11px] font-bold">
                <Lock size={12} /> Satisfaction guaranteed • Cancel anytime
              </div>
            </div>

            {/* Support Card */}
            <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-center gap-3.5">
              <div className="p-2.5 bg-amber-400/20 text-amber-800 rounded-xl shrink-0">
                <HelpCircle size={20} />
              </div>
              <div className="min-w-0">
                <p className="font-black text-xs text-amber-950">Need Custom Invoicing?</p>
                <p className="text-[11px] font-medium text-amber-900/80 mt-0.5">We support direct company bank wires and cash pickups.</p>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

// Wrapper for safe Suspense use with Next.js useSearchParams
export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#FAFBFC]">
        <div className="w-10 h-10 border-4 border-[#0065eb] border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <PaymentContent />
    </Suspense>
  );
}