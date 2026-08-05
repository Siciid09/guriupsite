'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth, db } from '@/app/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { 
  CheckCircle, 
  MessageCircle, 
  User, 
  Building2, 
  Briefcase, 
  Phone, 
  MapPin, 
  Loader2,
  ArrowLeft,
  CreditCard
} from 'lucide-react';

export default function PaymentPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]"><Loader2 className="w-10 h-10 animate-spin text-[#0164E5]"/></div>}>
      <PaymentPageContent />
    </Suspense>
  );
}

function PaymentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // --- URL PARAMS ---
  const planId = searchParams.get('planId') || 'unknown_plan';
  const planName = searchParams.get('planName') || 'Premium Plan';
  const amount = searchParams.get('amount') || '0.00';

  // --- STATE ---
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '',
    businessType: 'Independent Agent',
    businessName: '',
    phone: '',
    location: ''
  });

  // --- 1. LOAD USER DATA ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            const role = data.role || 'user';
            
            let bType = 'Independent Agent';
            if (role === 'hoadmin') bType = 'Hotel / Accommodation';
            if (role === 'reagent') bType = 'Real Estate Agency';

            setFormData({
              name: data.name || user.displayName || '',
              businessType: bType,
              businessName: data.hotelName || data.agencyName || data.businessName || '',
              phone: data.phoneNumber || data.phone || data.whatsappNumber || '',
              location: data.city || data.area || ''
            });
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- 2. SUBMIT ORDER & OPEN WHATSAPP ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const uid = currentUser?.uid || 'guest';
    const supportPhone = "252653227084"; // Your WhatsApp Support Number

    try {
      // 1. Save to Firebase 'orders' collection
      const orderData = {
        userId: uid,
        planId: planId,
        planName: planName,
        amount: Number(amount),
        customerName: formData.name,
        businessName: formData.businessName,
        businessType: formData.businessType,
        contactPhone: formData.phone,
        location: formData.location,
        status: 'pending_whatsapp',
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'orders'), orderData);

      // 2. Format WhatsApp Message
      const message = 
        `Hello GuriUp Support! 👋\n\n` +
        `I would like to activate my Premium Plan manually. Here are my details:\n\n` +
        `🛒 *ORDER SUMMARY*\n` +
        `• Order ID: ${docRef.id.substring(0, 8).toUpperCase()}\n` +
        `• Plan Requested: ${planName}\n` +
        `• Price: $${amount}\n\n` +
        `👤 *MY DETAILS*\n` +
        `• Name: ${formData.name}\n` +
        `• Business Type: ${formData.businessType}\n` +
        `• Business Name: ${formData.businessName}\n` +
        `• Contact Phone: ${formData.phone}\n` +
        `• Location: ${formData.location}\n\n` +
        `Please guide me on how to complete the payment via Zaad/eDahab so my account can be verified and unlocked immediately. Thank you!`;

      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${supportPhone}?text=${encodedMessage}`;

      // 3. Open WhatsApp in new tab & show success modal
      window.open(whatsappUrl, '_blank');
      setShowSuccess(true);

    } catch (error) {
      console.error("Order submission failed:", error);
      alert("Failed to create order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="w-10 h-10 animate-spin text-[#0164E5]"/>
      </div>
    );
  }

  // --- SUCCESS MODAL ---
  if (showSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white p-10 rounded-[2rem] shadow-2xl max-w-md w-full text-center animate-in zoom-in-95 duration-500 border border-slate-100">
          <div className="w-24 h-24 bg-green-50 text-[#25D366] rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <CheckCircle size={48} />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-4">Order Sent!</h2>
          <p className="text-slate-500 mb-8 font-medium leading-relaxed">
            Our support team will process your payment on WhatsApp and upgrade your account immediately.
          </p>
          <button 
            onClick={() => router.push('/dashboard')} 
            className="w-full bg-[#0164E5] text-white py-4 rounded-xl font-bold hover:bg-blue-700 hover:scale-[1.02] transition-all shadow-lg shadow-blue-500/20"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      {/* Navbar */}
      <nav className="bg-white px-6 py-4 shadow-sm border-b border-slate-100 flex items-center sticky top-0 z-50">
        <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-full transition-colors mr-4">
          <ArrowLeft size={24} className="text-slate-700"/>
        </button>
        <h1 className="text-xl font-black text-slate-900">Manual Activation</h1>
      </nav>

      <div className="max-w-3xl mx-auto px-6 mt-8">
        
        {/* --- HEADER CARD --- */}
        <div className="bg-gradient-to-br from-[#0164E5] to-[#004CB3] rounded-[2rem] p-8 md:p-10 shadow-xl shadow-blue-500/20 text-white mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <p className="text-white/70 font-medium mb-1 uppercase tracking-wider text-xs">Selected Plan</p>
              <h2 className="text-3xl md:text-4xl font-black">{planName}</h2>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 px-6 py-4 rounded-2xl flex items-center gap-3">
              <CreditCard className="text-white/80" />
              <span className="text-3xl font-black">${Number(amount).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* --- FORM SECTION --- */}
        <div className="mb-6">
          <h3 className="text-xl font-black text-slate-900 mb-2">Confirm Your Details</h3>
          <p className="text-slate-500 text-sm font-medium">
            We will send this information to our support team via WhatsApp to instantly upgrade your account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-[2rem] p-6 md:p-8 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] border border-slate-100 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputGroup icon={User} label="Your Name" name="name" value={formData.name} onChange={handleChange} required />
            <InputGroup icon={Briefcase} label="Business Type" name="businessType" value={formData.businessType} onChange={handleChange} required />
          </div>

          <InputGroup icon={Building2} label="Business / Hotel Name" name="businessName" value={formData.businessName} onChange={handleChange} required />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputGroup icon={Phone} label="Contact Phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} required />
            <InputGroup icon={MapPin} label="City / Location" name="location" value={formData.location} onChange={handleChange} required />
          </div>

          <div className="pt-6 border-t border-slate-100">
            <button 
              type="submit" 
              disabled={submitting}
              className="w-full bg-[#25D366] text-white py-4 md:py-5 rounded-2xl font-black text-lg hover:bg-[#1dbf57] hover:scale-[1.01] transition-all shadow-xl shadow-green-500/20 flex items-center justify-center gap-3 disabled:opacity-70 disabled:hover:scale-100"
            >
              {submitting ? (
                <><Loader2 className="animate-spin"/> Processing...</>
              ) : (
                <><MessageCircle size={24} /> Send Order via WhatsApp</>
              )}
            </button>
            <p className="text-center text-slate-400 text-xs mt-4 font-medium flex items-center justify-center gap-1">
              Secured by GuriUp Manual Verification
            </p>
          </div>
        </form>

      </div>
    </div>
  );
}

// --- REUSABLE INPUT COMPONENT ---
function InputGroup({ icon: Icon, label, name, value, onChange, type = "text", required = false }: any) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#0164E5] transition-colors">
          <Icon size={20} strokeWidth={2.5} />
        </div>
        <input 
          type={type} 
          name={name} 
          value={value} 
          onChange={onChange} 
          required={required}
          className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-[#0164E5] transition-all hover:bg-slate-100" 
        />
      </div>
    </div>
  );
}