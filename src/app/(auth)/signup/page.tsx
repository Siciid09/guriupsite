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
  collection,
  query,
  where,
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../../lib/firebase'; // Fixed path for src/app/(auth)/signup
import { 
  User, Building2, Briefcase, Mail, Lock, Phone, ArrowRight, ArrowLeft, 
  Building, MapPin, MessageCircle, Loader2, AlertCircle, Eye, EyeOff, 
  ShieldCheck, Layers, Globe, UploadCloud, Camera
} from 'lucide-react';

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
  
  const [role, setRole] = useState<Role>(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);
  const [emailSentTo, setEmailSentTo] = useState('');

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

  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (['reagent', 'hoadmin', 'user'].includes(roleParam as string)) {
      setRole(roleParam as Role);
    } else {
      setRole(null);
    }
  }, [searchParams]);

  const updateRole = (newRole: Role) => {
    setRole(newRole);
    setStep(1);
    setError(null);
    router.push(newRole ? `?role=${newRole}` : '/signup', { scroll: false });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError(null);

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
          phone: user.phoneNumber || "", 
          role: 'user', 
          authMethod: 'google',
          photoUrl: user.photoURL || "",
          emailVerified: true, 
          createdAt: serverTimestamp(),
          planTier: 'free',
        });
      }
      router.push('/'); 
    } catch (err: any) {
      setError("Failed to sign in with Google.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!formData.fullName || !formData.email || !formData.password || !formData.phone) {
        throw new Error("Please fill in all personal details.");
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
        throw new Error("This phone number is already registered. Please log in.");
      }

      if (role === 'reagent') {
        if (!formData.businessName || !formData.city || !formData.whatsappNumber) {
          throw new Error("Please fill in all business details.");
        }
        if (!agentProfile.file) {
          throw new Error("Please upload a Profile Photo.");
        }
      }

      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: formData.fullName });
      await sendEmailVerification(user);

      let finalProfileUrl = "";
      let finalCoverUrl = "";

      if (role === 'reagent') {
        try {
          if (agentProfile.file) {
            const ext = agentProfile.file.name.split('.').pop();
            const sRef = ref(storage, `agent_profiles/${user.uid}_profile_${Date.now()}.${ext}`);
            await uploadBytes(sRef, agentProfile.file);
            finalProfileUrl = await getDownloadURL(sRef);
          }
          if (agentCover.file) {
            const ext = agentCover.file.name.split('.').pop();
            const sRef = ref(storage, `agent_covers/${user.uid}_cover_${Date.now()}.${ext}`);
            await uploadBytes(sRef, agentCover.file);
            finalCoverUrl = await getDownloadURL(sRef);
          }
        } catch (uploadErr) {
          console.error("Image Upload Failed:", uploadErr);
        }
      }

      const userData = {
        uid: user.uid,
        authMethod: 'email_password',
        createdAt: serverTimestamp(),
        email: formData.email.trim(),
        emailVerified: false, 
        name: formData.fullName.trim(),
        phone: formattedPhone,
        photoUrl: finalProfileUrl || "", 
        planTier: 'free',
        role: role, 
        isAgent: role === 'reagent',
        slug: slug || "", 
        activeDays: []
      };

      await setDoc(doc(db, 'users', user.uid), userData);

      if (role === 'reagent') {
        const agencyData = {
          agencyName: formData.businessName.trim(),
          agentVerified: false,
          analytics: { clicks: 0, leads: 0, views: 0 },
          averageRating: 0,
          bio: formData.bio.trim(),
          coverPhoto: finalCoverUrl,
          email: formData.email.trim(),
          featured: false,
          isFeatured: false,
          isVerified: false,
          joinDate: serverTimestamp(),
          languages: ["Somali", "English"],
          lastUpdated: serverTimestamp(),
          licenseNumber: 'PENDING',
          migratedAt: serverTimestamp(),
          name: formData.businessName.trim(),
          phone: formattedPhone,
          planTier: 'free',
          profileImageUrl: finalProfileUrl,
          propertiesSold: 0,
          slug: slug, 
          specialties: [formData.specialty],
          status: "active",
          totalListings: 0,
          userid: user.uid,
          verifiedAt: null,
          city: formData.city.trim(),
          ownerName: formData.fullName.trim(),
          whatsappNumber: formData.whatsappNumber.trim(),
          type: "reagent"
        };
        await setDoc(doc(db, 'agents', user.uid), agencyData);
      } 
      
      await signOut(auth);

      setEmailSentTo(formData.email);
      setVerificationSent(true);

    } catch (err: any) {
      console.error("Registration Error:", err);
      let msg = err.message || "An error occurred.";
      if (err.code === 'auth/email-already-in-use') msg = "This email is already registered.";
      if (err.code === 'auth/weak-password') msg = "Password must be at least 6 characters.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (verificationSent) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="bg-white/90 backdrop-blur-xl border border-slate-200 p-10 rounded-[2.5rem] shadow-2xl max-w-md w-full text-center relative z-10">
          <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck size={48} />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-2">Verify Account</h2>
          <p className="text-slate-500 mb-8 font-medium leading-relaxed">
            We've sent a secure verification link to <br/>
            <span className="text-slate-900 font-bold bg-slate-100 px-2 py-1 rounded-lg mt-1 inline-block">{emailSentTo}</span>
          </p>
          <button 
            onClick={() => router.push('/login')} 
            className="w-full bg-[#0065eb] text-white py-4 rounded-xl font-bold hover:bg-[#0052c1] transition-all shadow-lg shadow-blue-500/20"
          >
            Proceed to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-10 px-6">
      <div className="w-full max-w-6xl mx-auto">
        
        {!role && (
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-4 tracking-tight">
              Join the <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0065eb] to-indigo-600">Future</span> of Real Estate
            </h1>
            <p className="text-lg text-slate-500 font-medium">Select how you want to use GuriUp.</p>
          </div>
        )}

        {!role && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <RoleCard icon={<User size={32} />} title="I'm a Guest" desc="Browse homes and book hotels." theme="blue" onClick={() => updateRole('user')} />
            <RoleCard icon={<Briefcase size={32} />} title="I'm an Agent" desc="List properties and manage leads." theme="indigo" onClick={() => updateRole('reagent')} />
            <RoleCard icon={<Building2 size={32} />} title="I'm a Hotel" desc="Manage rooms and bookings." theme="orange" onClick={() => updateRole('hoadmin')} />
          </div>
        )}

        {role && (
          <div className="max-w-5xl mx-auto bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-slate-100">
            
            <div className="w-full md:w-5/12 bg-slate-900 p-10 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#0065eb]/80 to-indigo-900/90 z-10"></div>
              <Image src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1000" alt="City" fill className="object-cover opacity-40 mix-blend-overlay" />
              
              <div className="relative z-20">
                 <button onClick={() => updateRole(null)} className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm font-bold mb-10 group">
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Change Role
                 </button>
                 <div className="space-y-2">
                   <span className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-sm border border-white/20 mb-2 inline-block">
                      {role === 'reagent' ? 'Agent' : role === 'hoadmin' ? 'Hotel Manager' : 'User'}
                   </span>
                   <h3 className="text-4xl font-black text-white leading-tight">Create your profile.</h3>
                 </div>
              </div>
            </div>

            <div className="w-full md:w-7/12 p-8 md:p-12">
              <form onSubmit={handleRegister} className="max-w-md mx-auto">
                
                {step === 1 && (
                  <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                      <h2 className="text-2xl font-bold text-slate-900 mb-6">Personal Details</h2>
                      
                      {role === 'user' && (
                        <div className="mb-6">
                          <button type="button" onClick={handleGoogleSignIn} className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 p-3.5 rounded-xl text-slate-700 font-bold text-sm hover:bg-slate-50 transition-all">
                            <Image src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width={20} height={20} alt="G" /> Sign up with Google
                          </button>
                          <div className="relative my-6"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-3 text-slate-400 font-bold">Or via Email</span></div></div>
                        </div>
                      )}

                      {error && <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm font-bold rounded-xl flex items-start gap-2 border border-red-100"><AlertCircle size={18} className="shrink-0 mt-0.5"/><span>{error}</span></div>}

                      <div className="space-y-4">
                          <InputGroup label="Full Name" icon={User} name="fullName" type="text" placeholder="Mubarik Osman" value={formData.fullName} onChange={handleChange} />
                          <InputGroup label="Email" icon={Mail} name="email" type="email" placeholder="name@example.com" value={formData.email} onChange={handleChange} />
                          <InputGroup label="Phone Number" icon={Phone} name="phone" type="tel" placeholder="+252..." value={formData.phone} onChange={handleChange} />
                          <PasswordInput label="Password" name="password" placeholder="••••••" value={formData.password} onChange={handleChange} />
                      </div>

                      <div className="pt-8">
                        {role === 'reagent' ? (
                          <button type="button" onClick={() => {
                              if (!formData.fullName || !formData.email || !formData.phone || !formData.password) {
                                setError("Please fill in all personal details."); return;
                              }
                              setError(null); setStep(2);
                            }} 
                            className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg"
                          >
                            Next Step: Agency Info <ArrowRight size={18} />
                          </button>
                        ) : (
                          <button type="submit" disabled={loading} className="w-full bg-[#0065eb] text-white py-4 rounded-xl font-bold text-sm hover:bg-[#0052c1] transition-all flex items-center justify-center gap-2 disabled:opacity-70 shadow-lg shadow-blue-500/20">
                            {loading ? <Loader2 className="animate-spin"/> : 'Create & Verify Account'}
                          </button>
                        )}
                        {role === 'hoadmin' && (
                           <p className="text-center text-xs text-slate-500 mt-4 font-medium">You will set up your hotel details inside the dashboard after verifying your email.</p>
                        )}
                      </div>
                   </div>
                )}

                {step === 2 && role === 'reagent' && (
                  <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                      <button type="button" onClick={() => setStep(1)} className="text-xs font-bold text-slate-400 hover:text-blue-600 mb-4 flex items-center gap-1"><ArrowLeft size={12}/> Back to Personal</button>
                      <h2 className="text-2xl font-bold text-slate-900 mb-6">Agency Details</h2>
                      
                      {error && <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm font-bold rounded-xl flex items-start gap-2 border border-red-100"><AlertCircle size={18} className="shrink-0 mt-0.5"/><span>{error}</span></div>}

                      <div className="space-y-4">
                          <div className="flex gap-4">
                              <div className="flex-1"><ImageUploader label="Profile Photo *" isCircle previewUrl={agentProfile.preview} onChange={(e) => handleImageChange(e, setAgentProfile)} /></div>
                              <div className="flex-1"><ImageUploader label="Cover Photo" previewUrl={agentCover.preview} onChange={(e) => handleImageChange(e, setAgentCover)} /></div>
                          </div>

                          <InputGroup label="Agency Name *" icon={Building} name="businessName" type="text" placeholder="Horn Properties" value={formData.businessName} onChange={handleChange} />
                          
                          <div className="grid grid-cols-2 gap-4">
                            <InputGroup label="City *" icon={MapPin} name="city" type="text" placeholder="Hargeisa" value={formData.city} onChange={handleChange} />
                            <InputGroup label="WhatsApp *" icon={MessageCircle} name="whatsappNumber" type="tel" placeholder="+252..." value={formData.whatsappNumber} onChange={handleChange} />
                          </div>
                          
                          <SelectGroup label="Specialty *" icon={Layers} name="specialty" value={formData.specialty} onChange={handleChange} options={["Residential", "Commercial", "Land", "Luxury"]} />
                          
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Bio / Description</label>
                            <textarea name="bio" value={formData.bio} onChange={handleChange} rows={3} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-[#0065eb]" placeholder="Tell clients about your agency..."></textarea>
                          </div>
                      </div>

                      <div className="pt-8">
                        <button type="submit" disabled={loading} className="w-full bg-[#0065eb] text-white py-4 rounded-xl font-bold text-sm hover:bg-[#0052c1] transition-all flex items-center justify-center gap-2 disabled:opacity-70 shadow-lg shadow-blue-500/20">
                          {loading ? <><Loader2 className="animate-spin"/> Creating...</> : 'Launch Agency Profile'}
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
  );
}

// --- REUSABLE COMPONENTS WITH STRICT TYPES ---

interface ImageUploaderProps {
  label: string;
  isCircle?: boolean;
  previewUrl?: string | null;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ImageUploader = ({ label, isCircle, previewUrl, onChange }: ImageUploaderProps) => {
  const id = `upload-${label.replace(/\s+/g, '')}`;
  return (
    <div className="mb-2">
      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">{label}</label>
      <input type="file" accept="image/*" onChange={onChange} className="hidden" id={id} />
      <label htmlFor={id} className={`relative flex flex-col items-center justify-center cursor-pointer border-2 border-dashed transition-all ${isCircle ? 'w-24 h-24 rounded-full mx-auto' : 'w-full h-24 rounded-2xl'} ${previewUrl ? 'border-transparent shadow-md' : 'border-slate-300 bg-slate-50 hover:border-blue-500'} overflow-hidden group`}>
        {previewUrl ? (
          <>
            <Image src={previewUrl} alt="Preview" fill className="object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><Camera className="text-white" size={20} /></div>
          </>
        ) : (
          <div className="text-slate-400 group-hover:text-blue-500 flex flex-col items-center"><UploadCloud size={20} className="mb-1" /></div>
        )}
      </label>
    </div>
  );
};

interface RoleCardProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
  theme: 'blue' | 'indigo' | 'orange';
  onClick: () => void;
}

const RoleCard = ({ icon, title, desc, theme, onClick }: RoleCardProps) => {
  const themes: Record<string, { bg: string, text: string, ring: string }> = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', ring: 'hover:ring-blue-200' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', ring: 'hover:ring-indigo-200' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-600', ring: 'hover:ring-orange-200' },
  };
  const t = themes[theme];
  return (
    <button onClick={onClick} className={`group bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all text-left flex flex-col items-start h-full hover:ring-2 ${t.ring} ring-offset-2 ring-transparent`}>
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform ${t.bg} ${t.text} group-hover:scale-110`}>{icon}</div>
      <h3 className="text-xl font-black text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-500 text-sm font-medium leading-relaxed">{desc}</p>
    </button>
  );
};

interface InputGroupProps {
  label: string;
  name: string;
  type: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<any>) => void;
  icon: React.ElementType;
  disabled?: boolean;
}

const InputGroup = ({ label, name, type, placeholder, value, onChange, icon: Icon, disabled }: InputGroupProps) => (
  <div>
    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">{label}</label>
    <div className="relative group">
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#0065eb]"><Icon size={18} /></div>
      <input type={type} name={name} placeholder={placeholder} value={value} onChange={onChange} disabled={disabled} className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-[#0065eb] transition-all placeholder:text-slate-300 disabled:opacity-60" />
    </div>
  </div>
);

interface SelectGroupProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<any>) => void;
  icon: React.ElementType;
  options: string[];
}

const SelectGroup = ({ label, name, value, onChange, icon: Icon, options }: SelectGroupProps) => (
  <div>
    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">{label}</label>
    <div className="relative group">
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#0065eb]"><Icon size={18} /></div>
      <select name={name} value={value} onChange={onChange} className="w-full pl-10 pr-10 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-[#0065eb] appearance-none cursor-pointer">
        {options.map((opt: string) => (<option key={opt} value={opt}>{opt}</option>))}
      </select>
    </div>
  </div>
);

interface PasswordInputProps {
  label: string;
  name: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<any>) => void;
}

const PasswordInput = ({ label, name, placeholder, value, onChange }: PasswordInputProps) => {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">{label}</label>
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#0065eb]"><Lock size={18} /></div>
        <input type={show ? "text" : "password"} name={name} placeholder={placeholder} value={value} onChange={onChange} className="w-full pl-10 pr-10 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-[#0065eb] placeholder:text-slate-300" />
        <button type="button" onClick={() => setShow(!show)} className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-[#0065eb]"><Eye size={18} /></button>
      </div>
    </div>
  );
};