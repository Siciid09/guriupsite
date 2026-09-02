// app/[role]/components/Step1BasicInfo.tsx
"use client";

import { useState } from 'react';
import { useFormStore } from '@/app/lib/store';
import { User, Phone, Briefcase, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
export default function Step1BasicInfo() {
  const { basicInfo, setBasicInfo, setStep } = useFormStore();
  const [showWarning, setShowWarning] = useState(false);
  
  // Field-level validation
  const isNameValid = basicInfo.fullName.length > 2;
  const isPhoneValid = basicInfo.phone.length > 5;
  const isJobValid = basicInfo.jobTitle.length > 2;
  
  const isValid = isNameValid && isPhoneValid && isJobValid;

  const handleNext = () => {
    if (isValid) {
      setShowWarning(false);
      setStep(2);
    } else {
      setShowWarning(true);
    }
  };

  // Animation variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="flex flex-col h-full w-full"
    >
      <motion.div variants={itemVariants} className="mb-8">
        <h2 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 mb-2">
          Let's start with your details
        </h2>
        <p className="text-gray-400">We need a little context before diving into your workflow.</p>
      </motion.div>
      
      <div className="space-y-6 flex-grow w-full max-w-2xl">
        
        {/* Full Name Input */}
        <motion.div variants={itemVariants} className="relative group">
          <label className="block text-sm font-medium text-gray-300 mb-2 ml-1">Full Name</label>
          <div className={`relative flex items-center bg-black/40 border transition-all duration-300 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/20 ${
            showWarning && !isNameValid ? 'border-amber-500/50 bg-amber-500/5' : 'border-white/10 focus-within:border-indigo-400 focus-within:bg-[#131b2f]'
          }`}>
            <div className="pl-4 pr-3 py-4 flex items-center justify-center">
              <User className={`w-5 h-5 transition-colors ${isNameValid ? 'text-indigo-400' : 'text-gray-500 group-focus-within:text-indigo-400'}`} />
            </div>
            <input 
              type="text" 
              value={basicInfo.fullName}
              onChange={(e) => {
                setBasicInfo({ fullName: e.target.value });
                if (showWarning) setShowWarning(false);
              }}
              className="w-full bg-transparent border-none py-4 pr-12 text-white placeholder-gray-600 focus:outline-none focus:ring-0"
              placeholder="e.g. Ahmed Aadan"
            />
            <AnimatePresence>
              {isNameValid && (
                <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} className="absolute right-4">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Phone Number Input */}
        <motion.div variants={itemVariants} className="relative group">
          <label className="block text-sm font-medium text-gray-300 mb-2 ml-1">Phone Number</label>
          <div className={`relative flex items-center bg-black/40 border transition-all duration-300 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/20 ${
            showWarning && !isPhoneValid ? 'border-amber-500/50 bg-amber-500/5' : 'border-white/10 focus-within:border-indigo-400 focus-within:bg-[#131b2f]'
          }`}>
            <div className="pl-4 pr-3 py-4 flex items-center justify-center">
              <Phone className={`w-5 h-5 transition-colors ${isPhoneValid ? 'text-indigo-400' : 'text-gray-500 group-focus-within:text-indigo-400'}`} />
            </div>
            <input 
              type="tel" 
              value={basicInfo.phone}
              onChange={(e) => {
                setBasicInfo({ phone: e.target.value });
                if (showWarning) setShowWarning(false);
              }}
              className="w-full bg-transparent border-none py-4 pr-12 text-white placeholder-gray-600 focus:outline-none focus:ring-0"
              placeholder="+252 XX XXX XXXX"
            />
            <AnimatePresence>
              {isPhoneValid && (
                <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} className="absolute right-4">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Job Title Input */}
        <motion.div variants={itemVariants} className="relative group">
          <label className="block text-sm font-medium text-gray-300 mb-2 ml-1">Exact Job Title / Role</label>
          <div className={`relative flex items-center bg-black/40 border transition-all duration-300 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/20 ${
            showWarning && !isJobValid ? 'border-amber-500/50 bg-amber-500/5' : 'border-white/10 focus-within:border-indigo-400 focus-within:bg-[#131b2f]'
          }`}>
            <div className="pl-4 pr-3 py-4 flex items-center justify-center">
              <Briefcase className={`w-5 h-5 transition-colors ${isJobValid ? 'text-indigo-400' : 'text-gray-500 group-focus-within:text-indigo-400'}`} />
            </div>
            <input 
              type="text" 
              value={basicInfo.jobTitle}
              onChange={(e) => {
                setBasicInfo({ jobTitle: e.target.value });
                if (showWarning) setShowWarning(false);
              }}
              className="w-full bg-transparent border-none py-4 pr-12 text-white placeholder-gray-600 focus:outline-none focus:ring-0"
              placeholder="e.g. Senior Registered Nurse"
            />
            <AnimatePresence>
              {isJobValid && (
                <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} className="absolute right-4">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Dynamic Warning Banner */}
      <div className="mt-6 min-h-[60px] flex items-center">
        <AnimatePresence>
          {showWarning && !isValid && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="w-full max-w-2xl bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-amber-200 font-medium text-sm">Almost there! Please complete:</h4>
                <ul className="text-amber-400/80 text-sm mt-1 list-disc list-inside">
                  {!isNameValid && <li>Your full name (min. 3 characters)</li>}
                  {!isPhoneValid && <li>A valid phone number</li>}
                  {!isJobValid && <li>Your exact job title</li>}
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Navigation */}
      <motion.div variants={itemVariants} className="mt-4 pt-6 border-t border-white/10 flex justify-end w-full">
        <button
          onClick={handleNext}
          className={`flex items-center px-8 py-3.5 rounded-xl font-bold transition-all duration-300 ${
            isValid 
              ? 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 text-white shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)] hover:-translate-y-0.5' 
              : 'bg-white/10 hover:bg-white/15 text-gray-200'
          }`}
        >
          Continue to Workflow <ArrowRight className={`ml-2 w-5 h-5 transition-transform ${isValid ? 'group-hover:translate-x-1' : ''}`} />
        </button>
      </motion.div>
    </motion.div>
  );
}