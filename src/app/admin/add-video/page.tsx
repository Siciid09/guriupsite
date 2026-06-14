'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '@/app/lib/firebase'; 
import { useAuth } from '@/hooks/useAuth'; 
import { 
  Video, Save, AlignLeft, Clock, Link as LinkIcon, 
  ListOrdered, LayoutDashboard, CheckCircle2, AlertCircle, Loader2 
} from 'lucide-react';

export default function AddVideoAdmin() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  // Security State
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Form State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: '',
    videoUrl: '',
    order: 1
  });

  // ------------------------------------------
  // SECURITY GUARD: SADMIN CHECK
  // ------------------------------------------
  useEffect(() => {
    const verifyAccess = async () => {
      if (authLoading) return;
      if (!user) {
        router.push('/dashboard');
        return;
      }
      
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && userDoc.data().role === 'sadmin') {
          setIsAuthorized(true);
        } else {
          router.push('/dashboard');
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        router.push('/dashboard');
      }
    };
    verifyAccess();
  }, [user, authLoading, router]);

  // Helper to extract YouTube ID for the live preview
  const getYoutubeThumbnail = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) 
      ? `https://img.youtube.com/vi/${match[2]}/hqdefault.jpg` 
      : null;
  };

  const thumbnailPreview = getYoutubeThumbnail(formData.videoUrl);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'order' ? parseInt(value) || 0 : value 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus({ type: null, message: '' });

    try {
      await addDoc(collection(db, 'videos1'), {
        title: formData.title,
        description: formData.description,
        duration: formData.duration,
        videoUrl: formData.videoUrl,
        order: formData.order,
        createdAt: serverTimestamp(),
      });

      setStatus({ type: 'success', message: 'Video successfully published to the Academy!' });
      
      setFormData(prev => ({
        title: '',
        description: '',
        duration: '',
        videoUrl: '',
        order: prev.order + 1
      }));
      
      setTimeout(() => setStatus({ type: null, message: '' }), 3000);

    } catch (error: any) {
      console.error("Error adding video: ", error);
      setStatus({ type: 'error', message: error.message || 'Failed to add video. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ------------------------------------------
  // RENDER LOADING / AUTH GUARD
  // ------------------------------------------
  if (authLoading || !isAuthorized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white">
        <Loader2 className="animate-spin text-[#0065eb] mb-4" size={48} />
        <h2 className="text-xl font-black tracking-widest uppercase">Verifying Admin Credentials...</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans">
      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Header */}
        <div className="flex items-center gap-4 border-b border-slate-200 pb-6">
          <div className="w-12 h-12 bg-[#0065eb]/10 text-[#0065eb] rounded-2xl flex items-center justify-center shadow-sm">
            <LayoutDashboard size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Academy Admin</h1>
            <p className="text-sm font-medium text-slate-500">Add and manage video lessons for the mobile app.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Form Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-8 space-y-6 relative overflow-hidden">
              
              {/* Glassmorphic decorative blob */}
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-[#0065eb]/5 rounded-full blur-3xl pointer-events-none" />

              {status.type && (
                <div className={`p-4 rounded-xl flex items-center gap-3 font-bold text-sm ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                  {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                  {status.message}
                </div>
              )}

              <div className="space-y-4">
                {/* Title Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Lesson Title</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Video size={18} /></div>
                    <input 
                      required type="text" name="title" value={formData.title} onChange={handleInputChange}
                      placeholder="e.g. Introduction to Variables" 
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-[#0065eb]/50 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* Description Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Detailed Description</label>
                  <div className="relative">
                    <div className="absolute left-4 top-4 text-slate-400"><AlignLeft size={18} /></div>
                    <textarea 
                      required name="description" value={formData.description} onChange={handleInputChange} rows={4}
                      placeholder="What will the students learn in this lesson?" 
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-[#0065eb]/50 focus:bg-white transition-all resize-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Duration Input */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Duration</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Clock size={18} /></div>
                      <input 
                        required type="text" name="duration" value={formData.duration} onChange={handleInputChange}
                        placeholder="e.g. 12:45" 
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-[#0065eb]/50 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  {/* Order Input */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Playback Order</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><ListOrdered size={18} /></div>
                      <input 
                        required type="number" min="1" name="order" value={formData.order} onChange={handleInputChange}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-[#0065eb]/50 focus:bg-white transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* YouTube Link Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">YouTube URL</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><LinkIcon size={18} /></div>
                    <input 
                      required type="url" name="videoUrl" value={formData.videoUrl} onChange={handleInputChange}
                      placeholder="https://youtube.com/watch?v=..." 
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-[#0065eb]/50 focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-[#0065eb] disabled:opacity-70 disabled:cursor-not-allowed hover:bg-[#0052c1] text-white font-bold text-sm py-4 rounded-2xl shadow-lg shadow-[#0065eb]/25 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><Save size={18} /> Publish Video Lesson</>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Sidebar / Live Preview */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-900 rounded-[32px] p-6 shadow-xl border border-slate-800 text-white">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">App Preview</h3>
              
              {/* Flutter Card Replica */}
              <div className="bg-slate-800/50 rounded-2xl p-3 border border-slate-700/50">
                <div className="flex gap-4">
                  {/* Thumbnail Replica */}
                  <div className="relative w-[110px] h-[85px] rounded-xl overflow-hidden bg-slate-800 shrink-0">
                    {thumbnailPreview ? (
                      <img src={thumbnailPreview} alt="Thumbnail" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-600">
                        <Video size={24} />
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <div className="w-0 h-0 border-t-4 border-t-transparent border-l-6 border-l-white border-b-4 border-b-transparent ml-1"></div>
                      </div>
                    </div>
                    <div className="absolute bottom-1.5 right-1.5 bg-black/80 px-1.5 py-0.5 rounded text-[10px] font-bold text-white">
                      {formData.duration || '--:--'}
                    </div>
                  </div>

                  {/* Text Details Replica */}
                  <div className="flex flex-col justify-center overflow-hidden">
                    <span className="text-[10px] font-bold text-[#0065eb]">Lesson {formData.order}</span>
                    <h4 className="font-bold text-sm truncate mt-0.5">{formData.title || 'Untitled Lesson'}</h4>
                    <p className="text-xs text-slate-400 truncate mt-1">{formData.description || 'No description provided.'}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 text-xs font-medium text-slate-400 bg-slate-800/30 p-4 rounded-xl border border-slate-700/30 leading-relaxed">
                This preview shows exactly how the video will appear in the app's scrollable list. Once saved, it instantly syncs to the <strong>videos1</strong> database collection.
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}