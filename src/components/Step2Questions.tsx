// src/app/components/Step2Questions.tsx
"use client";

import { useFormStore } from '@/app/lib/store';
import { ArrowRight, ArrowLeft, UploadCloud, AlertCircle, CheckCircle2, MessageSquare, File as FileIcon, X } from 'lucide-react';
import { motion, Variants } from 'framer-motion';
import { useMemo, useRef, useState } from 'react';

export default function Step2Questions({ roleData }: { roleData: any }) {
  const { 
    answers, setAnswer, setStep, 
    attachments, addAttachments, removeAttachment,
    missingRequirements, setMissingRequirements
  } = useFormStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Calculate progress based on how many questions have answers
  const answeredCount = roleData.questions.filter((q: string) => 
    (answers[q] || '').trim().length > 0
  ).length;

  const minRequired = 3;
  const isReady = answeredCount >= minRequired;
  const progressPercentage = Math.min((answeredCount / minRequired) * 100, 100);

  // Group questions by Category (Removes the ugly "[Category]" prefix)
  const groupedQuestions = useMemo(() => {
    const groups: Record<string, { original: string; display: string }[]> = {};
    
    roleData.questions.forEach((q: string) => {
      // Look for "[Category Name] Question text"
      const match = q.match(/^\[(.*?)\]\s(.*)$/);
      const category = match ? match[1] : roleData.title; // Default to main title if no brackets
      const displayQuestion = match ? match[2] : q;

      if (!groups[category]) groups[category] = [];
      groups[category].push({ original: q, display: displayQuestion });
    });
    
    return groups;
  }, [roleData]);

  // Handle File Uploads
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addAttachments(Array.from(e.target.files));
    }
  };

  // Animations
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <div className="flex flex-col h-full relative">
      
      {/* 1. STICKY HEADER & PROGRESS */}
      <div className="sticky top-0 z-20 bg-[#0f172a]/90 backdrop-blur-xl pb-4 border-b border-white/10 mb-6 pt-2 rounded-t-3xl -mx-2 px-2">
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-indigo-400" />
              Workflow Requirements
            </h2>
            <p className="text-gray-400 text-sm mt-1">Answer at least {minRequired} questions to proceed.</p>
          </div>
          
          <div className="text-right">
            <p className={`text-sm font-bold mb-2 transition-colors ${isReady ? 'text-green-400' : 'text-indigo-300'}`}>
              {isReady ? "Awesome! You hit the minimum." : `Keep going! ${minRequired - answeredCount} more required.`}
            </p>
            <div className="flex items-center gap-3">
              <div className="w-48 h-2.5 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
                <motion.div 
                  className={`h-full rounded-full ${isReady ? 'bg-green-500' : 'bg-gradient-to-r from-indigo-500 to-blue-400'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercentage}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-300 w-12">{answeredCount} / {minRequired}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SCROLLABLE CONTENT */}
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-10 overflow-y-auto max-h-[55vh] pr-4 pb-10 custom-scrollbar">
        
        {/* Render Grouped Questions */}
        {Object.entries(groupedQuestions).map(([category, questions], groupIdx) => {
          const isCollapsed = collapsedGroups[category];
          return (
          <div key={category} className="space-y-6">
            <motion.div variants={itemVariants} className="flex items-center justify-between border-b border-white/10 pb-2 mt-4">
              <h3 className="text-xl font-bold text-indigo-300">
                {category}
              </h3>
              <button 
                onClick={() => setCollapsedGroups(prev => ({ ...prev, [category]: !prev[category] }))}
                className="text-xs font-medium text-gray-400 hover:text-white px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/5"
              >
                {isCollapsed ? "Show section" : "Hide section"}
              </button>
            </motion.div>
            
            {!isCollapsed && (
              <div className="space-y-6">
                {questions.map((qData, idx) => {
                  const isAnswered = (answers[qData.original] || '').trim().length > 0;
              return (
                <motion.div key={idx} variants={itemVariants} className="relative">
                  <div className={`transition-all duration-300 p-5 rounded-2xl border ${
                    isAnswered ? 'bg-indigo-900/10 border-indigo-500/40 shadow-[0_0_15px_rgba(99,102,241,0.1)]' : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}>
                    <label className="flex items-start gap-3 text-base md:text-lg font-medium text-gray-200 mb-3 cursor-pointer">
                      <span className={`flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold mt-0.5 transition-colors ${
                        isAnswered ? 'bg-indigo-500 text-white' : 'bg-white/10 text-gray-400'
                      }`}>
                        {isAnswered ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                      </span>
                      <span className={isAnswered ? 'text-white' : ''}>{qData.display}</span>
                    </label>
                    <div className="pl-10">
                      <textarea 
                        rows={3}
                        value={answers[qData.original] || ''}
                        onChange={(e) => setAnswer(qData.original, e.target.value)}
                        className="w-full bg-black/40 border border-white/10 focus:border-indigo-400 focus:bg-[#131b2f] focus:ring-2 focus:ring-indigo-500/20 rounded-xl p-4 text-white placeholder-gray-500 resize-none transition-all outline-none"
                        placeholder="Type your workflow details here..."
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
              </div>
            )}
          </div>
        )})}

        {/* 3. MISSING REQUIREMENTS */}
        <motion.div variants={itemVariants} className="pt-8 border-t border-white/10">
          <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 p-6 rounded-2xl border border-amber-500/20 group hover:border-amber-500/40 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-500/20 rounded-lg text-amber-400"><AlertCircle className="w-5 h-5" /></div>
              <label className="text-lg font-medium text-amber-100">Anything missing? (Optional)</label>
            </div>
            <textarea 
              rows={2}
              value={missingRequirements}
              onChange={(e) => setMissingRequirements(e.target.value)}
              className="w-full bg-black/40 border border-amber-500/20 focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 rounded-xl p-4 text-white placeholder-amber-700/50 resize-none outline-none"
              placeholder="Explain any extra requirements or unlisted forms here..."
            />
          </div>
        </motion.div>

        {/* 4. FILE UPLOAD ZONE */}
        <motion.div variants={itemVariants} className="pt-4">
          <div className="bg-white/5 border border-dashed border-white/20 hover:border-indigo-400 transition-colors rounded-2xl p-6 text-center group">
            <input 
              type="file" 
              multiple 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            <div className="p-4 bg-white/5 rounded-full inline-block mb-3 group-hover:bg-indigo-500/20 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <UploadCloud className="w-8 h-8 text-indigo-400" />
            </div>
            <h3 className="text-lg font-medium text-white mb-1">Upload Forms & Reports</h3>
            <p className="text-sm text-gray-400 mb-4">Attach Excel, PDF, Word, or images of current forms.</p>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white text-sm font-medium transition-all"
            >
              Browse Files
            </button>

            {/* List of uploaded files */}
            {attachments.length > 0 && (
              <div className="mt-6 space-y-2 text-left">
                {attachments.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-white/5">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <FileIcon className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                      <span className="text-sm text-gray-200 truncate">{file.name}</span>
                      <span className="text-xs text-gray-500 flex-shrink-0">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </div>
                    <button onClick={() => removeAttachment(idx)} className="p-1.5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-lg transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* 5. NAVIGATION FOOTER */}
      <div className="mt-auto pt-6 border-t border-white/10 flex justify-between items-center z-10 bg-transparent">
        <button onClick={() => setStep(1)} className="flex items-center px-6 py-3 text-gray-400 hover:text-white rounded-xl transition-all">
          <ArrowLeft className="mr-2 w-5 h-5" /> Back
        </button>
        <button
          disabled={!isReady}
          onClick={() => setStep(3)}
          className={`flex items-center px-8 py-3.5 rounded-xl font-bold transition-all ${
            isReady ? 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 text-white shadow-lg' : 'bg-white/5 text-gray-500 cursor-not-allowed'
          }`}
        >
          Review Answers <ArrowRight className="ml-2 w-5 h-5" />
        </button>
      </div>
      
    </div>
  );
}