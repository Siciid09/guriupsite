'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, db } from '../../lib/firebase'; // Adjust path as needed
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
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

        if (userData.isVerified !== true) {
          await auth.signOut();
          setError('Please verify your email before logging in.');
          setLoading(false);
          return;
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
      if (err.code === 'auth/invalid-credential') {
        setError('Invalid email or password.');
      } else if (err.code === 'auth/user-not-found') {
        setError('No user found with this email.');
      } else if (err.code === 'auth/wrong-password') {
         setError('Incorrect password.');
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
        // Create new user matching your exact database schema
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          name: user.displayName || 'Google User',
          phone: user.phoneNumber || '',
          photoUrl: user.photoURL || '',
          role: 'user', 
          isAgent: false,
          planTier: 'free',
          authMethod: 'google',
          createdAt: serverTimestamp(),
          isVerified: true, // Google emails are verified automatically
          activeDays: [],
          slug: ''
        });
        router.push('/');
      } else {
         const userData = userDoc.data();
         
         if (userData.isVerified !== true) {
           await auth.signOut();
           setError('Account disabled or unverified.');
           setLoading(false);
           return;
         }

         if (userData.role === 'agent' || userData.isAgent === true) {
            router.push('/dashboard/agent');
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
    <div className="min-h-screen flex bg-white pb-8">
      {/* LEFT SIDE */}
      <div className="hidden lg:block relative w-0 lg:w-1/2 bg-slate-900 overflow-hidden">
        <Image 
          src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop" 
          alt="Modern architecture" 
          fill
          className="object-cover opacity-50"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent"></div>
        <div className="absolute bottom-[380px] left-0 p-12 text-white z-10">
          <h2 className="text-4xl font-black tracking-tight mb-4">Welcome back to GuriUp.</h2>
          <p className="text-slate-200 text-lg max-w-md leading-relaxed">
            Sign in to manage your properties, connect with clients, and unlock exclusive real estate opportunities across the region.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-12 pt-24 lg:pt-12 animate-in fade-in slide-in-from-right-8 duration-500">
        <div className="w-full max-w-md space-y-8">
          
          <div className="text-center lg:text-left">
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-3">Sign in</h1>
            <p className="text-slate-500 font-medium">
              New to GuriUp?{' '}
              <Link href="/signup" className="text-blue-600 font-bold hover:underline transition-all">
                Create an account
              </Link>
            </p>
          </div>

          {error && (
            <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-xl flex items-start gap-3 animate-in zoom-in-95">
              <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={20} />
              <p className="text-sm font-bold text-rose-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-black text-slate-700 uppercase tracking-wider">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-transparent rounded-2xl py-3.5 pl-12 pr-4 font-bold text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:bg-white transition-all"
                  placeholder="name@example.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="block text-sm font-black text-slate-700 uppercase tracking-wider">Password</label>
                <Link href="/forgot-password" className="text-xs font-bold text-blue-600 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-transparent rounded-2xl py-3.5 pl-12 pr-4 font-bold text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:bg-white transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0065eb] hover:bg-[#0052c1] text-white py-4 rounded-2xl font-black text-[15px] tracking-wide shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : 'Sign In to Dashboard'}
            </button>
          </form>

          <div className="relative flex items-center py-4">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-4 text-sm font-bold text-slate-400 uppercase tracking-widest">Or continue with</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 py-3.5 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-70"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            <span>Sign in with Google</span>
          </button>

        </div>
      </div>
    </div>
  );
}