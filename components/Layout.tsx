import React from 'react';
import { AppView } from '../types';
import { LogOut, Home, UserCheck, ShieldCheck, Menu, X, Info } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentView: AppView;
  isLoggedIn?: boolean;
  onViewChange: (view: AppView) => void;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, isLoggedIn, onViewChange, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const navItems = [
    { id: 'General', label: 'Info Hub', icon: <Info size={18} /> },
    { id: 'Guest', label: 'My Portal', icon: <Home size={18} /> },
    { id: 'Staff', label: 'Crew Hub', icon: <UserCheck size={18} /> },
    { id: 'Admin', label: 'Admin', icon: <ShieldCheck size={18} /> },
  ];

  // Horizontal logo for headers
  const headerLogoPath = "/images/Senate Golf Logo (Horizontal).png";
  // Vertical white logo for dark backgrounds
  const logoPath = "/images/Senate Golf Logo_Vertical White (Transparent).png";

  return (
    <div className="flex flex-col min-h-screen bg-[#FFFDF5]">
      {/* Desktop Header - Updated to Theme Green */}
      <header className="hidden md:block bg-[#014227] text-white shadow-lg sticky top-0 z-50 border-b border-[#FFD700]/20">
        <div className="max-w-7xl mx-auto px-4 h-24 flex items-center justify-between">
          <div className="flex items-center space-x-4 cursor-pointer" onClick={() => onViewChange('General')}>
            <div className="h-16 py-2">
              <img
                src={headerLogoPath}
                alt="30th JCI ASPAC Senate Golf"
                className="h-full object-contain"
                onError={(e) => {
                  (e.target as any).style.display = 'none';
                  const fallback = (e.target as any).nextSibling;
                  if (fallback) (fallback as HTMLElement).style.display = 'flex';
                }}
              />
            </div>
          </div>

          <nav className="hidden md:flex space-x-8">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id as AppView)}
                className={`flex items-center space-x-2 text-xs font-black uppercase tracking-widest transition-all ${currentView === item.id ? 'text-[#FFD700] scale-105' : 'text-white/60 hover:text-white'}`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="flex items-center space-x-4">
            <button
              onClick={onLogout}
              className="hidden md:flex items-center space-x-1 bg-white/10 text-white hover:bg-black px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition border border-white/20 shadow-md"
            >
              <LogOut size={14} />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Top Header - Updated to Theme Orange */}
      <header className="md:hidden bg-[#014227] border-b border-white/10 px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-md">
        <div className="h-10 flex items-center" onClick={() => onViewChange('General')}>
          <img src={headerLogoPath} alt="Logo" className="h-full object-contain" />
        </div>

        {isLoggedIn && (
          <div className="flex items-center space-x-2 animate-in fade-in slide-in-from-right-2">
            <button
              onClick={onLogout}
              className="bg-white/10 text-white p-2.5 rounded-2xl border border-white/10 active:bg-red-600/20 active:border-red-600/30"
              title="Reset Session"
            >
              <LogOut size={20} />
            </button>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8">
        {children}
      </main>

      <footer className="md:hidden bg-[#014227] border-t border-[#FFD700]/30 sticky bottom-0 z-50 h-16 relative">
        <div className="flex justify-around items-end h-full w-full">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id as AppView)}
              className={`flex flex-col items-center justify-center w-16 h-16 rounded-full transition-all duration-300 transform ${currentView === item.id
                ? 'bg-[#014227] text-white -translate-y-4 shadow-[0_4px_10px_rgba(255,215,0,0.4)] border border-[#FFD700]'
                : 'text-white hover:text-white'
                }`}
            >
              {item.id === 'General' ? (
                <img
                  src="/images/Senate Golf Logo_Vertical White (Transparent).png"
                  alt="Logo"
                  className={`object-contain transition-all ${currentView === item.id ? 'w-12 h-12' : 'w-10 h-10 brightness-0 invert'}`}
                />
              ) : (
                <>{/* Crew Hub Icon fallback */}
                  {React.cloneElement(item.icon as React.ReactElement<any>, { size: currentView === item.id ? 24 : 22 })}
                  {currentView !== item.id && (
                    <span className="text-[9px] font-black mt-0.5 uppercase tracking-tighter">{item.label}</span>
                  )}
                </>
              )}
            </button>
          ))}
        </div>
      </footer>
    </div>
  );
};