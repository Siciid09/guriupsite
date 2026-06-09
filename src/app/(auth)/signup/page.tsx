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
  GoogleAuthProvider,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../../lib/firebase'; 
import { 
  User, Building2, Briefcase, Mail, Lock, Phone, ArrowRight, ArrowLeft, 
  Building, MapPin, MessageCircle, Loader2, AlertCircle, Eye, EyeOff, 
  ShieldCheck, Layers, UploadCloud, Camera
} from 'lucide-react';

type Role = 'user' | 'reagent' | 'hoadmin' | null;

// ======================================================================
// MAIN PAGE EXPORT (Wrapped in Suspense for Vercel)
// ======================================================================
export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="animate-spin text-white" size={40}/>
      </div>
    }>
      <SignupContent />
    </Suspense>
  );
}

// ======================================================================
// SIGNUP CONTENT COMPONENT
// ======================================================================
function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [role, setRole] = useState<Role>(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);
  const [emailSentTo, setEmailSentTo] = useState('');

  // Google Intercept State
  const [tempGoogleUser, setTempGoogleUser] = useState<FirebaseUser | null>(null);

  // Reagent Specific Assets
  const [agentProfile, setAgentProfile] = useState<{file: File | null, preview: string | null}>({file: null, preview: null});
  const [agentCover, setAgentCover] = useState<{file: File | null, preview: string | null}>({file: null, preview: null});
  const [slug, setSlug] = useState('');

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    businessName: '', 
    whatsappNumber: '',
    city: '',
    specialty: 'Residential',
    address: '',
    bio: ''
  });

  const [fieldErrors, setFieldErrors] = useState<{email?: string, phone?: string}>({});

  // --- VALIDATION HANDLERS ---
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let errorMessage = '';
    
    if (value.trim() === '') return; 

    if (name === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) errorMessage = 'Invalid email format';
    } else if (name === 'phone') {
      const phoneDigits = value.replace(/\D/g, ''); 
      if (phoneDigits.length < 7 || phoneDigits.length > 15) errorMessage = 'Invalid phone number';
    }

    setFieldErrors(prev => ({ ...prev, [name]: errorMessage }));
  };

  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (['reagent', 'hoadmin', 'user'].includes(roleParam as string)) {
      setRole(roleParam as Role);
    } else {
      setRole(null);
    }
  }, [searchParams]);

  const updateRole = async (newRole: Role) => {
    if (tempGoogleUser) {
      await signOut(auth);
      setTempGoogleUser(null);
      setFormData({...formData, email: '', fullName: ''});
    }
    
    setRole(newRole);
    setStep(1);
    setError(null);
    router.push(newRole ? `?role=${newRole}` : '/signup', { scroll: false });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError(null);
    setFieldErrors(prev => ({ ...prev, [name]: '' })); 

    if (name === 'businessName' && role === 'reagent') {
      const safeSlug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      setSlug(safeSlug);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<any>>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size must be less than 5MB.");
        return;
      }
      setter({ file, preview: URL.createObjectURL(file) });
      setError(null);
    }
  };

  // --- GOOGLE SIGN IN ---
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userDoc = await getDoc(doc(db, 'users', user.uid));

      if (userDoc.exists()) {
        await signOut(auth);
        setError("Account already exists. Please go to the Log In page.");
      } else {
        setTempGoogleUser(user);
        setFormData(prev => ({
          ...prev,
          fullName: user.displayName || '',
          email: user.email || ''
        }));
      }
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
         setError("Failed to sign in with Google.");
      }
    } finally {
      setLoading(false);
    }
  };

  // --- REGISTRATION LOGIC ---
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!formData.fullName || !formData.email || !formData.phone || (!tempGoogleUser && !formData.password)) {
        throw new Error("Please fill in all required details.");
      }

      let formattedPhone = formData.phone.trim();
      if (!formattedPhone.startsWith('+')) {
        if (formattedPhone.startsWith('0')) formattedPhone = formattedPhone.substring(1);
        if (!formattedPhone.startsWith('252')) formattedPhone = `252${formattedPhone}`;
        formattedPhone = `+${formattedPhone}`;
      }

      const phoneQuery = query(collection(db, 'users'), where('phone', '==', formattedPhone));
      const phoneSnapshot = await getDocs(phoneQuery);
      if (!phoneSnapshot.empty) {
        throw new Error("This phone number is already registered.");
      }

      if (role === 'reagent' && !agentProfile.file && !tempGoogleUser?.photoURL) {
        throw new Error("Please upload a Profile Photo.");
      }

      let user: FirebaseUser;
      if (tempGoogleUser) {
        user = tempGoogleUser;
      } else {
        const cred = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        user = cred.user;
        await updateProfile(user, { displayName: formData.fullName });
        await sendEmailVerification(user);
      }

      let finalProfileUrl = tempGoogleUser?.photoURL || "";
      let finalCoverUrl = "";

      if (role === 'reagent') {
        if (agentProfile.file) {
          const sRef = ref(storage, `agent_profiles/${user.uid}_${Date.now()}`);
          await uploadBytes(sRef, agentProfile.file);
          finalProfileUrl = await getDownloadURL(sRef);
        }
        if (agentCover.file) {
          const sRef = ref(storage, `agent_covers/${user.uid}_${Date.now()}`);
          await uploadBytes(sRef, agentCover.file);
          finalCoverUrl = await getDownloadURL(sRef);
        }
      }

      // --- SYNC WITH FLUTTER MODELS ---
      const userData = {
        uid: user.uid,
        authMethod: tempGoogleUser ? 'google' : 'email_password',
        createdAt: serverTimestamp(),
        email: formData.email.trim(),
        emailVerified: !!tempGoogleUser,
        name: formData.fullName.trim(),
        phone: formattedPhone,
        photoUrl: finalProfileUrl, 
        planTier: 'free',
        role: role, 
        isAgent: role === 'reagent',
        slug: slug || "", 
        isBanned: false,
        status: 'active'
      };

      await setDoc(doc(db, 'users', user.uid), userData);

      if (role === 'reagent') {
        const agencyData = {
          agencyName: formData.businessName.trim(),
          agentVerified: false, 
          isVerified: false,
          analytics: { clicks: 0, leads: 0, views: 0 },
          bio: formData.bio.trim(),
          coverPhoto: finalCoverUrl,
          email: formData.email.trim(),
          featured: false,
          isFeatured: false,
          joinDate: serverTimestamp(),
          name: formData.businessName.trim(),
          phone: formattedPhone,
          planTier: 'free',
          profileImageUrl: finalProfileUrl,
          slug: slug, 
          status: "active",
          userid: user.uid,
          city: formData.city.trim(),
          ownerName: formData.fullName.trim(),
          whatsappNumber: formData.whatsappNumber.trim(),
          type: "reagent"
        };
        await setDoc(doc(db, 'agents', user.uid), agencyData);
      } 
      
      if (!tempGoogleUser) {
        await signOut(auth);
        setEmailSentTo(formData.email);
        setVerificationSent(true);
      } else {
        if (role === 'hoadmin') router.push('/dashboard/hotel');
        else if (role === 'reagent') router.push('/dashboard/agent');
        else router.push('/dashboard/user');
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ======================================================================
  // VERIFICATION VIEW (GLASSMORPHISM)
  // ======================================================================
  if (verificationSent) {
    return (
      <div className="min-h-screen relative flex items-center justify-center p-6 bg-black overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2075&auto=format&fit=crop" alt="Background" fill className="object-cover scale-105 blur-sm opacity-50" priority />
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md"></div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-2xl border border-white/20 p-10 rounded-[2.5rem] shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] max-w-md w-full text-center relative z-10 animate-in zoom-in duration-500">
          <div className="w-24 h-24 bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
            <ShieldCheck size={48} />
          </div>
          <h2 className="text-3xl font-black text-white mb-2 drop-shadow-md">Verify Account</h2>
          <p className="text-white/70 mb-8 font-medium">
            A link was sent to <span className="text-white font-bold">{emailSentTo}</span>.
          </p>
          <button onClick={() => router.push('/login')} className="w-full bg-white hover:bg-slate-100 text-black py-4 rounded-2xl font-bold transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]">
            Proceed to Login
          </button>
        </div>
      </div>
    );
  }

  // ======================================================================
  // MAIN RENDER (ROLE SELECTION & FORM)
  // ======================================================================
  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-8 overflow-y-auto bg-black scrollbar-hide">
      
      {/* FULL BACKGROUND IMAGE */}
      <div className="absolute inset-0 z-0 fixed">
        <Image 
          src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=2053&auto=format&fit=crop" 
          alt="GuriUp Premium Real Estate" 
          fill
          className="object-cover scale-105 animate-in zoom-in duration-1000"
          priority
        />
        <div className="absolute inset-0 bg-black/50 bg-gradient-to-t from-black/90 via-black/40 to-black/80 backdrop-blur-[6px]"></div>
      </div>

      <div className="w-full relative z-10 flex flex-col items-center py-10">
        
        {/* ROLE SELECTION VIEW */}
        {!role && (
          <div className="w-full max-w-5xl mx-auto px-4">
            <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight drop-shadow-xl">
                Join <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300 drop-shadow-none">GuriUp</span>
              </h1>
              <p className="text-lg md:text-xl text-white/70 font-medium max-w-2xl mx-auto">Select your account type to access the future of real estate.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto animate-in zoom-in-95 duration-700 delay-150 fill-mode-both">
              <RoleCard icon={<User size={32} />} title="I'm a Guest" desc="Browse homes and book exclusive hotels." onClick={() => updateRole('user')} />
              <RoleCard icon={<Briefcase size={32} />} title="I'm an Agent" desc="List properties, manage leads, and grow." onClick={() => updateRole('reagent')} />
              <RoleCard icon={<Building2 size={32} />} title="I'm a Hotel" desc="Manage premium rooms and bookings." onClick={() => updateRole('hoadmin')} />
            </div>

            <div className="text-center mt-12 mb-6 animate-in fade-in duration-1000 delay-300">
              <p className="text-white/60 font-medium text-sm">
                Already have an account? <Link href="/login" className="text-white font-bold hover:underline ml-1">Log In</Link>
              </p>
            </div>
          </div>
        )}

        {/* SIGNUP FORM VIEW (CENTERED GLASS CARD) */}
        {role && (
          <div className="w-full max-w-[480px] animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="bg-white/10 backdrop-blur-2xl border border-white/20 p-8 sm:p-10 rounded-[2.5rem] shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] overflow-hidden relative">
              
              {/* Subtle Top Glare */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>

              <div className="mb-8">
                 <button onClick={() => updateRole(null)} className="text-xs font-bold text-white/50 hover:text-white mb-6 flex items-center gap-1.5 transition-colors group">
                    <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Change Role
                 </button>
                 <div className="inline-block px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-[10px] font-bold uppercase tracking-widest mb-3 backdrop-blur-sm">
                    {role === 'reagent' ? 'Agent Account' : role === 'hoadmin' ? 'Hotel Manager' : 'Guest Account'}
                 </div>
                 <h2 className="text-3xl font-black text-white tracking-tight drop-shadow-md">
                   {step === 1 ? 'Create Profile' : 'Agency Profile'}
                 </h2>
              </div>

              <form onSubmit={handleRegister} className="space-y-5">
                
                {/* STEP 1: PERSONAL INFO */}
                {step === 1 && (
                  <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                      
                      {!tempGoogleUser && (
                        <div className="mb-6">
                          <button type="button" onClick={handleGoogleSignIn} className="w-full bg-black/30 border border-white/10 text-white hover:bg-white/10 hover:border-white/30 py-3.5 rounded-2xl font-semibold flex items-center justify-center gap-3 transition-all active:scale-[0.98] backdrop-blur-md">
                            <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                            Continue with Google
                          </button>
                          <div className="relative my-6"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div><div className="relative flex justify-center text-xs uppercase tracking-widest"><span className="bg-transparent px-3 text-white/40 font-bold backdrop-blur-md">Or Email</span></div></div>
                        </div>
                      )}

                      {tempGoogleUser && (
                         <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-2xl flex items-center gap-3 backdrop-blur-md">
                           <div className="bg-white p-1.5 rounded-full shadow-sm">
                             <Image src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width={18} height={18} alt="G" />
                           </div>
                           <p className="text-sm font-semibold text-blue-200">Google linked! Finish below.</p>
                         </div>
                      )}

                      {error && (
                        <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-2xl flex items-start gap-3 mb-6 animate-in zoom-in-95 backdrop-blur-md">
                          <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={20} />
                          <p className="text-sm font-medium text-red-200">{error}</p>
                        </div>
                      )}

                      <div className="space-y-4">
                          <InputGroup label="Full Name" icon={User} name="fullName" type="text" placeholder="Full Name" value={formData.fullName} onChange={handleChange} required />
                          <InputGroup 
                            label="Email" 
                            icon={Mail} 
                            name="email" 
                            type="email" 
                            placeholder="Email Address" 
                            value={formData.email} 
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={fieldErrors.email}
                            disabled={!!tempGoogleUser}
                            required
                          />
                          <InputGroup label="Phone" icon={Phone} name="phone" type="tel" placeholder="Phone" value={formData.phone} onChange={handleChange} onBlur={handleBlur} error={fieldErrors.phone} required />
                          
                          {!tempGoogleUser && (
                            <PasswordInput label="Password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required />
                          )}
                      </div>

                      <div className="pt-6">
                        {role === 'reagent' ? (
                          <button type="button" onClick={() => {
                              if (!formData.fullName || !formData.email || !formData.phone || (!tempGoogleUser && !formData.password)) {
                                setError("Please complete all fields."); return;
                              }
                              setError(null); setStep(2);
                            }} 
                            className="w-full bg-white hover:bg-slate-100 text-black py-4 rounded-2xl font-bold text-[15px] transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.2)] active:scale-[0.98]"
                          >
                            Next: Agency Info <ArrowRight size={18} />
                          </button>
                        ) : (
                          <button type="submit" disabled={loading} className="w-full bg-white hover:bg-slate-100 text-black py-4 rounded-2xl font-bold text-[15px] transition-all flex items-center justify-center gap-2 disabled:opacity-70 shadow-[0_0_20px_rgba(255,255,255,0.2)] active:scale-[0.98]">
                            {loading ? <Loader2 className="animate-spin text-black"/> : 'Complete Signup'}
                          </button>
                        )}
                      </div>
                  </div>
                )}

                {/* STEP 2: AGENCY INFO */}
                {step === 2 && role === 'reagent' && (
                  <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                      <button type="button" onClick={() => setStep(1)} className="text-xs font-bold text-white/50 hover:text-white mb-6 flex items-center gap-1 transition-colors"><ArrowLeft size={12}/> Back to Personal Info</button>
                      
                      {error && (
                        <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-2xl flex items-start gap-3 mb-6 animate-in zoom-in-95 backdrop-blur-md">
                          <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={20} />
                          <p className="text-sm font-medium text-red-200">{error}</p>
                        </div>
                      )}

                      <div className="space-y-5">
                          <div className="flex gap-4">
                              <div className="flex-1">
                                <ImageUploader 
                                  label="Profile Photo *" 
                                  isCircle 
                                  previewUrl={agentProfile.preview || tempGoogleUser?.photoURL} 
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleImageChange(e, setAgentProfile)} 
                                />
                              </div>
                              <div className="flex-1">
                                <ImageUploader 
                                  label="Cover Photo" 
                                  previewUrl={agentCover.preview} 
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleImageChange(e, setAgentCover)} 
                                />
                              </div>
                          </div>

                          <InputGroup label="Agency Name *" icon={Building} name="businessName" type="text" placeholder="Agency Name" value={formData.businessName} onChange={handleChange} required />
                          
                          <div className="grid grid-cols-2 gap-4">
                            <InputGroup label="City *" icon={MapPin} name="city" type="text" placeholder="Hargeisa" value={formData.city} onChange={handleChange} required />
                            <InputGroup label="WhatsApp *" icon={MessageCircle} name="whatsappNumber" type="tel" placeholder="+252..." value={formData.whatsappNumber} onChange={handleChange} required />
                          </div>
                          
                          <SelectGroup label="Specialty *" icon={Layers} name="specialty" value={formData.specialty} onChange={handleChange} options={["Residential", "Commercial", "Land", "Luxury"]} />
                          
                          <div>
                            <textarea name="bio" value={formData.bio} onChange={handleChange} rows={3} className="w-full p-4 bg-black/20 border border-white/10 rounded-2xl text-sm font-medium text-white placeholder-white/30 outline-none focus:border-white/50 focus:bg-white/10 transition-all backdrop-blur-md resize-none" placeholder="Brief description of your agency..."></textarea>
                          </div>
                      </div>

                      <div className="pt-6">
                        <button type="submit" disabled={loading} className="w-full bg-white hover:bg-slate-100 text-black py-4 rounded-2xl font-bold text-[15px] transition-all flex items-center justify-center gap-2 disabled:opacity-70 shadow-[0_0_20px_rgba(255,255,255,0.2)] active:scale-[0.98]">
                          {loading ? <><Loader2 className="animate-spin text-black"/> Saving...</> : 'Launch Profile'}
                        </button>
                      </div>
                  </div>
                )}
              </form>
              
              <div className="text-center mt-8">
                <p className="text-white/60 font-medium text-sm">
                  Already have an account? <Link href="/login" className="text-white font-bold hover:underline ml-1">Log In</Link>
                </p>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ======================================================================
// REUSABLE UI COMPONENTS (GLASSMORPHISM THEME)
// ======================================================================

const RoleCard = ({ icon, title, desc, onClick }: any) => (
  <button onClick={onClick} className="group relative bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[2rem] text-left flex flex-col items-start h-full hover:bg-white/10 hover:border-white/30 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_15px_40px_rgba(0,0,0,0.6)] overflow-hidden">
     <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
     <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center mb-6 text-white group-hover:scale-110 group-hover:bg-white group-hover:text-black transition-all duration-500 shadow-inner">{icon}</div>
     <h3 className="text-2xl font-black text-white mb-2">{title}</h3>
     <p className="text-white/60 text-sm font-medium leading-relaxed">{desc}</p>
  </button>
);

const InputGroup = ({ label, name, type, placeholder, value, onChange, onBlur, icon: Icon, disabled, required, error }: any) => (
  <div>
    <div className="relative group">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/40 group-focus-within:text-white transition-colors"><Icon size={20} /></div>
      <input type={type} name={name} placeholder={required ? `${placeholder} *` : placeholder} value={value} onChange={onChange} onBlur={onBlur} disabled={disabled} required={required} className={`w-full pl-12 pr-4 py-3.5 bg-black/20 border ${error ? 'border-red-500/50 focus:border-red-400' : 'border-white/10 focus:border-white/50'} rounded-2xl text-sm font-medium text-white outline-none transition-all placeholder:text-white/30 disabled:opacity-50 disabled:cursor-not-allowed focus:bg-white/10 backdrop-blur-md`} />
    </div>
    {error && <p className="text-[11px] font-bold text-red-400 mt-1.5 ml-2">{error}</p>}
  </div>
);

const PasswordInput = ({ label, name, placeholder, value, onChange, required, error }: any) => {
  const [show, setShow] = useState(false);
  return (
    <div>
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/40 group-focus-within:text-white transition-colors"><Lock size={20} /></div>
        <input type={show ? "text" : "password"} name={name} placeholder={required ? `${placeholder} *` : placeholder} value={value} onChange={onChange} required={required} className={`w-full pl-12 pr-12 py-3.5 bg-black/20 border ${error ? 'border-red-500/50 focus:border-red-400' : 'border-white/10 focus:border-white/50'} rounded-2xl text-sm font-medium text-white outline-none transition-all placeholder:text-white/30 focus:bg-white/10 backdrop-blur-md`} />
        <button type="button" onClick={() => setShow(!show)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/40 hover:text-white transition-colors"><Eye size={20} /></button>
      </div>
      {error && <p className="text-[11px] font-bold text-red-400 mt-1.5 ml-2">{error}</p>}
    </div>
  );
};

const SelectGroup = ({ label, name, value, onChange, icon: Icon, options }: any) => (
  <div className="relative group">
    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/40 group-focus-within:text-white transition-colors"><Icon size={20} /></div>
    <select name={name} value={value} onChange={onChange} className="w-full pl-12 pr-10 py-3.5 bg-black/20 border border-white/10 rounded-2xl text-sm font-medium text-white outline-none focus:border-white/50 focus:bg-white/10 transition-all appearance-none cursor-pointer backdrop-blur-md">
      <option value="" disabled className="bg-slate-900 text-white">Select {label} *</option>
      {options.map((opt: string) => (<option key={opt} value={opt} className="bg-slate-900 text-white">{opt}</option>))}
    </select>
  </div>
);

const ImageUploader = ({ label, isCircle, previewUrl, onChange }: { label: string, isCircle?: boolean, previewUrl?: string | null, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) => {
  const id = `upload-${label.replace(/\s+/g, '')}`;
  return (
    <div className="mb-2">
      <label className="block text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2 text-center">{label}</label>
      <input type="file" accept="image/*" onChange={onChange} className="hidden" id={id} />
      <label htmlFor={id} className={`relative flex flex-col items-center justify-center cursor-pointer border-2 border-dashed transition-all bg-black/20 backdrop-blur-md ${isCircle ? 'w-24 h-24 rounded-full mx-auto' : 'w-full h-24 rounded-2xl'} ${previewUrl ? 'border-transparent shadow-lg' : 'border-white/20 hover:border-white/50 hover:bg-white/5'} overflow-hidden group`}>
        {previewUrl ? (
          <>
            <Image src={previewUrl} alt="Preview" fill className="object-cover" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><Camera className="text-white" size={24} /></div>
          </>
        ) : (
          <div className="text-white/40 group-hover:text-white flex flex-col items-center transition-colors"><UploadCloud size={24} className="mb-1" /></div>
        )}
      </label>
    </div>
  );
};