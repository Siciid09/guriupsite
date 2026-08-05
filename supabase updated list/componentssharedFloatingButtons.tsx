'use client';

import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

// You can create a dedicated SVG icon component for WhatsApp if you prefer
const WhatsAppIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zM8.531 16.35c.227.404.443.645.678.852.235.207.48.368.74.49.26.122.535.195.82.215.285.02.56-.01.815-.09.255-.08.495-.21.715-.38s.42-.38.59-.61c.17-.23.3-.49.39-.77.09-.28.13-.57.12-.86-.01-.29-.07-.57-.18-.83s-.27-.5-.47-.72c-.2-.22-.44-.41-.71-.57s-.57-.29-.-.-" />
  </svg>
);


export default function FloatingButtons() {
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = () => {
    if (window.pageYOffset > 300) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    window.addEventListener('scroll', toggleVisibility);
    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-center gap-4">
      <a
        href="https://wa.me/252634001122" // Replace with your WhatsApp number
        target="_blank"
        rel="noopener noreferrer"
        className="bg-green-500 text-white p-3.5 rounded-full shadow-lg hover:bg-green-600 transition-transform hover:scale-110"
        aria-label="Chat on WhatsApp"
      >
        <WhatsAppIcon />
      </a>
      {isVisible && (
        <button
          onClick={scrollToTop}
          className="bg-[#0164E5] text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-110 animate-fade-in-up"
          aria-label="Go to top"
        >
          <ArrowUp size={24} />
        </button>
      )}
    </div>
  );
}