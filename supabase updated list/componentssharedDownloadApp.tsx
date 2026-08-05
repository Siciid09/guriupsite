import { Download } from 'lucide-react';
import Link from 'next/link';

export default function DownloadApp() {
  return (
    <section className="bg-[#0164E5] text-white">
      <div className="container mx-auto px-6 py-20 text-center">
        <h2 className="text-4xl font-bold mb-4">Your Next Home, in Your Pocket</h2>
        <p className="text-blue-200 mb-8 max-w-md mx-auto">
          Get exclusive deals, manage bookings, and find properties faster with the free GuriUp mobile app.
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <Link 
            href="#" 
            className="bg-black text-white w-52 px-6 py-3 rounded-lg flex items-center justify-center gap-3 hover:bg-gray-800 transition-colors"
          >
            <Download size={20} />
            <div>
                <p className="text-xs text-left">Download on the</p>
                <p className="text-lg font-semibold">App Store</p>
            </div>
          </Link>
          <Link 
            href="#" 
            className="bg-black text-white w-52 px-6 py-3 rounded-lg flex items-center justify-center gap-3 hover:bg-gray-800 transition-colors"
          >
            <Download size={20} />
            <div>
                <p className="text-xs text-left">GET IT ON</p>
                <p className="text-lg font-semibold">Google Play</p>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}