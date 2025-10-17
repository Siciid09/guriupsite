'use client';

import type { Property } from '@/types';
import { MessageSquare, Calendar } from 'lucide-react';

export function FloatingActionBar({ property }: { property: Property }) {
  const tourMessage = `Salaam, I would like to request a tour for the property: '${property.title}'. Please let me know the available times.`;
  // You would add the agent's phone number to the property data to make this fully dynamic
  const whatsappLink = `https://wa.me/?text=${encodeURIComponent(tourMessage)}`;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white shadow-top p-3 border-t z-40 lg:hidden">
      <div className="flex items-center gap-4 max-w-lg mx-auto">
        <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="flex-1 text-center bg-blue-100 text-[#0164E5] font-bold py-3 rounded-xl flex items-center justify-center gap-2">
          <MessageSquare size={20} /> Chat
        </a>
        <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="flex-1 text-center bg-[#0164E5] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2">
          <Calendar size={20} /> Request a Tour
        </a>
      </div>
    </div>
  );
}