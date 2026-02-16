'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

// Firebase Imports
import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider 
} from 'firebase/auth';
import { auth } from '../../lib/firebase'; // Ensure this path is correct

// Icons (Lucide React - Matches your Signup Page)
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  Loader2, 
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  
  // State
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle Input Change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  // --- 1. EMAIL LOGIN LOGIC ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await signInWithEmailAndPassword(auth, formData.email, formData.password);
      // Success: Redirect
      router.push('/dashboard'); 
    } catch (err: any) {
      console.error("Login Error:", err);
      // User-friendly error mapping
      let msg = "Failed to login. Please check your credentials.";
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found') {
        msg = "Invalid email or password.";
      } else if (err.code === 'auth/too-many-requests') {
        msg = "Too many failed attempts. Please try again later.";
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // --- 2. GOOGLE LOGIN LOGIC ---
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.push('/dashboard');
    } catch (err: any) {
      console.error("Google Auth Error:", err);
      setError("Failed to sign in with Google.");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#F8FAFC]">
      
  
     {/* --- LEFT SIDE: IMAGE (Hidden on Mobile) --- */}
      <div className="hidden lg:block relative w-1/2 bg-slate-900 overflow-hidden">
        <div className="absolute inset-0 bg-blue-600/20 mix-blend-overlay z-10" />
        <Image
          src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2000"
          alt="Modern Architecture"
          fill
          className="object-cover opacity-60"
          priority
        />
        
        {/* Modern Glass Content Overlay */}
        <div className="absolute inset-0 z-20 flex flex-col justify-end p-16 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent">
          
          {/* */}
          <div className="backdrop-blur-md bg-white/10 border border-white/10 p-8 rounded-3xl max-w-lg animate-in slide-in-from-bottom-8 duration-1000 mb-25">
            <div className="w-12 h-12 bg-[#0065eb] rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30">
              <CheckCircle2 className="text-white" size={24} />
            </div>
            <h2 className="text-3xl font-black text-white mb-4 tracking-tight">Welcome to the Future.</h2>
            <p className="text-blue-100/80 text-lg leading-relaxed font-medium">
              Join thousands of agents, hotels, and homeowners managing their properties with GuriUp.
            </p>
          </div>

        </div>
      </div>

      {/* --- RIGHT SIDE: FORM --- */}
      {/* Added pt-28 to push content down below the fixed navbar on mobile */}
     {/* Added lg:pt-32 to force desktop content down below the nav */}
<div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 relative pt-32 lg:pt-15">

        {/* Floating Back Button */}
        <Link 
          href="/" 
          className="absolute top-24 lg:top-7 left-6 lg:left-12 p-3 rounded-full bg-white border border-slate-100 shadow-sm hover:shadow-md hover:bg-slate-50 transition-all text-slate-500 group z-10"
        >
           <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        </Link>

        <div className="max-w-[420px] w-full animate-in zoom-in-95 duration-500">
          
          {/* Header */}
          <div className="mb-8 text-center lg:text-left">
            <h1 className="text-4xl lg:text-5xl font-black text-slate-900 mb-3 tracking-tight">
              Welcome <span className="text-[#0065eb]">Back</span>
            </h1>
            <p className="text-slate-500 text-lg font-medium">Enter your details to access your account.</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="shrink-0" size={20} />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            
            {/* Google Sign In Button */}
            <button 
              type="button" 
              onClick={handleGoogleSignIn}
              disabled={googleLoading || loading}
              className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 p-4 rounded-2xl text-slate-700 font-bold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm group"
            >
              {googleLoading ? (
                <Loader2 className="animate-spin text-slate-400" size={20} />
              ) : (
                <>
                  <Image 
                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                    width={20} height={20} alt="G" 
                    className="group-hover:scale-110 transition-transform"
                  />
                  <span>Sign in with Google</span>
                </>
              )}
            </button>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-100"></div>
              <span className="flex-shrink-0 mx-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Or Continue With</span>
              <div className="flex-grow border-t border-slate-100"></div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#0065eb] transition-colors">
                  <Mail size={20} strokeWidth={2} />
                </div>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-slate-900 font-bold outline-none focus:ring-4 focus:ring-[#0065eb]/10 focus:border-[#0065eb] transition-all placeholder:text-slate-300 placeholder:font-medium"
                  placeholder="mubarik@example.com"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex justify-between items-center mb-2 ml-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Password</label>
                <Link href="/forgot-password" className="text-xs font-bold text-[#0065eb] hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#0065eb] transition-colors">
                  <Lock size={20} strokeWidth={2} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-12 pr-12 py-4 bg-white border border-slate-200 rounded-2xl text-slate-900 font-bold outline-none focus:ring-4 focus:ring-[#0065eb]/10 focus:border-[#0065eb] transition-all placeholder:text-slate-300 placeholder:font-medium"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full bg-[#0065eb] text-white py-4 rounded-2xl font-bold text-lg hover:bg-[#0052c1] active:scale-[0.98] transition-all shadow-xl shadow-blue-500/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="mt-8 text-center text-slate-500 font-medium">
            Don't have an account?{' '}
            <Link href="/signup" className="text-[#0065eb] font-bold hover:underline">
              Create one now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}