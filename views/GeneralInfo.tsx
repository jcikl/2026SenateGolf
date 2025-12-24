
import React, { useState } from 'react';
import { EventSchedule, GolfGrouping, Guest } from '../types';
import { MapPin, Calendar, Utensils, Navigation, Landmark, Trophy, Coffee, Clock, Users } from 'lucide-react';

interface GeneralInfoProps {
  schedules: EventSchedule[];
  attractions: any[];
  diningGuide: any[];
  golfGroupings: GolfGrouping[];
  guests: Guest[];
}

const GeneralInfo: React.FC<GeneralInfoProps> = ({ schedules, attractions, diningGuide, golfGroupings, guests }) => {
  const [activeTab, setActiveTab] = useState<'Itinerary' | 'Travel' | 'Dining' | 'Day1Golf' | 'Day2Golf'>('Itinerary');

  const EVENT_DATES = [
    { label: 'Day 1', date: '27.03.2026' },
    { label: 'Day 2', date: '28.03.2026' },
    { label: 'Day 3', date: '29.03.2026' },
    { label: 'Day 4', date: '30.03.2026' },
    { label: 'Day 5', date: '31.03.2026' },
  ];

  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(2); // Default to Sunday (Day 3)

  const parseTime = (t: string) => {
    const match = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return 0;
    let h = parseInt(match[1]);
    const m = parseInt(match[2]);
    const period = match[3].toUpperCase();
    if (period === 'PM' && h < 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return h * 60 + m;
  };

  const filteredSchedules = schedules
    .filter(item => item.date === EVENT_DATES[selectedDayIdx].date)
    .sort((a, b) => parseTime(a.time) - parseTime(b.time));

  return (
    <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-700 pb-20 md:pb-0">
      {/* Styled Hero Banner */}
      <div className="relative h-64 md:h-80 rounded-[40px] overflow-hidden shadow-2xl group bg-gradient-to-b from-[#FFD700] via-[#FFA500] to-[#FF8C00]">
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/asfalt-dark.png')]"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-[120px] md:text-[200px] font-black text-white/20 select-none tracking-tighter">30</div>
        </div>

        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[#014227] flex flex-col items-center justify-center px-6 text-center">
          <div className="absolute -top-12 w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-2xl border-4 border-[#FFD700]">
            <Trophy className="text-[#014227] w-12 h-12" />
          </div>
          <div className="mt-8">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FFD700] mb-1">Kuala Lumpur {" >> "} Malaysia 2026</p>
            <h1 className="text-3xl md:text-5xl font-black tracking-widest text-white">JCI ASPAC SENATE GOLF</h1>
            <p className="text-xs md:text-sm text-white/70 font-bold mt-2 uppercase tracking-[0.2em]">27 - 31 MAR 2026</p>
          </div>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="flex bg-white rounded-3xl p-1.5 shadow-xl border border-gray-100 max-w-3xl mx-auto overflow-x-auto">
        {(['Itinerary', 'Travel', 'Dining', 'Day1Golf', 'Day2Golf'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 whitespace-nowrap ${activeTab === tab ? 'bg-[#014227] text-[#FFD700] shadow-lg' : 'text-gray-400 hover:text-[#014227]'}`}
          >
            {tab === 'Itinerary' && <Calendar size={14} />}
            {tab === 'Travel' && <Navigation size={14} />}
            {tab === 'Dining' && <Utensils size={14} />}
            {tab === 'Day1Golf' && <Trophy size={14} />}
            {tab === 'Day2Golf' && <Trophy size={14} />}
            <span>{tab === 'Day1Golf' ? 'Day 1 Golf' : tab === 'Day2Golf' ? 'Day 2 Golf' : tab}</span>
          </button>
        ))}
      </div>

      <div className="min-h-[400px]">
        {activeTab === 'Itinerary' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 border-l-4 border-[#FFD700]">
              <div>
                <h3 className="text-2xl font-black text-[#014227] tracking-tight">Official Itinerary</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{EVENT_DATES[selectedDayIdx].date}</p>
              </div>

              {/* Day Selector */}
              <div className="flex bg-[#FFFBEB] rounded-2xl p-1 border border-[#FFD700]/20 overflow-x-auto scrollbar-hide">
                {EVENT_DATES.map((day, idx) => (
                  <button
                    key={day.date}
                    onClick={() => setSelectedDayIdx(idx)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all whitespace-nowrap ${selectedDayIdx === idx ? 'bg-[#014227] text-[#FFD700] shadow-md' : 'text-[#014227]/50'}`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {filteredSchedules.length > 0 ? (
                filteredSchedules.map((item) => (
                  <div key={item.id} className="bg-white p-4 md:p-6 rounded-[32px] shadow-sm border border-gray-100 flex items-start space-x-3 md:space-x-4 group hover:shadow-xl hover:border-[#FFD700]/30 transition-all duration-500">
                    <div className="w-12 md:w-16 shrink-0 bg-[#FFFBEB] text-[#014227] rounded-2xl py-3 flex flex-col items-center justify-center group-hover:bg-[#014227] group-hover:text-[#FFD700] transition-all border border-[#FFD700]/20 px-2">
                      <Clock size={14} className="opacity-50 mb-1" />
                      <span className="text-[10px] font-black mt-1 text-center leading-tight">
                        {item.time}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-black text-gray-900 leading-tight group-hover:text-[#014227] transition">{item.title}</h4>

                      </div>
                      <p className="text-xs text-gray-500 font-medium mb-3">{item.description}</p>
                      <div className="flex items-center text-[10px] font-black text-[#014227] uppercase tracking-widest opacity-70 group-hover:opacity-100 transition">
                        <MapPin size={10} className="mr-1 text-[#FFD700]" />
                        {item.location}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-20 text-center bg-white rounded-[40px] border border-dashed border-gray-200">
                  <Calendar className="mx-auto text-gray-300 mb-4" size={48} />
                  <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">No major events for this date</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'Travel' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4">
            <h3 className="text-2xl font-black text-[#014227] px-4 border-l-4 border-[#FFD700]">KL Attractions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {attractions.map(place => (
                <div key={place.id} className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-gray-100 group hover:shadow-2xl transition-all duration-500">
                  <div className="h-44 relative">
                    <img src={place.img} alt={place.name} className="w-full h-full object-cover transition duration-700 group-hover:scale-110" />
                    <div className="absolute top-4 right-4 bg-[#FFD700] text-[#014227] px-2 py-1 rounded-lg text-[9px] font-black shadow-lg uppercase tracking-widest">
                      {place.dist}
                    </div>
                  </div>
                  <div className="p-4 md:p-6">
                    <h4 className="font-black text-gray-900 mb-2 text-lg">{place.name}</h4>
                    <p className="text-xs text-gray-500 font-medium leading-relaxed">{place.desc}</p>
                    <button className="mt-5 w-full bg-[#014227] text-[#FFD700] py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg hover:bg-black transition transform active:scale-95">
                      Get Directions
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'Dining' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4">
            <div className="bg-white rounded-[40px] p-10 shadow-xl border border-gray-100 text-center">
              <Utensils size={48} className="mx-auto text-[#FFD700] mb-6" />
              <h3 className="text-3xl font-black text-[#014227] mb-4">Culinary Experience</h3>
              <p className="text-gray-500 font-medium max-w-lg mx-auto mb-8">
                Malaysia is a food paradise. From the finest Halal banquets to international cuisines, your gastronomic journey is part of the 30th ASPAC experience.
              </p>

              <div className="grid grid-cols-1 gap-4 text-left">
                {diningGuide.map(item => (
                  <div key={item.id} className="p-4 md:p-5 bg-[#FFFBEB] rounded-3xl border border-[#FFD700]/20 flex items-center justify-between group hover:border-[#014227] transition">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-[#FFD700]/20 rounded-xl flex items-center justify-center text-[#014227]">
                        <Coffee size={20} />
                      </div>
                      <div>
                        <h4 className="font-black text-[#014227] uppercase tracking-widest text-xs">{item.name}</h4>
                        <p className="text-xs text-gray-600 mt-1">{item.desc}</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-black bg-white px-2 py-1 rounded-lg text-[#014227] border border-[#FFD700]/50">{item.type}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}


        {activeTab === 'Day1Golf' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4">
            <h3 className="text-2xl font-black text-[#014227] px-4 border-l-4 border-[#FFD700]">Day 1 Golf Drive Grouping</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {golfGroupings.filter(g => g.day === 1).sort((a, b) => a.flightNumber.localeCompare(b.flightNumber)).map(flight => (
                <div key={flight.id} className="bg-white rounded-[32px] p-4 md:p-6 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-500">
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
                    <div>
                      <h4 className="text-lg font-black text-[#014227]">{flight.flightNumber}</h4>
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Tee Time: {flight.teeTime}</p>
                    </div>
                    {flight.buggyNumber && (
                      <div className="bg-[#FFD700] text-[#014227] px-3 py-1 rounded-lg text-[9px] font-black uppercase">
                        Buggy {flight.buggyNumber}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    {flight.players.map((playerId, idx) => {
                      const player = guests.find(g => g.id === playerId);
                      return player ? (
                        <div key={playerId} className="flex items-center space-x-3 p-3 bg-[#FFFBEB] rounded-2xl border border-[#FFD700]/20">
                          <div className="w-8 h-8 bg-[#014227] text-[#FFD700] rounded-full flex items-center justify-center font-black text-xs">
                            {idx + 1}
                          </div>
                          <div className="flex-1">
                            <p className="font-black text-[#014227] text-sm">{player.name}</p>
                            <p className="text-[9px] text-gray-500 font-bold uppercase">{player.nation}</p>
                          </div>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              ))}
              {golfGroupings.filter(g => g.day === 1).length === 0 && (
                <div className="col-span-full py-20 text-center bg-white rounded-[40px] border border-dashed border-gray-200">
                  <Trophy className="mx-auto text-gray-300 mb-4" size={48} />
                  <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">No Golf Flights Scheduled</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'Day2Golf' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4">
            <h3 className="text-2xl font-black text-[#014227] px-4 border-l-4 border-[#FFD700]">Day 2 Golf Drive Grouping</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {golfGroupings.filter(g => g.day === 2).sort((a, b) => a.flightNumber.localeCompare(b.flightNumber)).map(flight => (
                <div key={flight.id} className="bg-white rounded-[32px] p-4 md:p-6 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-500">
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
                    <div>
                      <h4 className="text-lg font-black text-[#014227]">{flight.flightNumber}</h4>
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Tee Time: {flight.teeTime}</p>
                    </div>
                    {flight.buggyNumber && (
                      <div className="bg-[#FFD700] text-[#014227] px-3 py-1 rounded-lg text-[9px] font-black uppercase">
                        Buggy {flight.buggyNumber}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    {flight.players.map((playerId, idx) => {
                      const player = guests.find(g => g.id === playerId);
                      return player ? (
                        <div key={playerId} className="flex items-center space-x-3 p-3 bg-[#FFFBEB] rounded-2xl border border-[#FFD700]/20">
                          <div className="w-8 h-8 bg-[#014227] text-[#FFD700] rounded-full flex items-center justify-center font-black text-xs">
                            {idx + 1}
                          </div>
                          <div className="flex-1">
                            <p className="font-black text-[#014227] text-sm">{player.name}</p>
                            <p className="text-[9px] text-gray-500 font-bold uppercase">{player.nation}</p>
                          </div>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              ))}
              {golfGroupings.filter(g => g.day === 2).length === 0 && (
                <div className="col-span-full py-20 text-center bg-white rounded-[40px] border border-dashed border-gray-200">
                  <Trophy className="mx-auto text-gray-300 mb-4" size={48} />
                  <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">No Golf Flights Scheduled</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="bg-[#014227] rounded-[40px] p-6 md:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#FFD700]/10 rounded-full -mr-32 -mt-32"></div>
        <div className="flex items-center space-x-6">
          <div className="w-20 h-20 bg-[#FFD700] rounded-3xl flex items-center justify-center shadow-xl rotate-3">
            <Landmark className="text-[#014227]" size={40} />
          </div>
          <div>
            <h4 className="text-xl font-black text-[#FFD700] tracking-tight">Need Assistance?</h4>
            <p className="text-xs text-white/70 font-bold uppercase tracking-widest">JCI KL Concierge is available 24/7</p>
          </div>
        </div>
        <button className="bg-white text-[#014227] px-10 py-4 rounded-[20px] font-black text-xs uppercase tracking-[0.3em] shadow-xl hover:bg-[#FFD700] transition-all transform hover:-translate-y-1">
          Chat With Us
        </button>
      </div>
    </div>
  );
};

export default GeneralInfo;
