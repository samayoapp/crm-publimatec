'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import LeadModal from '@/components/LeadModal';

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

  const handleSaved = () => {
    // Dispatch custom event or reload current page
    window.dispatchEvent(new CustomEvent('crm-lead-saved'));
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 transition-colors">
      <Sidebar
        user={user}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          title="PixelMedia CRM"
          subtitle="Inversiones Publimatec S.A. de C.V."
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
    </div>
  );
}
