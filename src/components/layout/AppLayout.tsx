import type { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

type AppLayoutProps = {
  children: ReactNode;
  showNavbar?: boolean;
  showFooter?: boolean;
};

export function AppLayout({
  children,
  showNavbar = true,
  showFooter = true,
}: AppLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {showNavbar && <Navbar />}
      <main className="flex-1 w-full" id="main-content">
        {children}
      </main>
      {showFooter && <Footer />}
    </div>
  );
}
