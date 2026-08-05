'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Gift, Target, 
  Copy, CheckCircle2, Info, ArrowLeft,
  Lock, ShieldCheck, Phone, Send,
  Wallet, Users, ArrowRight, Globe
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { db, auth } from '../../lib/firebase';
import { 
  doc, onSnapshot, updateDoc, collection, 
  query, where, orderBy
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function ReferralSystem() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [origin, setOrigin] = useState('');

  const [showRules, setShowRules] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setOrigin(typeof window !== 'undefined' ? window.location.origin : '');

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        const unsubUser = onSnapshot(doc(db, "users", currentUser.uid), (docSnap) => {
          if (docSnap.exists()) setUserData(docSnap.data());
          setLoading(false);
        });

        // Only fetch their own referrals now
        const qRefs = query(collection(db, "referrals"), where("referrerId", "==", currentUser.uid), orderBy("createdAt", "desc"));
        const unsubRefs = onSnapshot(qRefs, (snap) => {
          setReferrals(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        return () => { unsubUser(); unsubRefs(); };
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
      validReferralCount: 0
    });
  };

  const fullReferralLink = userData?.referralCode ? `${origin}/invites/${userData.referralCode}` : '';
  const validCount = userData?.validReferralCount || 0;

  const handleCopy = () => {
    if (!fullReferralLink) return;
    navigator.clipboard.writeText(fullReferralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareToWhatsApp = () => {
    const text = encodeURIComponent(`Join GuriUp using my invite link and unlock exclusive rewards! ${fullReferralLink}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const shareToTwitter = () => {
    const text = encodeURIComponent(`I'm using GuriUp to find the best properties! Join me using my VIP link: ${fullReferralLink}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  if (loading) return <LoadingScreen />;
  if (!user) return <MarketingPage router={router} />;
  if (!userData?.referralCode) return <GuideScreen onGenerate={generateLink} onHow={() => setShowRules(true)} />;
  if (showRules) return <RulesScreen onClose={() => setShowRules(false)} />;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-24 pb-20 px-4 md:px-8 font-sans">
      <div className="max-w-3xl mx-auto space-y-8">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Referral Hub</h1>
            <p className="text-slate-500 font-medium">Track your invites and unlock rewards.</p>
          </div>
          
          <div className="flex items-center gap-3">
             <button onClick={() => setShowRules(true)} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-full text-slate-600 hover:text-blue-600 hover:border-blue-200 transition-all font-bold text-sm shadow-sm">
               <Info size={18} /> Fair Play Rules
             </button>
          </div>
        </div>

        <div className="space-y-8">
          {/* STATS & PROGRESS CARD */}
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/50 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
             
             <div className="relative z-10">
               <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-5xl font-black text-slate-900 mb-2">{validCount}</h2>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Total Verified Invites</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                    <Sparkles size={24} className="text-blue-600" />
                  </div>
               </div>

               <div className="flex items-start gap-3 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <Target className="text-blue-600 shrink-0 mt-0.5" size={20} />
                  <p className="text-sm text-slate-600 font-medium leading-relaxed">
                    Keep inviting friends! Reach new milestones to unlock <span className="text-slate-900 font-bold">exclusive gifts</span> and <span className="text-green-600 font-bold">Cash Reward Tiers</span>. We track everything automatically behind the scenes.
                  </p>
               </div>
             </div>
          </div>

          {/* LINK SHARING CARD */}
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
                   <button onClick={shareToWhatsApp} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-[#25D366] transition-all"><Phone size={18} /></button>
                   <button onClick={shareToTwitter} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-[#1DA1F2] transition-all"><Send size={18} /></button>
                </div>
              </div>
            </div>
          </div>

          {/* REFERRAL HISTORY */}
          <div>
            <div className="flex items-center justify-between mb-6">
               <h3 className="text-xl font-bold text-slate-900">Your Network History</h3>
            </div>

            <div className="space-y-3">
              {referrals.length > 0 ? (
                referrals.map((ref) => (
                  <div key={ref.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between hover:shadow-md transition-shadow">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-100 text-green-600">
                           <CheckCircle2 size={18} />
                        </div>
                        <div>
                           <h4 className="font-bold text-slate-900 text-sm">{ref.inviteeName || 'New User'}</h4>
                           <p className="text-xs text-slate-500">{ref.createdAt?.toDate ? ref.createdAt.toDate().toLocaleDateString() : 'Recent Invite'}</p>
                        </div>
                     </div>
                     <span className="text-xs font-bold px-3 py-1 rounded-full bg-green-50 text-green-700">
                       Verified
                     </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                     <Users size={24} className="text-slate-300" />
                  </div>
                  <p className="text-slate-500 text-sm font-bold">No invites yet.</p>
                  <p className="text-slate-400 text-xs mt-1">Share your link to start building your network!</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function MarketingPage({ router }: { router: any }) {
  return (
    <div className="bg-white min-h-screen font-sans text-slate-900">
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
              Join the exclusive GuriUp referral ecosystem. Unlock mystery gifts, premium app features, and high-tier cash rewards as your network grows.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
               <button onClick={() => router.push('/login')} className="bg-slate-900 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20">
                 Start Earning Now
               </button>
            </div>
         </div>
      </section>

      <section className="py-20 px-6 max-w-6xl mx-auto">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <BenefitCard icon={<Wallet className="text-green-600" size={32} />} title="Milestone Rewards" desc="Hit invite targets to unlock massive cash tiers. The more you share, the higher the tier." />
            <BenefitCard icon={<Users className="text-purple-600" size={32} />} title="Grow Your Network" desc="Connect with other top agents and property enthusiasts in our exclusive community." />
            <BenefitCard icon={<Gift className="text-pink-600" size={32} />} title="Exclusive Gifts" desc="Unlock pro features, badges, and early access to new property listings as a top referrer." />
         </div>
      </section>

      <section className="py-20 bg-slate-900 text-white rounded-[3rem] mx-4 mb-10 relative overflow-hidden">
         <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600 opacity-20 blur-[100px]"></div>
         <div className="max-w-4xl mx-auto px-6 relative z-10">
            <h2 className="text-3xl md:text-5xl font-black text-center mb-16">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
               <Step number="01" title="Get Your Link" desc="Sign up and generate your unique referral tracking link instantly." />
               <Step number="02" title="Invite Friends" desc="Share your link. Friends must sign up and verify their phone number." />
               <Step number="03" title="Unlock Tiers" desc="Watch your verified invites grow and unlock hidden reward tiers." />
            </div>
         </div>
      </section>
    </div>
  )
}

function GuideScreen({ onGenerate, onHow }: { onGenerate: () => void, onHow: () => void }) {
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
             Read Fair Play Rules
          </button>
        </div>
      </div>
    </div>
  );
}

function RulesScreen({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-6 py-20">
        <button onClick={onClose} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold mb-12 transition-colors">
          <ArrowLeft size={20} /> Back to Dashboard
        </button>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-8">Fair Play Rules</h1>
        <p className="text-xl text-slate-500 font-medium mb-16">To ensure the integrity of the GuriUp ecosystem, we strictly enforce the following verification rules for all referrals.</p>
        <div className="space-y-12">
           <RuleItem icon={<ShieldCheck className="text-green-600" size={28}/>} title="SMS Verification" desc="Every invited user must verify their phone number via OTP to create a legitimate account. Unverified/fake accounts do not count." />
           <RuleItem icon={<Lock className="text-red-600" size={28}/>} title="No Self-Referrals" desc="Creating multiple accounts on the same device or using fake credentials will result in an immediate ban and forfeiture of rewards." />
        </div>
        <button onClick={onClose} className="mt-16 w-full bg-slate-100 text-slate-900 font-bold py-5 rounded-2xl hover:bg-slate-200 transition-colors">
          I Understand
        </button>
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-white">
      <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
      <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Loading Dashboard</p>
    </div>
  );
}

const BenefitCard = ({ icon, title, desc }: { icon: any, title: string, desc: string }) => (
  <div className="bg-slate-50 p-8 rounded-[2rem] hover:bg-white hover:shadow-xl transition-all border border-slate-100 group">
     <div className="mb-6 bg-white w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">{icon}</div>
     <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
     <p className="text-slate-500 leading-relaxed font-medium">{desc}</p>
  </div>
);

const Step = ({ number, title, desc }: { number: string, title: string, desc: string }) => (
  <div className="text-center md:text-left">
    <div className="text-5xl font-black text-blue-600/30 mb-4">{number}</div>
    <h3 className="text-2xl font-bold mb-3">{title}</h3>
    <p className="text-slate-400 font-medium leading-relaxed">{desc}</p>
  </div>
);

const RuleItem = ({ icon, title, desc }: { icon: any, title: string, desc: string }) => (
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