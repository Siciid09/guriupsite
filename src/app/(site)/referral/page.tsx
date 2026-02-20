'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Smartphone, Gift, Flame, Target, 
  Copy, Share2, CheckCircle2, Info, ArrowLeft,
  Lock, Zap, Trophy, ShieldCheck, Phone, Send,
  Instagram, ChevronRight, Clock, Star, Medal,
  Wallet, TrendingUp, Users, LayoutDashboard,
  ArrowRight, Globe
} from 'lucide-react';
import { useRouter } from 'next/navigation';

// Firebase Imports
import { db, auth } from '../../lib/firebase';
import { 
  doc, onSnapshot, updateDoc, collection, 
  query, where, orderBy, limit 
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function ReferralSystem() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [origin, setOrigin] = useState('');

  // UI View States
  const [showRules, setShowRules] = useState(false);
  const [activeTab, setActiveTab] = useState<'valid' | 'pending'>('valid');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Get current domain for the link (e.g., https://guriup.com)
    setOrigin(typeof window !== 'undefined' ? window.location.origin : '');

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        // 1. Sync User Stats
        const unsubUser = onSnapshot(doc(db, "users", currentUser.uid), (doc) => {
          if (doc.exists()) setUserData(doc.data());
          setLoading(false);
        });

        // 2. Sync Leaderboard
        const qLeader = query(collection(db, "users"), orderBy("validReferralCount", "desc"), limit(10));
        const unsubLeader = onSnapshot(qLeader, (snap) => {
          setLeaderboard(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        // 3. Sync Referrals
        const qRefs = query(collection(db, "referrals"), where("referrerId", "==", currentUser.uid));
        const unsubRefs = onSnapshot(qRefs, (snap) => {
          setReferrals(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        return () => { unsubUser(); unsubLeader(); unsubRefs(); };
      } else {
        setUser(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const generateLink = async () => {
    if (!user) return;
    const randomCode = `GURIUP-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    await updateDoc(doc(db, "users", user.uid), {
      referralCode: randomCode,
      hasSeenGuide: true,
      validReferralCount: 0,
      streakCount: 0,
      rank: 0
    });
  };

  const fullReferralLink = userData?.referralCode 
    ? `${origin}/invites/${userData.referralCode}` 
    : '';

  const handleCopy = () => {
    if (!fullReferralLink) return;
    navigator.clipboard.writeText(fullReferralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <LoadingScreen />;

  // 1. Not Logged In -> Show Marketing Page
  if (!user) return <MarketingPage />;

  // 2. Logged In But No Code -> Show Guide/Onboarding
  if (!userData?.referralCode) return <GuideScreen onGenerate={generateLink} onHow={() => setShowRules(true)} />;

  // 3. Logged In & Has Code -> Show Dashboard (Or Rules Overlay)
  if (showRules) return <RulesScreen onClose={() => setShowRules(false)} />;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-24 pb-20 px-4 md:px-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Referral Hub</h1>
            <p className="text-slate-500 font-medium">Track your performance and rewards.</p>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="bg-white px-5 py-2.5 rounded-full shadow-sm border border-slate-200 flex items-center gap-2">
                <Trophy size={18} className="text-yellow-500" />
                <span className="font-bold text-slate-700 text-sm">Rank #{userData.rank || 'N/A'}</span>
             </div>
             <button onClick={() => setShowRules(true)} className="p-2.5 bg-white border border-slate-200 rounded-full text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all">
               <Info size={20} />
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* --- LEFT COLUMN: STATS & LINK --- */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* PROGRESS CARD */}
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/50 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
               
               <div className="relative z-10">
                 <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-4xl font-black text-slate-900 mb-1">{userData.validReferralCount || 0}</h2>
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Valid Referrals</p>
                    </div>
                    <div className="flex items-center gap-2 bg-orange-50 text-orange-600 px-3 py-1.5 rounded-lg border border-orange-100">
                      <Flame size={16} className="fill-orange-500" />
                      <span className="text-xs font-bold">{userData.streakCount || 0} Day Streak</span>
                    </div>
                 </div>

                 {/* Progress Bar */}
                 <div className="mb-2 flex justify-between text-xs font-bold text-slate-500">
                   <span>Progress to Top 10</span>
                   <span>{Math.min(((userData.validReferralCount || 0) / 10) * 100, 100).toFixed(0)}%</span>
                 </div>
                 <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden mb-6">
                   <div 
                     className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-1000" 
                     style={{ width: `${Math.min(((userData.validReferralCount || 0) / 10) * 100, 100)}%` }}
                   />
                 </div>

                 <div className="flex items-start gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <Target className="text-blue-600 shrink-0 mt-0.5" size={20} />
                    <p className="text-sm text-slate-600 font-medium">
                      You need <span className="text-slate-900 font-bold">{Math.max(10 - (userData.validReferralCount || 0), 0)} more referrals</span> to enter the leaderboard and unlock the <span className="text-green-600 font-bold">$500 Prize Pool</span>.
                    </p>
                 </div>
               </div>
            </div>

            {/* LINK GENERATOR */}
            <div className="bg-[#0F172A] rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
              <div className="relative z-10">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <Globe size={20} className="text-blue-400"/> Your Unique Invite Link
                </h3>

                <div className="flex flex-col md:flex-row gap-3">
                  <div className="flex-1 bg-white/10 border border-white/10 rounded-xl px-4 py-4 flex items-center justify-between group hover:bg-white/15 transition-colors">
                    <span className="font-mono text-sm text-blue-100 truncate pr-4">{fullReferralLink}</span>
                    <button onClick={handleCopy} className="text-white hover:text-blue-400 transition-colors">
                      {copied ? <CheckCircle2 size={20} className="text-green-400"/> : <Copy size={20}/>}
                    </button>
                  </div>
                  <button onClick={handleCopy} className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-4 rounded-xl transition-all shadow-lg shadow-blue-900/50">
                    {copied ? 'Copied!' : 'Copy Link'}
                  </button>
                </div>

                <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Share via</span>
                  <div className="flex gap-4">
                     <ShareIcon icon={<Phone size={18} />} />
                     <ShareIcon icon={<Instagram size={18} />} />
                     <ShareIcon icon={<Send size={18} />} />
                  </div>
                </div>
              </div>
            </div>

            {/* REFERRALS LIST */}
            <div>
              <div className="flex items-center justify-between mb-6">
                 <h3 className="text-xl font-bold text-slate-900">Referral History</h3>
                 <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm">
                    <button onClick={() => setActiveTab('valid')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'valid' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900'}`}>Valid</button>
                    <button onClick={() => setActiveTab('pending')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'pending' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900'}`}>Pending</button>
                 </div>
              </div>

              <div className="space-y-3">
                {referrals.filter(r => r.status === activeTab).length > 0 ? (
                  referrals.filter(r => r.status === activeTab).map((ref) => (
                    <div key={ref.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between hover:shadow-md transition-shadow">
                       <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activeTab === 'valid' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                             {activeTab === 'valid' ? <CheckCircle2 size={18} /> : <Clock size={18} />}
                          </div>
                          <div>
                             <h4 className="font-bold text-slate-900 text-sm">{ref.inviteeName || 'User'}</h4>
                             <p className="text-xs text-slate-500">{new Date(ref.createdAt?.toDate()).toLocaleDateString()}</p>
                          </div>
                       </div>
                       <span className={`text-xs font-bold px-3 py-1 rounded-full ${activeTab === 'valid' ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}`}>
                         {activeTab === 'valid' ? '+$50 Pending' : 'Waiting'}
                       </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
                    <p className="text-slate-400 text-sm font-medium">No {activeTab} referrals yet.</p>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* --- RIGHT COLUMN: LEADERBOARD --- */}
          <div className="lg:col-span-1">
             <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-slate-200/50 sticky top-24">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-slate-900">Top Performers</h3>
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">Live</span>
                </div>

                <div className="space-y-4 mb-6">
                   {leaderboard.slice(0, 3).map((l, i) => (
                      <div key={l.id} className={`flex items-center gap-4 p-3 rounded-2xl ${i === 0 ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-100' : 'bg-slate-50'}`}>
                         <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${i === 0 ? 'bg-yellow-400 text-white' : 'bg-white text-slate-500 shadow-sm'}`}>
                            {i + 1}
                         </div>
                         <div className="flex-1">
                            <p className="font-bold text-slate-900 text-sm">{l.name || 'Anonymous'}</p>
                            <p className="text-xs text-slate-500">{l.validReferralCount} Invites</p>
                         </div>
                         {i === 0 && <Trophy size={16} className="text-yellow-500" />}
                      </div>
                   ))}
                </div>

                <div className="border-t border-slate-100 pt-4">
                   {leaderboard.slice(3, 8).map((l, i) => (
                      <div key={l.id} className="flex items-center justify-between py-3 px-2 hover:bg-slate-50 rounded-lg transition-colors">
                         <div className="flex items-center gap-3">
                            <span className="text-slate-400 font-mono text-xs w-4">{i + 4}</span>
                            <span className="text-sm font-medium text-slate-700">{l.name}</span>
                         </div>
                         <span className="text-xs font-bold text-slate-900">{l.validReferralCount}</span>
                      </div>
                   ))}
                </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// =========================================================================
//  COMPONENT: Marketing Page (Not Logged In)
// =========================================================================
function MarketingPage() {
  const router = useRouter();

  return (
    <div className="bg-white min-h-screen font-sans text-slate-900">
      
      {/* HERO */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
         <div className="absolute top-0 inset-x-0 h-[60vh] bg-slate-50 -z-10 rounded-b-[4rem]"></div>
         <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider mb-8">
               <Sparkles size={14} /> GuriUp Partner Program
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1] mb-8">
              Turn Your Network <br/> Into <span className="text-blue-600">Net Worth.</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-500 font-medium max-w-2xl mx-auto mb-10 leading-relaxed">
              Join the GuriUp referral ecosystem. Earn real cash rewards for every friend who joins and verifies their account. No limits on earnings.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
               <button onClick={() => router.push('/login')} className="bg-slate-900 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20">
                 Start Earning Now
               </button>
               <button onClick={() => router.push('/about')} className="bg-white text-slate-900 border border-slate-200 px-8 py-4 rounded-full font-bold text-lg hover:bg-slate-50 transition-all">
                 Read Success Stories
               </button>
            </div>
         </div>
      </section>

      {/* 3 CORE BENEFITS */}
      <section className="py-20 px-6 max-w-6xl mx-auto">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <BenefitCard 
              icon={<Wallet className="text-green-600" size={32} />}
              title="Passive Income"
              desc="Earn $50 for every 10 valid referrals. Top performers earn monthly bonuses up to $700."
            />
            <BenefitCard 
              icon={<Users className="text-purple-600" size={32} />}
              title="Grow Your Network"
              desc="Connect with other top agents and property enthusiasts in our exclusive community."
            />
            <BenefitCard 
              icon={<Gift className="text-pink-600" size={32} />}
              title="Exclusive Rewards"
              desc="Unlock pro features, badges, and early access to new property listings."
            />
         </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 bg-slate-900 text-white rounded-[3rem] mx-4 mb-10 relative overflow-hidden">
         <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600 opacity-20 blur-[100px]"></div>
         <div className="max-w-4xl mx-auto px-6 relative z-10">
            <h2 className="text-3xl md:text-5xl font-black text-center mb-16">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
               <Step number="01" title="Get Your Link" desc="Sign up and generate your unique referral tracking link instantly." />
               <Step number="02" title="Invite Friends" desc="Share your link. Friends must verify phone & stay active for 4 days." />
               <Step number="03" title="Get Paid" desc="Track valid referrals on your dashboard and cash out directly." />
            </div>
            <div className="text-center mt-16">
               <button onClick={() => router.push('/login')} className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-5 rounded-2xl font-bold text-xl shadow-lg shadow-blue-600/40 transition-all">
                 Create Free Account
               </button>
            </div>
         </div>
      </section>
    </div>
  )
}

// =========================================================================
//  COMPONENT: Guide/Onboarding (Logged In, New User)
// =========================================================================
function GuideScreen({ onGenerate, onHow }: any) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white max-w-md w-full rounded-[2.5rem] p-10 shadow-2xl shadow-slate-200/50 text-center relative overflow-hidden">
        
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-purple-500"></div>

        <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
          <Sparkles size={40} />
        </div>

        <h1 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Welcome to <br/> Partner Program</h1>
        <p className="text-slate-500 font-medium mb-10 leading-relaxed">
          You are one step away from earning rewards. Generate your unique ID to start tracking your invites.
        </p>

        <div className="space-y-4">
          <button onClick={onGenerate} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-2 group">
             Activate My Account <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform"/>
          </button>
          <button onClick={onHow} className="text-slate-400 font-bold text-sm hover:text-slate-600 transition-colors">
             Read Terms & Conditions
          </button>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
//  COMPONENT: Rules Overlay
// =========================================================================
function RulesScreen({ onClose }: any) {
  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-6 py-20">
        <button onClick={onClose} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold mb-12 transition-colors">
          <ArrowLeft size={20} /> Back to Dashboard
        </button>

        <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-8">Fair Play Rules</h1>
        <p className="text-xl text-slate-500 font-medium mb-16">To ensure the integrity of the GuriUp ecosystem, we strictly enforce the following verification rules for all referrals.</p>

        <div className="space-y-12">
           <RuleItem 
             icon={<ShieldCheck className="text-green-600" size={28}/>}
             title="SMS Verification"
             desc="Every invited user must verify their phone number via OTP. Unverified accounts do not count towards your score."
           />
           <RuleItem 
             icon={<Flame className="text-orange-600" size={28}/>}
             title="4-Day Activity Streak"
             desc="Referrals remain 'Pending' until the new user opens the app for 4 separate days within their first week."
           />
           <RuleItem 
             icon={<Lock className="text-red-600" size={28}/>}
             title="No Self-Referrals"
             desc="Creating multiple accounts on the same device or IP address will result in an immediate ban from the partner program."
           />
        </div>

        <button onClick={onClose} className="mt-16 w-full bg-slate-100 text-slate-900 font-bold py-5 rounded-2xl hover:bg-slate-200 transition-colors">
          I Understand
        </button>
      </div>
    </div>
  );
}

// --- HELPER COMPONENTS ---

function LoadingScreen() {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-white">
      <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
      <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Loading Dashboard</p>
    </div>
  );
}

const ShareIcon = ({ icon }: any) => (
  <button className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white hover:text-slate-900 transition-all">
    {icon}
  </button>
);

const BenefitCard = ({ icon, title, desc }: any) => (
  <div className="bg-slate-50 p-8 rounded-[2rem] hover:bg-white hover:shadow-xl transition-all border border-slate-100 group">
     <div className="mb-6 bg-white w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">{icon}</div>
     <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
     <p className="text-slate-500 leading-relaxed font-medium">{desc}</p>
  </div>
);

const Step = ({ number, title, desc }: any) => (
  <div className="text-center md:text-left">
    <div className="text-5xl font-black text-blue-600/30 mb-4">{number}</div>
    <h3 className="text-2xl font-bold mb-3">{title}</h3>
    <p className="text-slate-400 font-medium leading-relaxed">{desc}</p>
  </div>
);

const RuleItem = ({ icon, title, desc }: any) => (
  <div className="flex gap-6">
    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center shrink-0 border border-slate-100">
      {icon}
    </div>
    <div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-500 leading-relaxed">{desc}</p>
    </div>
  </div>
);