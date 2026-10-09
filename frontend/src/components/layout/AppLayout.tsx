import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { FloatingSpaceObjects } from '../background/FloatingSpaceObjects';
import { LogoAnimation } from '../ui/LogoAnimation';
import { DemoLoginModal } from '../ui/DemoLoginModal';

export const AppLayout: React.FC = () => {
  const [showDemoModal, setShowDemoModal] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#070B14] text-slate-100 relative selection:bg-blue-600 selection:text-white">
      {/* 1. Smooth Logo Entrance Animation on First Load */}
      <LogoAnimation />

      {/* 2. Floating Space Everyday Objects drifting in cosmic background */}
      <FloatingSpaceObjects />

      {/* 3. Navigation Header */}
      <Navbar onOpenDemoModal={() => setShowDemoModal(true)} />

      {/* 4. Active Route Page Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* 5. Footer */}
      <Footer />

      {/* 6. Quick Demo Persona Switcher Modal */}
      <DemoLoginModal
        isOpen={showDemoModal}
        onClose={() => setShowDemoModal(false)}
      />
    </div>
  );
};
