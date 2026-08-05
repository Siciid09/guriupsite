'use client';

import React, { useState, useEffect } from 'react';
import { 
  Check, Star, MessageCircle, Building2, Briefcase, 
  User, MapPin, Phone, ArrowRight, X, ShieldCheck 
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth'; // Optional: Use your auth hook if available

// ============================================================================
// DATA STRUCTURES
// ============================================================================
const AGENT_FEATURES = [
  { text: "Top of Search Results", isPro: true },
  { text: "Blue Verified Badge", isPro: true },
  { text: "Ad Removal", isPro: true },
  { text: "Direct WhatsApp & Call", isPro: true },
  { text: "Unlimited Listings", isPro: true },
  { text: "Exact GPS Map", isPro: true },
  { text: "Analytics Dashboard", isPro: true },
  { text: "Priority Support 24/7", isPro: true },
  { text: "3 Featured Properties/mo", isPro: true },
  { text: "Auto-Repost to Socials", isPro: true },
  { text: "CRM Lead Management", isPro: true },
  { text: "SEO Optimization", isPro: true },
];

const HOTEL_FEATURES = [
  { text: "Featured on Home Slider", isPro: true },
  { text: "Top Search Ranking", isPro: true },
  { text: "Verified Hotel Badge", isPro: true },
  { text: "Receive Direct Bookings", isPro: true },
  { text: "Unlock Inbox", isPro: true },
  { text: "Exact Google Maps Pin", isPro: true },
  { text: "0% Commission Fees", isPro: true },
  { text: "Multi-User Access", isPro: true },
  { text: "Event Hall Promotion", isPro: true },
  { text: "Seasonal Pricing Tools", isPro: true },
  { text: "Guest Reviews Manager", isPro: true },
  { text: "Instant SMS Notifications", isPro: true },
];

const PLANS = {
  agent: {
    title: "Real Estate Pro",
    price: 10,
    period: "/ month",
    type: "agent",
    icon: <Briefcase size={24} className="text-white" />,
    features: AGENT_FEATURES,
  },
  hotel: {
    title: "Hotel Business",
    price: 20,
    period: "/ month",
    type: "hotel",
    icon: <Building2 size={24} className="text-white" />,
    features: HOTEL_FEATURES,
  }
};

export default function PricingPage() {
  const { user } = useAuth(); // Optional: used to auto-fill details if logged in
  const [activeTab, setActiveTab] = useState<'agent' | 'hotel'>('agent');
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    businessType: 'Independent Agent',
    businessName: '',
    phone: '',
    location: ''
  });

  // Auto-fill if user data is available
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.displayName || prev.name,
        phone: user.phoneNumber || prev.phone,
      }));
    }
  }, [user]);

  // Handle Tab Switch (Auto-updates business type in form)
  const handleTabSwitch = (tab: 'agent' | 'hotel') => {
    setActiveTab(tab);
    setFormData(prev => ({
      ...prev,
      businessType: tab === 'hotel' ? 'Hotel / Accommodation' : 'Real Estate Agency'
    }));
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubscribeClick = () => {
    setShowModal(true);
  };

  const submitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const activePlan = PLANS[activeTab];
    const orderId = Math.random().toString(36).substring(2, 10).toUpperCase();

    // 1. Format the exact WhatsApp message
    const message = `Hello GuriUp Support! 👋\n\nI would like to activate my Premium Plan manually. Here are my details:\n\n🛒 *ORDER SUMMARY*\n• Order ID: ${orderId}\n• Plan Requested: ${activePlan.title}\n• Price: $${activePlan.price}\n\n👤 *MY DETAILS*\n• Name: ${formData.name}\n• Business Type: ${formData.businessType}\n• Business Name: ${formData.businessName}\n• Contact Phone: ${formData.phone}\n• Location: ${formData.location}\n\nPlease guide me on how to complete the payment via Zaad/eDahab so my account can be verified and unlocked immediately. Thank you!`;

    // 2. Redirect to WhatsApp
    const supportPhone = "252653227084";
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${supportPhone}?text=${encodedMessage}`;

    // Small delay for UX feeling
    setTimeout(() => {
      setIsSubmitting(false);
      setShowModal(false);
      window.open(whatsappUrl, '_blank');
    }, 800);
  };

  const currentPlan = PLANS[activeTab];

  return (
    <div className="min-h-screen bg-[#FAFBFC] font-sans text-slate-900 selection:bg-blue-200 pt-24 pb-20">
      
      {/* ================= HERO & TOGGLE ================= */}
      <div className="max-w-4xl mx-auto px-6 text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900 mb-6">
          Upgrade to <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0164E5] to-blue-400">Premium.</span>
        </h1>
        <p className="text-slate-500 font-medium text-lg mb-10 max-w-2xl mx-auto">
          Unlock powerful tools, top search rankings, and zero commission fees to scale your business across the Horn of Africa.
        </p>

        {/* Super Modern Toggle */}
        <div className="inline-flex items-center p-1.5 bg-white border border-slate-200 rounded-full shadow-sm relative">
          <div 
            className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-slate-900 rounded-full transition-transform duration-300 ease-in-out shadow-md ${activeTab === 'hotel' ? 'translate-x-[calc(100%+6px)]' : 'translate-x-0'}`}
          />
          <button 
            onClick={() => handleTabSwitch('agent')}
            className={`relative z-10 px-8 py-3 rounded-full text-sm font-black uppercase tracking-wider transition-colors duration-300 ${activeTab === 'agent' ? 'text-white' : 'text-slate-500 hover:text-slate-900'}`}
          >
            For Agents
          </button>
          <button 
            onClick={() => handleTabSwitch('hotel')}
            className={`relative z-10 px-8 py-3 rounded-full text-sm font-black uppercase tracking-wider transition-colors duration-300 ${activeTab === 'hotel' ? 'text-white' : 'text-slate-500 hover:text-slate-900'}`}
          >
            For Hotels
          </button>
        </div>
      </div>

      {/* ================= PRICING CARD ================= */}
      <div className="max-w-5xl mx-auto px-6">
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-blue-900/5 border border-slate-100 overflow-hidden flex flex-col lg:flex-row">
          
          {/* Left: Pricing Details */}
          <div className="lg:w-2/5 p-10 lg:p-12 bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] text-white flex flex-col justify-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
            
            <div className="relative z-10">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 border border-white/20 shadow-lg">
                {currentPlan.icon}
              </div>
              <h2 className="text-3xl font-black mb-2">{currentPlan.title}</h2>
              <p className="text-blue-100 font-medium mb-8">Everything you need to dominate the local market.</p>
              
              <div className="flex items-baseline gap-2 mb-8">
                <span className="text-6xl font-black tracking-tighter">${currentPlan.price}</span>
                <span className="text-blue-200 font-bold uppercase tracking-widest">{currentPlan.period}</span>
              </div>

              <button 
                onClick={handleSubscribeClick}
                className="w-full py-4 bg-amber-400 hover:bg-amber-500 text-amber-950 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-amber-400/20 transition-all flex items-center justify-center gap-2 group"
              >
                Subscribe Now <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>

              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-blue-200 font-bold">
                <ShieldCheck size={14} /> Secured by Sifalo Pay
              </div>
            </div>
          </div>

          {/* Right: Features List */}
          <div className="lg:w-3/5 p-10 lg:p-12 bg-white">
            <h3 className="font-black text-slate-900 text-lg mb-8 uppercase tracking-widest">What's Included</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
              {currentPlan.features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-3 group">
                  <div className={`mt-0.5 p-1 rounded-full shrink-0 transition-colors ${feature.isPro ? 'bg-green-100 text-green-600 group-hover:bg-green-500 group-hover:text-white' : 'bg-slate-100 text-slate-400'}`}>
                    {feature.isPro ? <Check size={14} strokeWidth={3} /> : <X size={14} strokeWidth={3} />}
                  </div>
                  <span className={`text-sm font-bold ${feature.isPro ? 'text-slate-700' : 'text-slate-400 line-through'}`}>
                    {feature.text}
                  </span>
                  {feature.isPro && idx < 3 && <Star size={12} className="text-amber-400 fill-amber-400 ml-auto opacity-50" />}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ================= CHECKOUT MODAL ================= */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          
          <div className="relative bg-[#F8F9FA] w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-br from-[#0164E5] to-[#004CB3] p-8 text-white relative">
              <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                <X size={20} />
              </button>
              <p className="text-blue-200 text-xs font-black uppercase tracking-widest mb-2">Selected Plan</p>
              <h2 className="text-3xl font-black mb-4">{currentPlan.title}</h2>
              <div className="inline-block bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl text-xl font-black">
                ${currentPlan.price.toFixed(2)}
              </div>
            </div>

            {/* Modal Body (Form) */}
            <div className="p-8 overflow-y-auto custom-scrollbar">
              <div className="mb-6">
                <h3 className="font-black text-slate-900 text-lg">Confirm Your Details</h3>
                <p className="text-xs text-slate-500 font-bold mt-1 leading-relaxed">
                  We will send this information to our support team via WhatsApp to instantly upgrade your account.
                </p>
              </div>

              <form id="checkout-form" onSubmit={submitOrder} className="space-y-4">
                <ModernInput 
                  icon={<User size={18} />} 
                  label="Your Name *" 
                  value={formData.name} 
                  onChange={(v: string) => handleInputChange('name', v)} 
                  required 
                />
                <ModernInput 
                  icon={<Briefcase size={18} />} 
                  label="Business Type *" 
                  value={formData.businessType} 
                  onChange={(v: string) => handleInputChange('businessType', v)} 
                  required 
                />
                <ModernInput 
                  icon={<Building2 size={18} />} 
                  label="Business / Hotel Name *" 
                  value={formData.businessName} 
                  onChange={(v: string) => handleInputChange('businessName', v)} 
                  required 
                />
                <ModernInput 
                  icon={<Phone size={18} />} 
                  label="Contact Phone *" 
                  type="tel"
                  value={formData.phone} 
                  onChange={(v: string) => handleInputChange('phone', v)} 
                  required 
                />
                <ModernInput 
                  icon={<MapPin size={18} />} 
                  label="City / Location *" 
                  value={formData.location} 
                  onChange={(v: string) => handleInputChange('location', v)} 
                  required 
                />
              </form>
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-white border-t border-slate-100">
              <button 
                form="checkout-form"
                type="submit"
                disabled={isSubmitting} 
                className="w-full h-14 bg-[#25D366] hover:bg-[#1dbf57] text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-green-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isSubmitting ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <><MessageCircle size={20} /> Send Order via WhatsApp</>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

interface ModernInputProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}

function ModernInput({ icon, label, value, onChange, type = "text", required = false }: ModernInputProps) {
  return (
    <div className="relative">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
        {icon}
      </div>
      <input 
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={label}
        className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-900 outline-none focus:border-[#0164E5] focus:ring-4 focus:ring-[#0164E5]/10 transition-all placeholder:text-slate-400 placeholder:font-medium shadow-sm"
      />
    </div>
  );
}