'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './../../lib/firebase';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/'); // Redirect to homepage on successful login
    } catch (err: any) {
      setError('Invalid email or password. Please try again.');
    }
  };

  return (
    <>
      <h2 className="text-3xl font-bold text-center mb-6">Welcome Back</h2>
      <form onSubmit={handleLogin}>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border rounded-lg"
            required
          />
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border rounded-lg"
            required
          />
        </div>
        <button type="submit" className="w-full bg-[#0164E5] text-white font-bold py-3 rounded-full hover:bg-blue-700">
          Log In
        </button>
      </form>
      <p className="text-center text-sm mt-6">
        Don't have an account?{' '}
        <Link href="/signup" className="text-[#0164E5] hover:underline">
          Sign Up
        </Link>
      </p>
    </>
  );
}