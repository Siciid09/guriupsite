'use client';

import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import Image from 'next/image';

const testimonialsData = [
  {
    name: 'Fatima Omar',
    location: 'Mogadishu',
    image: 'https://i.pravatar.cc/150?u=fatima',
    text: 'Using GuriUp was a game-changer. I found the perfect apartment in less than a week. Highly recommended!',
  },
  {
    name: 'Ahmed Ali',
    location: 'Hargeisa',
    image: 'https://i.pravatar.cc/150?u=ahmed',
    text: 'The hotel booking was seamless and the prices were the best I could find. The app is incredibly user-friendly.',
  },
  {
    name: 'Yusuf Ibrahim',
    location: 'Kismayo',
    image: 'https://i.pravatar.cc/150?u=yusuf',
    text: 'Found a great deal on a villa for our family vacation. The platform is transparent and trustworthy.',
  },
];

export default function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex(
        (prevIndex) => (prevIndex + 1) % testimonialsData.length
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-20 bg-slate-50">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-3xl font-bold text-black mb-10">
          What Our Clients Say
        </h2>

        <div className="relative max-w-2xl mx-auto h-72">
          {testimonialsData.map((testimonial, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                index === currentIndex ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <div className="relative w-20 h-20 mx-auto mb-4">
                <Image
                  src={testimonial.image}
                  alt={testimonial.name}
                  fill
                  className="rounded-full object-cover"
                />
              </div>

              <div className="flex justify-center text-amber-500 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={20} className="fill-current" />
                ))}
              </div>

              <p className="text-gray-700 italic text-lg mb-4">
                &quot;{testimonial.text}&quot;
              </p>

              <h4 className="font-bold text-lg text-black">
                {testimonial.name},{' '}
                <span className="font-normal text-gray-500">
                  {testimonial.location}
                </span>
              </h4>
            </div>
          ))}
        </div>

        <div className="flex justify-center gap-2 mt-4">
          {testimonialsData.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                index === currentIndex ? 'bg-[#0164E5] w-6' : 'bg-gray-300'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}