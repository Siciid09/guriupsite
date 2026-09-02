// app/[role]/page.tsx
"use client";

import { notFound } from 'next/navigation';
import { allRoles } from '../lib/questionsData';
import { useFormStore } from '../lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

// Component Imports (We will define these below)
import Step1BasicInfo from '../../components/Step1BasicInfo';
import Step2Questions from '../../components/Step2Questions';
import Step3Preview from '../../components/Step3Preview';

export default function RoleFormPage({ params }: { params: { role: string } }) {
  const roleData = allRoles.find(r => r.slug === params.role);
  const { step, resetForm } = useFormStore();

  if (!roleData) return notFound();

  // Reset form when leaving page (optional, remove if you want persistence across roles)
  // useEffect(() => { return () => resetForm(); }, []);

  return (
    <main className="min-h-screen py-12 px-4 md:px-8 flex flex-col items-center relative overflow-hidden">
      {/* Background Orbs */}
      <div className="fixed top-0 left-[20%] w-[50%] h-[50%] bg-indigo-900/20 rounded-full blur-[150px] pointer-events-none" />
      
      <div className="w-full max-w-4xl z-10">
        <Link href="/" onClick={() => resetForm()} className="inline-flex items-center text-gray-400 hover:text-white mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Roles
        </Link>

        {/* Header Section */}
        <div className="glass-panel rounded-3xl p-8 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/20 rounded-xl">
              <roleData.icon className="w-8 h-8 text-indigo-300" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">{roleData.title} Requirements</h1>
              <p className="text-gray-400 text-sm mt-1">Please provide accurate details about your workflow.</p>
            </div>
          </div>
          
          {/* Progress Indicator */}
          <div className="hidden md:flex gap-2">
            {[1, 2, 3].map((s) => (
              <div 
                key={s} 
                className={`w-12 h-2 rounded-full transition-all duration-500 ${step >= s ? 'bg-indigo-500' : 'bg-gray-700'}`}
              />
            ))}
          </div>
        </div>

        {/* Form Container */}
        <div className="glass-panel rounded-3xl overflow-hidden relative min-h-[500px]">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <StepWrapper key="step1">
                <Step1BasicInfo />
              </StepWrapper>
            )}
            {step === 2 && (
              <StepWrapper key="step2">
                <Step2Questions roleData={roleData} />
              </StepWrapper>
            )}
            {step === 3 && (
              <StepWrapper key="step3">
                <Step3Preview roleData={roleData} />
              </StepWrapper>
            )}
            {step === 4 && (
              <StepWrapper key="step4">
                <SuccessStep />
              </StepWrapper>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}

// Helper wrapper for smooth transitions
function StepWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="p-8 h-full"
    >
      {children}
    </motion.div>
  );
}

// Success State
function SuccessStep() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-16 text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", bounce: 0.5 }}
      >
        <CheckCircle2 className="w-24 h-24 text-green-400 mb-6" />
      </motion.div>
      <h2 className="text-3xl font-bold mb-4">Requirements Submitted!</h2>
      <p className="text-gray-400 max-w-md mx-auto mb-8">
        Thank you for your input. Your workflow details have been saved securely and will be used to build the new system.
      </p>
      <Link href="/">
        <button className="px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-all">
          Return to Dashboard
        </button>
      </Link>
    </div>
  )
}