'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Smartphone, Gift, Flame, Target, 
  Copy, Share2, CheckCircle2, Info, ArrowLeft,
  Lock, Zap, Trophy, ShieldCheck, Phone, Send,
  Instagram, ChevronRight, Clock, Star, Medal,
  Wallet, TrendingUp, Users, LayoutDashboard
} from 'lucide-react';

// Firebase Imports
import { db, auth } from '../../lib/firebase';
import { 
  doc, onSnapshot, updateDoc, collection, 
  query, where, orderBy, limit 
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function ReferralSystem() {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // UI View States
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [activeTab, setActiveTab] = useState<'valid' | 'pending' | 'rejected'>('valid');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        // 1. Sync User Stats (Rank, Streak, Code)
        const unsubUser = onSnapshot(doc(db, "users", currentUser.uid), (doc) => {
          if (doc.exists()) setUserData(doc.data());
          setLoading(false);
        });

        // 2. Sync Leaderboard (Top 10)
        const qLeader = query(collection(db, "users"), orderBy("validReferralCount", "desc"), limit(10));
        const unsubLeader = onSnapshot(qLeader, (snap) => {
          setLeaderboard(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        // 3. Sync User Referrals
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

  const handleCopy = () => {
    if (!userData?.referralCode) return;
    navigator.clipboard.writeText(userData.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <LoadingScreen />;
  if (!user) return <AuthScreen />;
  if (showHowItWorks) return <RulesScreen onClose={() => setShowHowItWorks(false)} />;
  if (!userData?.referralCode) return <GuideScreen onGenerate={generateLink} onHow={() => setShowHowItWorks(true)} />;

  return (
    <div className="min-h-screen bg-[#F1F5F9] pt-24 pb-20 px-4 md:px-6">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* --- DYNAMIC HEADER --- */}
        <div className="flex justify-between items-center px-2">
           <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white rounded-2xl shadow-xl shadow-slate-200 flex items-center justify-center border border-white">
                 <Medal className="text-blue-600" size={28} />
              </div>
              <div>
                 <h1 className="text-2xl font-black text-slate-900 tracking-tighter leading-none">Rank #{userData.rank || '---'}</h1>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">{userData.validReferralCount || 0} Valid Referrals</p>
              </div>
           </div>
           <button onClick={() => setShowHowItWorks(true)} className="p-3 bg-white rounded-full text-slate-400 hover:text-blue-600 shadow-md border border-white transition-all">
              <Info size={22} />
           </button>
        </div>

        {/* --- MAIN DASHBOARD CARD --- */}
        <div className="bg-white rounded-[3rem] p-8 shadow-2xl shadow-slate-200 border border-white relative overflow-hidden">
           <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-2xl border border-orange-200">
                 <Flame size={18} className="fill-orange-500" />
                 <span className="text-xs font-black uppercase">{userData.streakCount || 0} Day Streak</span>
              </div>
              <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-2xl border border-blue-100 flex items-center gap-2">
                 <Trophy size={14} />
                 <span className="text-[10px] font-black uppercase">Top 100</span>
              </div>
           </div>

           <div className="flex justify-between mb-3 text-[10px] font-black uppercase text-slate-400 px-1">
              <span>Start</span>
              <span className="text-blue-600">Goal: Top 10</span>
           </div>
           <div className="h-4 w-full bg-slate-100 rounded-full p-0.5 mb-8">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-blue-700 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(37,99,235,0.4)]" 
                style={{ width: `${Math.min(((userData.validReferralCount || 0) / 10) * 100, 100)}%` }}
              />
           </div>

           <div className="flex items-center gap-4 bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                <Target size={24} />
              </div>
              <p className="text-sm font-bold text-slate-700 leading-tight">
                You need <span className="text-blue-600">{Math.max(10 - (userData.validReferralCount || 0), 0)} more referrals</span> <br/>
                <span className="text-slate-400 text-xs font-medium">to enter the Top 10 and unlock your $50+ reward.</span>
              </p>
           </div>
        </div>

        {/* --- THE PRO INVITE CARD (DARK CONTRAST) --- */}
        <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl">
           <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600 opacity-20 blur-[90px]"></div>
           <div className="relative z-10">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-blue-400 mb-8 text-center">Your Unique Referral Code</h3>
              
              <div className="flex items-center justify-between gap-4 bg-white/5 border border-white/10 p-5 rounded-3xl mb-10 group">
                 <span className="text-2xl md:text-3xl font-black font-mono tracking-[0.4em] pl-4">{userData.referralCode}</span>
                 <button onClick={handleCopy} className="p-4 bg-white text-slate-900 rounded-2xl hover:scale-105 transition-all active:scale-90 shadow-xl">
                    {copied ? <CheckCircle2 size={24} className="text-green-600" /> : <Copy size={24} />}
                 </button>
              </div>

              <div className="grid grid-cols-4 gap-4">
                 <ShareBtn color="bg-[#25D366]" icon={<Phone />} label="WhatsApp" />
                 <ShareBtn color="bg-[#E1306C]" icon={<Instagram />} label="Instagram" />
                 <ShareBtn color="bg-[#0088cc]" icon={<Send />} label="Telegram" />
                 <ShareBtn color="bg-slate-700" icon={<Share2 />} label="More" />
              </div>
           </div>
        </div>

        {/* --- LIVE LEADERBOARD (PODIUMS) --- */}
        <div className="pt-10">
           <div className="flex justify-between items-center mb-8 px-2">
              <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Live Leaderboard</h3>
              <div className="flex items-center gap-2 text-blue-600 text-xs font-black uppercase tracking-widest">
                 <Clock size={14} /> Resets in 12d
              </div>
           </div>
           
           <div className="grid grid-cols-3 gap-3 mb-12 items-end">
              <PodiumItem rank={2} name={leaderboard[1]?.name} count={leaderboard[1]?.validReferralCount} prize="$500" h="h-32" />
              <PodiumItem rank={1} name={leaderboard[0]?.name} count={leaderboard[0]?.validReferralCount} prize="$700" h="h-48" first />
              <PodiumItem rank={3} name={leaderboard[2]?.name} count={leaderboard[2]?.validReferralCount} prize="$300" h="h-28" />
           </div>

           <div className="bg-white rounded-[2.5rem] border border-white overflow-hidden shadow-2xl shadow-slate-200">
              {leaderboard.slice(3, 6).map((l, i) => (
                 <div key={l.id} className="flex items-center justify-between p-6 border-b border-slate-50 last:border-0">
                    <div className="flex items-center gap-5">
                       <span className="text-slate-300 font-black text-xl w-6 text-center">{i + 4}</span>
                       <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-black text-slate-400 border border-white">{l.name?.[0]}</div>
                       <span className="font-bold text-slate-800">{l.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                       <span className="text-xs font-black text-slate-400">{l.validReferralCount} Refs</span>
                       <span className="bg-purple-50 text-purple-600 text-[9px] font-black px-2 py-1 rounded uppercase">Gift Available</span>
                    </div>
                 </div>
              ))}
              <div className="p-5 text-center bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">View Full Leaderboard</div>
           </div>
        </div>

        {/* --- MY REFERRALS LIST --- */}
        <div className="pt-10">
           <h3 className="text-xl font-black text-slate-900 mb-6 px-2">Manage Referrals</h3>
           <div className="flex p-1.5 bg-white border border-white rounded-[2rem] shadow-xl shadow-slate-200 mb-6">
              {['valid', 'pending', 'rejected'].map((t: any) => (
                 <button key={t} onClick={() => setActiveTab(t)} className={`flex-1 py-3.5 text-[10px] font-black uppercase rounded-[1.5rem] transition-all ${activeTab === t ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}>
                    {t}
                 </button>
              ))}
           </div>
           
           <div className="space-y-4">
              {referrals.filter(r => r.status === activeTab).length > 0 ? (
                referrals.filter(r => r.status === activeTab).map((ref) => (
                  <div key={ref.id} className="bg-white p-6 rounded-[2.5rem] border border-white flex items-center justify-between shadow-lg shadow-slate-200/50">
                     <div className="flex items-center gap-5">
                        <div className={`w-14 h-14 rounded-[1.25rem] flex items-center justify-center ${activeTab === 'valid' ? 'bg-green-500 text-white shadow-xl shadow-green-200' : 'bg-slate-100 text-slate-400'}`}>
                           {activeTab === 'valid' ? <CheckCircle2 size={24} /> : <Clock size={24} />}
                        </div>
                        <div>
                           <h4 className="font-black text-slate-800 text-lg">{ref.inviteeName || 'GuriUp User'}</h4>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{activeTab === 'valid' ? 'Active Partner' : 'Waiting for 4-day streak'}</p>
                        </div>
                     </div>
                     <span className="text-[10px] font-black text-slate-300 uppercase">{ref.createdAt?.toDate().toLocaleDateString() || 'Recent'}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-16 text-slate-300 text-sm font-bold bg-white rounded-[2.5rem] border border-dashed border-slate-200 uppercase tracking-widest shadow-inner">Empty Status</div>
              )}
           </div>
        </div>

      </div>
    </div>
  );
}

// --- VISUAL LAYERS ---

function LoadingScreen() {
  return (
    <div className="h-screen flex items-center justify-center bg-slate-900">
      <div className="flex flex-col items-center gap-6">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin shadow-2xl shadow-blue-500/50"></div>
        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-400">Loading GuriUp</span>
      </div>
    </div>
  );
}

function AuthScreen() {
  return (
    <div className="h-screen flex flex-col items-center justify-center p-8 bg-slate-50 text-center">
      <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center mb-10 text-slate-200 shadow-2xl border border-white"><Lock size={40} /></div>
      <h1 className="text-4xl font-black mb-4 tracking-tighter">Pro Access Only</h1>
      <p className="text-slate-400 font-medium mb-12 max-w-xs leading-relaxed">Sign in to your GuriUp account to access your referral dashboard and rewards.</p>
      <button className="bg-slate-900 text-white px-12 py-5 rounded-[2rem] font-black shadow-2xl shadow-slate-900/20 active:scale-95 transition-all">Go to Login</button>
    </div>
  );
}

function GuideScreen({ onGenerate, onHow }: any) {
  return (
    <div className="min-h-screen bg-white pt-28 pb-12 px-8 flex flex-col items-center text-center">
      <div className="w-24 h-24 bg-blue-600 text-white rounded-[2.5rem] flex items-center justify-center mb-12 shadow-[0_20px_50px_rgba(37,99,235,0.4)] animate-bounce"><Gift size={48}/></div>
      <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.85] mb-8">Win <br/><span className="text-blue-600">Free Cash.</span></h1>
      <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.4em] mb-16">The GuriUp Partner Program</p>
      
      <div className="grid gap-8 max-w-sm w-full mb-20 text-left">
         <div className="flex gap-5 items-center">
            <div className="w-16 h-16 bg-slate-50 rounded-[1.5rem] flex items-center justify-center border border-slate-100"><Zap className="text-orange-500" /></div>
            <div><h4 className="font-black text-lg">Unique Link</h4><p className="text-xs font-bold text-slate-400">Generate your tracking code.</p></div>
         </div>
         <div className="flex gap-5 items-center">
            <div className="w-16 h-16 bg-slate-50 rounded-[1.5rem] flex items-center justify-center border border-slate-100"><Smartphone className="text-blue-600" /></div>
            <div><h4 className="font-black text-lg">Invite Friends</h4><p className="text-xs font-bold text-slate-400">Share via WhatsApp or Instagram.</p></div>
         </div>
         <div className="flex gap-5 items-center">
            <div className="w-16 h-16 bg-slate-50 rounded-[1.5rem] flex items-center justify-center border border-slate-100"><Trophy className="text-yellow-500" /></div>
            <div><h4 className="font-black text-lg">Claim Prizes</h4><p className="text-xs font-bold text-slate-400">Win cash for valid referrals.</p></div>
         </div>
      </div>

      <div className="w-full max-w-sm space-y-6">
         <button onClick={onGenerate} className="w-full bg-slate-900 text-white py-7 rounded-[2.5rem] font-black text-xl shadow-2xl hover:bg-blue-600 transition-all active:scale-95">Generate My Code</button>
         <button onClick={onHow} className="text-slate-400 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:text-slate-900"><Info size={16}/> View System Rules</button>
      </div>
    </div>
  );
}

function RulesScreen({ onClose }: any) {
  return (
    <div className="min-h-screen bg-white pt-24 pb-12 px-8 overflow-y-auto">
      <div className="max-w-xl mx-auto">
        <button onClick={onClose} className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest mb-16 hover:text-slate-900"><ArrowLeft size={16}/> Dashboard</button>
        <h1 className="text-5xl font-black mb-6 tracking-tighter">The System.</h1>
        <p className="text-slate-500 font-medium mb-16 leading-relaxed text-lg">GuriUp is a trusted ecosystem. To keep it fair, our rewards are only for valid, real activity.</p>
        
        <div className="space-y-16">
           <div className="flex gap-8">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-[2rem] flex items-center justify-center flex-shrink-0 border border-blue-100"><ShieldCheck size={28}/></div>
              <div><h4 className="font-black text-xl mb-2">Phone Verification</h4><p className="text-slate-500 font-medium leading-relaxed">Every person you invite must verify their account via SMS to prevent bots.</p></div>
           </div>
           <div className="flex gap-8">
              <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-[2rem] flex items-center justify-center flex-shrink-0 border border-orange-100"><Flame size={28}/></div>
              <div><h4 className="font-black text-xl mb-2">4-Day Active Streak</h4><p className="text-slate-500 font-medium leading-relaxed">A referral is only 'Valid' if the user opens and uses the app for 4 days within their first week.</p></div>
           </div>
        </div>
      </div>
    </div>
  );
}

// --- ATOMS ---

const ShareBtn = ({ color, icon, label }: any) => (
  <div className="flex flex-col items-center gap-3 group cursor-pointer">
    <div className={`w-14 h-14 ${color} rounded-[1.5rem] flex items-center justify-center text-white transition-all group-hover:scale-110 active:scale-90 shadow-2xl`}>{icon}</div>
    <span className="text-[9px] font-black text-slate-500 group-hover:text-white transition-colors">{label}</span>
  </div>
);

const PodiumItem = ({ rank, name, count, prize, h, first = false }: any) => (
  <div className={`flex flex-col items-center relative ${first ? 'z-10' : ''}`}>
    <div className={`text-[11px] font-black uppercase mb-3 ${first ? 'text-blue-600 animate-pulse' : 'text-slate-300'}`}>#{rank}</div>
    <div className={`w-full bg-white rounded-t-[2.5rem] border border-b-0 border-slate-100 flex flex-col items-center justify-center gap-3 shadow-2xl shadow-slate-200 ${h} ${first ? 'border-blue-100 scale-105' : ''}`}>
       <div className={`rounded-full flex items-center justify-center font-black ${first ? 'w-16 h-16 bg-blue-600 text-white shadow-xl shadow-blue-500/30 text-xl' : 'w-10 h-10 bg-slate-50 text-slate-400 text-sm'}`}>{name?.[0] || '?'}</div>
       <div className={`font-black truncate w-24 text-center ${first ? 'text-slate-900 text-base' : 'text-slate-500 text-[10px]'}`}>{name || '...'}</div>
    </div>
    <div className={`w-full py-3 flex flex-col items-center ${first ? 'bg-blue-600 text-white rounded-b-[2rem] shadow-xl shadow-blue-600/20 scale-105' : 'bg-slate-100 text-slate-400 rounded-b-[1.5rem]'}`}>
       <span className="text-[11px] font-black tracking-tighter">{count || 0} Refs</span>
       <span className="text-[9px] font-black opacity-60 uppercase tracking-tighter">{prize}</span>
    </div>
  </div>
);