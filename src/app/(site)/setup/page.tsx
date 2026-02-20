'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

// Firebase Imports
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../../lib/firebase'; 

// Icons
import { 
  Camera, 
  UploadCloud, 
  Loader2, 
  AlertCircle, 
  CheckCircle,
  Building2,
  User as UserIcon
} from 'lucide-react';

export default function SetupPage() {
  const router = useRouter();
  
  // State
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // File State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // --- 1. AUTH & ROUTING CHECK ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push('/login');
        return;
      }
      
      setUser(currentUser);
      
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userDocRef);
        
        if (userSnap.exists()) {
          const data = userSnap.data();
          setUserData(data);

          // If they are a guest OR already completed onboarding, kick them to dashboard
          if (data.role === 'user' || data.onboardingCompleted === true) {
            router.push('/dashboard');
          } else {
            setLoading(false); // Stay on this page
          }
        } else {
          router.push('/login');
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError("Failed to load profile data.");
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // --- 2. HANDLE FILE SELECTION ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Basic validation (Must be an image, under 5MB)
      if (!file.type.startsWith('image/')) {
        setError("Please select a valid image file (JPG, PNG).");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size must be less than 5MB.");
        return;
      }

      setError(null);
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // --- 3. HANDLE UPLOAD & COMPLETE SETUP ---
  const handleCompleteSetup = async () => {
    if (!selectedFile || !user || !userData) {
      setError("Please select an image to continue.");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // 1. Upload Image to Firebase Storage
      const fileExtension = selectedFile.name.split('.').pop();
      const storageRef = ref(storage, `profile_images/${user.uid}_${Date.now()}.${fileExtension}`);
      await uploadBytes(storageRef, selectedFile);
      const downloadUrl = await getDownloadURL(storageRef);

      // 2. Update the 'users' collection
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        photoUrl: downloadUrl,
        onboardingCompleted: true
      });

      // 3. Update the 'agents' OR 'hotels' collection based on role
      if (userData.role === 'reagent') {
        const agentRef = doc(db, 'agents', user.uid);
        await updateDoc(agentRef, {
          profileImageUrl: downloadUrl
        });
      } else if (userData.role === 'hoadmin') {
        const hotelRef = doc(db, 'hotels', user.uid);
        const hotelSnap = await getDoc(hotelRef);
        // Add image to the hotel's image array (creating the array if it doesn't exist)
        const currentImages = hotelSnap.exists() ? (hotelSnap.data().images || []) : [];
        await updateDoc(hotelRef, {
          images: [downloadUrl, ...currentImages] // Put new logo first
        });
      }

      // 4. Send them to their dashboard!
      router.push('/dashboard');

    } catch (err: any) {
      console.error("Setup Completion Error:", err);
      setError("Failed to upload image. Please try again.");
      setUploading(false);
    }
  };


  // --- VIEW: LOADING STATE ---
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="animate-spin text-[#0065eb] w-10 h-10" />
      </div>
    );
  }

  // --- VIEW: SETUP FORM ---
  const isAgent = userData?.role === 'reagent';

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans text-slate-900">
      
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#0065eb]/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none mix-blend-multiply" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4 pointer-events-none mix-blend-multiply" />

      <div className="w-full max-w-lg relative z-10 animate-in zoom-in-95 duration-500">
        
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-100 text-[#0065eb]">
            {isAgent ? <UserIcon size={32} /> : <Building2 size={32} />}
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">
            Complete Your Profile
          </h1>
          <p className="text-slate-500 font-medium">
            {isAgent 
              ? "Upload a professional photo to build trust with clients." 
              : "Upload your Hotel's main cover photo or logo to stand out."}
          </p>
        </div>

        {/* Setup Card */}
        <div className="bg-white/80 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-white/50 ring-1 ring-slate-100 text-center">
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm font-bold rounded-xl flex items-start gap-3 border border-red-100 text-left">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Image Uploader */}
          <div className="mb-8">
            <input 
              type="file" 
              id="imageUpload" 
              accept="image/*" 
              className="hidden" 
              onChange={handleFileSelect} 
            />
            
            <label 
              htmlFor="imageUpload" 
              className={`relative flex flex-col items-center justify-center cursor-pointer mx-auto transition-all duration-300 ${
                isAgent ? 'w-40 h-40 rounded-full' : 'w-full h-48 rounded-2xl'
              } border-2 border-dashed ${
                previewUrl ? 'border-transparent shadow-xl' : 'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-[#0065eb]'
              } overflow-hidden group`}
            >
              {previewUrl ? (
                <>
                  <Image src={previewUrl} alt="Preview" fill className="object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Camera className="text-white" size={32} />
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center text-slate-400 group-hover:text-[#0065eb] transition-colors">
                  <UploadCloud size={40} className="mb-3" />
                  <span className="text-sm font-bold">Click to upload</span>
                  <span className="text-[10px] font-medium uppercase tracking-widest mt-1">Max 5MB (JPG/PNG)</span>
                </div>
              )}
            </label>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50/50 rounded-2xl p-4 mb-8 text-sm text-blue-700 font-medium border border-blue-100 text-left flex items-start gap-3">
             <CheckCircle size={20} className="shrink-0 mt-0.5" />
             <p>This image will be public and acts as the main face of your {isAgent ? 'Agency' : 'Hotel'}. You can always change it later in your dashboard settings.</p>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleCompleteSetup}
            disabled={!selectedFile || uploading}
            className="w-full bg-[#0065eb] text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-[#0052c1] active:scale-[0.98] transition-all shadow-lg shadow-blue-500/20 disabled:opacity-70 disabled:hover:scale-100 flex items-center justify-center gap-2"
          >
            {uploading ? (
              <><Loader2 className="animate-spin" /> Uploading & Saving...</>
            ) : (
              'Complete Setup & Go to Dashboard'
            )}
          </button>

        </div>
      </div>
    </div>
  );
}