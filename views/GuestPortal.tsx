
import React from 'react';
import { Guest, EventSchedule, PackagePermissions } from '../types';
import { MapPin, Calendar, Trophy, Coffee, AlertCircle, Shirt, Star } from 'lucide-react';

interface GuestPortalProps {
  guest: Guest;
  schedules: EventSchedule[];
  packagePermissions: PackagePermissions;
}

const GuestPortal: React.FC<GuestPortalProps> = ({ guest, schedules, packagePermissions }) => {
  // Filter schedules based on package permissions
  const filteredSchedules = schedules.filter(item => {
    const pkgInfo = packagePermissions[guest.package];
    return pkgInfo ? pkgInfo.permissions[item.category] : true;
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20 md:pb-0">
      {/* VIP Identity Header */}
      <div className="bg-[#014227] rounded-[40px] shadow-2xl p-10 text-center relative overflow-hidden border-b-8 border-[#FFD700]">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFD700]/10 rounded-full -mr-16 -mt-16"></div>
        <div className="absolute top-10 left-10 opacity-20"><Star size={40} className="text-[#FFD700]" /></div>
        
        <p className="text-[10px] font-black text-[#FFD700] uppercase tracking-[0.5em] mb-4">Official Delegate</p>
        <h2 className="text-3xl font-black text-white mb-2 tracking-tight">{guest.name}</h2>
        <div className="inline-flex flex-col items-center mb-10">
          <div className="inline-flex items-center space-x-2 px-6 py-2 bg-white/10 rounded-full text-xs font-black text-[#FFD700] border border-white/10 uppercase tracking-widest mb-2">
            <Star size={12} fill="#FFD700" />
            <span>{guest.package}</span>
          </div>
          <span className="text-[9px] font-bold text-white/60 uppercase tracking-widest">
            {packagePermissions[guest.package]?.category || 'Standard'} Category
          </span>
        </div>

        <div className="bg-white w-56 h-56 mx-auto rounded-[40px] shadow-inner flex items-center justify-center p-8 relative mb-6">
          <img 
            src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${guest.id}`} 
            alt="QR Code" 
            className="w-full h-full grayscale brightness-0"
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.05]">
            <span className="text-4xl font-black text-[#014227] rotate-[-45deg]">JCI KL</span>
          </div>
        </div>
        <p className="text-[10px] text-white/40 font-mono tracking-[0.4em] mb-2">{guest.id}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 flex flex-col items-center text-center group hover:border-[#FFD700] transition duration-500">
          <div className="w-12 h-12 bg-[#FFFBEB] text-[#014227] rounded-2xl flex items-center justify-center mb-3 group-hover:bg-[#FFD700] transition">
            <Coffee size={24} />
          </div>
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Dinner Table</span>
          <p className="text-3xl font-black text-[#014227]">{guest.dinnerTableNo || 'N/A'}</p>
        </div>
        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 flex flex-col items-center text-center group hover:border-[#FFD700] transition duration-500">
          <div className="w-12 h-12 bg-[#FFFBEB] text-[#014227] rounded-2xl flex items-center justify-center mb-3 group-hover:bg-[#FFD700] transition">
            <Trophy size={24} />
          </div>
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Golf Flight</span>
          <p className="text-3xl font-black text-[#014227]">{guest.golfFlightNo || 'None'}</p>
        </div>
      </div>

      <div className="space-y-4">
        <section className="bg-white rounded-[40px] shadow-sm border border-gray-100 p-8">
          <h3 className="text-xl font-black text-[#014227] flex items-center space-x-3 mb-8">
            <Trophy className="text-[#FFD700]" size={24} />
            <span>Profile & Logistics</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <InfoItem label="Origin" value={`${guest.nation} / ${guest.localOrg}`} />
            <InfoItem label="Merchandise" value={`${guest.tShirtSize} Size T-Shirt`} icon={<Shirt size={14} />} />
            {guest.isGolfParticipant && (
              <>
                <InfoItem label="Tee-off Time" value={guest.golfTeeOff || 'TBA'} />
                <InfoItem label="Buggy No" value={guest.golfBuggyNo || 'TBA'} />
              </>
            )}
            <InfoItem label="Hotel Arrangement" value={guest.hotelName || 'No Booking'} />
          </div>
        </section>

        {(guest.dietaryRequirements || guest.allergies) && (
          <section className="bg-red-50 rounded-[40px] border border-red-100 p-8">
            <h3 className="text-lg font-black flex items-center space-x-3 mb-4 text-red-900">
              <AlertCircle size={22} />
              <span>Safety & Dietary</span>
            </h3>
            <div className="space-y-4">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Catering Preference</span>
                <p className="text-sm font-bold text-red-900">{guest.dietaryRequirements || 'Standard'}</p>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Medical Warnings</span>
                <p className="text-sm font-bold text-red-900">{guest.allergies || 'None'}</p>
              </div>
            </div>
          </section>
        )}

        <section className="bg-white rounded-[40px] shadow-sm border border-gray-100 p-8">
          <h3 className="text-xl font-black text-[#014227] flex items-center space-x-3 mb-8">
            <Calendar className="text-[#FFD700]" size={24} />
            <span>Permitted Events</span>
          </h3>
          <div className="space-y-8">
            {filteredSchedules.length > 0 ? (
              filteredSchedules.slice(0, 10).map(item => (
                <div key={item.id} className="flex group">
                  <div className="w-20 shrink-0 relative">
                    <p className="text-[10px] font-black text-[#014227] opacity-60 uppercase">{item.time.split(': ')[0]}</p>
                    <p className="text-[11px] font-black text-[#014227]">{item.time}</p>
                    <div className="absolute top-5 left-0 bottom-[-32px] w-[2px] bg-gray-100 group-last:hidden"></div>
                  </div>
                  <div className="pb-8 pl-4 flex-1">
                    <h4 className="text-sm font-black text-gray-900 group-hover:text-[#014227] transition">{item.title}</h4>
                    <p className="text-[10px] text-gray-500 flex items-center mt-2 uppercase tracking-tight font-bold">
                      <MapPin size={10} className="mr-1 text-[#FFD700]" /> {item.location} • <span className="ml-1 text-[#014227] opacity-60">{item.category}</span>
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-10 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">No activities permitted for your package</p>
              </div>
            )}
          </div>
        </section>
      </div>

      <button className="w-full bg-[#014227] text-[#FFD700] p-6 rounded-[30px] flex items-center justify-center space-x-3 font-black shadow-2xl transition transform hover:-translate-y-1 active:scale-95 uppercase tracking-[0.3em] text-xs">
        <Star size={18} fill="#FFD700" />
        <span>Contact Event Concierge</span>
      </button>
    </div>
  );
};

const InfoItem: React.FC<{ label: string, value: string, icon?: React.ReactNode }> = ({ label, value, icon }) => (
  <div>
    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{label}</p>
    <p className="text-sm font-bold text-[#014227] flex items-center">
      {icon && <span className="mr-2 text-[#FFD700]">{icon}</span>}
      {value}
    </p>
  </div>
);

export default GuestPortal;
