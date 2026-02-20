'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

// Firebase Imports
import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  sendEmailVerification,
  signOut,
  User
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from '../../lib/firebase'; 

// Icons
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  Loader2, 
  AlertCircle,
  ShieldCheck,
  Send
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  
  // State
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verification Gate State
  const [unverifiedUser, setUnverifiedUser] = useState<User | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  // Handle Input Change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  // --- 1. EMAIL LOGIN LOGIC ---
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setError(null);
    setResendSuccess(false);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // 🚨 GATING: Block unverified emails immediately
      if (!user.emailVerified) {
        // Keep the user object in state so we can resend the email, but don't let them in
        setUnverifiedUser(user);
        setLoading(false);
        return;
      }

      // ✅ DB SYNC: The user is verified! Sync it to Firestore.
      const userRef = doc(db, 'users', user.uid);
      try {
        await updateDoc(userRef, { emailVerified: true });
      } catch (err) {
        console.error("Non-critical: Could not sync verification status", err);
      }

      // 🧭 ROUTING: Check if they need to complete Setup/Onboarding
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        
        // If they are an Agent or Hotel and haven't uploaded their photos yet
        if (userData.onboardingCompleted === false && userData.role !== 'user') {
          router.push('/setup'); // Redirect to your setup/onboarding page
          return;
        }
      }

      // Otherwise, go to dashboard!
      router.push('/dashboard');

    } catch (err: any) {
      console.error("Login Error:", err);
      let msg = "Invalid email or password.";
      if (err.code === 'auth/user-not-found') msg = "No account found with this email.";
      if (err.code === 'auth/wrong-password') msg = "Incorrect password.";
      if (err.code === 'auth/too-many-requests') msg = "Too many failed attempts. Try again later.";
      
      setError(msg);
      await signOut(auth); // Clear any broken auth states
      setUnverifiedUser(null);
    } finally {
      setLoading(false);
    }
  };

  // --- 2. RESEND VERIFICATION EMAIL ---
  const handleResendVerification = async () => {
    if (!unverifiedUser) return;
    setResendLoading(true);
    setError(null);

    try {
      await sendEmailVerification(unverifiedUser);
      setResendSuccess(true);
      // For security, sign them out after sending the link
      await signOut(auth);
    } catch (err: any) {
      console.error("Resend Error:", err);
      if (err.code === 'auth/too-many-requests') {
        setError("We just sent one! Please wait a few minutes before requesting another.");
      } else {
        setError("Failed to resend. Please try again later.");
      }
    } finally {
      setResendLoading(false);
    }
  };

  // --- 3. GOOGLE LOGIN LOGIC ---
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      // If they don't exist, create a basic Guest account
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
          onboardingCompleted: true, // Guests don't need onboarding
          createdAt: serverTimestamp(),
          planTier: 'free',
          favoriteProperties: [],
          favoriteHotels: []
        });
      }
      
      router.push('/dashboard');
    } catch (err: any) {
      console.error("Google Auth Error:", err);
      setError("Failed to sign in with Google.");
    } finally {
      setGoogleLoading(false);
    }
  };


  // =======================================================================
  // VIEW 1: UNVERIFIED USER GATE (RESEND EMAIL SCREEN)
  // =======================================================================
  if (unverifiedUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
         <div className="absolute top-0 left-0 w-96 h-96 bg-amber-200/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
         <div className="absolute bottom-0 right-0 w-96 h-96 bg-red-200/30 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
         
        <div className="bg-white/80 backdrop-blur-xl border border-white/50 p-10 rounded-[2.5rem] shadow-2xl max-w-md w-full text-center animate-in zoom-in-95 duration-500 relative z-10">
          <div className="w-24 h-24 bg-gradient-to-tr from-amber-100 to-orange-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <ShieldCheck size={48} />
          </div>
          
          <h2 className="text-3xl font-black text-slate-900 mb-2">Verification Required</h2>
          
          {resendSuccess ? (
            <div className="bg-green-50 text-green-700 p-4 rounded-2xl mb-6 font-bold text-sm border border-green-200">
              New link sent! Please check your inbox and spam folder.
            </div>
          ) : (
            <p className="text-slate-500 mb-8 font-medium leading-relaxed">
              Your email <span className="text-slate-900 font-bold">{formData.email}</span> has not been verified yet. You must verify your email before accessing the platform.
            </p>
          )}

          {error && <p className="text-red-500 font-bold text-sm mb-6">{error}</p>}

          <div className="flex flex-col gap-3">
            {!resendSuccess && (
              <button 
                onClick={handleResendVerification} 
                disabled={resendLoading}
                className="w-full bg-[#0065eb] text-white py-4 rounded-xl font-bold hover:bg-[#0052c1] transition-all shadow-lg flex items-center justify-center gap-2"
              >
                {resendLoading ? <Loader2 className="animate-spin" /> : <><Send size={18}/> Resend Verification Link</>}
              </button>
            )}
            
            <button 
              onClick={async () => {
                await signOut(auth);
                setUnverifiedUser(null);
                setFormData({email: '', password: ''});
              }} 
              className="w-full bg-slate-100 text-slate-600 py-4 rounded-xl font-bold hover:bg-slate-200 transition-all"
            >
              Cancel & Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =======================================================================
  // VIEW 2: STANDARD LOGIN SCREEN
  // =======================================================================
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#0065eb]/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none mix-blend-multiply" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4 pointer-events-none mix-blend-multiply" />

      {/* Back Button */}
      <div className="absolute top-8 left-8 z-20">
        <Link href="/" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-bold text-sm bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200">
          <ArrowLeft size={16} /> Back to Home
        </Link>
      </div>

      <div className="w-full max-w-md relative z-10 animate-in zoom-in-95 duration-500">
        
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">Welcome Back</h1>
          <p className="text-slate-500 font-medium">Sign in to your GuriUp account to continue.</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/80 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-white/50 ring-1 ring-slate-100">
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm font-bold rounded-xl flex items-start gap-3 border border-red-100">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Google Login */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-100 p-4 rounded-xl text-slate-700 font-bold text-sm hover:bg-slate-50 hover:border-slate-300 transition-all group disabled:opacity-70"
          >
            {googleLoading ? (
              <Loader2 size={20} className="animate-spin text-slate-400" />
            ) : (
              <Image src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width={20} height={20} alt="G" className="group-hover:scale-110 transition-transform" />
            )}
            Continue with Google
          </button>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-4 text-slate-400 font-black tracking-widest rounded-full">Or use email</span></div>
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2 ml-1">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#0065eb] transition-colors">
                  <Mail size={18} strokeWidth={2.5} />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-[#0065eb]/10 focus:border-[#0065eb] transition-all placeholder:text-slate-300 placeholder:font-medium hover:bg-slate-50/80 hover:border-slate-300"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex justify-between items-center mb-2 ml-1 mr-1">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-wider">Password</label>
                <Link href="/forgot-password" className="text-[11px] font-bold text-[#0065eb] hover:underline">Forgot?</Link>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#0065eb] transition-colors">
                  <Lock size={18} strokeWidth={2.5} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full pl-11 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-[#0065eb]/10 focus:border-[#0065eb] transition-all placeholder:text-slate-300 placeholder:font-medium hover:bg-slate-50/80 hover:border-slate-300"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-[#0065eb] transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full bg-[#0065eb] text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-[#0052c1] active:scale-[0.98] transition-all shadow-lg shadow-blue-500/20 disabled:opacity-70 disabled:hover:scale-100 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Sign In'}
            </button>
          </form>

        </div>      
        {/* Footer */}
        <p className="mt-8 text-center text-slate-500 font-medium text-sm">
          Don't have an account?{' '}
          <Link href="/signup" className="text-[#0065eb] font-black hover:underline ml-1">
            Create one
          </Link>
        </p>

      </div>
    </div>
  );
}