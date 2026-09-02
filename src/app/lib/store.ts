// src/lib/store.ts
import { create } from 'zustand';

interface FormState {
  step: number;
  basicInfo: {
    fullName: string;
    phone: string;
    jobTitle: string;
  };
  answers: Record<string, string>;
  missingRequirements: string;
  attachments: File[]; // <-- Now supports real files
  setStep: (step: number) => void;
  setBasicInfo: (info: Partial<FormState['basicInfo']>) => void;
  setAnswer: (questionId: string, answer: string) => void;
  setMissingRequirements: (val: string) => void;
  addAttachments: (files: File[]) => void;
  removeAttachment: (index: number) => void;
  resetForm: () => void;
}

export const useFormStore = create<FormState>((set) => ({
  step: 1,
  basicInfo: { fullName: '', phone: '', jobTitle: '' },
  answers: {},
  missingRequirements: '',
  attachments: [], // Start with empty array
  
  setStep: (step) => set({ step }),
  setBasicInfo: (info) => set((state) => ({ basicInfo: { ...state.basicInfo, ...info } })),
  setAnswer: (questionId, answer) => set((state) => ({ 
    answers: { ...state.answers, [questionId]: answer } 
  })),
  setMissingRequirements: (missingRequirements) => set({ missingRequirements }),
  
  addAttachments: (files) => set((state) => ({ attachments: [...state.attachments, ...files] })),
  removeAttachment: (index) => set((state) => ({ 
    attachments: state.attachments.filter((_, i) => i !== index) 
  })),
  
  resetForm: () => set({ 
    step: 1, 
    basicInfo: { fullName: '', phone: '', jobTitle: '' }, 
    answers: {}, 
    missingRequirements: '',
    attachments: [] 
  }),
}));