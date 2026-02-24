'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { applyActionCode, getAuth } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const verifyEmail = async () => {
      const oobCode = searchParams.get('oobCode');

      if (!oobCode) {
        setStatus('error');
        return;
      }

      try {
        // 🔐 Verify with Firebase
        await applyActionCode(auth, oobCode);

        const user = auth.currentUser;

        // 🧠 Update Firestore manually (since you store it there)
        if (user) {
          await updateDoc(doc(db, 'users', user.uid), {
            emailVerified: true,
          });
        }

        setStatus('success');

        // ⏳ Redirect after 3 seconds
        setTimeout(() => {
          router.push('/login');
        }, 3000);

      } catch (error) {
        console.error('Verification error:', error);
        setStatus('error');
      }
    };

    verifyEmail();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="bg-white shadow-xl rounded-2xl p-10 text-center max-w-md w-full">

        {status === 'loading' && (
          <>
            <h2 className="text-2xl font-bold mb-4">Verifying your email...</h2>
            <p className="text-gray-500">Please wait a moment.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <h2 className="text-2xl font-bold text-green-600 mb-4">
              Email verified successfully ✅
            </h2>
            <p className="text-gray-500">
              Redirecting you to login...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              Invalid or expired link ❌
            </h2>
            <p className="text-gray-500">
              Please request a new verification email.
            </p>
          </>
        )}

      </div>
    </div>
  );
}