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
    { id: 'Staff', label: 'Staff Hub', icon: <UserCheck size={18} /> },
    { id: 'Admin', label: 'Admin', icon: <ShieldCheck size={18} /> },
  ];

  // Using the vertical white transparent logo for better contrast on dark green
  const logoPath = "/images/Senate Golf Logo_Vertical White (Transparent).png";
  const mobileLogoPath = "/images/Senate Golf Logo_Vertical Black (Transparent).png";

  return (
    <div className="flex flex-col min-h-screen bg-[#FFFDF5]">
      {/* Desktop Header - Nav back to Green, Logo area Orange */}
      <header className="hidden md:block bg-[#014227] text-white shadow-lg sticky top-0 z-50 border-b border-[#FFD700]/30">
        <div className="max-w-7xl mx-auto px-4 h-24 flex items-center justify-between">
          <div className="flex items-center h-full cursor-pointer" onClick={() => onViewChange('General')}>
            <div className="h-full bg-[#F58220] px-6 flex items-center shadow-inner">
              <img
                src={logoPath}
                alt="30th JCI ASPAC Senate Golf"
                className="h-20 object-contain"
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
                className={`flex items-center space-x-2 text-xs font-black uppercase tracking-widest transition-all ${currentView === item.id ? 'text-[#FFD700] scale-105' : 'text-gray-300 hover:text-white'}`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="flex items-center space-x-4">
            <button
              onClick={onLogout}
              className="hidden md:flex items-center space-x-1 bg-white/10 hover:bg-red-600/80 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition border border-white/20"
            >
              <LogOut size={14} />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Top Header - Nav Green, Logo block Orange */}
      <header className="md:hidden bg-[#014227] border-b border-[#FFD700]/20 flex items-center justify-between sticky top-0 z-50 shadow-md h-16">
        <div className="h-full bg-[#F58220] px-4 flex items-center shadow-md" onClick={() => onViewChange('General')}>
          <img src={logoPath} alt="Logo" className="h-10 object-contain" />
        </div>

        <div className="px-4 flex items-center">
          {!isLoggedIn ? (
            <button
              onClick={() => onViewChange('Guest')}
              className="bg-[#F58220] text-white px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center space-x-2 animate-in fade-in slide-in-from-right-2 border border-white/10"
            >
              <UserCheck size={14} />
              <span>Login</span>
            </button>
          ) : (
            <div className="flex items-center space-x-2 animate-in fade-in slide-in-from-right-2">
              <button
                onClick={onLogout}
                className="bg-white/10 text-white p-2.5 rounded-2xl border border-white/10 active:bg-red-600/20 active:border-red-600/30"
                title="Reset Session"
              >
                <LogOut size={20} />
              </button>
              <button
                onClick={() => onViewChange('Guest')}
                className={`p-2.5 rounded-2xl transition-all border shadow-sm ${currentView === 'Guest' ? 'bg-[#FFD700]/20 border-[#FFD700] text-[#FFD700]' : 'bg-white/5 border-white/5 text-gray-400'}`}
              >
                <UserCheck size={20} />
              </button>
            </div>
          )}
        </div>
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
                <>
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