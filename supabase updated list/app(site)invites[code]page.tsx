'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Download,
  CheckCircle,
  ShieldCheck,
  Smartphone,
  Zap,
  Users,
  Trophy,
  ArrowRight,
  Gift
} from 'lucide-react';
import { db } from './../../../lib/firebase'; // Adjust to your actual path
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function InvitePage({
  params,
}: {
  params: { code: string };
}) {
  const [referrerName, setReferrerName] = useState('A friend');

  // --- FETCH REFERRER & SET LOCAL STORAGE ---
  useEffect(() => {
    // 1. Save code to localStorage for web-based tracking fallback
    if (typeof window !== 'undefined') {
      localStorage.setItem('guriup_referral_code', params.code);
      console.log('Tracking referral code:', params.code);
    }

    // 2. Fetch the name of the person who invited them
    const fetchReferrer = async () => {
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('referralCode', '==', params.code));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const data = querySnapshot.docs[0].data();
          if (data.name) setReferrerName(data.name);
        }
      } catch (error) {
        console.error('Error fetching referrer:', error);
      }
    };

    fetchReferrer();
  }, [params.code]);

  // --- SMART CLIPBOARD BUTTON HANDLERS ---
  
  const handleGooglePlayClick = () => {
    // 1. Secretly copy the formatted code to the phone's clipboard
    navigator.clipboard.writeText(`GURIUP_REF:${params.code}`).catch(() => {
      console.log("Clipboard permission denied, but continuing to app store.");
    });
    
    // 2. Redirect to your working playstore link
    window.location.href = "https://apps.hiigsitech.com";
  };

  const handleAppStoreClick = () => {
    // Show the "Coming Soon" popup for iOS users
    alert("Sorry, we are coming soon to the App Store!");
  };

  return (
    <div className="min-h-screen bg-[#FAFCFF] font-sans text-slate-900 selection:bg-blue-200 selection:text-blue-900 overflow-x-hidden">
      
      {/* --- HERO SECTION --- */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden flex flex-col items-center justify-center min-h-[85vh]">
        {/* Modern Grid & Glow Background */}
        <div className="absolute inset-0 -z-10 h-full w-full bg-[#FAFCFF] bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute left-1/2 top-0 -z-10 -translate-x-1/2 w-[800px] h-[400px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute right-0 top-1/4 -z-10 w-[400px] h-[400px] bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center animate-in slide-in-from-bottom-8 duration-1000 fade-in">
          {/* VIP Badge */}
          <div className="inline-flex items-center gap-2 bg-white/60 border border-slate-200/60 text-blue-600 px-5 py-2.5 rounded-full mb-8 shadow-sm backdrop-blur-md">
            <Sparkles size={16} className="animate-pulse text-blue-500" />
            <span className="text-[11px] font-black uppercase tracking-[0.25em]">
              VIP Partner Invitation
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl lg:text-[5rem] font-black tracking-tighter leading-[1.05] mb-6 text-slate-900">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600">
              {referrerName}
            </span> <br />
            invited you to GuriUp.
          </h1>

          <p className="text-base md:text-xl text-slate-500 font-medium mb-10 max-w-2xl mx-auto leading-relaxed">
            The Horn of Africa’s premier hospitality ecosystem. Join today using code{' '}
            <span className="font-mono font-black text-slate-800 bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-sm inline-flex items-center gap-2 mx-1 translate-y-[-2px]">
              <Gift size={16} className="text-indigo-500"/> {params.code}
            </span>{' '}
            to unlock your <strong className="text-slate-900">$500 monthly reward</strong> potential.
          </p>

          {/* CTAs (Updated with Smart Trackers) */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={handleAppStoreClick}
              className="w-full sm:w-auto bg-slate-900 text-white px-8 py-4 rounded-[2rem] font-bold flex items-center justify-center gap-3 hover:bg-slate-800 hover:scale-105 transition-all shadow-xl shadow-slate-900/20 active:scale-95 group"
            >
              <Smartphone size={20} className="group-hover:-translate-y-0.5 transition-transform" /> 
              <span>Download on App Store</span>
            </button>
            <button
              onClick={handleGooglePlayClick}
              className="w-full sm:w-auto bg-white text-slate-900 border border-slate-200 px-8 py-4 rounded-[2rem] font-bold flex items-center justify-center gap-3 hover:bg-slate-50 hover:scale-105 transition-all shadow-lg shadow-slate-200/20 active:scale-95 group"
            >
              <Download size={20} className="text-blue-600 group-hover:-translate-y-0.5 transition-transform" /> 
              <span>Get it on Google Play</span>
            </button>
          </div>
        </div>
      </section>

      {/* --- REWARDS SECTION (Dark Premium Mode) --- */}
      <section className="relative -mt-10 mx-2 md:mx-6 lg:mx-auto max-w-7xl">
        <div className="bg-[#0B1120] rounded-[2.5rem] md:rounded-[4rem] p-8 md:p-16 lg:p-20 relative overflow-hidden shadow-2xl shadow-blue-900/20">
          
          {/* Abstract Dark Background Elements */}
          <div className="absolute top-0 right-0 w-full h-full overflow-hidden pointer-events-none rounded-[4rem]">
            <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] bg-indigo-600/20 rounded-full blur-[100px]"></div>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
          </div>

          <div className="relative z-10 grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-6 text-white leading-tight">
                Real rewards. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">For real people.</span>
              </h2>

              <p className="text-slate-400 font-medium text-lg leading-relaxed mb-10">
                Unlike other platforms, our referral system is automated,
                transparent, and built on trust. We financially reward active users who help
                grow our verified community.
              </p>

              <div className="space-y-4">
                <DarkTrustBadge icon={<CheckCircle className="text-emerald-400" size={20} />} text="Automated Payouts via Mobile Money" />
                <DarkTrustBadge icon={<CheckCircle className="text-emerald-400" size={20} />} text="Fraud-proof 4-Day Activity Streak" />
                <DarkTrustBadge icon={<CheckCircle className="text-emerald-400" size={20} />} text="Verified Device Integrity Check" />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <DarkFeatureCard icon={<Trophy className="text-amber-400" />} title="$700" desc="Monthly Prize Pool" />
              <DarkFeatureCard icon={<Users className="text-blue-400" />} title="10k+" desc="Active Travelers" />
              <DarkFeatureCard icon={<ShieldCheck className="text-emerald-400" />} title="100%" desc="Verified Stays" />
              <DarkFeatureCard icon={<Zap className="text-indigo-400" />} title="Instant" desc="Status Tracking" />
            </div>
          </div>
        </div>
      </section>

      {/* --- HOW IT WORKS (Bento Box Style) --- */}
      <section className="py-24 md:py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tighter text-slate-900">
              The Path to Your Prize
            </h2>
            <p className="text-slate-500 font-medium">Three simple steps to unlock your earning potential.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <BentoStepCard 
              num="01" 
              title="Secure Setup" 
              desc="Download the GuriUp app and complete phone verification. We use OTP to ensure every member is a real person."
            />
            <BentoStepCard 
              num="02" 
              title="Active Streak" 
              desc="Explore the Horn of Africa’s best stays for 4 consecutive days to verify your account activity status."
              highlight={false}
            />
            <BentoStepCard 
              num="03" 
              title="Collect Cash" 
              desc="Once verified, you enter the monthly leaderboard. Top 10 users earn between $50 and $500 monthly bonuses."
              highlight={true}
            />
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="py-12 bg-white border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="flex justify-center items-center gap-8 mb-8 opacity-30 grayscale hover:grayscale-0 transition-all duration-500">
            <LandmarkLogo />
            <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
            <CloudLogo />
            <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
            <ShieldLogo />
          </div>

          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mb-3">
            Developed & Managed by
          </p>

          <div className="text-slate-900 font-black text-xl tracking-tighter flex items-center justify-center gap-2">
            HIIGSI TECH <span className="w-2 h-2 rounded-full bg-blue-600"></span>
          </div>
        </div>
      </footer>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function DarkTrustBadge({ icon, text }: { icon: any; text: string }) {
  return (
    <div className="flex items-center gap-4 py-3 px-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl backdrop-blur-md transition-colors w-fit group cursor-default">
      <div className="bg-white/10 p-1.5 rounded-full group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <span className="font-bold text-slate-200 text-sm tracking-wide">{text}</span>
    </div>
  );
}

function DarkFeatureCard({ icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="bg-white/5 border border-white/10 backdrop-blur-md p-6 rounded-[2rem] hover:bg-white/10 hover:-translate-y-1 transition-all duration-300 group">
      <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-white/20 transition-all">
        {icon}
      </div>
      <h3 className="text-3xl font-black mb-1 text-white">{title}</h3>
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
        {desc}
      </p>
    </div>
  );
}

function BentoStepCard({ num, title, desc, highlight = false }: { num: string; title: string; desc: string, highlight?: boolean }) {
  return (
    <div className={`p-8 rounded-[2rem] relative overflow-hidden group transition-all duration-500 hover:-translate-y-2 ${highlight ? 'bg-[#0065eb] text-white shadow-xl shadow-blue-500/20' : 'bg-white border border-slate-100 shadow-lg shadow-slate-200/20'}`}>
      
      {/* Background Number Watermark */}
      <div className={`absolute -right-4 -bottom-4 text-9xl font-black opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-700 ${highlight ? 'text-black opacity-10' : 'text-slate-900'}`}>
        {num}
      </div>

      <div className="relative z-10">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg mb-6 shadow-sm ${highlight ? 'bg-white text-blue-600' : 'bg-slate-50 text-slate-900 border border-slate-100'}`}>
          {num}
        </div>
        <h3 className={`text-2xl font-black mb-3 tracking-tight ${highlight ? 'text-white' : 'text-slate-900'}`}>
          {title}
        </h3>
        <p className={`font-medium leading-relaxed ${highlight ? 'text-blue-100' : 'text-slate-500'}`}>
          {desc}
        </p>

        <div className={`mt-6 inline-flex items-center gap-2 text-sm font-bold opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 ${highlight ? 'text-white' : 'text-blue-600'}`}>
          Next Step <ArrowRight size={16} />
        </div>
      </div>
    </div>
  );
}

function LandmarkLogo() {
  return <div className="font-black text-sm tracking-tighter flex items-center gap-1"><Building /> GURIUP.</div>;
}
function CloudLogo() {
  return <div className="font-black text-xs tracking-widest uppercase">CloudVerified</div>;
}
function ShieldLogo() {
  return <div className="font-black text-xs tracking-widest uppercase">SecureGate</div>;
}
function Building(props: any) {
  // Fallback simple SVG
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path><path d="M8 6h.01"></path><path d="M16 6h.01"></path><path d="M12 6h.01"></path><path d="M12 10h.01"></path><path d="M12 14h.01"></path><path d="M16 10h.01"></path><path d="M16 14h.01"></path><path d="M8 10h.01"></path><path d="M8 14h.01"></path></svg>
  );
}