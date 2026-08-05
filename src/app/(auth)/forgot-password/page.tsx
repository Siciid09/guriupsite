'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, ArrowLeft, Loader2, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send reset email.');
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-8 overflow-hidden bg-black font-sans">
      {/* Background Image with Dark Glassmorphism Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2075&auto=format&fit=crop"
          alt="GuriUp Premium Real Estate"
          fill
          sizes="100vw"
          className="object-cover scale-105 animate-in zoom-in duration-1000"
          priority
        />
        <div className="absolute inset-0 bg-black/60 bg-gradient-to-t from-black/90 via-black/50 to-black/80 backdrop-blur-[4px]" />
      </div>

      {/* Main Glass Card */}
      <div className="w-full max-w-[460px] relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="bg-white/10 backdrop-blur-2xl border border-white/20 p-8 sm:p-10 rounded-[2.5rem] shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />

          {/* Top Brand & Icon */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-white/10 border border-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white shadow-inner backdrop-blur-md">
              <KeyRound size={28} />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight mb-2 drop-shadow-md">
              Reset Password
            </h1>
            <p className="text-white/70 font-medium text-xs px-2 leading-relaxed">
              Enter your registered email address and we'll send you instructions to reset your password.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-2xl flex items-start gap-3 mb-6 animate-in zoom-in-95 backdrop-blur-md">
              <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={18} />
              <p className="text-xs font-semibold text-red-200">{error}</p>
            </div>
          )}

          {/* Success State */}
          {submitted ? (
            <div className="text-center py-4 space-y-6 animate-in fade-in zoom-in duration-300">
              <div className="bg-emerald-500/20 border border-emerald-500/40 p-6 rounded-3xl backdrop-blur-md flex flex-col items-center gap-3">
                <CheckCircle2 size={40} className="text-emerald-400" />
                <h3 className="text-lg font-black text-white">Check Your Inbox</h3>
                <p className="text-xs text-white/80 font-medium leading-relaxed">
                  We've sent a password reset link to <br />
                  <span className="text-white font-bold underline">{email}</span>
                </p>
              </div>

              <button
                onClick={() => setSubmitted(false)}
                className="text-xs font-bold text-white/60 hover:text-white transition-colors"
              >
                Didn't receive the email? Try again
              </button>

              <Link
                href="/login"
                className="w-full bg-white hover:bg-slate-100 text-black py-4 rounded-2xl font-bold text-sm shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] transition-all flex items-center justify-center gap-2 block"
              >
                <ArrowLeft size={16} /> Return to Sign In
              </Link>
            </div>
          ) : (
            /* Request Form */
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="block text-[10px] font-black text-white/70 uppercase tracking-widest pl-1"
                >
                  Email Address
                </label>
                <div className="relative group">
                  <Mail
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-white transition-colors"
                    size={20}
                  />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 rounded-2xl py-4 pl-12 pr-4 font-bold text-sm text-white placeholder:text-white/30 outline-none focus:border-white/50 focus:bg-white/10 transition-all backdrop-blur-md"
                    placeholder="name@example.com"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white hover:bg-slate-100 text-black py-4 rounded-2xl font-black text-sm shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin text-black" />
                ) : (
                  'Send Reset Link'
                )}
              </button>

              <div className="pt-2 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-xs font-bold text-white/70 hover:text-white transition-colors"
                >
                  <ArrowLeft size={14} /> Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}