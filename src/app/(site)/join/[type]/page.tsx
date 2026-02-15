'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Building2, UserCheck, Lock, ArrowRight, CheckCircle, 
  MapPin, Phone, Mail, UploadCloud, ShieldCheck, X 
} from 'lucide-react';
// Assuming you have this hook. If not, the logic inside the component handles loading states.
import { useAuth } from '@/hooks/useAuth'; 

// =======================================================================
//  1. MODERN LOGIN POPUP (Glassmorphism)
// =======================================================================
const LoginPopup = ({ isOpen, type }: { isOpen: boolean; type: string }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"></div>
      
      {/* Modal Content */}
      <div className="bg-white relative z-10 w-full max-w-md p-8 rounded-[2.5rem] shadow-2xl border border-white/20 transform scale-100 transition-all">
        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <Lock size={32} className="text-[#0065eb]" />
          </div>
          
          <h3 className="text-2xl font-black text-slate-900 mb-2">Login Required</h3>
          <p className="text-slate-500 font-medium mb-8 leading-relaxed">
            To register as a <span className="font-bold text-slate-900 capitalize">{type}</span>, you need to sign in to your GuriUp account first.
          </p>

          <div className="w-full space-y-3">
            <Link 
              href={`/login?redirect=/join/${type}`} 
              className="w-full bg-[#0065eb] text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
            >
              Login / Sign Up <ArrowRight size={20} />
            </Link>
            <Link 
              href="/" 
              className="w-full bg-slate-50 text-slate-600 py-4 rounded-xl font-bold hover:bg-slate-100 transition-colors block"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

// =======================================================================
//  2. SHARED UI HELPERS
// =======================================================================
const InputField = ({ label, placeholder, type = "text", icon: Icon }: any) => (
  <div className="space-y-2">
    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">{label}</label>
    <div className="relative group">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0065eb] transition-colors">
        <Icon size={20} />
      </div>
      <input 
        type={type} 
        placeholder={placeholder}
        className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-medium rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-[#0065eb] focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
      />
    </div>
  </div>
);

// =======================================================================
//  3. HOTEL REGISTRATION FORM
// =======================================================================
const HotelRegistrationForm = () => {
  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center gap-2 bg-blue-50 text-[#0065eb] px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-4">
          <Building2 size={14} /> Hotel Partner
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">List Your Property</h1>
        <p className="text-slate-500 text-lg font-medium max-w-lg mx-auto">Start getting bookings today. Join the fastest growing hospitality network in the Horn of Africa.</p>
      </div>

      <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-xl border border-slate-100">
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField label="Hotel Name" placeholder="e.g. Grand Hargeisa Hotel" icon={Building2} />
            <InputField label="Manager Name" placeholder="Full Name" icon={UserCheck} />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField label="Phone Number" placeholder="+252 ..." type="tel" icon={Phone} />
            <InputField label="Email Address" placeholder="hotel@example.com" type="email" icon={Mail} />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Location</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <MapPin size={20} />
              </div>
              <select className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-medium rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-[#0065eb] appearance-none cursor-pointer">
                <option>Select City...</option>
                <option>Hargeisa</option>
                <option>Mogadishu</option>
                <option>Berbera</option>
                <option>Garowe</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <ArrowRight size={16} className="text-slate-400 rotate-90" />
              </div>
            </div>
          </div>

          <div className="pt-4">
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors cursor-pointer group">
               <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-[#0065eb] mb-4 group-hover:scale-110 transition-transform">
                 <UploadCloud size={32} />
               </div>
               <h4 className="font-bold text-slate-900">Upload Hotel License</h4>
               <p className="text-sm text-slate-500 mt-1">PDF or JPG (Max 5MB)</p>
            </div>
          </div>

          <button className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg shadow-xl hover:bg-[#0065eb] transition-all flex items-center justify-center gap-2 mt-4">
            Create Hotel Account <ArrowRight size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

// =======================================================================
//  4. AGENT REGISTRATION FORM
// =======================================================================
const AgentRegistrationForm = () => {
  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center gap-2 bg-green-50 text-green-600 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-4">
          <ShieldCheck size={14} /> Real Estate Agent
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">Become a Partner</h1>
        <p className="text-slate-500 text-lg font-medium max-w-lg mx-auto">Connect buyers and sellers. Manage your property portfolio with professional tools.</p>
      </div>

      <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-xl border border-slate-100">
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField label="Full Name" placeholder="e.g. Ahmed Ali" icon={UserCheck} />
            <InputField label="Agency Name (Optional)" placeholder="e.g. Somali Homes" icon={Building2} />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField label="WhatsApp Number" placeholder="+252 ..." type="tel" icon={Phone} />
            <InputField label="Email Address" placeholder="agent@example.com" type="email" icon={Mail} />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Area of Operation</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <MapPin size={20} />
              </div>
              <input 
                type="text" 
                placeholder="e.g. Hargeisa, 26 June District"
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-medium rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="flex gap-4 items-start p-4 bg-slate-50 rounded-2xl border border-slate-100">
             <div className="mt-1">
               <input type="checkbox" className="w-5 h-5 rounded text-[#0065eb] focus:ring-[#0065eb] cursor-pointer" />
             </div>
             <p className="text-sm text-slate-600 font-medium leading-relaxed">
               I agree to the <span className="text-slate-900 font-bold underline cursor-pointer">Partner Terms</span> and confirm that I am a licensed real estate agent or authorized representative.
             </p>
          </div>

          <button className="w-full bg-[#0065eb] text-white py-5 rounded-2xl font-black text-lg shadow-xl hover:bg-black transition-all flex items-center justify-center gap-2 mt-4">
            Register as Agent <ArrowRight size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

// =======================================================================
//  5. MAIN PAGE LOGIC
// =======================================================================
export default function JoinPage({ params }: { params: Promise<{ type: string }> }) {
  // 1. Unwrap dynamic params (Next.js 15+)
  const { type } = use(params);
  
  const { user, loading } = useAuth(); // Assuming useAuth provides a loading state
  const [showLogin, setShowLogin] = useState(false);
  const router = useRouter();

  // Validate Type
  const isValidType = ['agent', 'hotel'].includes(type);

  useEffect(() => {
    // If not loading and no user, show popup
    if (!loading && !user) {
      setShowLogin(true);
    } else {
      setShowLogin(false);
    }
  }, [user, loading]);

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-[#0065eb] rounded-full animate-spin"></div>
      </div>
    );
  }

  // 404 for invalid types
  if (!isValidType) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-center px-6">
        <h1 className="text-4xl font-black text-slate-900 mb-4">404</h1>
        <p className="text-slate-500 font-medium text-lg mb-8">Invalid registration type.</p>
        <Link href="/" className="bg-black text-white px-8 py-3 rounded-full font-bold">Go Home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafbfc] relative overflow-hidden">
      
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-blue-50/50 to-transparent -z-10 pointer-events-none"></div>
      <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-blue-100/30 blur-[120px] rounded-full -z-10 pointer-events-none"></div>

      {/* Login Protection Popup */}
      <LoginPopup isOpen={showLogin} type={type} />

      {/* Main Content Area */}
      <main className={`max-w-4xl mx-auto px-6 py-20 transition-all duration-500 ${showLogin ? 'blur-sm opacity-50 pointer-events-none' : ''}`}>
        
        {/* Back Link */}
        <Link href="/" className="inline-flex items-center gap-2 text-slate-500 font-bold hover:text-black transition-colors mb-12">
          <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm">
            <ArrowRight size={14} className="rotate-180"/> 
          </div>
          Back to Home
        </Link>

        {/* Dynamic Form Render */}
        {type === 'hotel' ? <HotelRegistrationForm /> : <AgentRegistrationForm />}

        {/* Footer */}
        <div className="mt-20 text-center text-slate-400 text-sm font-medium">
          <p>© 2025 GuriUp Platform. Secure Registration.</p>
          <div className="flex justify-center gap-4 mt-2">
            <a href="#" className="hover:text-slate-600 transition-colors">Privacy Policy</a>
            <span>•</span>
            <a href="#" className="hover:text-slate-600 transition-colors">Support</a>
          </div>
        </div>

      </main>
    </div>
  );
}