
import React, { useState, useEffect } from 'react';
import { EventSchedule, GolfGrouping, Guest } from '../types';
import { MapPin, Calendar, Utensils, Navigation, Landmark, Trophy, Coffee, Clock, Users, Phone, Globe, Star, Megaphone } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectCube, Pagination } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-cube';
import 'swiper/css/pagination';

interface GeneralInfoProps {
  schedules: EventSchedule[];
  attractions: any[];
  diningGuide: any[];
  golfGroupings: GolfGrouping[];
  guests: Guest[];
  sponsorships: any[];
}

const GeneralInfo: React.FC<GeneralInfoProps> = ({ schedules, attractions, diningGuide, golfGroupings, guests, sponsorships }) => {
  const [activeTab, setActiveTab] = useState<'Itinerary' | 'Nearby' | 'Golf' | 'Sponsors'>('Itinerary');
  const [selectedGolfDay, setSelectedGolfDay] = useState<number>(1);

  const EVENT_DATES = [
    { label: 'Day 1', date: '27.03.2026' },
    { label: 'Day 2', date: '28.03.2026' },
    { label: 'Day 3', date: '29.03.2026' },
    { label: 'Day 4', date: '30.03.2026' },
    { label: 'Day 5', date: '31.03.2026' },
  ];

  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(2); // Default to Sunday (Day 3)
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});
  const [nearbyFilter, setNearbyFilter] = useState('All');

  const getLinkPreview = (url: string) => {
    if (!url) return null;
    // If it's a direct image URL (basic check), return as is
    if (url.match(/\.(jpeg|jpg|gif|png|webp|svg)/i)) return url;
    // Otherwise use microlink to get the metadata thumbnail image (og:image)
    return `https://api.microlink.io/?url=${encodeURIComponent(url)}&embed=image.url`;
  };
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
      {/* Sponsor Banner (Swiper 3D Cube Powered) */}
      <div className="relative h-72 md:h-80 rounded-[40px] overflow-hidden shadow-2xl group border-4 border-[#014227] bg-[#014227]">
        {sponsorships && sponsorships.length > 0 ? (
          <Swiper
            modules={[Autoplay, EffectCube, Pagination]}
            effect="cube"
            grabCursor={true}
            cubeEffect={{
              shadow: true,
              slideShadows: true,
              shadowOffset: 20,
              shadowScale: 2,
            }}
            autoplay={{
              delay: 5000,
              disableOnInteraction: false,
            }}
            pagination={{
              clickable: true,
            }}
            loop={true}
            className="w-full h-full"
          >
            {sponsorships.map((sponsor) => (
              <SwiperSlide key={sponsor.id}>
                <div className="relative w-full h-full flex flex-col items-center p-6 md:p-10">
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] pointer-events-none"></div>

                  {/* Tier Badge */}
                  <div className="absolute top-6 left-6 flex items-center gap-2 bg-[#FFD700] text-[#014227] px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg z-20">
                    <Star size={12} className="fill-[#014227]" />
                    <span>{sponsor.tier} Sponsor</span>
                  </div>

                  {/* Logo Container - Filling available space */}
                  <div className="relative w-full flex-1 flex items-center justify-center mb-4 z-10 min-h-0 pt-12 md:pt-14 px-8 md:px-12">
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-32 bg-[#FFD700]/10 blur-3xl rounded-full pointer-events-none"></div>
                    <div className="relative h-full w-full flex items-center justify-center p-4">
                      <img
                        src={sponsor.logo}
                        alt={sponsor.name}
                        className="max-h-[140px] md:max-h-[180px] w-auto max-w-full object-contain filter drop-shadow-2xl"
                      />
                    </div>
                  </div>

                  {/* Text Info - Pushed to bottom */}
                  <div className="text-center z-10 max-w-xl pb-4 flex flex-col items-center">
                    {sponsor.website ? (
                      <button
                        onClick={() => window.open(sponsor.website, '_blank')}
                        className="group/btn flex items-center gap-2 mb-1"
                      >
                        <h2 className="text-xl md:text-2xl font-black text-[#FFD700] uppercase tracking-tight line-clamp-1 group-hover/btn:underline decoration-2 underline-offset-4">
                          {sponsor.name}
                        </h2>
                        <span className="text-[#FFD700] font-black text-sm md:text-lg animate-pulse">»</span>
                      </button>
                    ) : (
                      <h2 className="text-xl md:text-2xl font-black text-[#FFD700] mb-1 uppercase tracking-tight line-clamp-1">
                        {sponsor.name}
                      </h2>
                    )}
                    <p className="text-[9px] md:text-[10px] text-white/50 font-bold uppercase tracking-[0.2em] leading-relaxed line-clamp-1 opacity-80">
                      {sponsor.description}
                    </p>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        ) : (
          /* Fallback when no sponsors */
          <div className="absolute inset-0 bg-gradient-to-b from-[#014227] to-black flex items-center justify-center">
            <div className="text-center">
              <Megaphone className="text-[#FFD700] w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-[#FFD700] font-black uppercase tracking-[0.3em] text-xs">JCI ASPAC SENATE GOLF</p>
            </div>
          </div>
        )}
      </div>

      {/* Primary Navigation Tabs */}
      <div className="flex bg-white rounded-3xl p-1.5 shadow-xl border border-gray-100 max-w-3xl mx-auto overflow-x-auto">
        {(['Itinerary', 'Nearby', 'Golf', 'Sponsors'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 whitespace-nowrap ${activeTab === tab ? 'bg-[#014227] text-[#FFD700] shadow-lg' : 'text-gray-400 hover:text-[#014227]'}`}
          >
            {tab === 'Itinerary' && <Calendar size={14} />}
            {tab === 'Nearby' && <MapPin size={14} />}
            {tab === 'Golf' && <Trophy size={14} />}
            {tab === 'Sponsors' && <Megaphone size={14} />}
            <span>{tab === 'Golf' ? 'Golf' : tab}</span>
          </button>
        ))}
      </div>

      <div>
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

        {activeTab === 'Nearby' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4">
            <div className="px-4 border-l-4 border-[#FFD700] space-y-1">
              <h3 className="text-2xl font-black text-[#014227]">Nearby Places</h3>
              <p className="text-[10px] md:text-sm text-gray-500 font-medium max-w-lg leading-relaxed">
                Discover the vibrant heart of Malaysia. Everything you need—from landmarks to dining—is right here.
              </p>
            </div>

            {/* Filter Bar */}
            <div className="px-4 md:px-0">
              <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                {['All', ...Array.from(new Set([...attractions, ...diningGuide].map(p => p.type || 'Other'))).sort()].map(type => (
                  <button
                    key={type}
                    onClick={() => setNearbyFilter(type)}
                    className={`px-4 py-1.5 rounded-full text-[10px] md:text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all ${nearbyFilter === type ? 'bg-[#014227] text-[#FFD700] shadow-md transform scale-105' : 'bg-white text-gray-400 border border-gray-100 hover:border-[#014227] hover:text-[#014227]'}`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 px-4 md:px-0">
              {[...attractions, ...diningGuide]
                .filter(place => nearbyFilter === 'All' || (place.type || 'Other') === nearbyFilter)
                .map(place => (
                  <div key={place.id} className="h-full bg-white rounded-[24px] md:rounded-[32px] overflow-hidden shadow-sm border border-gray-100 group hover:shadow-xl transition-all duration-500 flex flex-row md:flex-col items-stretch">
                    <div className="w-28 md:w-full md:h-32 shrink-0 relative bg-gray-50 flex items-center justify-center overflow-hidden">
                      {place.img && !imgErrors[place.id] ? (
                        <img
                          src={getLinkPreview(place.img) || ''}
                          alt={place.name}
                          className="w-full h-full object-cover transition duration-700 group-hover:scale-110"
                          onError={() => setImgErrors(prev => ({ ...prev, [place.id]: true }))}
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-gray-300">
                          <Landmark size={32} className="opacity-20" />
                          <span className="text-[8px] font-black uppercase tracking-tighter opacity-10">Map Link</span>
                        </div>
                      )}
                      <div className="absolute top-2 right-2 md:top-4 md:right-4 bg-[#FFD700] text-[#014227] px-1.5 py-0.5 rounded-lg text-[7px] md:text-[9px] font-black shadow-lg uppercase tracking-widest">
                        {place.dist}
                      </div>
                    </div>
                    <div className="flex-1 p-3 md:p-6 flex flex-col justify-between min-w-0">
                      <div className="space-y-2">
                        <div>
                          {place.type && <span className="text-[7px] md:text-[9px] font-black uppercase text-[#014227]/40 tracking-wider mb-0.5 block">{place.type}</span>}
                          <h4 className="font-black text-gray-900 text-sm md:text-lg truncate md:whitespace-normal">{place.name}</h4>
                        </div>

                        <div className="space-y-1">
                          {place.address && (
                            <div className="flex items-start gap-1.5 text-[8px] md:text-[10px] text-gray-500 font-medium">
                              <MapPin size={10} className="shrink-0 text-[#FFD700] mt-0.5" />
                              <span>{place.address}</span>
                            </div>
                          )}
                          <div className="flex flex-wrap gap-2 md:gap-3">
                            {place.phone && (
                              <div className="flex items-center gap-1 text-[8px] md:text-[10px] text-gray-500 font-medium">
                                <Phone size={10} className="shrink-0 text-[#FFD700]" />
                                <span>{place.phone}</span>
                              </div>
                            )}
                            {place.hours && (
                              <div className="flex items-center gap-1 text-[8px] md:text-[10px] text-gray-500 font-medium">
                                <Clock size={10} className="shrink-0 text-[#FFD700]" />
                                <span>{place.hours}</span>
                              </div>
                            )}
                          </div>
                          {place.website && (
                            <div className="flex items-center gap-1.5 text-[8px] md:text-[10px] text-[#014227] font-black uppercase tracking-tighter">
                              <Globe size={10} className="shrink-0 text-[#FFD700]" />
                              <button onClick={() => window.open(place.website, '_blank')} className="hover:underline">Visit Website</button>
                            </div>
                          )}
                        </div>

                        <p className="text-[9px] md:text-xs text-gray-400 font-medium leading-relaxed line-clamp-1 md:line-clamp-2 md:pt-1">{place.desc}</p>
                      </div>
                      <button
                        onClick={() => place.img && window.open(place.img, '_blank')}
                        className="mt-3 md:mt-5 w-full bg-[#014227] text-[#FFD700] py-2 md:py-3 rounded-xl md:rounded-2xl text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] shadow-sm hover:bg-black transition transform active:scale-95"
                      >
                        Get Directions
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}




        {activeTab === 'Golf' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-4 border-l-4 border-[#FFD700]">
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-[#014227]">Tournament Grouping</h3>
                <p className="text-[10px] md:text-sm text-gray-500 font-medium max-w-lg leading-relaxed">
                  View your tournament groupings, tee times, and buggy assignments for the ASPAC Senate Golf competition.
                </p>
              </div>

              {/* Day Selector */}
              <div className="flex bg-[#FFFBEB] rounded-2xl p-1 border border-[#FFD700]/20 shrink-0">
                {[1, 2].map(day => (
                  <button
                    key={day}
                    onClick={() => setSelectedGolfDay(day)}
                    className={`px-6 py-2 rounded-xl text-[10px] font-black transition-all ${selectedGolfDay === day ? 'bg-[#014227] text-[#FFD700] shadow-md' : 'text-[#014227]/50 uppercase'}`}
                  >
                    DAY {day}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 px-4 md:px-0">
              {golfGroupings
                .filter(g => g.day === selectedGolfDay)
                .sort((a, b) => a.flightNumber.localeCompare(b.flightNumber))
                .map(flight => (
                  <div key={flight.id} className="bg-white rounded-[24px] md:rounded-[32px] p-4 md:p-6 shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-500">
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
                      <div>
                        <h4 className="text-base md:text-lg font-black text-[#014227]">{flight.flightNumber}</h4>
                        <p className="text-[9px] md:text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Tee Time: {flight.teeTime}</p>
                      </div>
                      {flight.buggyNumber && (
                        <div className="bg-[#FFD700] text-[#014227] px-2 md:px-3 py-1 rounded-lg text-[8px] md:text-[9px] font-black uppercase shadow-sm">
                          Buggy {flight.buggyNumber}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      {flight.players.map((playerId, idx) => {
                        const player = guests.find(g => g.id === playerId);
                        return player ? (
                          <div key={playerId} className="flex items-center space-x-3 p-2 md:p-3 bg-[#FFFBEB] rounded-xl md:rounded-2xl border border-[#FFD700]/10 hover:border-[#FFD700]/30 transition">
                            <div className="w-6 h-6 md:w-8 md:h-8 bg-[#014227] text-[#FFD700] rounded-full flex items-center justify-center font-black text-[10px] md:text-xs">
                              {idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-black text-[#014227] text-xs md:text-sm truncate">{player.name}</p>
                              <p className="text-[8px] md:text-[9px] text-gray-400 font-bold uppercase tracking-wider">{player.country}</p>
                            </div>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                ))}
              {golfGroupings.filter(g => g.day === selectedGolfDay).length === 0 && (
                <div className="col-span-full py-20 text-center bg-white rounded-[40px] border border-dashed border-gray-200">
                  <Trophy className="mx-auto text-gray-300 mb-4" size={48} />
                  <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">No Golf Flights Scheduled</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {activeTab === 'Sponsors' && (
        <div className="space-y-12 animate-in slide-in-from-bottom-4">
          <div className="px-4 border-l-4 border-[#FFD700] space-y-1">
            <h3 className="text-2xl font-black text-[#014227]">Our Partners</h3>
            <p className="text-[10px] md:text-sm text-gray-500 font-medium max-w-lg leading-relaxed">
              We extend our deepest gratitude to the visionary organizations making this event possible.
            </p>
          </div>

          {(() => {
            const grouped = sponsorships.reduce((acc, s) => {
              const tier = s.tier || 'Other';
              if (!acc[tier]) acc[tier] = [];
              acc[tier].push(s);
              return acc;
            }, {} as Record<string, any[]>);

            // Sort tiers: Diamond, Platinum, Gold, Silver, then others
            const tierOrder = ['Diamond', 'Platinum', 'Gold', 'Silver'];
            const sortedTiers = Object.keys(grouped).sort((a, b) => {
              const idxA = tierOrder.indexOf(a);
              const idxB = tierOrder.indexOf(b);
              if (idxA !== -1 && idxB !== -1) return idxA - idxB;
              if (idxA !== -1) return -1;
              if (idxB !== -1) return 1;
              return a.localeCompare(b);
            });

            return sortedTiers.map(tier => (
              <div key={tier} className="space-y-6">
                <div className="flex items-center gap-4 px-4">
                  <div className="h-px bg-gray-100 flex-1"></div>
                  <div className="flex items-center gap-2 bg-[#FFD700] text-[#014227] px-6 py-2 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-sm">
                    <Star size={12} className="fill-[#014227]" />
                    <span>{tier}</span>
                  </div>
                  <div className="h-px bg-gray-100 flex-1"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 px-4 md:px-0 auto-rows-fr">
                  {grouped[tier].map(sponsor => (
                    <div key={sponsor.id} className="h-full bg-white rounded-[24px] md:rounded-[32px] overflow-hidden shadow-sm border border-gray-100 group hover:shadow-xl transition-all duration-500 flex flex-row md:flex-col items-stretch">
                      <div className="w-28 md:w-full md:h-32 shrink-0 relative bg-gray-50 flex items-center justify-center overflow-hidden">
                        <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] pointer-events-none"></div>
                        <img
                          src={getLinkPreview(sponsor.website || sponsor.logo) || ''}
                          alt={sponsor.name}
                          className="w-full h-full object-cover transition duration-700 group-hover:scale-110"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            // If the current src is already the logo, don't try again to avoid infinite loop
                            if (sponsor.logo && target.src !== sponsor.logo) {
                              target.src = sponsor.logo;
                            }
                          }}
                        />
                      </div>
                      <div className="flex-1 p-3 md:p-6 flex flex-col justify-between min-w-0">
                        <div className="space-y-1">
                          <span className="text-[7px] md:text-[9px] font-black uppercase text-[#014227]/40 tracking-wider block">Partner</span>
                          <h4 className="font-black text-gray-900 text-sm md:text-lg truncate md:whitespace-normal">{sponsor.name}</h4>
                          <p className="text-[9px] md:text-xs text-gray-400 font-medium leading-relaxed line-clamp-2 md:pt-1">{sponsor.description}</p>
                        </div>
                        {sponsor.website && (
                          <button
                            onClick={() => window.open(sponsor.website, '_blank')}
                            className="mt-3 md:mt-5 w-full bg-[#014227] text-[#FFD700] py-2 md:py-3 rounded-xl md:rounded-2xl text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] shadow-sm hover:bg-black transition transform active:scale-95 flex items-center justify-center gap-2"
                          >
                            <Globe size={12} />
                            Visit Site
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ));
          })()}

          {sponsorships.length === 0 && (
            <div className="col-span-full py-20 text-center bg-white rounded-[40px] border border-dashed border-gray-200">
              <Megaphone className="mx-auto text-gray-300 mb-4" size={48} />
              <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">Sponsorship drive in progress</p>
            </div>
          )}
        </div>
      )
      }

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
    </div >
  );
};

export default GeneralInfo;
