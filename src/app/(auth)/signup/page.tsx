'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Building2, 
  Briefcase, 
  Mail, 
  Lock, 
  Phone, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle,
  Building,
  MapPin
} from 'lucide-react';

// --- TYPES ---
type Role = 'user' | 'agent' | 'hotel' | null;

export default function SignupPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>(null);
  const [step, setStep] = useState(1); // 1 = Basic, 2 = Business
  const [loading, setLoading] = useState(false);

  // --- FORM STATE ---
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    businessName: '',
    city: '',
    licenseNumber: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- LOGIC ---
  const handleRoleSelect = (selectedRole: Role) => {
    setRole(selectedRole);
    setStep(1); 
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    } else {
      setRole(null); 
    }
  };

  const handleNext = () => {
    if (!formData.fullName || !formData.email || !formData.password) {
      alert("Please fill in all required fields.");
      return;
    }
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      console.log("Registered:", { role, ...formData });
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col relative overflow-hidden font-sans text-slate-900 justify-center">
      
      {/* --- BACKGROUND DECOR --- */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-100/50 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-100/50 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4 pointer-events-none" />

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 relative z-10">
        <div className="w-full max-w-6xl">
          
          {/* HEADER (Logo + Title) */}
          {!role && (
            <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex items-center justify-center gap-2 mb-6">
                <div className="bg-[#0065eb] p-2 rounded-xl shadow-lg shadow-blue-500/30">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
                </div>
                <span className="text-2xl font-black text-slate-900 tracking-tight">GuriUp</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-4 tracking-tight">
                Join the <span className="text-[#0065eb]">Future</span> of Real Estate
              </h1>
              <p className="text-slate-500 text-lg max-w-2xl mx-auto font-medium">
                Select your account type to get started. Whether you are hunting for a home or building a business, we have the tools you need.
              </p>
            </div>
          )}

          {/* === VIEW 1: ROLE SELECTION (Bento Grid) === */}
          {!role && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
              <RoleCard 
                icon={<User size={32} />}
                title="I'm a Guest"
                desc="Browse homes, book hotels, and chat with agents."
                theme="blue"
                onClick={() => handleRoleSelect('user')}
              />
              <RoleCard 
                icon={<Briefcase size={32} />}
                title="I'm an Agent"
                desc="List properties, manage leads, and access analytics."
                theme="indigo"
                onClick={() => handleRoleSelect('agent')}
              />
              <RoleCard 
                icon={<Building2 size={32} />}
                title="I'm a Hotel"
                desc="Manage rooms, bookings, and increase occupancy."
                theme="orange"
                onClick={() => handleRoleSelect('hotel')}
              />
            </div>
          )}

          {/* === VIEW 2: REGISTRATION FORM (Split Layout) === */}
          {role && (
            <div className="max-w-5xl mx-auto bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-500 border border-white/50">
              
              {/* LEFT SIDE: VISUAL CONTEXT */}
              <div className="w-full md:w-5/12 bg-slate-900 p-10 flex flex-col justify-between relative overflow-hidden min-h-[300px] md:min-h-auto">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0065eb] to-slate-900 opacity-90 z-10"></div>
                <Image 
                    src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1000" 
                    alt="City" 
                    fill 
                    className="object-cover opacity-50 mix-blend-overlay"
                />
                
                <div className="relative z-20">
                   <button onClick={handleBack} className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm font-bold mb-10 group">
                      <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
                      Change Role
                   </button>
                   
                   <div className="inline-flex items-center justify-center w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl text-white mb-6 border border-white/20 shadow-lg">
                      {role === 'user' && <User size={28} />}
                      {role === 'agent' && <Briefcase size={28} />}
                      {role === 'hotel' && <Building2 size={28} />}
                   </div>
                   
                   <h3 className="text-3xl md:text-4xl font-black text-white mb-3">
                     {role === 'user' ? 'Welcome Guest.' : role === 'agent' ? 'Agent Portal.' : 'Partner Portal.'}
                   </h3>
                   <p className="text-blue-100 text-sm md:text-base font-medium leading-relaxed max-w-xs">
                     {role === 'user' 
                        ? "Join 50,000+ people finding their dream homes and stays across the Horn of Africa."
                        : role === 'agent'
                        ? "Grow your agency with verified listings, lead management, and premium tools."
                        : "Take control of your bookings. Fill rooms faster with our verified ecosystem."
                     }
                   </p>
                </div>

                {role !== 'user' && (
                  <div className="relative z-20 mt-10">
                     <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs font-bold ${step >= 1 ? 'text-white' : 'text-white/40'}`}>Account</span>
                        <div className="h-px flex-1 bg-white/20"></div>
                        <span className={`text-xs font-bold ${step >= 2 ? 'text-white' : 'text-white/40'}`}>Business</span>
                     </div>
                     <div className="flex gap-2">
                        <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= 1 ? 'bg-white' : 'bg-white/20'}`}></div>
                        <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= 2 ? 'bg-white' : 'bg-white/20'}`}></div>
                     </div>
                  </div>
                )}
              </div>

              {/* RIGHT SIDE: THE FORM */}
              <div className="w-full md:w-7/12 p-8 md:p-12 lg:p-16 bg-white relative">
                <form onSubmit={handleSubmit} className="max-w-md mx-auto md:mx-0">
                  
                  {/* --- STEP 1: CREDENTIALS --- */}
                  {step === 1 && (
                    <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                       <div className="mb-8">
                          <h2 className="text-2xl font-bold text-slate-900">Create Account</h2>
                          <p className="text-slate-500 text-sm font-medium mt-1">Enter your details to get started.</p>
                       </div>

                       <button type="button" className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 p-4 rounded-xl text-slate-700 font-bold text-sm hover:bg-slate-50 transition-all mb-6">
                         <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                         Sign up with Google
                       </button>

                       <div className="relative mb-6">
                          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                          <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-3 text-slate-400 font-bold tracking-wider">Or continue with</span></div>
                       </div>

                       <div className="space-y-4">
                           <InputGroup label="Full Name" icon={User} name="fullName" type="text" placeholder="e.g. Mubarik Osman" value={formData.fullName} onChange={handleChange} />
                           <InputGroup label="Email Address" icon={Mail} name="email" type="email" placeholder="name@example.com" value={formData.email} onChange={handleChange} />
                           <div className="grid grid-cols-2 gap-4">
                              <InputGroup label="Phone" icon={Phone} name="phone" type="tel" placeholder="+252..." value={formData.phone} onChange={handleChange} />
                              <InputGroup label="Password" icon={Lock} name="password" type="password" placeholder="••••••••" value={formData.password} onChange={handleChange} />
                           </div>
                       </div>

                       <div className="pt-8">
                         {role === 'user' ? (
                           <button type="submit" disabled={loading} className="w-full bg-[#0065eb] text-white py-4 rounded-xl font-bold text-sm hover:bg-[#0052c1] transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 active:scale-95">
                             {loading ? 'Creating Account...' : 'Create Guest Account'}
                           </button>
                         ) : (
                           <button type="button" onClick={handleNext} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all flex items-center justify-center gap-2 active:scale-95">
                             Next Step <ArrowRight size={18} />
                           </button>
                         )}
                       </div>
                    </div>
                  )}

                  {/* --- STEP 2: BUSINESS INFO (AGENT/HOTEL) --- */}
                  {step === 2 && (
                    <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                       <div className="mb-8">
                          <h2 className="text-2xl font-bold text-slate-900">
                            {role === 'agent' ? 'Agency Details' : 'Hotel Details'}
                          </h2>
                          <p className="text-slate-500 text-sm font-medium mt-1">Tell us a bit more about your business.</p>
                       </div>

                       <div className="space-y-4">
                           <InputGroup 
                              label={role === 'agent' ? "Agency Name" : "Hotel Name"} 
                              icon={role === 'agent' ? Briefcase : Building} 
                              name="businessName" 
                              type="text" 
                              placeholder={role === 'agent' ? "e.g. Horn Properties" : "e.g. Grand Plaza"} 
                              value={formData.businessName} 
                              onChange={handleChange} 
                           />
                           
                           <InputGroup 
                              label="City Location" 
                              icon={MapPin} 
                              name="city" 
                              type="text" 
                              placeholder="e.g. Hargeisa" 
                              value={formData.city} 
                              onChange={handleChange} 
                           />

                           {role === 'agent' && (
                             <InputGroup 
                                label="License Number (Optional)" 
                                icon={CheckCircle} 
                                name="licenseNumber" 
                                type="text" 
                                placeholder="e.g. AG-12345" 
                                value={formData.licenseNumber} 
                                onChange={handleChange} 
                             />
                           )}
                       </div>

                       <div className="pt-8">
                         <button type="submit" disabled={loading} className="w-full bg-[#0065eb] text-white py-4 rounded-xl font-bold text-sm hover:bg-[#0052c1] transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 active:scale-95">
                           {loading ? 'Registering...' : `Complete Registration`}
                         </button>
                       </div>
                    </div>
                  )}

                </form>
              </div>
            </div>
          )}

          {/* --- BOTTOM LOGIN LINK --- */}
          <div className="text-center mt-12 mb-6">
            <p className="text-slate-500 font-medium text-sm">
              Already have an account? <Link href="/login" className="text-[#0065eb] font-bold hover:underline ml-1">Log In</Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

// ==========================================================
//  SUB-COMPONENTS (Clean & Reusable)
// ==========================================================

const RoleCard = ({ icon, title, desc, theme, onClick }: { icon: React.ReactNode, title: string, desc: string, theme: 'blue' | 'indigo' | 'orange', onClick: () => void }) => {
  const themes = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', hover: 'group-hover:bg-blue-600 group-hover:text-white', ring: 'group-hover:ring-blue-200' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', hover: 'group-hover:bg-indigo-600 group-hover:text-white', ring: 'group-hover:ring-indigo-200' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-600', hover: 'group-hover:bg-orange-600 group-hover:text-white', ring: 'group-hover:ring-orange-200' },
  };
  const t = themes[theme];

  return (
    <button 
      onClick={onClick}
      className={`group bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 text-left flex flex-col items-start h-full relative overflow-hidden`}
    >
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-colors duration-300 ${t.bg} ${t.text} ${t.hover}`}>
        {icon}
      </div>
      <h3 className="text-xl font-black text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-500 text-sm leading-relaxed font-medium">{desc}</p>
      
      {/* Decorative Circle on Hover */}
      <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-0 group-hover:opacity-10 transition-opacity duration-300 ${t.bg.replace('bg-', 'bg-')}`}></div>
    </button>
  );
};

const InputGroup = ({ label, name, type, placeholder, value, onChange, icon: Icon }: any) => (
  <div>
    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">{label}</label>
    <div className="relative group">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#0065eb] transition-colors">
        <Icon size={18} strokeWidth={2.5} />
      </div>
      <input 
        type={type} 
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-[#0065eb]/10 focus:border-[#0065eb] transition-all placeholder:font-medium placeholder:text-slate-400"
      />
    </div>
  </div>
);