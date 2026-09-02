// src/app/components/Step3Preview.tsx
"use client";

import { useState } from 'react';
import { useFormStore } from '@/app/lib/store'; 
import { Send, Edit3, AlertCircle, Loader2, User, Phone, Briefcase, FileText, ShieldCheck } from 'lucide-react';
import { motion, Variants } from 'framer-motion'; 

// FIREBASE IMPORTS
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/app/lib/firebase'; // Adjust path if your firebase.ts is elsewhere

export default function Step3Preview({ roleData }: { roleData: any }) {
  const { basicInfo, answers, missingRequirements, attachments, setStep } = useFormStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter only questions the user actually typed an answer for
  const answeredQuestions = roleData.questions.filter((q: string) => 
    (answers[q] || '').trim().length > 0
  );

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      // FUTURE-PROOFING: Firebase Firestore CANNOT save raw HTML5 `File` objects.
      // If you try to save the raw array, Firebase will crash.
      // Instead, we extract the metadata (Name, Size, Type) to save as text records.
      // (Later, if you add Firebase Storage, you would upload the actual files there first).
      const fileMetaDataList = attachments.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      }));

      // 1. Construct the complete payload
      const payload = {
        role: roleData.slug,
        roleTitle: roleData.title,
        submitterName: basicInfo.fullName,
        submitterPhone: basicInfo.phone,
        submitterJobTitle: basicInfo.jobTitle,
        answers: answers, 
        missingRequirements: missingRequirements || "",
        attachedFilesInfo: fileMetaDataList, // Saves the safe metadata
        hasAttachments: attachments.length > 0,
        submittedAt: new Date().toISOString(),
        answeredCount: answeredQuestions.length
      };
      
      // 2. Save directly to Firestore collection "hospital_requirements"
      await addDoc(collection(db, 'hospital_requirements'), payload);
      
      // 3. Move to the Success Step (Step 4)
      setStep(4); 
    } catch (err: any) {
      console.error("Firebase Submission Error:", err);
      setError(err.message || "Failed to submit securely to the database. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Premium Framer Motion Animations (Properly typed to avoid TypeScript errors)
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <div className="flex flex-col h-full relative">
      
      {/* Header section */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-green-400" />
            Review Submission
          </h2>
          <p className="text-gray-400 text-sm mt-1">Please verify your details and attached files before saving.</p>
        </div>
        <button 
          onClick={() => setStep(2)}
          disabled={isSubmitting}
          className="flex items-center text-sm font-medium text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 px-4 py-2 rounded-lg transition-all disabled:opacity-50"
        >
          <Edit3 className="w-4 h-4 mr-2" /> Edit Answers
        </button>
      </div>

      {/* Main Scrollable Content */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-6 overflow-y-auto max-h-[55vh] pr-4 mb-4 custom-scrollbar"
      >
        
        {/* 1. Submitter Card */}
        <motion.div variants={itemVariants} className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-lg shadow-black/20 backdrop-blur-md">
          <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-4 flex items-center">
            <User className="w-4 h-4 mr-2" /> Submitter Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <p className="text-xs text-gray-500 mb-1 flex items-center"><User className="w-3 h-3 mr-1"/> Full Name</p>
              <p className="font-semibold text-white truncate">{basicInfo.fullName}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <p className="text-xs text-gray-500 mb-1 flex items-center"><Phone className="w-3 h-3 mr-1"/> Phone Number</p>
              <p className="font-semibold text-white truncate">{basicInfo.phone}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <p className="text-xs text-gray-500 mb-1 flex items-center"><Briefcase className="w-3 h-3 mr-1"/> Job Title</p>
              <p className="font-semibold text-white truncate">{basicInfo.jobTitle}</p>
            </div>
          </div>
        </motion.div>

        {/* 2. Uploaded Files Preview (Only shows if files exist) */}
        {attachments.length > 0 && (
          <motion.div variants={itemVariants}>
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-4 flex items-center">
              <FileText className="w-4 h-4 mr-2" /> Attached Files ({attachments.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {attachments.map((file, idx) => (
                <div key={idx} className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-900/20 to-indigo-900/10 border border-blue-500/20 rounded-xl shadow-inner">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <FileText className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-medium text-blue-100 text-sm truncate">{file.name}</p>
                    <p className="text-xs text-blue-300/60 mt-0.5">
                      {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type || 'Unknown type'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* 3. Answers List */}
        <motion.div variants={itemVariants}>
          <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-4 flex items-center">
            <AlertCircle className="w-4 h-4 mr-2" /> Provided Answers ({answeredQuestions.length})
          </h3>
          <div className="space-y-4">
            {answeredQuestions.map((q: string, idx: number) => {
              // Strip out the [Category] prefix purely for the UI display so it looks clean
              const displayQuestion = q.replace(/^\[.*?\]\s/, '');
              
              return (
                <div key={idx} className="bg-white/5 border border-white/10 hover:border-indigo-500/30 transition-colors rounded-2xl p-5 shadow-md">
                  <p className="text-sm font-medium text-indigo-300 mb-3 leading-relaxed">{displayQuestion}</p>
                  <p className="text-base text-gray-200 whitespace-pre-wrap leading-relaxed">{answers[q]}</p>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* 4. Missing Requirements (Conditional) */}
        {missingRequirements && (
          <motion.div variants={itemVariants}>
            <h3 className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-4 flex items-center">
              <AlertCircle className="w-4 h-4 mr-2" /> Additional Notes
            </h3>
            <div className="bg-gradient-to-br from-orange-900/20 to-red-900/20 border border-orange-500/30 rounded-2xl p-5 shadow-md">
              <p className="text-base text-orange-100 whitespace-pre-wrap leading-relaxed">{missingRequirements}</p>
            </div>
          </motion.div>
        )}

      </motion.div>

      {/* Error Message Banner */}
      {error && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="p-4 mb-4 bg-red-900/30 border border-red-500/50 rounded-xl text-red-200 text-sm flex items-center shadow-lg"
        >
          <AlertCircle className="w-5 h-5 mr-3 shrink-0" />
          {error}
        </motion.div>
      )}

      {/* Footer / Actions */}
      <div className="mt-auto pt-6 border-t border-white/10 flex justify-between items-center bg-transparent">
        <button
          onClick={() => setStep(2)}
          disabled={isSubmitting}
          className="px-6 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all disabled:opacity-50 font-medium"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="group relative flex items-center px-8 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 rounded-xl font-bold text-white transition-all shadow-[0_0_20px_rgba(79,70,229,0.4)] hover:shadow-[0_0_30px_rgba(79,70,229,0.6)] hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden"
        >
          {/* Glass glare effect inside button */}
          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-[100%] group-hover:animate-[shimmer_1.5s_infinite]" />
          
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 mr-3 animate-spin" /> 
              Saving Securely...
            </>
          ) : (
            <>
              Confirm & Submit 
              <Send className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </div>

    </div>
  );
}