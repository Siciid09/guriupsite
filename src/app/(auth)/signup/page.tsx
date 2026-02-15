'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  createUserWithEmailAndPassword, 
  updateProfile, 
  sendEmailVerification,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from '../../lib/firebase'; // ⚠️ Ensure this path matches your project
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
  MapPin,
  MessageCircle,
  Loader2,
  AlertCircle,
  MailCheck
} from 'lucide-react';

// --- TYPES ---
type Role = 'user' | 'agent' | 'hotel' | null;

// Wrapper for Suspense (Required for useSearchParams in Next.js App Router)
export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin"/></div>}>
      <SignupContent />
    </Suspense>
  );
}

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State
  const [role, setRole] = useState<Role>(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);

  // Form Data
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    businessName: '',
    city: '',
    licenseNumber: '',
    whatsappNumber: '',
  });

  // --- 1. SYNC URL WITH STATE ---
  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam === 'agent' || roleParam === 'hotel' || roleParam === 'user') {
      setRole(roleParam as Role);
    } else {
      setRole(null);
    }
  }, [searchParams]);

  const updateRole = (newRole: Role) => {
    setRole(newRole);
    setStep(1);
    setError(null);
    // Update URL without refreshing
    if (newRole) {
      router.push(`?role=${newRole}`, { scroll: false });
    } else {
      router.push('/signup', { scroll: false });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  // --- 2. GOOGLE SIGN IN (REAL) ---
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user doc exists
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // Create new User Doc (Default to 'user' role for Google Signups)
        // Note: We don't allow Agents to signup via Google initially to ensure we capture business data
        await setDoc(userDocRef, {
          uid: user.uid,
          name: user.displayName || 'Google User',
          email: user.email,
          phoneNumber: user.phoneNumber || null,
          role: 'user', // Defaulting to User
          authMethod: 'google',
          photoUrl: user.photoURL,
          createdAt: serverTimestamp(),
          favoriteProperties: [],
          favoriteHotels: []
        });
      }

      // Redirect
      router.push('/dashboard'); 

    } catch (err: any) {
      console.error("Google Auth Error:", err);
      setError("Failed to sign in with Google.");
    } finally {
      setLoading(false);
    }
  };

  // --- 3. EMAIL REGISTRATION (REAL WITH VERIFICATION) ---
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validation
      if (!formData.fullName || !formData.email || !formData.password || !formData.phone) {
        throw new Error("Please fill in all personal details.");
      }
      if (role !== 'user' && (!formData.businessName || !formData.city || !formData.whatsappNumber)) {
        throw new Error("Please fill in all business details.");
      }

      // Create Auth User
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // Update Profile Name
      await updateProfile(user, { displayName: formData.fullName });

      // Prepare Firestore Data
      const userData = {
        uid: user.uid,
        name: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phone,
        role: role,
        createdAt: serverTimestamp(),
        authMethod: 'email_password',
        photoUrl: null,
        favoriteProperties: [],
        favoriteHotels: []
      };

      const agencyData = role !== 'user' ? {
        uid: user.uid,
        ownerName: formData.fullName,
        businessName: formData.businessName,
        city: formData.city,
        licenseNumber: formData.licenseNumber || 'PENDING',
        whatsappNumber: formData.whatsappNumber,
        phone: formData.phone,
        type: role,
        isVerified: false,
        createdAt: serverTimestamp(),
        logoUrl: null,
      } : null;

      // Write to Firestore
      await setDoc(doc(db, 'users', user.uid), userData);
      if (agencyData) {
        await setDoc(doc(db, 'agencies', user.uid), agencyData);
      }

      // Send Verification Email
      await sendEmailVerification(user);
      setVerificationSent(true);

    } catch (err: any) {
      console.error("Registration Error:", err);
      let msg = "An error occurred.";
      if (err.code === 'auth/email-already-in-use') msg = "Email already in use.";
      if (err.code === 'auth/weak-password') msg = "Password must be at least 6 characters.";
      setError(err.message || msg);
    } finally {
      setLoading(false);
    }
  };

  // --- VIEW: VERIFICATION SUCCESS ---
  if (verificationSent) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl max-w-md w-full text-center animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <MailCheck size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-4">Verify your Email</h2>
          <p className="text-slate-500 mb-8 font-medium">
            We've sent a verification link to <span className="text-slate-900 font-bold">{formData.email}</span>. 
            Please check your inbox to activate your account.
          </p>
          <button 
            onClick={() => router.push('/login')} 
            className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-all"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // --- MAIN VIEW ---
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col relative overflow-hidden font-sans text-slate-900 justify-center">
      
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-100/50 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-100/50 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4 pointer-events-none" />

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 relative z-10">
        <div className="w-full max-w-6xl">
          
          {/* Header */}
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
            </div>
          )}

          {/* === ROLE SELECTION === */}
          {!role && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
              <RoleCard 
                icon={<User size={32} />}
                title="I'm a Guest"
                desc="Browse homes and book hotels."
                theme="blue"
                onClick={() => updateRole('user')}
              />
              <RoleCard 
                icon={<Briefcase size={32} />}
                title="I'm an Agent"
                desc="List properties and manage leads."
                theme="indigo"
                onClick={() => updateRole('agent')}
              />
              <RoleCard 
                icon={<Building2 size={32} />}
                title="I'm a Hotel"
                desc="Manage rooms and bookings."
                theme="orange"
                onClick={() => updateRole('hotel')}
              />
            </div>
          )}

          {/* === REGISTRATION FORM === */}
          {role && (
            <div className="max-w-5xl mx-auto bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-500 border border-white/50">
              
              {/* Left Side (Visuals) */}
              <div className="w-full md:w-5/12 bg-slate-900 p-10 flex flex-col justify-between relative overflow-hidden min-h-[300px] md:min-h-auto">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0065eb] to-slate-900 opacity-90 z-10"></div>
                <Image 
                    src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1000" 
                    alt="City" fill className="object-cover opacity-50 mix-blend-overlay"
                />
                <div className="relative z-20">
                   <button onClick={() => updateRole(null)} className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm font-bold mb-10 group">
                      <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Change Role
                   </button>
                   <h3 className="text-3xl font-black text-white mb-3 capitalize">{role} Portal.</h3>
                   <p className="text-blue-100 font-medium">Create your account to get started.</p>
                </div>
              </div>

              {/* Right Side (Form) */}
              <div className="w-full md:w-7/12 p-8 md:p-12 lg:p-16 bg-white relative">
                <form onSubmit={handleRegister} className="max-w-md mx-auto md:mx-0">
                  
                  {step === 1 && (
                    <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                        <h2 className="text-2xl font-bold text-slate-900 mb-6">Personal Details</h2>
                        
                        {/* REAL GOOGLE SIGNUP BUTTON (Only for Guests/Users to keep flow simple) */}
                        {role === 'user' && (
                          <div className="mb-6">
                            <button 
                              type="button" 
                              onClick={handleGoogleSignIn}
                              className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 p-4 rounded-xl text-slate-700 font-bold text-sm hover:bg-slate-50 transition-all"
                            >
                              <Image 
                                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                                width={20} height={20} alt="G" 
                              />
                              Sign up with Gmail
                            </button>
                            <div className="relative my-6">
                              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                              <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-3 text-slate-400 font-bold tracking-wider">Or via Email</span></div>
                            </div>
                          </div>
                        )}

                        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm font-bold rounded-lg flex items-center gap-2"><AlertCircle size={16}/>{error}</div>}

                        <div className="space-y-4">
                            <InputGroup label="Full Name" icon={User} name="fullName" type="text" placeholder="Mubarik Osman" value={formData.fullName} onChange={handleChange} />
                            <InputGroup label="Email" icon={Mail} name="email" type="email" placeholder="name@example.com" value={formData.email} onChange={handleChange} />
                            <div className="grid grid-cols-2 gap-4">
                              <InputGroup label="Phone" icon={Phone} name="phone" type="tel" placeholder="+252..." value={formData.phone} onChange={handleChange} />
                              <InputGroup label="Password" icon={Lock} name="password" type="password" placeholder="••••••" value={formData.password} onChange={handleChange} />
                            </div>
                        </div>

                        <div className="pt-8">
                          {role === 'user' ? (
                            <button type="submit" disabled={loading} className="w-full bg-[#0065eb] text-white py-4 rounded-xl font-bold text-sm hover:bg-[#0052c1] transition-all flex items-center justify-center gap-2">
                              {loading ? <Loader2 className="animate-spin"/> : 'Create Account'}
                            </button>
                          ) : (
                            <button type="button" onClick={() => setStep(2)} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                              Next Step <ArrowRight size={18} />
                            </button>
                          )}
                        </div>
                     </div>
                  )}

                  {step === 2 && (
                    <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                       <h2 className="text-2xl font-bold text-slate-900 mb-6">Business Details</h2>
                       {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm font-bold rounded-lg flex items-center gap-2"><AlertCircle size={16}/>{error}</div>}

                       <div className="space-y-4">
                           <InputGroup label="Business Name" icon={Building} name="businessName" type="text" placeholder="e.g. Horn Properties" value={formData.businessName} onChange={handleChange} />
                           <div className="grid grid-cols-2 gap-4">
                             <InputGroup label="City" icon={MapPin} name="city" type="text" placeholder="Hargeisa" value={formData.city} onChange={handleChange} />
                             <InputGroup label="WhatsApp" icon={MessageCircle} name="whatsappNumber" type="tel" placeholder="+252..." value={formData.whatsappNumber} onChange={handleChange} />
                           </div>
                           {role === 'agent' && (
                             <InputGroup label="License (Optional)" icon={CheckCircle} name="licenseNumber" type="text" placeholder="AG-12345" value={formData.licenseNumber} onChange={handleChange} />
                           )}
                       </div>

                       <div className="pt-8">
                         <button type="submit" disabled={loading} className="w-full bg-[#0065eb] text-white py-4 rounded-xl font-bold text-sm hover:bg-[#0052c1] transition-all flex items-center justify-center gap-2">
                           {loading ? <Loader2 className="animate-spin"/> : 'Complete Registration'}
                         </button>
                       </div>
                    </div>
                  )}

                </form>
              </div>
            </div>
          )}

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

// --- SUB-COMPONENTS ---
const RoleCard = ({ icon, title, desc, theme, onClick }: any) => {
  const themes: any = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', hover: 'group-hover:bg-blue-600 group-hover:text-white' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', hover: 'group-hover:bg-indigo-600 group-hover:text-white' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-600', hover: 'group-hover:bg-orange-600 group-hover:text-white' },
  };
  const t = themes[theme];
  return (
    <button onClick={onClick} className="group bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 text-left flex flex-col items-start h-full">
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-colors duration-300 ${t.bg} ${t.text} ${t.hover}`}>{icon}</div>
      <h3 className="text-xl font-black text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-500 text-sm font-medium">{desc}</p>
    </button>
  );
};

const InputGroup = ({ label, name, type, placeholder, value, onChange, icon: Icon }: any) => (
  <div>
    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">{label}</label>
    <div className="relative group">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#0065eb] transition-colors"><Icon size={18} strokeWidth={2.5} /></div>
      <input type={type} name={name} placeholder={placeholder} value={value} onChange={onChange} className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-[#0065eb]/10 focus:border-[#0065eb] transition-all" />
    </div>
  </div>
);