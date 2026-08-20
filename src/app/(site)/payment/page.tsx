'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ArrowLeft, ShieldCheck, CheckCircle2, AlertTriangle, 
  MessageCircle, Phone, Lock, Sparkles, Building2, 
  Briefcase, CreditCard, ChevronRight, Zap, Copy, 
  Check, Info, RefreshCw, X, ArrowRight, Smartphone
} from 'lucide-react';

// ============================================================================
// DATA & PROVIDERS (Clean Brand Names & Regions)
// ============================================================================

interface Provider {
  id: string;
  name: string;
  subtitle: string;
  type: string;
  tag: string;
  badgeClass: string;
}

interface CountryTab {
  id: 'somalia' | 'ethiopia' | 'kenya' | 'djibouti';
  label: string;
  flag: string;
  code: string;
  currency: string;
  phonePlaceholder: string;
  providers: Provider[];
}

const COUNTRIES: CountryTab[] = [
  {
    id: 'somalia',
    label: 'Somalia & Somaliland',
    flag: '🇸🇴',
    code: '+252',
    currency: 'USD / SLSH / SOS',
    phonePlaceholder: '63 XXXXXXX or 61 XXXXXXX',
    providers: [
      { id: 'zaad', name: 'ZAAD Service', subtitle: 'Telesom', type: 'Mobile Money', tag: 'Instant', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      { id: 'edahab', name: 'eDahab', subtitle: 'Somtel / Dahabshiil', type: 'Mobile Money', tag: 'Fast Push', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200' },
      { id: 'evc', name: 'EVC Plus', subtitle: 'Hormuud Telecom', type: 'Mobile Money', tag: 'Popular', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200' },
      { id: 'sahal', name: 'SAHAL', subtitle: 'Golis Telecom', type: 'Mobile Money', tag: 'Puntland', badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
      { id: 'waafi', name: 'WaafiPay', subtitle: 'Card & Mobile Wallet', type: 'Aggregator', tag: 'Cards / Wallets', badgeClass: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
      { id: 'premier', name: 'Premier Bank', subtitle: 'Premier Wallet / Card', type: 'Bank Gateway', tag: 'Direct Bank', badgeClass: 'bg-purple-50 text-purple-700 border-purple-200' },
      { id: 'ibs', name: 'IBS Bank', subtitle: 'IBS M-Book', type: 'Bank Gateway', tag: 'Corporate', badgeClass: 'bg-rose-50 text-rose-700 border-rose-200' },
      { id: 'salaam', name: 'Salaam Bank', subtitle: 'Salaam Direct', type: 'Bank Gateway', tag: 'Islamic Banking', badgeClass: 'bg-teal-50 text-teal-700 border-teal-200' },
    ]
  },
  {
    id: 'ethiopia',
    label: 'Ethiopia',
    flag: '🇪🇹',
    code: '+251',
    currency: 'ETB / USD',
    phonePlaceholder: '9X XXX XXXX',
    providers: [
      { id: 'telebirr', name: 'Telebirr', subtitle: 'Ethio Telecom', type: 'SuperApp / USSD', tag: 'Nationwide', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200' },
      { id: 'cbe', name: 'CBE Birr', subtitle: 'Commercial Bank of Ethiopia', type: 'Bank Wallet', tag: 'Official', badgeClass: 'bg-purple-50 text-purple-700 border-purple-200' },
      { id: 'ebirr', name: 'E-Birr', subtitle: 'E-Birr Payment Hub', type: 'Fintech Wallet', tag: 'Multi-Bank', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200' },
      { id: 'awash', name: 'Awash Birr', subtitle: 'Awash Bank', type: 'Bank Wallet', tag: 'Direct Bank', badgeClass: 'bg-blue-50 text-blue-800 border-blue-300' },
      { id: 'amole', name: 'Amole', subtitle: 'Dashen Bank', type: 'Digital Wallet', tag: 'Cards / Wallets', badgeClass: 'bg-teal-50 text-teal-700 border-teal-200' },
    ]
  },
  {
    id: 'kenya',
    label: 'Kenya',
    flag: '🇰🇪',
    code: '+254',
    currency: 'KES / USD',
    phonePlaceholder: '7XX XXX XXX',
    providers: [
      { id: 'mpesa', name: 'M-Pesa', subtitle: 'Safaricom Daraja', type: 'Lipa Na M-Pesa', tag: 'Instant STK', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      { id: 'airtel', name: 'Airtel Money', subtitle: 'Airtel Kenya', type: 'Mobile Commerce', tag: 'Zero Fee', badgeClass: 'bg-red-50 text-red-700 border-red-200' },
      { id: 'tkash', name: 'T-Kash', subtitle: 'Telkom Kenya', type: 'Mobile Wallet', tag: 'Fast Pay', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200' },
      { id: 'equity', name: 'Equity Bank', subtitle: 'Jenga Gateway', type: 'Direct Bank & Card', tag: 'Bank Transfer', badgeClass: 'bg-amber-50 text-amber-800 border-amber-200' },
    ]
  },
  {
    id: 'djibouti',
    label: 'Djibouti',
    flag: '🇩🇯',
    code: '+253',
    currency: 'DJF / USD',
    phonePlaceholder: '77 XX XX XX',
    providers: [
      { id: 'dmoney', name: 'D-Money', subtitle: 'Djibouti Telecom', type: 'National Wallet', tag: 'Official', badgeClass: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
      { id: 'waafi_dj', name: 'Waafi Djibouti', subtitle: 'Regional Gateway', type: 'Multi-Currency', tag: 'Cross-Border', badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
      { id: 'cac', name: 'CAC Pay', subtitle: 'CAC International Bank', type: 'Merchant Banking', tag: 'Bank Portal', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200' },
    ]
  }
];

// ============================================================================
// MAIN CHECKOUT VIEW
// ============================================================================

function PaymentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Params
  const planId = searchParams.get('planId') || 'hotel_premium';
  const planName = searchParams.get('planName') || (planId.includes('hotel') ? 'Hotel Business' : 'Real Estate Pro');
  const amountParam = searchParams.get('amount') || (planId.includes('hotel') ? '25.00' : '20.00');
  const amount = parseFloat(amountParam).toFixed(2);

  // States
  const [activeCheckoutMode, setActiveCheckoutMode] = useState<'whatsapp' | 'automated'>('whatsapp');
  const [selectedCountryId, setSelectedCountryId] = useState<'somalia' | 'ethiopia' | 'kenya' | 'djibouti'>('somalia');
  const [selectedProvider, setSelectedProvider] = useState<Provider>(COUNTRIES[0].providers[0]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const activeCountry = COUNTRIES.find(c => c.id === selectedCountryId) || COUNTRIES[0];
  const supportPhone = '+252 63 3227084';
  const cleanPhone = '252633227084';

  const generateWhatsAppUrl = (customNote?: string) => {
    const text = `Hello GuriUp Support Team! 👋\n\nI want to activate my subscription:\n• Plan: ${planName} (${planId})\n• Amount: $${amount} / month\n• Preferred Payment: ${selectedProvider.name} (${activeCountry.label})\n${phoneNumber ? `• My Mobile Money Number: ${activeCountry.code} ${phoneNumber}\n` : ''}${customNote ? `• Note: ${customNote}\n` : ''}\nPlease provide payment instructions to activate my account immediately.`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  const handleTriggerAutomatedPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      alert("Please enter your mobile money or wallet phone number.");
      return;
    }

    setIsProcessing(true);
    // Simulating initial connection to the provider's API
    setTimeout(() => {
      setIsProcessing(false);
      setShowMaintenanceModal(true);
    }, 900);
  };

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(cleanPhone);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 pb-24">
      
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-4 sm:px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.back()} 
              className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-black text-slate-900">Complete Subscription</h1>
              <p className="text-xs text-slate-400 font-medium">{planName} • ${amount}/mo</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full text-emerald-700 font-bold text-xs">
            <ShieldCheck size={16} /> Verified Checkout
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        
        {/* Top Status Alert Banner */}
        <section className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-black uppercase tracking-wider border border-amber-400/30">
              <Sparkles size={13} /> Active Notice
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Instant Activation Available via WhatsApp DM
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Automated card and merchant gateways are currently undergoing server maintenance. For immediate 1-minute plan activation with official receipt, please submit your payment slip directly via WhatsApp.
            </p>
          </div>

          <a
            href={generateWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full md:w-auto px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm rounded-2xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all hover:scale-105 shrink-0"
          >
            <MessageCircle size={18} className="fill-slate-950" /> Fast WhatsApp Pay
          </a>
        </section>

        {/* 2-Option Switcher */}
        <div className="flex justify-center">
          <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm inline-flex w-full sm:w-auto">
            <button
              onClick={() => setActiveCheckoutMode('whatsapp')}
              className={`flex-1 sm:flex-none px-6 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                activeCheckoutMode === 'whatsapp'
                  ? 'bg-[#0065eb] text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <MessageCircle size={16} /> 1. Direct WhatsApp Activation (Recommended)
            </button>
            <button
              onClick={() => setActiveCheckoutMode('automated')}
              className={`flex-1 sm:flex-none px-6 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                activeCheckoutMode === 'automated'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Smartphone size={16} /> 2. Online Merchant Gateway
            </button>
          </div>
        </div>

        {/* ====================================================================
            OPTION 1: INSTANT WHATSAPP DIRECT PAYMENT
        ==================================================================== */}
        {activeCheckoutMode === 'whatsapp' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in duration-300">
            
            {/* Left: Step-by-Step Payment Instructions (8 Cols) */}
            <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
              <div>
                <h3 className="text-xl font-black text-slate-900">How to Complete Your Payment</h3>
                <p className="text-xs text-slate-500 mt-0.5">Quick manual verification with our 24/7 billing operators</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-[#0065eb] font-black text-sm flex items-center justify-center shrink-0 mt-0.5">1</div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900">Confirm Your Plan Details</h4>
                    <p className="text-xs text-slate-500 mt-1">You are upgrading to <strong>{planName}</strong> for <strong>${amount} USD / month</strong>.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-[#0065eb] font-black text-sm flex items-center justify-center shrink-0 mt-0.5">2</div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900">Send Merchant Payment</h4>
                    <p className="text-xs text-slate-500 mt-1">We accept ZAAD, eDahab, EVC Plus, Telebirr, M-Pesa, or direct bank transfer.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-[#0065eb] font-black text-sm flex items-center justify-center shrink-0 mt-0.5">3</div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900">Send Slip for Instant Activation</h4>
                    <p className="text-xs text-slate-500 mt-1">Click the button below to message our priority verification line. Your dashboard badges and listings will be unlocked in under 2 minutes.</p>
                  </div>
                </div>
              </div>

              {/* Direct WhatsApp Callout */}
              <div className="p-6 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-md">Official Line</span>
                  <p className="text-xl font-black text-emerald-950 mt-1.5">{supportPhone}</p>
                  <p className="text-xs text-emerald-700 font-medium">Available 24/7 on WhatsApp & Direct Call</p>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  <a
                    href={generateWhatsAppUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-none px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all"
                  >
                    <MessageCircle size={16} /> Open WhatsApp Chat
                  </a>
                  <button
                    onClick={handleCopyPhone}
                    className="px-3.5 py-3 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Plan Summary (4 Cols) */}
            <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400">Selected Plan</span>
                <span className="text-xs font-bold px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md">Pro Tier</span>
              </div>

              <div>
                <h4 className="text-2xl font-black text-slate-900">{planName}</h4>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-black text-slate-900">${amount}</span>
                  <span className="text-xs text-slate-500 font-bold">/ month</span>
                </div>
              </div>

              <div className="space-y-2 py-4 border-y border-slate-100 text-xs font-bold text-slate-600">
                <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> Verified Badge Included</div>
                <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> Top-Ranked Public Placement</div>
                <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> Instant Customer Contact Routing</div>
                <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> 0% Transaction Fees</div>
              </div>

              <a
                href={generateWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 bg-[#0065eb] hover:bg-[#0052c1] text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02]"
              >
                <MessageCircle size={18} /> Chat with Billing Operator
              </a>

              <a
                href={`tel:${cleanPhone}`}
                className="w-full py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border border-slate-200 transition-colors"
              >
                <Phone size={14} /> Call Support Directly
              </a>
            </div>

          </div>
        )}

        {/* ====================================================================
            OPTION 2: ONLINE MERCHANT GATEWAY (WITH STK FORM & MAINTENANCE MODAL)
        ==================================================================== */}
        {activeCheckoutMode === 'automated' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in duration-300">
            
            {/* Left: Interactive Country & Gateway Selector */}
            <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div>
                  <h3 className="text-xl font-black text-slate-900">Choose Payment Method</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Select your local telecom wallet or bank provider</p>
                </div>

                {/* Country Flag Tabs */}
                <div className="flex overflow-x-auto gap-1.5 bg-slate-100 p-1.5 rounded-2xl no-scrollbar">
                  {COUNTRIES.map(country => (
                    <button
                      key={country.id}
                      onClick={() => {
                        setSelectedCountryId(country.id);
                        setSelectedProvider(country.providers[0]);
                      }}
                      className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                        selectedCountryId === country.id
                          ? 'bg-white text-slate-900 shadow-sm font-black'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <span className="text-base">{country.flag}</span>
                      <span>{country.label.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Provider Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {activeCountry.providers.map(provider => {
                  const isSelected = selectedProvider.id === provider.id;
                  return (
                    <div
                      key={provider.id}
                      onClick={() => setSelectedProvider(provider)}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-[#0065eb] bg-blue-50/40 shadow-sm' 
                          : 'border-slate-100 bg-slate-50/60 hover:bg-white hover:border-slate-200'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${provider.badgeClass}`}>
                          {provider.tag}
                        </span>
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          isSelected ? 'border-[#0065eb] bg-[#0065eb]' : 'border-slate-300 bg-white'
                        }`}>
                          {isSelected && <Check size={10} className="text-white stroke-[3]" />}
                        </div>
                      </div>
                      <h4 className="font-black text-slate-900 text-sm">{provider.name}</h4>
                      <p className="text-xs text-slate-500">{provider.subtitle}</p>
                    </div>
                  );
                })}
              </div>

              {/* Interactive Phone / STK Input Form */}
              <form onSubmit={handleTriggerAutomatedPayment} className="pt-6 border-t border-slate-100 space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-2">
                    Enter {selectedProvider.name} Account / Phone Number
                  </label>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-1.5 px-4 py-3.5 bg-slate-100 border border-slate-200 rounded-2xl font-bold text-sm text-slate-700">
                      <span>{activeCountry.flag}</span>
                      <span>{activeCountry.code}</span>
                    </div>
                    <input
                      type="tel"
                      required
                      placeholder={activeCountry.phonePlaceholder}
                      value={phoneNumber}
                      onChange={e => setPhoneNumber(e.target.value)}
                      className="flex-1 px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#0065eb] outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5 font-medium">An STK prompt or verification request will be initiated for ${amount} USD equivalent.</p>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-4 bg-slate-900 hover:bg-black text-white font-black text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" /> Connecting to {selectedProvider.name}...
                    </>
                  ) : (
                    <>
                      Pay ${amount} with {selectedProvider.name} <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Right: Summary */}
            <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Order Overview</h4>
              
              <div className="space-y-3 pb-4 border-b border-slate-100 text-sm font-bold">
                <div className="flex justify-between text-slate-600">
                  <span>Plan</span>
                  <span className="text-slate-900">{planName}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Selected Gateway</span>
                  <span className="text-[#0065eb]">{selectedProvider.name}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Billing Cycle</span>
                  <span className="text-slate-900">Monthly</span>
                </div>
              </div>

              <div className="flex justify-between items-baseline">
                <span className="text-xs font-black uppercase text-slate-400">Total</span>
                <span className="text-3xl font-black text-slate-900">${amount}</span>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500 font-medium space-y-1">
                <p className="font-bold text-slate-700">Need Immediate Activation?</p>
                <p>You can also use WhatsApp manual verification at any time without waiting for digital gateways.</p>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* ====================================================================
          MAINTENANCE / GATEWAY NOTICE MODAL (Triggered gracefully on Submit)
      ==================================================================== */}
      {showMaintenanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 animate-in zoom-in-95 duration-200">
            
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 mx-auto">
              <AlertTriangle size={28} />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-xl font-black text-slate-900">Gateway Under Maintenance</h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Direct automated STK checkout for <strong>{selectedProvider.name}</strong> is currently being upgraded for security. Please complete your payment via WhatsApp DM for instant account verification.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1 font-semibold text-slate-600">
              <p className="font-bold text-slate-900">Your Checkout Details:</p>
              <p>• Plan: {planName} (${amount})</p>
              <p>• Method: {selectedProvider.name} ({activeCountry.code} {phoneNumber})</p>
            </div>

            <div className="space-y-2.5">
              <a
                href={generateWhatsAppUrl(`Automated checkout maintenance fallback for ${selectedProvider.name}`)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-transform hover:scale-[1.02]"
              >
                <MessageCircle size={18} /> Continue to WhatsApp Pay
              </a>

              <button
                type="button"
                onClick={() => setShowMaintenanceModal(false)}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
              >
                Close & Change Method
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="w-8 h-8 border-3 border-[#0065eb] border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <PaymentForm />
    </Suspense>
  );
}