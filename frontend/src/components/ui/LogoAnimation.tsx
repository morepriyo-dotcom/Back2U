import React, { useState, useEffect } from 'react';

interface LogoAnimationProps {
  onComplete?: () => void;
}

export const LogoAnimation: React.FC<LogoAnimationProps> = ({ onComplete }) => {
  const [stage, setStage] = useState<'initial' | 'glow' | 'reveal' | 'fadeout'>('initial');
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Stage 1: initial appear
    const t1 = setTimeout(() => setStage('glow'), 400);
    // Stage 2: reveal tagline
    const t2 = setTimeout(() => setStage('reveal'), 1200);
    // Stage 3: fadeout
    const t3 = setTimeout(() => setStage('fadeout'), 2200);
    // Stage 4: remove from DOM
    const t4 = setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, 2800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onComplete]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[#050811] transition-opacity duration-700 ${
        stage === 'fadeout' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="relative flex flex-col items-center justify-center p-8 text-center select-none">
        {/* Glowing aura */}
        <div
          className={`absolute w-72 h-72 rounded-full bg-blue-600/20 blur-3xl transition-all duration-1000 ${
            stage !== 'initial' ? 'scale-125 opacity-70' : 'scale-75 opacity-0'
          }`}
        />

        {/* Orbit ring */}
        <div
          className={`absolute w-44 h-44 rounded-full border border-blue-500/30 transition-all duration-1000 ${
            stage !== 'initial' ? 'rotate-180 scale-100 opacity-60' : 'rotate-0 scale-50 opacity-0'
          }`}
        />

        {/* Logo Wordmark */}
        <div className="relative z-10 flex items-center gap-1.5 overflow-hidden">
          <span
            className={`text-5xl md:text-6xl font-black tracking-tight text-white transition-all duration-700 ${
              stage === 'initial' ? 'translate-y-12 opacity-0' : 'translate-y-0 opacity-100'
            }`}
          >
            Back
          </span>
          <span
            className={`text-5xl md:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-400 transition-all duration-700 delay-150 ${
              stage === 'initial' ? 'translate-y-12 opacity-0' : 'translate-y-0 opacity-100'
            }`}
          >
            2U
          </span>
        </div>

        {/* Tagline */}
        <div
          className={`relative z-10 mt-3 text-xs md:text-sm font-semibold tracking-widest uppercase text-blue-300/80 transition-all duration-700 ${
            stage === 'reveal' || stage === 'fadeout'
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-4'
          }`}
        >
          Lost Today. Found Tomorrow.
        </div>
      </div>
    </div>
  );
};
