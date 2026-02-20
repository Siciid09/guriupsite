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
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../../lib/firebase'; // Make sure storage is exported in your firebase config
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
  Eye,
  EyeOff,
  ShieldCheck,
  Layers,
  Star,
  Clock,
  CreditCard,
  Globe,
  UploadCloud,
  Camera
} from 'lucide-react';

// --- TYPES ---
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

  // --- IMAGE UPLOAD STATES ---
  const [agentProfile, setAgentProfile] = useState<{file: File | null, preview: string | null}>({file: null, preview: null});
  const [agentCover, setAgentCover] = useState<{file: File | null, preview: string | null}>({file: null, preview: null});
  const [hotelImage, setHotelImage] = useState<{file: File | null, preview: string | null}>({file: null, preview: null});

  // --- SLUG GENERATION ---
  const [slug, setSlug] = useState('');

  // Form Data
  const [formData, setFormData] = useState({
    // Common
    fullName: '',
    email: '',
    phone: '',
    password: '',
    city: '',
    
    // Agent & Hotel Common
    businessName: '', 
    whatsappNumber: '',
    
    // Agent Specific
    licenseNumber: '',
    specialty: 'Residential',

    // Hotel Specific
    hotelType: 'Hotel',
    area: '',
    pricePerNight: '',
    roomsCount: '',
    rating: '3',
    description: '',
    phoneCall: '',
    phoneManager: '',
    website: '',
    checkInTime: '12:00 PM',
    checkOutTime: '10:00 AM',
    cancellation: 'Free cancellation up to 24 hours',
    paymentMethods: 'Cash, Zaad, EDahab'
  });

  // --- 1. SYNC URL ---
  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam === 'reagent' || roleParam === 'hoadmin' || roleParam === 'user') {
      setRole(roleParam as Role);
    } else if (roleParam === 'agent') {
      setRole('reagent'); 
    } else if (roleParam === 'hotel') {
      setRole('hoadmin'); 
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError(null);

    // Auto-generate unique slug when businessName changes
    if (name === 'businessName') {
      const randomChars = Math.random().toString(36).substring(2, 5); 
      const safeSlug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      if (value) setSlug(`${safeSlug}_${randomChars}`);
      else setSlug('');
    }
  };

  // Generic Image Handler
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, setter: any) => {
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
          photoUrl: user.photoURL || "",
          emailVerified: true, 
          onboardingCompleted: true, 
          createdAt: serverTimestamp(),
          planTier: 'free',
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

  // --- 3. STRICT REGISTER WITH IMAGES & VERIFICATION LOCK ---
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Validate Core Inputs
      if (!formData.fullName || !formData.email || !formData.password || !formData.phone) {
        throw new Error("Please fill in all personal details.");
      }
      
      // 2. Validation for Agents (INCLUDING IMAGES)
      if (role === 'reagent') {
        if (!formData.businessName || !formData.city || !formData.whatsappNumber) {
          throw new Error("Please fill in all business details.");
        }
        if (!agentProfile.file) {
          throw new Error("Please upload a Profile Photo. It is required for Agents.");
        }
      }

      // 3. Validation for Hotels (INCLUDING IMAGES)
      if (role === 'hoadmin') {
         if (!formData.businessName || !formData.city || !formData.area || !formData.pricePerNight || !formData.roomsCount) {
             throw new Error("Please fill in all required hotel details.");
         }
         if (!hotelImage.file) {
             throw new Error("Please upload a Main Hotel Photo. It is required.");
         }
      }

      // 4. Create Authentication User
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: formData.fullName });
      await sendEmailVerification(user);

      // 5. UPLOAD IMAGES TO STORAGE
      let finalProfileUrl = "";
      let finalCoverUrl = "";
      let finalHotelImages: string[] = [];

      try {
        if (role === 'reagent') {
          // Upload Agent Profile
          if (agentProfile.file) {
            const ext = agentProfile.file.name.split('.').pop();
            const sRef = ref(storage, `profile_images/${user.uid}_profile_${Date.now()}.${ext}`);
            await uploadBytes(sRef, agentProfile.file);
            finalProfileUrl = await getDownloadURL(sRef);
          }
          // Upload Agent Cover (Optional)
          if (agentCover.file) {
            const ext = agentCover.file.name.split('.').pop();
            const sRef = ref(storage, `cover_images/${user.uid}_cover_${Date.now()}.${ext}`);
            await uploadBytes(sRef, agentCover.file);
            finalCoverUrl = await getDownloadURL(sRef);
          }
        } else if (role === 'hoadmin') {
          // Upload Hotel Image
          if (hotelImage.file) {
            const ext = hotelImage.file.name.split('.').pop();
            const sRef = ref(storage, `hotel_images/${user.uid}_main_${Date.now()}.${ext}`);
            await uploadBytes(sRef, hotelImage.file);
            const url = await getDownloadURL(sRef);
            finalHotelImages.push(url);
            finalProfileUrl = url; // Set as user profile photo too
          }
        }
      } catch (uploadErr) {
        console.error("Image Upload Failed:", uploadErr);
        // Continue creating doc even if upload fails to avoid broken accounts, 
        // they can re-upload in dashboard later.
      }

      // 6. Create Firestore Documents 
      
      const userData = {
        uid: user.uid,
        authMethod: 'email_password',
        createdAt: serverTimestamp(),
        email: formData.email,
        emailVerified: false, 
        onboardingCompleted: true, // Set to true because we did the photo upload right here!
        name: formData.fullName,
        phoneNumber: formData.phone,
        photoUrl: finalProfileUrl, 
        planTier: 'free',
        role: role, 
        slug: slug || "", 
        favoriteHotels: [],
        favoriteProperties: []
      };

      let agencyData = null;

      if (role === 'reagent') {
        agencyData = {
          agencyName: formData.businessName,
          agentVerified: false,
          analytics: { clicks: 0, leads: 0, views: 0 },
          averageRating: 0,
          bio: "",
          coverPhoto: finalCoverUrl,
          email: formData.email,
          featured: false,
          isFeatured: false,
          isVerified: false,
          joinDate: serverTimestamp(),
          languages: ["Somali", "English"],
          lastUpdated: serverTimestamp(),
          licenseNumber: formData.licenseNumber || 'PENDING',
          migratedAt: serverTimestamp(),
          name: formData.businessName,
          phone: formData.phone,
          planTier: 'free',
          profileImageUrl: finalProfileUrl,
          propertiesSold: 0,
          slug: slug || "", 
          specialties: [formData.specialty],
          status: "active",
          totalListings: 0,
          userid: user.uid,
          verifiedAt: null,
          city: formData.city,
          ownerName: formData.fullName,
          whatsappNumber: formData.whatsappNumber,
          type: "reagent"
        };
      } 
      else if (role === 'hoadmin') {
        agencyData = {
            name: formData.businessName, 
            type: formData.hotelType,
            city: formData.city,
            area: formData.area,
            pricePerNight: Number(formData.pricePerNight) || 0,
            rating: Number(formData.rating) || 3,
            roomsCount: Number(formData.roomsCount) || 0,
            description: formData.description,
            featured: false,
            planTierAtUpload: "free",
            hotelAdminId: user.uid,
            createdAt: serverTimestamp(),
            slug: slug || "", 
            images: finalHotelImages, 
            location: {
                area: formData.area,
                city: formData.city,
                coordinates: null,
                latDisplay: null,
                lngDisplay: null
            },
            policies: {
                cancellation: formData.cancellation,
                checkInTime: formData.checkInTime,
                checkOutTime: formData.checkOutTime,
                paymentMethods: formData.paymentMethods
            },
            paymentMethodsList: [], 
            contact: {
                phoneCall: formData.phoneCall,
                phoneManager: formData.phoneManager,
                phoneWhatsapp: formData.whatsappNumber,
                website: formData.website
            }
        };
      }

      await setDoc(doc(db, 'users', user.uid), userData);
      
      if (agencyData) {
        const collectionName = role === 'reagent' ? 'agents' : 'hotels';
        await setDoc(doc(db, collectionName, user.uid), agencyData);
        
        if (role === 'hoadmin') {
             await setDoc(doc(db, 'users', user.uid), { 
                 ...userData, 
                 managedHotelId: user.uid,
                 isHotelOwner: true 
             });
        }
      }

      // 7. Sign Out to prevent unverified dashboard access
      await signOut(auth);

      // 8. Show Verification Screen
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

  // --- VIEW: VERIFICATION SENT (The "Gate") ---
  if (verificationSent) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
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
              <h1 className="text-4xl md:text-7xl font-black text-slate-900 mb-6 tracking-tight leading-tight">
                Join the <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0065eb] to-indigo-600">Future</span><br/> of Real Estate
              </h1>
              <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto">
                Connect with top rated agents, book luxury hotels, and find your dream home.
              </p>
            </div>
          )}

          {/* === ROLE SELECTION === */}
          {!role && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700 max-w-5xl mx-auto">
              <RoleCard icon={<User size={32} />} title="I'm a Guest" desc="Browse homes and book hotels." theme="blue" onClick={() => updateRole('user')} />
              <RoleCard icon={<Briefcase size={32} />} title="I'm an Agent" desc="List properties and manage leads." theme="indigo" onClick={() => updateRole('reagent')} />
              <RoleCard icon={<Building2 size={32} />} title="I'm a Hotel" desc="Manage rooms and bookings." theme="orange" onClick={() => updateRole('hoadmin')} />
            </div>
          )}

          {/* === REGISTRATION FORM === */}
          {role && (
            <div className="max-w-5xl mx-auto bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-500 border border-white/50 ring-1 ring-slate-100">
              
              {/* Left Side (Visuals) */}
              <div className="w-full md:w-5/12 bg-slate-900 p-10 flex flex-col justify-between relative overflow-hidden min-h-[300px] md:min-h-auto group">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0065eb] to-indigo-900 opacity-90 z-10 transition-opacity duration-700 group-hover:opacity-95"></div>
                <Image src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1000" alt="City" fill className="object-cover opacity-50 mix-blend-overlay scale-110 group-hover:scale-100 transition-transform duration-1000" />
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
                     <h3 className="text-4xl font-black text-white capitalize leading-tight">Create your <br/> profile.</h3>
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
              <div className="w-full md:w-7/12 p-8 md:p-12 lg:p-16 relative overflow-y-auto max-h-[800px] custom-scrollbar">
                <form onSubmit={handleRegister} className="max-w-md mx-auto md:mx-0">
                  
                  {/* === STEP 1: PERSONAL DETAILS === */}
                  {step === 1 && (
                    <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                        <h2 className="text-2xl font-bold text-slate-900 mb-6">Personal Details</h2>
                        
                        {role === 'user' && (
                          <div className="mb-8">
                            <button type="button" onClick={handleGoogleSignIn} className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 p-4 rounded-xl text-slate-700 font-bold text-sm hover:bg-slate-50 hover:border-slate-300 transition-all group">
                              <Image src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width={20} height={20} alt="G" className="group-hover:scale-110 transition-transform" /> Sign up with Gmail
                            </button>
                            <div className="relative my-6"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-white/80 backdrop-blur px-3 text-slate-400 font-bold tracking-wider">Or via Email</span></div></div>
                          </div>
                        )}

                        {error && (
                            <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm font-bold rounded-xl flex items-start gap-3 border border-red-100">
                                <AlertCircle size={20} className="shrink-0 mt-0.5"/><span>{error}</span>
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
                            <button type="button" onClick={() => {
                                if (!formData.fullName || !formData.email || !formData.phone || !formData.password) {
                                  setError("Please fill in all personal details before continuing.");
                                  return;
                                }
                                setError(null);
                                setStep(2);
                              }} 
                              className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-sm hover:bg-slate-800 hover:scale-[1.01] transition-all shadow-lg shadow-slate-900/20 flex items-center justify-center gap-2"
                            >
                              Next Step <ArrowRight size={18} />
                            </button>
                          )}
                        </div>
                     </div>
                  )}

                  {/* === STEP 2: AGENT === */}
                  {step === 2 && role === 'reagent' && (
                    <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                        <button type="button" onClick={() => setStep(1)} className="text-xs font-bold text-slate-400 uppercase tracking-wider hover:text-[#0065eb] mb-4 flex items-center gap-1 transition-colors"><ArrowLeft size={12}/> Back</button>
                        <h2 className="text-2xl font-bold text-slate-900 mb-6">Agent Details</h2>
                        
                        {error && <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm font-bold rounded-xl flex items-start gap-3 border border-red-100"><AlertCircle size={20} className="shrink-0 mt-0.5"/><span>{error}</span></div>}

                        <div className="space-y-5">
                            {/* AGENT IMAGES UPLOAD */}
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <ImageUploader label="Profile Photo" required isCircle previewUrl={agentProfile.preview} onChange={(e: any) => handleImageChange(e, setAgentProfile)} />
                                </div>
                                <div className="flex-1">
                                    <ImageUploader label="Cover Photo" previewUrl={agentCover.preview} onChange={(e: any) => handleImageChange(e, setAgentCover)} />
                                </div>
                            </div>

                            <InputGroup label="Agency Name" icon={Building} name="businessName" type="text" placeholder="e.g. Horn Properties" value={formData.businessName} onChange={handleChange} />
                            
                            <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Profile Link / Slug</label>
                              <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#0065eb] transition-colors"><Globe size={18} strokeWidth={2.5} /></div>
                                <input type="text" name="slug" value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))} placeholder="your-business-link_123" className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-[#0065eb]/10 focus:border-[#0065eb] transition-all placeholder:text-slate-300" />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <InputGroup label="City" icon={MapPin} name="city" type="text" placeholder="Hargeisa" value={formData.city} onChange={handleChange} />
                              <InputGroup label="WhatsApp" icon={MessageCircle} name="whatsappNumber" type="tel" placeholder="+252..." value={formData.whatsappNumber} onChange={handleChange} />
                            </div>
                            
                            <SelectGroup label="Specialty" icon={Layers} name="specialty" value={formData.specialty} onChange={handleChange} options={["Residential", "Commercial", "Land", "Industrial", "Luxury"]} />
                            <InputGroup label="License (Optional)" icon={CheckCircle} name="licenseNumber" type="text" placeholder="AG-12345" value={formData.licenseNumber} onChange={handleChange} />
                        </div>

                        <div className="pt-8">
                          <button type="submit" disabled={loading} className="w-full bg-[#0065eb] text-white py-4 rounded-xl font-bold text-sm hover:bg-[#0052c1] hover:scale-[1.01] transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:scale-100">
                            {loading ? <><Loader2 className="animate-spin"/> Creating...</> : 'Create & Verify Account'}
                          </button>
                        </div>
                     </div>
                  )}

                  {/* === STEP 2: HOTEL === */}
                  {step === 2 && role === 'hoadmin' && (
                    <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                        <button type="button" onClick={() => setStep(1)} className="text-xs font-bold text-slate-400 uppercase tracking-wider hover:text-[#0065eb] mb-4 flex items-center gap-1 transition-colors"><ArrowLeft size={12}/> Back</button>
                        <h2 className="text-2xl font-bold text-slate-900 mb-6">Hotel Details</h2>
                        
                        {error && <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm font-bold rounded-xl flex items-start gap-3 border border-red-100"><AlertCircle size={20} className="shrink-0 mt-0.5"/><span>{error}</span></div>}

                        <div className="space-y-6">
                            {/* HOTEL IMAGE UPLOAD */}
                            <ImageUploader label="Main Hotel Image" required previewUrl={hotelImage.preview} onChange={(e: any) => handleImageChange(e, setHotelImage)} />

                            <div>
                                <h3 className="text-xs font-black uppercase text-[#0065eb] mb-4 tracking-wider">Basic Info</h3>
                                <div className="space-y-4">
                                    <InputGroup label="Hotel Name" icon={Building} name="businessName" type="text" placeholder="e.g. Muun Hotel" value={formData.businessName} onChange={handleChange} />
                                    
                                    <div>
                                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Profile Link / Slug</label>
                                      <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#0065eb] transition-colors"><Globe size={18} strokeWidth={2.5} /></div>
                                        <input type="text" name="slug" value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))} placeholder="your-business-link_123" className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-[#0065eb]/10 focus:border-[#0065eb] transition-all placeholder:text-slate-300" />
                                      </div>
                                    </div>

                                    <SelectGroup label="Hotel Type" icon={Layers} name="hotelType" value={formData.hotelType} onChange={handleChange} options={['Hotel', 'Resort', 'Lodge', 'Villa', 'Apartment']} />
                                    <div className="grid grid-cols-2 gap-4">
                                        <InputGroup label="Price/Night ($)" icon={CreditCard} name="pricePerNight" type="number" placeholder="50" value={formData.pricePerNight} onChange={handleChange} />
                                        <InputGroup label="Total Rooms" icon={Building2} name="roomsCount" type="number" placeholder="100" value={formData.roomsCount} onChange={handleChange} />
                                    </div>
                                    <SelectGroup label="Star Rating" icon={Star} name="rating" value={formData.rating} onChange={handleChange} options={['1', '2', '3', '4', '5']} />
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xs font-black uppercase text-[#0065eb] mb-4 tracking-wider">Location</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <InputGroup label="City" icon={MapPin} name="city" type="text" placeholder="Hargeisa" value={formData.city} onChange={handleChange} />
                                    <InputGroup label="Area" icon={MapPin} name="area" type="text" placeholder="Jigjiga Yar" value={formData.area} onChange={handleChange} />
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xs font-black uppercase text-[#0065eb] mb-4 tracking-wider">Contact & Policies</h3>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <InputGroup label="Reception Phone" icon={Phone} name="phoneCall" type="tel" placeholder="+252..." value={formData.phoneCall} onChange={handleChange} />
                                        <InputGroup label="WhatsApp" icon={MessageCircle} name="whatsappNumber" type="tel" placeholder="+252..." value={formData.whatsappNumber} onChange={handleChange} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <InputGroup label="Manager Phone" icon={Phone} name="phoneManager" type="tel" placeholder="+252..." value={formData.phoneManager} onChange={handleChange} />
                                        <InputGroup label="Website (Opt)" icon={Globe} name="website" type="text" placeholder="www.hotel.com" value={formData.website} onChange={handleChange} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <InputGroup label="Check-In" icon={Clock} name="checkInTime" type="text" placeholder="12:00 PM" value={formData.checkInTime} onChange={handleChange} />
                                        <InputGroup label="Check-Out" icon={Clock} name="checkOutTime" type="text" placeholder="10:00 AM" value={formData.checkOutTime} onChange={handleChange} />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Description</label>
                                <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-[#0065eb]/10 focus:border-[#0065eb] transition-all placeholder:text-slate-300" placeholder="Tell us about your hotel..."></textarea>
                            </div>
                        </div>

                        <div className="pt-8">
                          <button type="submit" disabled={loading} className="w-full bg-[#0065eb] text-white py-4 rounded-xl font-bold text-sm hover:bg-[#0052c1] hover:scale-[1.01] transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:scale-100">
                            {loading ? <><Loader2 className="animate-spin"/> Creating...</> : 'Create & Verify Account'}
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

// New Image Uploader Component
const ImageUploader = ({ label, required, isCircle, previewUrl, onChange }: any) => {
  const idId = `upload-${label.replace(/\s+/g, '')}`;
  return (
    <div className="mb-2">
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">
        {label} {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input type="file" accept="image/*" onChange={onChange} className="hidden" id={idId} />
      <label
        htmlFor={idId}
        className={`relative flex flex-col items-center justify-center cursor-pointer transition-all duration-300 border-2 border-dashed
          ${isCircle ? 'w-24 h-24 sm:w-28 sm:h-28 rounded-full mx-auto' : 'w-full h-28 rounded-2xl'}
          ${previewUrl ? 'border-transparent shadow-md' : 'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-[#0065eb]'}
          overflow-hidden group`}
      >
        {previewUrl ? (
          <>
            <Image src={previewUrl} alt="Preview" fill className="object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Camera className="text-white" size={24} />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center text-slate-400 group-hover:text-[#0065eb] transition-colors p-4 text-center">
            <UploadCloud size={24} className="mb-2" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Upload</span>
          </div>
        )}
      </label>
    </div>
  );
};

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
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#0065eb] transition-colors"><Icon size={18} strokeWidth={2.5} /></div>
      <input type={type} name={name} placeholder={placeholder} value={value} onChange={onChange} className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-[#0065eb]/10 focus:border-[#0065eb] transition-all placeholder:text-slate-300 hover:bg-slate-50/80 hover:border-slate-300" />
    </div>
  </div>
);

const SelectGroup = ({ label, name, value, onChange, icon: Icon, options }: any) => (
  <div>
    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">{label}</label>
    <div className="relative group">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#0065eb] transition-colors"><Icon size={18} strokeWidth={2.5} /></div>
      <select name={name} value={value} onChange={onChange} className="w-full pl-11 pr-10 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-[#0065eb]/10 focus:border-[#0065eb] transition-all hover:bg-slate-50/80 hover:border-slate-300 appearance-none cursor-pointer">
        {options.map((opt: string) => (<option key={opt} value={opt}>{opt}</option>))}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-400">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
      </div>
    </div>
  </div>
);

const PasswordInput = ({ label, name, placeholder, value, onChange }: any) => {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">{label}</label>
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#0065eb] transition-colors"><Lock size={18} strokeWidth={2.5} /></div>
        <input type={show ? "text" : "password"} name={name} placeholder={placeholder} value={value} onChange={onChange} className="w-full pl-11 pr-11 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-[#0065eb]/10 focus:border-[#0065eb] transition-all placeholder:text-slate-300 hover:bg-slate-50/80 hover:border-slate-300" />
        <button type="button" onClick={() => setShow(!show)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-[#0065eb] transition-colors cursor-pointer">
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
};