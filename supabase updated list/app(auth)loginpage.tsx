'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, db } from '../../lib/firebase'; // Adjust path as needed
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Mail, Lock, Loader2, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();

        // 🔒 SECURITY FIX: Rely on Google/Firebase's internal security token
        if (!user.emailVerified) {
          await auth.signOut();
          setError('Account not verified. Please check your email and click the link.');
          setLoading(false);
          return;
        }

        // 🛠️ AUTO-REPAIR: If Firebase says they clicked the link, but your DB missed it, fix the DB silently!
        if (user.emailVerified && userData.emailVerified !== true) {
          await setDoc(userDocRef, { emailVerified: true }, { merge: true });
          userData.emailVerified = true; // 🚨 FIX: Repair emailVerified, not Admin isVerified
        }

        if (userData.role === 'agent' || userData.isAgent === true) {
          router.push('/dashboard/agent');
        } else {
          router.push('/');
        }
      } else {
        await auth.signOut();
        setError('User profile not found. Please contact support.');
      }

    } catch (err: any) {
      console.error("Login Error:", err);
      if (err.code === 'auth/invalid-credential' || 
          err.code === 'auth/user-not-found' || 
          err.code === 'auth/wrong-password') {
        setError('Invalid email or password. Please check your credentials.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later.');
      } else if (err.code === 'auth/user-disabled') {
        setError('This account has been disabled. Contact support.');
      } else {
        setError('Failed to log in. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // 🚫 SCAM PREVENTION: Do not let random Google clicks create default accounts here.
        // Force them to go through the proper Signup page to accept terms and pick a role.
        await auth.signOut();
        setError('No account found. Please go to the Sign Up page to create an account.');
        setLoading(false);
        return;
      } else {
         const userData = userDoc.data();
         
         // ✅ FIX: Check if banned, not isVerified. Google users are auto-verified.
         if (userData.isBanned === true) {
           await auth.signOut();
           setError('This account has been disabled.');
           setLoading(false);
           return;
         }

         // ✅ FIX: Properly route all role types (added reagent and hoadmin)
         if (userData.role === 'agent' || userData.isAgent === true || userData.role === 'reagent') {
            router.push('/dashboard/agent');
         } else if (userData.role === 'hoadmin') {
            router.push('/dashboard/hotel');
         } else {
            router.push('/');
         }
      }
    } catch (err: any) {
        console.error("Google Login Error:", err);
        // Ignore the error if the user simply closed the Google popup window
        if (err.code === 'auth/popup-closed-by-user') {
          setError('');
        } else {
          // Expose the actual Firebase error message to help with debugging
          setError(err.message || 'Failed to log in with Google.');
        }
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-8 overflow-hidden bg-black">
      
      {/* FULL BACKGROUND IMAGE */}
      <div className="absolute inset-0 z-0">
        <Image 
          src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2075&auto=format&fit=crop" 
          alt="GuriUp Premium Real Estate" 
          fill
          className="object-cover scale-105 animate-in zoom-in duration-1000"
          priority
        />
        {/* Sleek Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-black/50 bg-gradient-to-t from-black/90 via-black/40 to-black/80 backdrop-blur-[4px]"></div>
      </div>

      {/* CENTERED GLASSMORPHISM CARD */}
      <div className="w-full max-w-[460px] relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="bg-white/10 backdrop-blur-2xl border border-white/20 p-8 sm:p-10 rounded-[2.5rem] shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] overflow-hidden">
          
          {/* Subtle Top Glare */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>

          {/* HEADER INFO */}
          <div className="text-center mb-10">
            <h1 className="text-4xl font-black text-white tracking-tight mb-2 drop-shadow-md">GuriUp</h1>
            <p className="text-white/70 font-medium text-sm px-4">
              Access your dashboard to manage properties and exclusive listings.
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-2xl flex items-start gap-3 mb-6 animate-in zoom-in-95 backdrop-blur-md">
              <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={20} />
              <p className="text-sm font-medium text-red-200">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-xs font-bold text-white/70 uppercase tracking-widest pl-1">Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-white transition-colors" size={20} />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 font-medium text-white placeholder:text-white/30 outline-none focus:border-white/50 focus:bg-white/10 transition-all backdrop-blur-md"
                  placeholder="name@example.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center pl-1 pr-1">
                <label htmlFor="password" className="block text-xs font-bold text-white/70 uppercase tracking-widest">Password</label>
                <Link href="/forgot-password" className="text-xs font-semibold text-white/70 hover:text-white hover:underline transition-colors">
                  Forgot?
                </Link>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-white transition-colors" size={20} />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 font-medium text-white placeholder:text-white/30 outline-none focus:border-white/50 focus:bg-white/10 transition-all backdrop-blur-md"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-white hover:bg-slate-100 text-black py-4 rounded-2xl font-bold text-[15px] shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={20} className="animate-spin text-black" /> : 'Sign In'}
            </button>
          </form>

          <div className="relative flex items-center py-6">
            <div className="flex-grow border-t border-white/10"></div>
            <span className="flex-shrink mx-4 text-xs font-bold text-white/40 uppercase tracking-widest">Or</span>
            <div className="flex-grow border-t border-white/10"></div>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-black/30 border border-white/10 text-white hover:bg-white/10 hover:border-white/30 py-3.5 rounded-2xl font-semibold flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-70 backdrop-blur-md"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span>Continue with Google</span>
          </button>

          <p className="text-center text-white/60 mt-8 text-sm font-medium">
            New to GuriUp?{' '}
            <Link href="/signup" className="text-white font-bold hover:underline transition-all">
              Create an account
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}