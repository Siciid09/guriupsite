// src/app/page.tsx
"use client";

import { Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

// Imports from your lib files
import { allRoles } from '@/app/lib/questionsData';
import { useFormStore } from '@/app/lib/store'; // Fixed double slash here

// Imports for your step components (ensure they are in the ./components/ folder)
import Step1BasicInfo from '../../components/Step1BasicInfo';
import Step2Questions from '../../components/Step2Questions'; // Fixed double slash here
import Step3Preview from '../../components/Step3Preview'; // Fixed double slash here

// Main content component that uses URL parameters to switch views (Tabs)
function SystemRequirementsManager() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname(); // Allows this to work on any domain path like /hargeisahos
  
  const { step, resetForm } = useFormStore();

  // Read the '?role=' from the URL
  const activeRoleSlug = searchParams.get('role');
  const roleData = allRoles.find(r => r.slug === activeRoleSlug);

  // Function to change the "tab" / URL without reloading the page
  const handleSelectRole = (slug: string) => {
    resetForm();
    router.push(`${pathname}?role=${slug}`);
  };

  // Function to clear the tab / go back to grid
  const handleClearRole = () => {
    resetForm();
    router.push(pathname);
  };

  // ==========================================
  // VIEW 1: THE FORM (If a role is selected)
  // ==========================================
  if (roleData) {
    return (
      <motion.div 
        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
        // FIX: Removed max-w-4xl so it takes the full width available
        className="w-full z-10 flex flex-col flex-1" 
      >
        <button 
          onClick={handleClearRole} 
          className="inline-flex items-center text-gray-400 hover:text-white mb-8 transition-colors self-start"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Departments
        </button>

        {/* Header Section */}
        <div className="glass-panel rounded-3xl p-8 mb-8 flex items-center justify-between w-full">
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

        {/* Multi-Step Form Container */}
        <div className="glass-panel rounded-3xl overflow-hidden relative min-h-[500px] w-full flex-1 flex flex-col">
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
                <SuccessStep onReturn={handleClearRole} />
              </StepWrapper>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    );
  }

  // ==========================================
  // VIEW 2: THE GRID (If no role is selected)
  // ==========================================
  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
      className="flex flex-col items-center z-10 w-full"
    >
      <div className="text-center max-w-3xl mb-16">
        <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
          Hargeisa Hospital System
        </h1>
        <p className="text-lg text-gray-300">
          Select your department to help us design the perfect system. 
          Your workflow requirements build our foundation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full max-w-full">
        {allRoles.map((role, index) => {
          const Icon = role.icon;
          return (
            <motion.div
              key={role.slug}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              whileHover={{ scale: 1.03, y: -5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSelectRole(role.slug)}
              className="glass-panel rounded-2xl p-6 h-full cursor-pointer group flex flex-col items-center text-center transition-all hover:bg-white/10 hover:border-indigo-500/30 shadow-lg"
            >
              <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center mb-4 group-hover:bg-indigo-500/40 transition-colors">
                <Icon className="w-8 h-8 text-indigo-300 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{role.title}</h3>
              <p className="text-sm text-gray-400 group-hover:text-gray-300">
                {role.questions.length} Questions
              </p>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  );
}

// ------------------------------------------------------------------
// HELPER COMPONENTS
// ------------------------------------------------------------------

// Smooth transition wrapper for form steps
function StepWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="p-4 md:p-8 h-full w-full flex flex-col flex-1"
    >
      {children}
    </motion.div>
  );
}

// The Success Screen
function SuccessStep({ onReturn }: { onReturn: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-16 text-center w-full">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5 }}>
        <CheckCircle2 className="w-24 h-24 text-green-400 mb-6 drop-shadow-[0_0_15px_rgba(74,222,128,0.5)]" />
      </motion.div>
      <h2 className="text-3xl font-bold mb-4 text-white">Requirements Submitted!</h2>
      <p className="text-gray-400 max-w-md mx-auto mb-8">
        Thank you for your input. Your workflow details have been saved securely to the database.
      </p>
      <button 
        onClick={onReturn}
        className="px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-all font-medium"
      >
        Return to Departments
      </button>
    </div>
  )
}

// ==========================================
// EXPORTED PAGE WRAPPER (REQUIRED FOR NEXT.JS SUSPENSE)
// ==========================================
export default function Page() {
  return (
    // FIX: Reduced lg:p-24 to lg:p-8 so it doesn't compress the main container on large screens
    <main className="min-h-screen p-4 md:p-8 lg:p-8 flex flex-col items-center relative overflow-hidden w-full max-w-[1920px] mx-auto">
      {/* Universal Background Orbs */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/30 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      
      {/* Suspense is required by Next.js when using useSearchParams() */}
      <Suspense fallback={
        <div className="h-screen flex items-center justify-center w-full">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }>
        <SystemRequirementsManager />
      </Suspense>
    </main>
  );
}