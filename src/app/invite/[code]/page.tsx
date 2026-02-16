import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Sparkles, Download, CheckCircle, 
  ShieldCheck, ArrowRight, Star, 
  Smartphone, Gift
} from 'lucide-react';
import { db, auth } from '../../lib/firebase'; // Adjust this path to your firebase config
import { collection, query, where, getDocs } from 'firebase/firestore';

// --- SERVER-SIDE DATA FETCHING ---
async function getReferrer(code: string) {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("referralCode", "==", code));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data();
    }
    return null;
  } catch (error) {
    console.error("Error fetching referrer:", error);
    return null;
  }
}

export default async function InvitePage({ params }: { params: { code: string } }) {
  const referrer = await getReferrer(params.code);
  const referrerName = referrer?.name || "A friend";

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      {/* 1. PERSISTENCE LOGIC (Hidden Client Component) */}
      <ReferralTracker code={params.code} />

      {/* --- HERO SECTION --- */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-6xl">
          <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-50 rounded-full blur-[120px] opacity-60"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-orange-50 rounded-full blur-[100px] opacity-40"></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-600/10 text-blue-700 px-4 py-2 rounded-full mb-8 animate-bounce">
            <Sparkles size={16} />
            <span className="text-xs font-black uppercase tracking-widest">Special Invitation</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[1.1] mb-6">
            <span className="text-blue-600">{referrerName}</span> <br />
            Invited you to GuriUp!
          </h1>

          <p className="text-xl text-slate-500 font-medium mb-12 max-w-2xl mx-auto leading-relaxed">
            Join the Horn of Africa’s premier hospitality ecosystem. Use the code <span className="font-bold text-slate-900 px-2 py-1 bg-slate-100 rounded">{params.code}</span> to unlock your $500 reward potential.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              href="https://apps.apple.com/guriup" 
              className="w-full sm:w-auto bg-slate-900 text-white px-8 py-5 rounded-[2rem] font-black flex items-center justify-center gap-3 hover:bg-blue-600 transition-all shadow-xl hover:-translate-y-1"
            >
              <Smartphone size={20} /> App Store
            </Link>
            <Link 
              href="https://play.google.com/store/guriup" 
              className="w-full sm:w-auto bg-slate-900 text-white px-8 py-5 rounded-[2rem] font-black flex items-center justify-center gap-3 hover:bg-blue-600 transition-all shadow-xl hover:-translate-y-1"
            >
              <Download size={20} /> Google Play
            </Link>
          </div>
        </div>
      </section>

      {/* --- HOW IT WORKS (NO SCAM GUARANTEE) --- */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black mb-4 tracking-tight">How to Claim Your Reward</h2>
            <div className="w-20 h-1.5 bg-blue-600 mx-auto rounded-full"></div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <StepCard 
              num="01"
              icon={<Smartphone className="text-blue-600" />}
              title="Download & Sign Up"
              desc="Install GuriUp and verify your phone number to ensure a secure account."
            />
            <StepCard 
              num="02"
              icon={<Star className="text-orange-500" />}
              title="4-Day Activity Streak"
              desc="Explore properties and stay active for 4 consecutive days to verify your account."
            />
            <StepCard 
              num="03"
              icon={<Gift className="text-green-500" />}
              title="Win Cash Prizes"
              desc="Enter the Top 10 leaderboard and win up to $500 monthly cash rewards."
            />
          </div>
        </div>
      </section>

      {/* --- TRUST FOOTER --- */}
      <footer className="py-20 text-center">
        <div className="flex justify-center gap-8 mb-8">
          <div className="flex items-center gap-2 text-slate-400 font-bold text-sm">
            <ShieldCheck size={18} /> Verified Partners
          </div>
          <div className="flex items-center gap-2 text-slate-400 font-bold text-sm">
            <CheckCircle size={18} /> Secure Payments
          </div>
        </div>
        <p className="text-slate-400 text-xs font-medium">
          Powered by <span className="text-slate-900 font-bold">Hiigsi Tech</span>
        </p>
      </footer>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function StepCard({ num, icon, title, desc }: { num: string, icon: any, title: string, desc: string }) {
  return (
    <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-500 group">
      <div className="flex justify-between items-start mb-8">
        <div className="p-4 bg-slate-50 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors duration-500">
          {icon}
        </div>
        <span className="text-4xl font-black text-slate-100 group-hover:text-blue-50 transition-colors">{num}</span>
      </div>
      <h3 className="text-xl font-black mb-4">{title}</h3>
      <p className="text-slate-500 font-medium leading-relaxed">{desc}</p>
    </div>
  );
}

/**
 * This Client Component runs in the background to save the referral 
 * code in the browser. If the user decides to sign up via WEB instead 
 * of the app, we won't lose the referral data.
 */
function ReferralTracker({ code }: { code: string }) {
  return (
    <script dangerouslySetInnerHTML={{
      __html: `
        localStorage.setItem('guriup_referral_code', '${code}');
        console.log('Referral tracking active for code: ${code}');
      `
    }} />
  );
}