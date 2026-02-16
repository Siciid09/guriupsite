'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  createUserWithEmailAndPassword, 
  updateProfile, 
  sendEmailVerification,
  signOut,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
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
  MailCheck,
  Eye,
  EyeOff,
  ShieldCheck
} from 'lucide-react';

// --- TYPES ---
// FIXED: Updated roles to match App expectations ('reagent' for Agent, 'hoadmin' for Hotel)
type Role = 'user' | 'reagent' | 'hoadmin' | null;

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]"><Loader2 className="animate-spin text-[#0065eb]"/></div>}>
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
  const [emailSentTo, setEmailSentTo] = useState('');

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

  // --- 1. SYNC URL ---
  useEffect(() => {
    const roleParam = searchParams.get('role');
    // FIXED: Map URL params to correct internal roles
    if (roleParam === 'reagent' || roleParam === 'hoadmin' || roleParam === 'user') {
      setRole(roleParam as Role);
    } else if (roleParam === 'agent') {
      setRole('reagent'); // Handle legacy param
    } else if (roleParam === 'hotel') {
      setRole('hoadmin'); // Handle legacy param
    } else {
      setRole(null);
    }
  }, [searchParams]);

  const updateRole = (newRole: Role) => {
    setRole(newRole);
    setStep(1);
    setError(null);
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

  // --- 2. GOOGLE SIGN IN ---
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          uid: user.uid,
          name: user.displayName || 'Google User',
          email: user.email,
          phoneNumber: user.phoneNumber || null,
          role: 'user', 
          authMethod: 'google',
          photoUrl: user.photoURL,
          emailVerified: true, 
          createdAt: serverTimestamp(),
          planTier: 'free', // FIXED: Added default plan tier
          favoriteProperties: [],
          favoriteHotels: []
        });
      }
      router.push('/dashboard'); 
    } catch (err: any) {
      setError("Failed to sign in with Google.");
    } finally {
      setLoading(false);
    }
  };

  // --- 3. STRICT REGISTER WITH VERIFICATION LOCK ---
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Validate inputs
      if (!formData.fullName || !formData.email || !formData.password || !formData.phone) {
        throw new Error("Please fill in all personal details.");
      }
      if (role !== 'user' && (!formData.businessName || !formData.city || !formData.whatsappNumber)) {
        throw new Error("Please fill in all business details.");
      }

      // 2. Create Authentication User
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // 3. Update Display Name immediately
      await updateProfile(user, { displayName: formData.fullName });

      // 4. Send Verification Link
      await sendEmailVerification(user);

      // 5. Create Firestore Documents (Marked as NOT verified)
      const userData = {
        uid: user.uid,
        name: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phone,
        role: role, // This will now be 'reagent' or 'hoadmin'
        createdAt: serverTimestamp(),
        authMethod: 'email_password',
        photoUrl: null,
        emailVerified: false, 
        planTier: 'free', // FIXED: Default plan tier ensures users are sortable in App
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

      await setDoc(doc(db, 'users', user.uid), userData);
      
      if (agencyData) {
        // FIXED: Determine correct collection based on role
        // 'reagent' -> 'agents' collection (Matches App logic)
        // 'hoadmin' -> 'hotels' collection
        const collectionName = role === 'reagent' ? 'agents' : 'hotels';
        
        // FIXED: Writing to 'agents' (or 'hotels') instead of 'agencies'
        await setDoc(doc(db, collectionName, user.uid), agencyData);
      }

      // 6. CRITICAL: Sign Out immediately so they can't access dashboard
      await signOut(auth);

      // 7. Show Verification Screen
      setEmailSentTo(formData.email);
      setVerificationSent(true);

    } catch (err: any) {
      console.error("Registration Error:", err);
      let msg = "An error occurred.";
      if (err.code === 'auth/email-already-in-use') msg = "This email is already registered.";
      if (err.code === 'auth/weak-password') msg = "Password must be at least 6 characters.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // --- VIEW: VERIFICATION SENT (The "Gate") ---
  if (verificationSent) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
         {/* Background Blobs */}
         <div className="absolute top-0 left-0 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
         <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
         
        <div className="bg-white/80 backdrop-blur-xl border border-white/50 p-10 rounded-[2.5rem] shadow-2xl max-w-md w-full text-center animate-in zoom-in-95 duration-500 relative z-10">
          <div className="w-24 h-24 bg-gradient-to-tr from-green-100 to-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <ShieldCheck size={48} />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-2">Verify Account</h2>
          <p className="text-slate-500 mb-8 font-medium leading-relaxed">
            We've sent a secure verification link to <br/>
            <span className="text-slate-900 font-bold bg-slate-100 px-2 py-1 rounded-lg mt-1 inline-block">{emailSentTo}</span>
          </p>
          
          <div className="bg-blue-50/50 rounded-2xl p-4 mb-8 text-sm text-blue-700 font-medium border border-blue-100">
            <p>1. Open your email app</p>
            <p>2. Click the verification link</p>
            <p>3. Come back here and log in</p>
          </div>

          <button 
            onClick={() => router.push('/login')} 
            className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 hover:scale-[1.02] transition-all shadow-lg shadow-slate-900/20"
          >
            Proceed to Login
          </button>
          
          <button 
             onClick={() => window.location.reload()}
             className="mt-4 text-slate-400 text-sm font-bold hover:text-slate-600 transition-colors"
          >
            Resend Link
          </button>
        </div>
      </div>
    );
  }

  // --- MAIN VIEW ---
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col relative overflow-hidden font-sans text-slate-900 justify-center">
      
      {/* Dynamic Background */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#0065eb]/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none mix-blend-multiply" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4 pointer-events-none mix-blend-multiply" />

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 relative z-10">
        <div className="w-full max-w-6xl">
          
          {/* Header Section */}
          {!role && (
            <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex items-center justify-center gap-3 mb-8">
                <div className="bg-gradient-to-tr from-[#0065eb] to-blue-500 p-2.5 rounded-xl shadow-lg shadow-blue-500/20">
                       </div>
               
              </div>
              <h1 className="text-4xl md:text-7xl font-black text-slate-900 mb-6 tracking-tight leading-tight">
                Join the <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0065eb] to-indigo-600">Future</span><br/> of Real Estate
              </h1>
              <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto">
                Connect with top rated agents, book luxury hotels, and find your dream home in Somalia's fastest growing network.
              </p>
            </div>
          )}

          {/* === ROLE SELECTION === */}
          {!role && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700 max-w-5xl mx-auto">
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
                // FIXED: Set role to 'reagent'
                onClick={() => updateRole('reagent')}
              />
              <RoleCard 
                icon={<Building2 size={32} />}
                title="I'm a Hotel"
                desc="Manage rooms and bookings."
                theme="orange"
                // FIXED: Set role to 'hoadmin'
                onClick={() => updateRole('hoadmin')}
              />
            </div>
          )}

          {/* === REGISTRATION FORM === */}
          {role && (
            <div className="max-w-5xl mx-auto bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-500 border border-white/50 ring-1 ring-slate-100">
              
              {/* Left Side (Visuals) */}
              <div className="w-full md:w-5/12 bg-slate-900 p-10 flex flex-col justify-between relative overflow-hidden min-h-[300px] md:min-h-auto group">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0065eb] to-indigo-900 opacity-90 z-10 transition-opacity duration-700 group-hover:opacity-95"></div>
                <Image 
                    src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1000" 
                    alt="City" fill className="object-cover opacity-50 mix-blend-overlay scale-110 group-hover:scale-100 transition-transform duration-1000"
                />
                <div className="relative z-20">
                   <button onClick={() => updateRole(null)} className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm font-bold mb-10 group/btn">
                      <div className="p-2 rounded-full bg-white/10 group-hover/btn:bg-white/20 transition-colors">
                        <ArrowLeft size={16} className="group-hover/btn:-translate-x-0.5 transition-transform" /> 
                      </div>
                      <span className="ml-1">Change Role</span>
                   </button>
                   <div className="space-y-2">
                     <span className="px-3 py-1 rounded-full bg-white/10 text-white/90 text-xs font-bold uppercase tracking-wider border border-white/10 inline-block mb-2">
                        {role === 'reagent' ? 'Agent' : role === 'hoadmin' ? 'Hotel' : 'User'} Account
                     </span>
                     <h3 className="text-4xl font-black text-white capitalize leading-tight">
                        Create your <br/> profile.
                     </h3>
                     <p className="text-blue-100 font-medium leading-relaxed mt-4 max-w-xs opacity-90">
                        Join thousands of users and businesses managing their real estate journey with GuriUp.
                     </p>
                   </div>
                </div>
                
                {/* Progress Dots */}
                <div className="relative z-20 flex gap-2 mt-12 md:mt-0">
                    <div className={`h-1.5 rounded-full transition-all duration-300 ${step === 1 ? 'w-8 bg-white' : 'w-2 bg-white/30'}`} />
                    {role !== 'user' && (
                        <div className={`h-1.5 rounded-full transition-all duration-300 ${step === 2 ? 'w-8 bg-white' : 'w-2 bg-white/30'}`} />
                    )}
                </div>
              </div>

              {/* Right Side (Form) */}
              <div className="w-full md:w-7/12 p-8 md:p-12 lg:p-16 relative">
                <form onSubmit={handleRegister} className="max-w-md mx-auto md:mx-0">
                  
                  {step === 1 && (
                    <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                        <h2 className="text-2xl font-bold text-slate-900 mb-6">Personal Details</h2>
                        
                        {/* Google Btn */}
                        {role === 'user' && (
                          <div className="mb-8">
                            <button 
                              type="button" 
                              onClick={handleGoogleSignIn}
                              className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 p-4 rounded-xl text-slate-700 font-bold text-sm hover:bg-slate-50 hover:border-slate-300 transition-all group"
                            >
                              <Image 
                                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                                width={20} height={20} alt="G" 
                                className="group-hover:scale-110 transition-transform"
                              />
                              Sign up with Gmail
                            </button>
                            <div className="relative my-6">
                              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                              <div className="relative flex justify-center text-xs uppercase"><span className="bg-white/80 backdrop-blur px-3 text-slate-400 font-bold tracking-wider">Or via Email</span></div>
                            </div>
                          </div>
                        )}

                        {error && (
                            <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm font-bold rounded-xl flex items-start gap-3 border border-red-100">
                                <AlertCircle size={20} className="shrink-0 mt-0.5"/>
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="space-y-5">
                            <InputGroup label="Full Name" icon={User} name="fullName" type="text" placeholder="Mubarik Osman" value={formData.fullName} onChange={handleChange} />
                            <InputGroup label="Email" icon={Mail} name="email" type="email" placeholder="name@example.com" value={formData.email} onChange={handleChange} />
                            <div className="grid grid-cols-2 gap-4">
                              <InputGroup label="Phone" icon={Phone} name="phone" type="tel" placeholder="+252..." value={formData.phone} onChange={handleChange} />
                              <PasswordInput label="Password" name="password" placeholder="••••••" value={formData.password} onChange={handleChange} />
                            </div>
                        </div>

                        <div className="pt-8">
                          {role === 'user' ? (
                            <button type="submit" disabled={loading} className="w-full bg-[#0065eb] text-white py-4 rounded-xl font-bold text-sm hover:bg-[#0052c1] hover:scale-[1.01] transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:scale-100">
                              {loading ? <Loader2 className="animate-spin"/> : 'Create & Verify Account'}
                            </button>
                          ) : (
                            <button type="button" onClick={() => setStep(2)} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-sm hover:bg-slate-800 hover:scale-[1.01] transition-all shadow-lg shadow-slate-900/20 flex items-center justify-center gap-2">
                              Next Step <ArrowRight size={18} />
                            </button>
                          )}
                        </div>
                     </div>
                  )}

                  {step === 2 && (
                    <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                        <button type="button" onClick={() => setStep(1)} className="text-xs font-bold text-slate-400 uppercase tracking-wider hover:text-[#0065eb] mb-4 flex items-center gap-1 transition-colors">
                            <ArrowLeft size={12}/> Back
                        </button>
                        <h2 className="text-2xl font-bold text-slate-900 mb-6">Business Details</h2>
                        
                        {error && <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm font-bold rounded-xl flex items-start gap-3 border border-red-100"><AlertCircle size={20} className="shrink-0 mt-0.5"/><span>{error}</span></div>}

                        <div className="space-y-5">
                            <InputGroup label="Business Name" icon={Building} name="businessName" type="text" placeholder="e.g. Horn Properties" value={formData.businessName} onChange={handleChange} />
                            <div className="grid grid-cols-2 gap-4">
                              <InputGroup label="City" icon={MapPin} name="city" type="text" placeholder="Hargeisa" value={formData.city} onChange={handleChange} />
                              <InputGroup label="WhatsApp" icon={MessageCircle} name="whatsappNumber" type="tel" placeholder="+252..." value={formData.whatsappNumber} onChange={handleChange} />
                            </div>
                            {role === 'reagent' && (
                              <InputGroup label="License (Optional)" icon={CheckCircle} name="licenseNumber" type="text" placeholder="AG-12345" value={formData.licenseNumber} onChange={handleChange} />
                            )}
                        </div>

                        <div className="pt-8">
                          <button type="submit" disabled={loading} className="w-full bg-[#0065eb] text-white py-4 rounded-xl font-bold text-sm hover:bg-[#0052c1] hover:scale-[1.01] transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:scale-100">
                            {loading ? <Loader2 className="animate-spin"/> : 'Create & Verify Account'}
                          </button>
                        </div>
                     </div>
                  )}

                </form>
              </div>
            </div>
          )}

          <div className="text-center mt-12 mb-6 animate-in fade-in duration-1000 delay-300">
            <p className="text-slate-500 font-medium text-sm">
              Already have an account? <Link href="/login" className="text-[#0065eb] font-bold hover:underline ml-1">Log In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- REUSABLE COMPONENTS ---

const RoleCard = ({ icon, title, desc, theme, onClick }: any) => {
  const themes: any = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', ring: 'hover:ring-blue-200' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', ring: 'hover:ring-indigo-200' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-600', ring: 'hover:ring-orange-200' },
  };
  const t = themes[theme];
  return (
    <button onClick={onClick} className={`group bg-white p-8 rounded-[2rem] border border-slate-100 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-300 text-left flex flex-col items-start h-full hover:ring-2 ${t.ring} ring-offset-2 ring-transparent`}>
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 ${t.bg} ${t.text} group-hover:scale-110 shadow-sm`}>{icon}</div>
      <h3 className="text-xl font-black text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-500 text-sm font-medium leading-relaxed">{desc}</p>
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
        className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-[#0065eb]/10 focus:border-[#0065eb] transition-all placeholder:text-slate-300 hover:bg-slate-50/80 hover:border-slate-300" 
      />
    </div>
  </div>
);

// New Password Input with "Eye" Toggle
const PasswordInput = ({ label, name, placeholder, value, onChange }: any) => {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">{label}</label>
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#0065eb] transition-colors">
          <Lock size={18} strokeWidth={2.5} />
        </div>
        <input 
          type={show ? "text" : "password"} 
          name={name} 
          placeholder={placeholder} 
          value={value} 
          onChange={onChange} 
          className="w-full pl-11 pr-11 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-[#0065eb]/10 focus:border-[#0065eb] transition-all placeholder:text-slate-300 hover:bg-slate-50/80 hover:border-slate-300" 
        />
        <button 
          type="button" 
          onClick={() => setShow(!show)} 
          className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-[#0065eb] transition-colors cursor-pointer"
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
};