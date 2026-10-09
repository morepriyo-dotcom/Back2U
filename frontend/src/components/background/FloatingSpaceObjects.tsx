import React from 'react';

/**
 * FloatingSpaceObjects
 * Creates the illusion of lost everyday objects drifting in space like cosmic debris.
 * Features:
 * - Subtle dark navy / black silhouette fills
 * - Delicate electric-blue rim lighting along the edges
 * - Gentle drift and float animations
 * - Strictly non-interactive (pointer-events-none) and accessible (aria-hidden)
 */
export const FloatingSpaceObjects: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
    >
      {/* Background Star Dust / Subtle Particle Glow */}
      <div className="absolute top-[15%] left-[20%] w-1.5 h-1.5 rounded-full bg-blue-400 opacity-40 animate-pulse-subtle" />
      <div className="absolute top-[40%] right-[25%] w-1 h-1 rounded-full bg-cyan-300 opacity-30 animate-pulse-subtle" />
      <div className="absolute bottom-[20%] left-[30%] w-2 h-2 rounded-full bg-indigo-400 opacity-20 animate-pulse-subtle" />
      <div className="absolute top-[75%] right-[15%] w-1 h-1 rounded-full bg-blue-300 opacity-50 animate-pulse-subtle" />

      {/* 1. Water Bottle (Top-Left Edge - Drifting) */}
      <div
        className="absolute -top-6 left-6 md:left-12 opacity-60 animate-float-slow transition-transform duration-1000"
        style={{ animationDuration: '14s' }}
      >
        <svg
          width="110"
          height="160"
          viewBox="0 0 100 160"
          className="transform -rotate-12 drop-shadow-[0_0_8px_rgba(59,130,246,0.4)]"
        >
          <defs>
            <linearGradient id="rimBottle" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#1E3A8A" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          {/* Cap */}
          <rect x="36" y="10" width="28" height="14" rx="4" fill="#0B1325" stroke="url(#rimBottle)" strokeWidth="1.5" />
          <rect x="42" y="4" width="16" height="8" rx="2" fill="#080E1A" stroke="#38BDF8" strokeWidth="1" />
          {/* Body */}
          <path
            d="M28 32 C28 26, 36 24, 50 24 C64 24, 72 26, 72 32 L72 135 C72 145, 62 152, 50 152 C38 152, 28 145, 28 135 Z"
            fill="#091122"
            stroke="url(#rimBottle)"
            strokeWidth="1.5"
          />
          {/* Inner contour highlight line */}
          <path d="M33 40 L33 130" stroke="#3B82F6" strokeWidth="1" strokeOpacity="0.3" strokeDasharray="3 3" />
        </svg>
      </div>

      {/* 2. Over-Ear Headphones (Top-Right Edge) */}
      <div
        className="absolute top-10 right-4 md:right-16 opacity-55 animate-float-reverse transition-transform"
        style={{ animationDuration: '12s' }}
      >
        <svg
          width="120"
          height="120"
          viewBox="0 0 120 120"
          className="transform rotate-15 drop-shadow-[0_0_10px_rgba(59,130,246,0.35)]"
        >
          {/* Headband arch */}
          <path
            d="M25 70 C25 25, 95 25, 95 70"
            fill="none"
            stroke="#3B82F6"
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Left Earcup */}
          <rect x="15" y="65" width="20" height="35" rx="8" fill="#091122" stroke="#60A5FA" strokeWidth="1.5" />
          {/* Right Earcup */}
          <rect x="85" y="65" width="20" height="35" rx="8" fill="#091122" stroke="#60A5FA" strokeWidth="1.5" />
        </svg>
      </div>

      {/* 3. Keys with Keychain Ring (Far Left Mid) */}
      <div
        className="absolute top-[38%] -left-3 md:left-6 opacity-50 animate-float-medium"
        style={{ animationDuration: '9s' }}
      >
        <svg
          width="85"
          height="95"
          viewBox="0 0 90 100"
          className="transform rotate-45 drop-shadow-[0_0_8px_rgba(56,189,248,0.35)]"
        >
          {/* Key Ring */}
          <circle cx="45" cy="30" r="18" fill="none" stroke="#60A5FA" strokeWidth="2" />
          {/* Key 1 */}
          <path
            d="M45 48 L45 88 L52 88 L52 82 L48 80 L52 74 L48 72 L45 70"
            stroke="#38BDF8"
            strokeWidth="2"
            fill="none"
          />
          {/* Key 2 */}
          <path
            d="M38 42 L22 75 L16 75 L18 70 L24 64"
            stroke="#818CF8"
            strokeWidth="1.8"
            fill="none"
          />
        </svg>
      </div>

      {/* 4. Minimalist Wallet (Upper-Center Left, Far Deep) */}
      <div
        className="absolute top-[22%] left-[45%] opacity-25 animate-float-slow scale-75 hidden lg:block"
        style={{ animationDuration: '18s' }}
      >
        <svg
          width="80"
          height="60"
          viewBox="0 0 80 60"
          className="transform -rotate-25 drop-shadow-[0_0_6px_rgba(37,99,235,0.3)]"
        >
          <rect x="8" y="10" width="64" height="42" rx="6" fill="#080F1E" stroke="#3B82F6" strokeWidth="1.2" />
          <path d="M8 24 L72 24" stroke="#60A5FA" strokeWidth="1" strokeOpacity="0.4" />
          <circle cx="58" cy="33" r="3" fill="#60A5FA" />
        </svg>
      </div>

      {/* 5. AirPods / Wireless Earbuds Case (Far Right Mid) */}
      <div
        className="absolute top-[48%] -right-2 md:right-8 opacity-50 animate-float-slow"
        style={{ animationDuration: '11s' }}
      >
        <svg
          width="75"
          height="80"
          viewBox="0 0 80 80"
          className="transform -rotate-15 drop-shadow-[0_0_9px_rgba(59,130,246,0.4)]"
        >
          <rect x="18" y="15" width="46" height="52" rx="16" fill="#091325" stroke="#38BDF8" strokeWidth="1.5" />
          <line x1="18" y1="36" x2="64" y2="36" stroke="#60A5FA" strokeWidth="1.2" strokeOpacity="0.6" />
          <circle cx="41" cy="48" r="2.5" fill="#38BDF8" className="animate-pulse" />
        </svg>
      </div>

      {/* 6. Travel Backpack Silhouette (Bottom Left Edge) */}
      <div
        className="absolute bottom-16 -left-4 md:left-8 opacity-45 animate-float-reverse"
        style={{ animationDuration: '15s' }}
      >
        <svg
          width="115"
          height="125"
          viewBox="0 0 100 110"
          className="transform rotate-12 drop-shadow-[0_0_10px_rgba(59,130,246,0.35)]"
        >
          {/* Top handle */}
          <path d="M40 22 C40 12, 60 12, 60 22" fill="none" stroke="#3B82F6" strokeWidth="2" />
          {/* Bag Body */}
          <path
            d="M25 35 C25 22, 75 22, 75 35 L80 92 C80 98, 72 102, 50 102 C28 102, 20 98, 20 92 Z"
            fill="#080E1C"
            stroke="#60A5FA"
            strokeWidth="1.5"
          />
          {/* Front pocket */}
          <rect x="30" y="58" width="40" height="32" rx="6" fill="#0A1428" stroke="#38BDF8" strokeWidth="1.2" />
        </svg>
      </div>

      {/* 7. Smartphone Silhouette (Bottom Right Edge) */}
      <div
        className="absolute bottom-12 right-6 md:right-20 opacity-50 animate-float-medium"
        style={{ animationDuration: '10s' }}
      >
        <svg
          width="75"
          height="120"
          viewBox="0 0 65 110"
          className="transform -rotate-12 drop-shadow-[0_0_9px_rgba(59,130,246,0.4)]"
        >
          <rect x="6" y="8" width="53" height="94" rx="10" fill="#080F1E" stroke="#3B82F6" strokeWidth="1.5" />
          {/* Dynamic Island pill */}
          <rect x="24" y="14" width="17" height="4" rx="2" fill="#1E293B" stroke="#60A5FA" strokeWidth="0.8" />
          {/* Screen subtle edge */}
          <rect x="10" y="24" width="45" height="72" rx="4" fill="#050912" stroke="#1D4ED8" strokeWidth="0.8" strokeOpacity="0.4" />
        </svg>
      </div>

      {/* 8. Classic Sunglasses (Bottom Center Far Deep) */}
      <div
        className="absolute bottom-6 left-[48%] opacity-30 animate-float-slow hidden md:block"
        style={{ animationDuration: '13s' }}
      >
        <svg
          width="90"
          height="45"
          viewBox="0 0 90 45"
          className="transform rotate-6 drop-shadow-[0_0_6px_rgba(37,99,235,0.3)]"
        >
          <rect x="8" y="10" width="30" height="22" rx="8" fill="#070C18" stroke="#3B82F6" strokeWidth="1.5" />
          <rect x="52" y="10" width="30" height="22" rx="8" fill="#070C18" stroke="#3B82F6" strokeWidth="1.5" />
          {/* Bridge */}
          <path d="M38 16 C42 13, 48 13, 52 16" fill="none" stroke="#60A5FA" strokeWidth="1.5" />
        </svg>
      </div>
    </div>
  );
};
