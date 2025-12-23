import React from 'react';
import { AppView } from '../types';
import { LogOut, Home, UserCheck, ShieldCheck, Menu, X, Info } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, onViewChange, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const navItems = [
    { id: 'General', label: 'Info Hub', icon: <Info size={18} /> },
    { id: 'Guest', label: 'My Portal', icon: <Home size={18} /> },
    { id: 'Staff', label: 'Staff Hub', icon: <UserCheck size={18} /> },
    { id: 'Admin', label: 'Admin', icon: <ShieldCheck size={18} /> },
  ];

  // Using the requested vertical black transparent logo
  const logoPath = "images/Senate Golf Logo (Horizontal).png";

  return (
    <div className="flex flex-col min-h-screen bg-[#FFFDF5]">
      {/* Header */}
      <header className="bg-[#014227] text-white shadow-lg sticky top-0 z-50 border-b border-[#FFD700]/30">
        <div className="max-w-7xl mx-auto px-4 h-24 flex items-center justify-between">
          <div className="flex items-center space-x-4 cursor-pointer" onClick={() => onViewChange('General')}>
            <div className="h-20 py-2">
              <img
                src={logoPath}
                alt="30th ASPAC Senate Golf"
                className="h-full object-contain filter brightness-0 invert"
                onError={(e) => {
                  // Fallback to text if image fails
                  (e.target as any).style.display = 'none';
                  const fallback = (e.target as any).nextSibling;
                  if (fallback) (fallback as HTMLElement).style.display = 'flex';
                }}
              />
              <div className="hidden flex-col">
                <h1 className="text-sm font-black tracking-widest leading-none">30TH ASPAC</h1>
                <h2 className="text-[10px] font-bold text-[#FFD700] tracking-tighter uppercase">Senate Golf KL 2026</h2>
              </div>
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
            <button className="md:hidden text-[#FFD700]" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-[#00331e] px-4 pt-2 pb-8 flex flex-col space-y-4 animate-in slide-in-from-top duration-300">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => { onViewChange(item.id as AppView); setIsMenuOpen(false); }}
                className={`text-left py-3 border-b border-white/5 flex items-center space-x-3 text-sm font-black uppercase tracking-widest ${currentView === item.id ? 'text-[#FFD700]' : 'text-gray-300'}`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
            <button onClick={onLogout} className="text-left py-4 text-red-400 font-black text-xs uppercase tracking-widest">Clear Session</button>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8">
        {children}
      </main>

      {/* Mobile Sticky Nav */}
      <footer className="md:hidden bg-white border-t border-gray-200 sticky bottom-0 p-2 flex justify-around items-center shadow-2xl z-50">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id as AppView)}
            className={`flex flex-col items-center p-2 rounded-2xl transition-all ${currentView === item.id ? 'text-[#014227] bg-[#FFD700]/10 scale-110' : 'text-gray-400'}`}
          >
            {React.cloneElement(item.icon as React.ReactElement<any>, { size: 20 })}
            <span className="text-[9px] font-black mt-1 uppercase tracking-tighter">{item.label}</span>
          </button>
        ))}
      </footer>
    </div>
  );
};