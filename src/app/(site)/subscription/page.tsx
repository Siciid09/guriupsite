'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  CheckCircle2, 
  Star, 
  Building2, 
  Briefcase, 
  ArrowRight,
  ShieldCheck,
  ArrowLeft
} from 'lucide-react';

export default function SubscriptionPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'agent' | 'hotel'>('agent');

  // --- PLAN DATA (Mirroring your Flutter App) ---
  const plans = {
    agent: {
      id: 'agent_premium',
      name: 'Real Estate Pro',
      price: 20.00,
      period: '/ month',
      icon: Briefcase,
      color: 'from-[#1E3A8A] to-[#3B82F6]', // Dark Blue to Light Blue
      features: [
        "Top of Search Results",
        "Blue Verified Badge",
        "Ad Removal",
        "Direct WhatsApp & Call",
        "Unlimited Listings",
        "Exact GPS Map",
        "Analytics Dashboard",
        "Priority Support 24/7",
        "3 Featured Properties/mo",
        "Auto-Repost to Socials",
        "CRM Lead Management",
        "SEO Optimization",
      ]
    },
    hotel: {
      id: 'hotel_premium',
      name: 'Hotel Business',
      price: 25.00,
      period: '/ month',
      icon: Building2,
      color: 'from-[#0f172a] to-[#334155]', // Slate/Black gradient for Hotels
      features: [
        "Featured on Home Slider",
        "Top Search Ranking",
        "Verified Hotel Badge",
        "Receive Direct Bookings",
        "Unlock Inbox",
        "Exact Google Maps Pin",
        "0% Commission Fees",
        "Multi-User Access",
        "Event Hall Promotion",
        "Seasonal Pricing Tools",
        "Guest Reviews Manager",
        "Instant SMS Notifications",
      ]
    }
  };

  const activePlan = plans[activeTab];
  const Icon = activePlan.icon;

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-20">
      {/* --- NAVBAR --- */}
      <nav className="bg-white px-6 py-4 shadow-sm border-b border-slate-100 flex items-center sticky top-0 z-50">
        <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-full transition-colors mr-4">
          <ArrowLeft size={24} className="text-slate-700"/>
        </button>
        <h1 className="text-xl font-black text-slate-900">Upgrade Plan</h1>
      </nav>

      <div className="max-w-3xl mx-auto px-6 mt-10">
        
        {/* --- HEADER --- */}
        <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
            Grow your business with <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0164E5] to-indigo-600">Premium</span>
          </h2>
          <p className="text-slate-500 font-medium">Select the plan that best fits your needs.</p>
        </div>

        {/* --- TAB SWITCHER --- */}
        <div className="flex justify-center mb-10 animate-in fade-in zoom-in-95 duration-500">
          <div className="bg-white p-1.5 rounded-full border border-slate-200 shadow-sm inline-flex">
            <button
              onClick={() => setActiveTab('agent')}
              className={`px-8 py-3 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'agent' 
                  ? 'bg-[#0164E5] text-white shadow-md' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Briefcase size={18} /> For Agents
            </button>
            <button
              onClick={() => setActiveTab('hotel')}
              className={`px-8 py-3 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'hotel' 
                  ? 'bg-slate-900 text-white shadow-md' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Building2 size={18} /> For Hotels
            </button>
          </div>
        </div>

        {/* --- PRICING CARD --- */}
        <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
          
          {/* Top Gradient Area */}
          <div className={`p-10 text-center relative overflow-hidden bg-gradient-to-br ${activePlan.color}`}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
            
            <div className="inline-flex items-center justify-center p-4 bg-white/10 backdrop-blur-md rounded-2xl mb-6 border border-white/20">
              <Icon size={32} className="text-white" />
            </div>
            
            <h3 className="text-2xl font-bold text-white/90 mb-2">{activePlan.name}</h3>
            
            <div className="flex items-baseline justify-center gap-1 mb-8">
              <span className="text-5xl md:text-6xl font-black text-white">${activePlan.price}</span>
              <span className="text-lg text-white/70 font-medium">{activePlan.period}</span>
            </div>

            {/* Link routes to the exact PaymentPage with URL params */}
            <Link 
              href={`/payment?planId=${activePlan.id}&planName=${encodeURIComponent(activePlan.name)}&amount=${activePlan.price.toFixed(2)}`}
              className="inline-flex items-center justify-center w-full sm:w-auto px-10 py-4 bg-amber-400 hover:bg-amber-300 text-slate-900 rounded-full font-black text-lg transition-all hover:scale-105 shadow-[0_0_20px_rgba(251,191,36,0.4)] gap-2"
            >
              SUBSCRIBE NOW <ArrowRight size={20} />
            </Link>
          </div>

          {/* Features List */}
          <div className="p-8 md:p-12 bg-white">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-px bg-slate-200 flex-1"></div>
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Everything Included</span>
              <div className="h-px bg-slate-200 flex-1"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
              {activePlan.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3 group">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-50 flex items-center justify-center border border-green-100 group-hover:bg-green-100 transition-colors">
                    <CheckCircle2 size={14} className="text-green-600" />
                  </div>
                  <span className="text-slate-700 font-medium text-sm flex-1">{feature}</span>
                  <Star size={14} className="text-amber-400 flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* --- FOOTER --- */}
        <div className="mt-10 text-center flex flex-col items-center justify-center opacity-60">
          <ShieldCheck size={24} className="text-slate-400 mb-2" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Secured by GuriUp Manual Verification</p>
        </div>

      </div>
    </div>
  );
}