import React, { useState } from 'react';

interface LoginProps {
  onLogin: (email: string, passportId: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [passportId, setPassportId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(email, passportId);
  };

  const logoPath = "/images/Senate Golf Logo_Vertical Black (Transparent).png";

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background Graphic elements inspired by the image branding */}

      <div className="max-w-md w-full bg-white rounded-[40px] p-10 relative z-10 border border-[#FFD700]/20">
        <div className="text-center mb-10">
          <div className="w-full h-44 flex items-center justify-center mb-6">
            <img
              src={logoPath}
              alt="30th ASPAC Senate Golf"
              className="h-full object-contain"
              onError={(e) => {
                (e.target as any).src = "/images/Senate Golf Logo_Vertical Black (Transparent).png";
              }}
            />
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.5em] mb-2">Registry Access</p>
          <div className="flex items-center justify-center space-x-2">
            <div className="h-[2px] w-8 bg-[#F58220]/30"></div>
            <p className="text-xs font-black text-[#014227] uppercase tracking-widest">Delegates Only</p>
            <div className="h-[2px] w-8 bg-[#F58220]/30"></div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-[#014227] uppercase tracking-widest ml-4">Registered Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-[25px] focus:ring-4 focus:ring-[#FFD700]/20 focus:border-[#FFD700] outline-none transition text-sm font-bold shadow-inner"
              placeholder="Enter your email..."
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-[#014227] uppercase tracking-widest ml-4">Passport / ID No.</label>
            <input
              type="text"
              value={passportId}
              onChange={(e) => setPassportId(e.target.value)}
              className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-[25px] focus:ring-4 focus:ring-[#FFD700]/20 focus:border-[#FFD700] outline-none transition text-sm font-bold shadow-inner"
              placeholder="As per registration..."
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#014227] hover:bg-black text-[#FFD700] font-black py-5 rounded-[25px] shadow-2xl transition transform active:scale-95 uppercase tracking-[0.3em] text-xs mt-4 border-b-4 border-amber-600"
          >
            Enter Hub
          </button>
        </form>

        <div className="mt-12 pt-8 border-t border-gray-50 flex flex-col items-center space-y-3 opacity-60">
          <div className="flex space-x-3">
            <div className="w-2 h-2 bg-[#F58220] rounded-full"></div>
            <div className="w-2 h-2 bg-[#000000] rounded-full"></div>
            <div className="w-2 h-2 bg-[#F58220] rounded-full"></div>
          </div>
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.4em]">Kuala Lumpur 2026</span>
        </div>
      </div>
    </div>
  );
};

export default Login;