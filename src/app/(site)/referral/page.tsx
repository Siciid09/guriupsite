'use client';

import React, { useState } from 'react';
import { 
  Settings, 
  Copy, 
  Share2, 
  Trophy, 
  Users, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Gift, 
  ChevronRight, 
  Flame, 
  Target,
  Instagram,
  Facebook,
  Twitter,
  Send, // For Telegram
  Phone
} from 'lucide-react';

export default function ReferralPage() {
  const [activeTab, setActiveTab] = useState<'pending' | 'valid' | 'rejected'>('valid');
  const [copied, setCopied] = useState(false);

  const referralCode = "GURIUP-9X3K2";

  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans text-slate-900">
      
      {/* ================= HERO BANNER (Small Height, Full Width) ================= */}
      {/* pt-28 ensures it sits below your Fixed Navbar */}
      <div className="pt-28 pb-6">
        <div className="relative w-full h-48 md:h-56 bg-slate-900 overflow-hidden">
            {/* Background Image */}
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-60"
              style={{ backgroundImage: "url('https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=2000')" }}
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#0065eb]/90 to-[#004bb5]/80" />
            
            <div className="relative z-10 h-full flex flex-col justify-center px-6 md:px-12 max-w-7xl mx-auto">
                <div className="flex justify-between items-start w-full">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tight">
                            Invite & Earn
                        </h1>
                        <p className="text-blue-100 font-medium text-sm md:text-base max-w-md">
                            Earn rewards by inviting friends to GuriUp. Climb the Top 10 and win big cash prizes.
                        </p>
                    </div>
                    <button className="bg-white/20 backdrop-blur-md p-2.5 rounded-full hover:bg-white/30 transition-colors border border-white/10 text-white">
                        <Settings size={20} />
                    </button>
                </div>
            </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 -mt-16 relative z-20 space-y-8">

        {/* ================= 1. STATS & STREAK CARD ================= */}
        <div className="bg-white rounded-3xl p-6 shadow-xl shadow-blue-900/5 border border-slate-100">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-xl font-black text-slate-900">Your Rank: #18</h2>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mt-1">
                        12 Valid Referrals
                    </p>
                </div>
                {/* Streak Badge */}
                <div className="flex items-center gap-1.5 bg-orange-50 text-orange-600 px-3 py-1.5 rounded-full border border-orange-100">
                    <Flame size={16} className="fill-current" />
                    <span className="text-xs font-black uppercase">4 Day Streak</span>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-2 flex justify-between text-xs font-bold text-slate-400">
                <span>Top 100</span>
                <span className="text-[#0065eb]">Top 10</span>
            </div>
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-400 to-[#0065eb] w-[65%] rounded-full shadow-[0_0_10px_rgba(0,101,235,0.5)]" />
            </div>
            
            <div className="mt-4 flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-50 p-3 rounded-xl">
                <Target size={14} className="text-[#0065eb]" />
                <span>You need <strong>6 more referrals</strong> to enter the Top 10 and win $50+</span>
            </div>
        </div>

        {/* ================= 2. REFERRAL CODE & SHARE ================= */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 text-center text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#0065eb] opacity-20 blur-[60px] rounded-full"></div>
            
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Your Unique Code</h3>
            
            <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-4 flex items-center justify-between gap-4 mb-6">
                <span className="text-2xl md:text-3xl font-black tracking-widest font-mono text-white">
                    {referralCode}
                </span>
                <button 
                    onClick={handleCopy}
                    className="bg-white text-slate-900 p-3 rounded-xl hover:bg-blue-50 transition-colors active:scale-95"
                >
                    {copied ? <CheckCircle2 size={20} className="text-green-600" /> : <Copy size={20} />}
                </button>
            </div>

            <p className="text-slate-400 text-xs font-medium mb-6">Friends must sign up using your code.</p>

            <div className="grid grid-cols-4 gap-4">
                <ShareButton icon={<div className="w-10 h-10 bg-[#25D366] rounded-full flex items-center justify-center text-white"><Phone size={20} /></div>} label="WhatsApp" />
                <ShareButton icon={<div className="w-10 h-10 bg-[#E1306C] rounded-full flex items-center justify-center text-white"><Instagram size={20} /></div>} label="Instagram" />
                <ShareButton icon={<div className="w-10 h-10 bg-[#0088cc] rounded-full flex items-center justify-center text-white"><Send size={20} /></div>} label="Telegram" />
                <ShareButton icon={<div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center text-white"><Share2 size={20} /></div>} label="More" />
            </div>
        </div>

        {/* ================= 3. LEADERBOARD (Top 10) ================= */}
        <div>
            <div className="flex justify-between items-end mb-4">
                <h3 className="text-xl font-black text-slate-900">Top 10 This Month</h3>
                <button className="text-[#0065eb] text-xs font-bold hover:underline">View Full Leaderboard</button>
            </div>
            
            <div className="grid grid-cols-3 gap-3 mb-4">
                {/* 2nd Place */}
                <TopWinner rank={2} name="Sara M." count={76} prize="$500" color="bg-slate-200" />
                {/* 1st Place */}
                <TopWinner rank={1} name="Ahmed K." count={89} prize="$700" color="bg-yellow-100 border-yellow-200" isFirst />
                {/* 3rd Place */}
                <TopWinner rank={3} name="John D." count={65} prize="$300" color="bg-orange-100 border-orange-200" />
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden divide-y divide-slate-50">
                {[
                    { rank: 4, name: 'Fatima R.', count: 44, reward: 'Gift' },
                    { rank: 5, name: 'Omar S.', count: 39, reward: 'Gift' },
                    { rank: 6, name: 'Lina A.', count: 31, reward: 'Gift' },
                ].map((user) => (
                    <div key={user.rank} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-4">
                            <span className="text-slate-400 font-black w-6 text-center">{user.rank}</span>
                            <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-xs font-bold text-slate-600">
                                {user.name[0]}
                            </div>
                            <span className="font-bold text-sm text-slate-700">{user.name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-xs font-bold text-slate-500">{user.count} Refs</span>
                            <span className="bg-purple-100 text-purple-700 text-[10px] font-black px-2 py-1 rounded uppercase flex items-center gap-1">
                                <Gift size={10} /> {user.reward}
                            </span>
                        </div>
                    </div>
                ))}
                <div className="p-3 text-center">
                    <span className="text-xs font-bold text-slate-400">... and 4 more winners</span>
                </div>
            </div>
        </div>

        {/* ================= 4. MY REFERRALS ================= */}
        <div>
            <h3 className="text-xl font-black text-slate-900 mb-4">My Referrals</h3>
            
            {/* Tabs */}
            <div className="bg-white p-1 rounded-xl border border-slate-100 flex mb-4">
                {(['valid', 'pending', 'rejected'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wide rounded-lg transition-all ${
                            activeTab === tab 
                            ? 'bg-slate-900 text-white shadow-md' 
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* List */}
            <div className="space-y-3">
                {activeTab === 'valid' && (
                    <>
                        <ReferralItem name="Rami K." status="Verified" date="2 days ago" type="valid" />
                        <ReferralItem name="Hala M." status="Verified" date="5 days ago" type="valid" />
                    </>
                )}
                {activeTab === 'pending' && (
                    <>
                        <ReferralItem name="Ali S." status="Waiting for verification" date="Just now" type="pending" />
                        <ReferralItem name="Mona H." status="No activity yet" date="1 hour ago" type="pending" />
                    </>
                )}
                {activeTab === 'rejected' && (
                    <div className="text-center py-8 text-slate-400 text-sm font-medium">
                        No rejected referrals. Good job!
                    </div>
                )}
            </div>
            
            <p className="text-center text-xs text-slate-400 mt-4 font-medium">
                Only valid referrals (verified + active) count toward your rank.
            </p>
        </div>

        {/* ================= 5. HOW IT WORKS ================= */}
        <div className="grid grid-cols-3 gap-4 py-6 border-t border-slate-200 mt-8">
            <StepCard number="1" title="Share" desc="Send code to friends" icon={<Share2 size={18} />} />
            <StepCard number="2" title="Join" desc="They verify account" icon={<Users size={18} />} />
            <StepCard number="3" title="Earn" desc="You climb ranks" icon={<Trophy size={18} />} />
        </div>

        {/* ================= FOOTER ================= */}
        <div className="text-center space-y-4 pt-4">
            <p className="text-xs text-slate-400 font-medium">
                Leaderboard resets every month. <br/> Top winners are verified before prizes are delivered.
            </p>
            <div className="flex justify-center gap-4">
                <button className="text-slate-500 text-xs font-bold hover:text-[#0065eb] underline">Referral Rules</button>
                <button className="text-slate-500 text-xs font-bold hover:text-[#0065eb] underline">Support</button>
            </div>
        </div>

      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---

const ShareButton = ({ icon, label }: { icon: React.ReactNode, label: string }) => (
    <button className="flex flex-col items-center gap-2 group">
        <div className="transition-transform group-hover:scale-110 active:scale-95">
            {icon}
        </div>
        <span className="text-[10px] font-bold text-slate-400 group-hover:text-white transition-colors">{label}</span>
    </button>
);

const TopWinner = ({ rank, name, count, prize, color, isFirst = false }: any) => (
    <div className={`rounded-2xl p-4 flex flex-col items-center justify-between relative ${isFirst ? 'bg-gradient-to-b from-yellow-50 to-white border-2 border-yellow-200 shadow-lg shadow-yellow-100 h-44 -mt-4 z-10' : 'bg-white border border-slate-100 h-36 mt-4 shadow-sm'}`}>
        <div className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">#{rank}</div>
        <div className="flex flex-col items-center">
            <div className={`rounded-full flex items-center justify-center font-black text-slate-600 mb-2 ${isFirst ? 'w-14 h-14 text-xl bg-yellow-100 text-yellow-700' : 'w-10 h-10 text-sm bg-slate-100'}`}>
                {name[0]}
            </div>
            <div className={`font-black text-slate-900 ${isFirst ? 'text-lg' : 'text-sm'}`}>{name}</div>
            <div className="text-xs font-bold text-slate-400">{count} Refs</div>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-black ${isFirst ? 'bg-yellow-500 text-white shadow-md' : 'bg-slate-100 text-slate-600'}`}>
            {prize}
        </div>
    </div>
);

const ReferralItem = ({ name, status, date, type }: { name: string, status: string, date: string, type: 'valid' | 'pending' | 'rejected' }) => {
    let icon = <Clock size={18} className="text-slate-400" />;
    let bg = "bg-slate-100";
    
    if (type === 'valid') {
        icon = <CheckCircle2 size={18} className="text-white" />;
        bg = "bg-green-500";
    } else if (type === 'rejected') {
        icon = <XCircle size={18} className="text-white" />;
        bg = "bg-red-500";
    }

    return (
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-50 shadow-sm">
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${bg} shadow-sm`}>
                    {type === 'pending' ? <Clock size={20} className="text-slate-500" /> : icon}
                </div>
                <div>
                    <h4 className="text-sm font-bold text-slate-900">{name}</h4>
                    <p className={`text-xs font-medium ${type === 'valid' ? 'text-green-600' : 'text-slate-400'}`}>{status}</p>
                </div>
            </div>
            <span className="text-[10px] font-bold text-slate-300 uppercase">{date}</span>
        </div>
    );
};

const StepCard = ({ number, title, desc, icon }: any) => (
    <div className="flex flex-col items-center text-center">
        <div className="w-8 h-8 rounded-full bg-blue-50 text-[#0065eb] flex items-center justify-center text-xs font-black mb-2">
            {number}
        </div>
        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide mb-1">{title}</h4>
        <p className="text-[10px] font-medium text-slate-400 leading-tight px-2">{desc}</p>
    </div>
);