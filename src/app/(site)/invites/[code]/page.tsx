import React from 'react';
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
} from 'lucide-react';
import { db } from './../../../lib/firebase'; // Adjust to your actual path
import { collection, query, where, getDocs } from 'firebase/firestore';

// --- SERVER-SIDE DATA FETCHING ---
async function getReferrer(code: string) {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('referralCode', '==', code));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data();
    }
    return null;
  } catch (error) {
    console.error('Error fetching referrer:', error);
    return null;
  }
}

export default async function InvitePage({
  params,
}: {
  params: { code: string };
}) {
  const referrer = await getReferrer(params.code);
  const referrerName = referrer?.name || 'A friend';

  return (
    <div className="min-h-screen bg-[#FDFEFF] font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      {/* Referral tracking */}
      <ReferralTracker code={params.code} />

      {/* --- HERO SECTION --- */}
      <section className="relative pt-6 pb-6 md:pt-8 md:pb-10 overflow-hidden">
        {/* Background Accents */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
          <div className="absolute top-[-15%] right-[-10%] w-[600px] h-[600px] bg-blue-400/10 rounded-full blur-[140px]"></div>
          <div className="absolute bottom-[20%] left-[-15%] w-[500px] h-[500px] bg-indigo-400/10 rounded-full blur-[120px]"></div>
          <div className="absolute top-[10%] left-[10%] w-[300px] h-[300px] bg-orange-200/20 rounded-full blur-[100px]"></div>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-blue-600/5 border border-blue-600/10 text-blue-700 px-4 py-2 rounded-full mb-4 shadow-sm backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Sparkles size={14} className="animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">
              Verified Partner Invitation
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1] mb-3 text-slate-900">
            <span className="text-blue-600">{referrerName}</span> <br />
            Invited you to{' '}
            <span className="relative">
              GuriUp.
              <span className="absolute bottom-1 left-0 w-full h-2 bg-blue-600/10 -rotate-1 -z-10"></span>
            </span>
          </h1>

          <p className="text-sm md:text-base text-slate-500 font-medium mb-5 max-w-2xl mx-auto leading-relaxed">
            The Horn of Africa’s premier hospitality ecosystem. Join now using
            code{' '}
            <span className="font-mono font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              {params.code}
            </span>{' '}
            to unlock your $500 monthly reward potential.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link
              href="https://apps.apple.com/guriup"
              className="w-full sm:w-auto bg-slate-900 text-white px-8 py-3 rounded-[2.5rem] font-black flex items-center justify-center gap-3 hover:bg-blue-600 hover:scale-[1.02] transition-all shadow-2xl shadow-slate-900/20 active:scale-95"
            >
              <Smartphone size={18} /> App Store
            </Link>
            <Link
              href="https://play.google.com/store/guriup"
              className="w-full sm:w-auto bg-white text-slate-900 border border-slate-200 px-8 py-3 rounded-[2.5rem] font-black flex items-center justify-center gap-3 hover:bg-slate-50 hover:scale-[1.02] transition-all shadow-xl active:scale-95"
            >
              <Download size={18} /> Google Play
            </Link>
          </div>
        </div>
      </section>

      {/* --- REWARDS SECTION --- */}
      <section className="py-6 md:py-10 bg-white border-y border-slate-100 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-3">
                Real rewards for <br />{' '}
                <span className="text-blue-600">Real people.</span>
              </h2>

              <p className="text-slate-500 font-medium text-sm md:text-base leading-relaxed mb-5">
                Unlike other platforms, our referral system is automated,
                transparent, and built on trust. We reward active users who help
                grow our community.
              </p>

              <div className="space-y-2">
                <TrustBadge
                  icon={<CheckCircle className="text-green-500" />}
                  text="Automated Payouts via Mobile Money"
                />
                <TrustBadge
                  icon={<CheckCircle className="text-green-500" />}
                  text="Fraud-proof 4-Day Activity Streak"
                />
                <TrustBadge
                  icon={<CheckCircle className="text-green-500" />}
                  text="Verified Device Integrity Check"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <FeatureCard
                icon={<Trophy className="text-orange-500" />}
                title="$700"
                desc="Top monthly prize pool"
              />
              <FeatureCard
                icon={<Users className="text-blue-500" />}
                title="10k+"
                desc="Happy active travelers"
              />
              <FeatureCard
                icon={<ShieldCheck className="text-indigo-500" />}
                title="100%"
                desc="Verified secure hotels"
              />
              <FeatureCard
                icon={<Zap className="text-yellow-500" />}
                title="Instant"
                desc="Referral status tracking"
              />
            </div>
          </div>
        </div>
      </section>

      {/* --- HOW IT WORKS --- */}
      <section className="py-6 md:py-10 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-6 text-center mb-6 md:mb-8">
          <h2 className="text-2xl md:text-3xl font-black mb-2 tracking-tight">
            The Path to Your Prize
          </h2>
          <div className="w-16 h-1 bg-blue-600 mx-auto rounded-full"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-6">
          <JourneyStep
            num="01"
            title="Secure Setup"
            desc="Download the GuriUp app and complete phone verification. We use OTP to ensure every member is a real person."
          />
          <JourneyStep
            num="02"
            title="Active Streak"
            desc="Explore the Horn of Africa’s best stays for 4 consecutive days to verify your account activity status."
          />
          <JourneyStep
            num="03"
            title="Collect Cash"
            desc="Once verified, you enter the monthly leaderboard. Top 10 users earn between $50 and $500 monthly bonuses."
          />
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="py-6 md:py-10 bg-white border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="flex justify-center gap-8 mb-5 opacity-40">
            <LandmarkLogo />
            <CloudLogo />
            <ShieldLogo />
          </div>

          <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.3em] mb-2">
            Developed & Managed by
          </p>

          <div className="text-slate-900 font-black text-lg tracking-tighter">
            HIIGSI TECH.
          </div>
        </div>
      </footer>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function TrustBadge({ icon, text }: { icon: any; text: string }) {
  return (
    <div className="flex items-center gap-3 py-2 px-4 bg-white rounded-2xl border border-slate-100 shadow-sm w-fit hover:border-blue-200 transition-colors">
      {icon}
      <span className="font-bold text-slate-700 text-xs">{text}</span>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: any;
  title: string;
  desc: string;
}) {
  return (
    <div className="bg-white p-5 rounded-[1.75rem] border border-slate-100 shadow-lg shadow-slate-200/20 hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group">
      <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
        {icon}
      </div>
      <h3 className="text-2xl font-black mb-1">{title}</h3>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
        {desc}
      </p>
    </div>
  );
}

function JourneyStep({
  num,
  title,
  desc,
}: {
  num: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="text-left group">
      <div className="text-5xl md:text-6xl font-black text-slate-100 mb-3 group-hover:text-blue-50 transition-colors">
        {num}
      </div>
      <h3 className="text-xl font-black mb-2 text-slate-900 tracking-tight">
        {title}
      </h3>
      <p className="text-slate-500 text-sm font-medium leading-relaxed">
        {desc}
      </p>
    </div>
  );
}

function LandmarkLogo() {
  return <div className="font-black text-sm tracking-tighter">GURIUP.</div>;
}
function CloudLogo() {
  return (
    <div className="font-black text-sm tracking-tighter uppercase">
      CloudVerified
    </div>
  );
}
function ShieldLogo() {
  return (
    <div className="font-black text-sm tracking-tighter uppercase">
      SecureGate
    </div>
  );
}

/**
 * Saves referral code in background.
 */
function ReferralTracker({ code }: { code: string }) {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          localStorage.setItem('guriup_referral_code', '${code}');
          console.log('Tracking referral code: ${code}');
        `,
      }}
    />
  );
}
