'use client';

import { useState } from 'react';

export default function ContactForm() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, description }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong.');
      }
      
      setStatus('success');
      setMessage('Thank you! Your message has been sent.');
      setName('');
      setPhone('');
      setDescription('');
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Your Name</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-3 border rounded-lg" required />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Phone Number</label>
        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full p-3 border rounded-lg" required />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">What are you looking for?</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="w-full p-3 border rounded-lg" required></textarea>
      </div>
      <button type="submit" disabled={status === 'loading'} className="w-full bg-[#0164E5] text-white font-bold py-3 rounded-full hover:bg-blue-700 disabled:bg-gray-400">
        {status === 'loading' ? 'Sending...' : 'Send Message'}
      </button>

      {message && (
        <p className={`text-sm mt-4 text-center ${status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
          {message}
        </p>
      )}
    </form>
  );
}