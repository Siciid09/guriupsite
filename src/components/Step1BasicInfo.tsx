// app/[role]/components/Step1BasicInfo.tsx
import { useFormStore } from '@/app/lib/store';
import { User, Phone, Briefcase, ArrowRight } from 'lucide-react';

export default function Step1BasicInfo() {
  const { basicInfo, setBasicInfo, setStep } = useFormStore();
  
  const isValid = basicInfo.fullName.length > 2 && basicInfo.phone.length > 5 && basicInfo.jobTitle.length > 2;

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-2xl font-semibold mb-6">Let's start with your details</h2>
      
      <div className="space-y-6 flex-grow">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              value={basicInfo.fullName}
              onChange={(e) => setBasicInfo({ fullName: e.target.value })}
              className="glass-input w-full rounded-xl py-3 pl-12 pr-4"
              placeholder="e.g. Ahmed Aadan"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number</label>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="tel" 
              value={basicInfo.phone}
              onChange={(e) => setBasicInfo({ phone: e.target.value })}
              className="glass-input w-full rounded-xl py-3 pl-12 pr-4"
              placeholder="+252 XX XXX XXXX"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Exact Job Title / Role</label>
          <div className="relative">
            <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              value={basicInfo.jobTitle}
              onChange={(e) => setBasicInfo({ jobTitle: e.target.value })}
              className="glass-input w-full rounded-xl py-3 pl-12 pr-4"
              placeholder="e.g. Senior Registered Nurse"
            />
          </div>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-white/10 flex justify-end">
        <button
          disabled={!isValid}
          onClick={() => setStep(2)}
          className="flex items-center px-8 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-xl font-medium transition-all"
        >
          Next Step <ArrowRight className="ml-2 w-5 h-5" />
        </button>
      </div>
    </div>
  );
}