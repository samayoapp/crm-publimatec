'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import LeadModal from '@/components/LeadModal';
import WelcomeModal from '@/components/WelcomeModal';
import { SettingsProvider } from '@/lib/settingsContext';
import { crmCache } from '@/lib/crmCache';

interface CrmShellProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  children: React.ReactNode;
}

export default function CrmShell({ user, children }: CrmShellProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      crmCache.setUser(user);
    }
    // Precarga silenciosa en background después de montar la shell para navegación instantánea
    const timer = setTimeout(() => {
      crmCache.prefetchCoreData();
    }, 300);

    // Escuchar eventos de guardado para invalidar caché
    const handleInvalidate = () => {
      crmCache.invalidate('all');
    };
    window.addEventListener('crm-lead-saved', handleInvalidate);
    window.addEventListener('crm-proposal-saved', handleInvalidate);
    window.addEventListener('crm-contact-saved', handleInvalidate);

    // PopUp de Bienvenida / Frase al loguearse
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const hasWelcomeParam = urlParams.get('welcome') === '1' || urlParams.get('welcome') === 'true';
      const hasLoginFlag = sessionStorage.getItem('crm_show_welcome') === 'true';
      const hasCookieFlag = typeof document !== 'undefined' && document.cookie.includes('welcome_pending=1');

      if (hasWelcomeParam || hasLoginFlag || hasCookieFlag) {
        setIsQuoteModalOpen(true);
      }
    } catch (e) {}

    const handleOpenQuote = () => setIsQuoteModalOpen(true);
    window.addEventListener('crm-show-quote', handleOpenQuote);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('crm-lead-saved', handleInvalidate);
      window.removeEventListener('crm-proposal-saved', handleInvalidate);
      window.removeEventListener('crm-contact-saved', handleInvalidate);
      window.removeEventListener('crm-show-quote', handleOpenQuote);
    };
  }, [user]);

  const handleSaved = () => {
    crmCache.invalidate('all');
    window.dispatchEvent(new CustomEvent('crm-lead-saved'));
  };

  return (
    <SettingsProvider>
      <div className="flex min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 transition-colors">
        <Sidebar
          user={user}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onOpenQuote={() => setIsQuoteModalOpen(true)}
        />
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar
            user={user}
            onNewLeadClick={() => setIsModalOpen(true)}
            onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          />
          <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-y-auto min-w-0">
            {children}
          </main>
        </div>

        <LeadModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSaved={handleSaved}
          currentUser={user}
        />

        <WelcomeModal
          isOpen={isQuoteModalOpen}
          onClose={() => {
            setIsQuoteModalOpen(false);
            try {
              sessionStorage.removeItem('crm_show_welcome');
              document.cookie = 'welcome_pending=; path=/; max-age=0;';
              if (typeof window !== 'undefined' && window.location.search.includes('welcome=')) {
                const url = new URL(window.location.href);
                url.searchParams.delete('welcome');
                window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
              }
            } catch (e) {}
          }}
          userName={user.name}
        />
      </div>
    </SettingsProvider>
  );
}
