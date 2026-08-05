'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  createUserWithEmailAndPassword, 
  sendEmailVerification,
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
  reload,
  User as FirebaseUser
} from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, storage } from '../../lib/firebase'; 
import { 
  User, Building2, Briefcase, Mail, Lock, Phone, ArrowRight, ArrowLeft, 
  Building, MapPin, MessageCircle, Loader2, AlertCircle, Eye, 
  ShieldCheck, Layers, UploadCloud, Camera, CheckCircle2, RefreshCw, Send, LogOut
} from 'lucide-react';

type Role = 'user' | 'reagent' | 'hoadmin' | null;
type Step = 1 | 'verify' | 2;

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

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [role, setRole] = useState<Role>(null);
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verification States (Hantikaab Style)
  const [unverifiedUser, setUnverifiedUser] = useState<FirebaseUser | null>(null);
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [tempGoogleUser, setTempGoogleUser] = useState<FirebaseUser | null>(null);

  // Agent Specific States
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

  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (['reagent', 'hoadmin', 'user'].includes(roleParam as string)) {
      setRole(roleParam as Role);
    } else {
      setRole(null);
    }
  }, [searchParams]);

  // --- 1. DYNAMIC POLLING FOR VERIFICATION ---
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (unverifiedUser && step === 'verify') {
      interval = setInterval(async () => {
        try {
          await reload(unverifiedUser);
          if (unverifiedUser.emailVerified) {
            clearInterval(interval);
            
            // Move to correct next step upon verification
            if (role === 'reagent') {
              setStep(2);
            } else {
              finalizeRegistration(unverifiedUser.uid, null, 'email_password');
            }
          }
        } catch (err) {
          console.error("Polling error:", err);
        }
      }, 3000); 
    }
    
    return () => clearInterval(interval);
  }, [unverifiedUser, step, role]);


  const updateRole = async (newRole: Role) => {
    if (tempGoogleUser || unverifiedUser) {
      await signOut(auth);
      setTempGoogleUser(null);
      setUnverifiedUser(null);
      setFormData({...formData, email: '', fullName: '', password: ''});
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

  // --- 2. AUTH CREATION (Step 1) ---
  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!formData.fullName || !formData.email || !formData.phone || !formData.password) {
      setError("Please fill in all required details.");
      setLoading(false);
      return;
    }

    try {
      // Create Firebase user FIRST
      const cred = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      await updateProfile(cred.user, { displayName: formData.fullName });
      await sendEmailVerification(cred.user);
      
      // Trap them in the waiting room
      setUnverifiedUser(cred.user);
      setStep('verify');
    } catch (err: any) {
      setError(err.message || "Failed to create account. Email may already be in use.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      setFormData(prev => ({
        ...prev,
        fullName: result.user.displayName || '',
        email: result.user.email || ''
      }));

      // Google usually auto-verifies, but just in case:
      if (!result.user.emailVerified) {
         setUnverifiedUser(result.user);
         setStep('verify');
         return;
      }

      // If verified, proceed to form or database write
      if (role === 'reagent') {
         setTempGoogleUser(result.user);
         setStep(2);
      } else {
         await finalizeRegistration(result.user.uid, result.user.photoURL, 'google');
      }
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
         setError(err.message || "Failed to sign in with Google.");
      }
    } finally {
      setLoading(false);
    }
  };

  // --- 3. DATABASE WRITE (Final Step) ---
  const finalizeRegistration = async (firebaseUid: string, googlePhotoUrl?: string | null, authMethodStr: string = 'email_password') => {
    setLoading(true);
    setError(null);

    try {
      let finalProfileUrl = googlePhotoUrl || "";
      let finalCoverUrl = "";

      if (role === 'reagent') {
        if (agentProfile.file) {
          const sRef = ref(storage, `agent_profiles/${Date.now()}_${agentProfile.file.name}`);
          await uploadBytes(sRef, agentProfile.file);
          finalProfileUrl = await getDownloadURL(sRef);
        }
        if (agentCover.file) {
          const sRef = ref(storage, `agent_covers/${Date.now()}_${agentCover.file.name}`);
          await uploadBytes(sRef, agentCover.file);
          finalCoverUrl = await getDownloadURL(sRef);
        }
      }

      // Securely call API to write ONLY to Supabase
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          role,
          photoUrl: finalProfileUrl,
          coverPhoto: finalCoverUrl,
          slug,
          authMethod: authMethodStr,
          firebaseUid: firebaseUid 
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Registration failed.');

      // Route to correct dashboard
      if (role === 'hoadmin') router.push('/dashboard/hotel');
      else if (role === 'reagent') router.push('/dashboard/agent');
      else router.push('/dashboard');

    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!unverifiedUser) return;
    setIsResending(true);
    setError(null);
    try {
      await sendEmailVerification(unverifiedUser);
      setVerificationMessage("Verification link resent! Please check your inbox.");
      setTimeout(() => setVerificationMessage(null), 5000);
    } catch (err: any) {
      if (err.code === 'auth/too-many-requests') {
        setError("Too many requests. Please wait a minute before resending.");
      } else {
        setError("Failed to resend. Please try again later.");
      }
    } finally {
      setIsResending(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUnverifiedUser(null);
    setTempGoogleUser(null);
    setStep(1);
    setError(null);
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-8 overflow-y-auto bg-black">
      <div className="absolute inset-0 z-0 fixed">
        <Image src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=2053&auto=format&fit=crop" alt="Background" fill className="object-cover scale-105" priority />
        <div className="absolute inset-0 bg-black/50 bg-gradient-to-t from-black/90 via-black/40 to-black/80 backdrop-blur-[6px]"></div>
      </div>

      <div className="w-full relative z-10 flex flex-col items-center py-10">
        {!role && (
          <div className="w-full max-w-5xl mx-auto px-4">
            <div className="text-center mb-16">
              <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight">
                Join <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">GuriUp</span>
              </h1>
              <p className="text-lg md:text-xl text-white/70 font-medium max-w-2xl mx-auto">Select your account type to access the future of real estate.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <RoleCard icon={<User size={32} />} title="I'm a Guest" desc="Browse homes and book exclusive hotels." onClick={() => updateRole('user')} />
              <RoleCard icon={<Briefcase size={32} />} title="I'm an Agent" desc="List properties, manage leads, and grow." onClick={() => updateRole('reagent')} />
              <RoleCard icon={<Building2 size={32} />} title="I'm a Hotel" desc="Manage premium rooms and bookings." onClick={() => updateRole('hoadmin')} />
            </div>
          </div>
        )}

        {role && (
          <div className="w-full max-w-[480px]">
            <div className="bg-white/10 backdrop-blur-2xl border border-white/20 p-8 sm:p-10 rounded-[2.5rem] shadow-2xl relative">
              <div className="mb-8">
                 <button onClick={() => updateRole(null)} className="text-xs font-bold text-white/50 hover:text-white mb-6 flex items-center gap-1.5"><ArrowLeft size={14} /> Change Role</button>
                 <div className="inline-block px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-[10px] font-bold uppercase tracking-widest mb-3">
                    {role === 'reagent' ? 'Agent Account' : role === 'hoadmin' ? 'Hotel Manager' : 'Guest Account'}
                 </div>
                 <h2 className="text-3xl font-black text-white tracking-tight">
                   {step === 1 ? 'Create Profile' : step === 'verify' ? 'Check Email' : 'Agency Profile'}
                 </h2>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-2xl flex items-start gap-3 mb-6">
                  <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={20} />
                  <p className="text-sm font-medium text-red-200">{error}</p>
                </div>
              )}

              {/* STEP 1: INITIAL CREATION */}
              {step === 1 && (
                <form onSubmit={handleInitialSubmit} className="space-y-5">
                  <div className="mb-6">
                    <button type="button" onClick={handleGoogleSignIn} disabled={loading} className="w-full bg-black/30 border border-white/10 text-white hover:bg-white/10 py-3.5 rounded-2xl font-semibold flex items-center justify-center gap-3">
                      Continue with Google
                    </button>
                    <div className="relative my-6"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div><div className="relative flex justify-center text-xs uppercase tracking-widest"><span className="bg-transparent px-3 text-white/40 font-bold">Or Email</span></div></div>
                  </div>

                  <div className="space-y-4">
                    <InputGroup label="Full Name" icon={User} name="fullName" type="text" placeholder="Full Name" value={formData.fullName} onChange={handleChange} required />
                    <InputGroup label="Email" icon={Mail} name="email" type="email" placeholder="Email Address" value={formData.email} onChange={handleChange} onBlur={handleBlur} error={fieldErrors.email} required />
                    <InputGroup label="Phone" icon={Phone} name="phone" type="tel" placeholder="Phone" value={formData.phone} onChange={handleChange} onBlur={handleBlur} error={fieldErrors.phone} required />
                    <PasswordInput name="password" placeholder="Password" value={formData.password} onChange={handleChange} required />
                  </div>

                  <div className="pt-6">
                    <button type="submit" disabled={loading} className="w-full bg-white text-black py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform">
                      {loading ? <Loader2 className="animate-spin text-black"/> : 'Next Step'} <ArrowRight size={18} />
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 1.5: VERIFICATION WAITING ROOM */}
              {step === 'verify' && unverifiedUser && (
                <div className="space-y-6 text-center animate-in fade-in slide-in-from-bottom-5 duration-500">
                  <div className="mx-auto w-20 h-20 bg-blue-500/20 border border-blue-500/50 rounded-full flex items-center justify-center mb-4 relative">
                     <Mail className="w-8 h-8 text-blue-400" />
                     <span className="absolute top-0 right-0 flex h-4 w-4">
                       <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                       <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500"></span>
                     </span>
                  </div>
                  
                  <p className="text-white/70 font-medium">
                    We sent a secure link to <br/>
                    <span className="text-white font-bold">{unverifiedUser.email}</span>
                  </p>

                  {verificationMessage && (
                    <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> {verificationMessage}
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-2 text-sm text-blue-400 font-semibold mb-2">
                    <RefreshCw className="w-4 h-4 animate-spin" /> Waiting for verification...
                  </div>

                  <div className="space-y-3 mt-6">
                    <button onClick={handleResendVerification} disabled={isResending} className="w-full flex items-center justify-center py-3 px-4 rounded-xl text-white bg-white/10 hover:bg-white/20 border border-white/10 transition-colors font-semibold shadow-sm">
                      {isResending ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                      Resend Email
                    </button>

                    <button onClick={handleLogout} className="w-full flex items-center justify-center py-3 px-4 rounded-xl text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-colors font-semibold">
                      <LogOut className="w-4 h-4 mr-2" /> Cancel & Restart
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: AGENT SPECIFIC DETAILS */}
              {step === 2 && role === 'reagent' && (
                <form onSubmit={(e) => { e.preventDefault(); finalizeRegistration(unverifiedUser?.uid || tempGoogleUser?.uid || ''); }} className="space-y-5 animate-in slide-in-from-right duration-300">
                  <div className="flex gap-4">
                    <div className="flex-1"><ImageUploader label="Profile Photo *" previewUrl={agentProfile.preview || tempGoogleUser?.photoURL} onChange={(e: any) => handleImageChange(e, setAgentProfile)} /></div>
                    <div className="flex-1"><ImageUploader label="Cover Photo" previewUrl={agentCover.preview} onChange={(e: any) => handleImageChange(e, setAgentCover)} /></div>
                  </div>
                  <InputGroup label="Agency Name *" icon={Building} name="businessName" type="text" placeholder="Agency Name" value={formData.businessName} onChange={handleChange} required />
                  <div className="grid grid-cols-2 gap-4">
                    <InputGroup label="City *" icon={MapPin} name="city" type="text" placeholder="Hargeisa" value={formData.city} onChange={handleChange} required />
                    <InputGroup label="WhatsApp *" icon={MessageCircle} name="whatsappNumber" type="tel" placeholder="+252..." value={formData.whatsappNumber} onChange={handleChange} required />
                  </div>
                  <SelectGroup name="specialty" value={formData.specialty} onChange={handleChange} icon={Layers} options={["Residential", "Commercial", "Land", "Luxury"]} />
                  <textarea name="bio" value={formData.bio} onChange={handleChange} rows={3} className="w-full p-4 bg-black/20 border border-white/10 rounded-2xl text-sm text-white placeholder-white/30 outline-none resize-none" placeholder="Brief description..."></textarea>
                  
                  <div className="pt-6">
                    <button type="submit" disabled={loading} className="w-full bg-white text-black py-4 rounded-2xl font-bold flex items-center justify-center gap-2">
                      {loading ? <Loader2 className="animate-spin text-black"/> : 'Launch Profile'}
                    </button>
                  </div>
                </form>
              )}

            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const RoleCard = ({ icon, title, desc, onClick }: any) => (
  <button onClick={onClick} className="group relative bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[2rem] text-left flex flex-col items-start h-full hover:bg-white/10 hover:border-white/30 transition-all duration-300">
     <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-6 text-white group-hover:scale-110 group-hover:bg-white group-hover:text-black transition-all">{icon}</div>
     <h3 className="text-2xl font-black text-white mb-2">{title}</h3>
     <p className="text-white/60 text-sm font-medium">{desc}</p>
  </button>
);

const InputGroup = ({ name, type, placeholder, value, onChange, onBlur, icon: Icon, disabled, required, error }: any) => (
  <div>
    <div className="relative group">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/40"><Icon size={20} /></div>
      <input type={type} name={name} placeholder={placeholder} value={value} onChange={onChange} onBlur={onBlur} disabled={disabled} required={required} className="w-full pl-12 pr-4 py-3.5 bg-black/20 border border-white/10 rounded-2xl text-sm font-medium text-white outline-none focus:border-white/50 placeholder:text-white/30" />
    </div>
    {error && <p className="text-[11px] font-bold text-red-400 mt-1.5 ml-2">{error}</p>}
  </div>
);

const PasswordInput = ({ name, placeholder, value, onChange, required }: any) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative group">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/40"><Lock size={20} /></div>
      <input type={show ? "text" : "password"} name={name} placeholder={placeholder} value={value} onChange={onChange} required={required} className="w-full pl-12 pr-12 py-3.5 bg-black/20 border border-white/10 rounded-2xl text-sm font-medium text-white outline-none focus:border-white/50 placeholder:text-white/30" />
      <button type="button" onClick={() => setShow(!show)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/40 hover:text-white"><Eye size={20} /></button>
    </div>
  );
};

const SelectGroup = ({ name, value, onChange, icon: Icon, options }: any) => (
  <div className="relative group">
    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/40"><Icon size={20} /></div>
    <select name={name} value={value} onChange={onChange} className="w-full pl-12 pr-10 py-3.5 bg-black/20 border border-white/10 rounded-2xl text-sm font-medium text-white outline-none appearance-none cursor-pointer">
      <option value="" disabled className="bg-slate-900 text-white">Select Specialty *</option>
      {options.map((opt: string) => (<option key={opt} value={opt} className="bg-slate-900 text-white">{opt}</option>))}
    </select>
  </div>
);

const ImageUploader = ({ label, previewUrl, onChange }: any) => {
  const id = `upload-${label.replace(/\s+/g, '')}`;
  return (
    <div className="mb-2">
      <label className="block text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2 text-center">{label}</label>
      <input type="file" accept="image/*" onChange={onChange} className="hidden" id={id} />
      <label htmlFor={id} className="relative flex flex-col items-center justify-center cursor-pointer border-2 border-dashed border-white/20 hover:border-white/50 w-full h-24 rounded-2xl bg-black/20 overflow-hidden group">
        {previewUrl ? <Image src={previewUrl} alt="Preview" fill className="object-cover" /> : <UploadCloud size={24} className="text-white/40" />}
      </label>
    </div>
  );
};