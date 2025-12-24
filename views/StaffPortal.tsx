

import React, { useState } from 'react';
import { Guest, EventSchedule, PackagePermissions, PermissionMeta } from '../types';

import { QrCode, Search, CheckCircle, AlertTriangle, AlertCircle, History, XCircle, Calendar, Camera } from 'lucide-react';
import { Scanner } from '@yudiel/react-qr-scanner';

interface StaffPortalProps {
  guests: Guest[];
  onUpdateGuests: (updatedList: Guest[]) => void;
  schedules: EventSchedule[];
  packagePermissions: PackagePermissions;
  categoryPermissions: Record<string, PermissionMeta[]>;
}

const StaffPortal: React.FC<StaffPortalProps> = ({ guests, onUpdateGuests, schedules, packagePermissions, categoryPermissions }) => {
  const [activeTab, setActiveTab] = useState<'Scan' | 'History' | 'Stats'>('Scan');
  const [searchQuery, setSearchQuery] = useState('');
  const [scannedGuest, setScannedGuest] = useState<Guest | null>(null);
  const [showResult, setShowResult] = useState<{ status: 'success' | 'denied'; message: string } | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [logFilterEventId, setLogFilterEventId] = useState<string>('');

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

  // Group and sort schedules for dropdown
  const groupedSchedules = schedules.reduce((groups, item) => {
    const date = item.date;
    if (!groups[date]) groups[date] = [];
    groups[date].push(item);
    return groups;
  }, {} as Record<string, EventSchedule[]>);

  Object.keys(groupedSchedules).forEach(date => {
    groupedSchedules[date].sort((a, b) => parseTime(a.time) - parseTime(b.time));
  });

  const sortedDates = Object.keys(groupedSchedules).sort((a, b) => {
    const parseDate = (d: string) => {
      const parts = d.split('.');
      if (parts.length === 3) return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0])).getTime();
      return 0;
    };
    return parseDate(a) - parseDate(b);
  });

  const selectedEvent = schedules.find(s => s.id === selectedEventId);

  const handleScan = (guestId: string | null) => {
    if (!guestId) return;

    // Normalize ID
    const normalizedId = guestId.trim().toUpperCase();
    console.log("Scanned/Input ID:", normalizedId);

    if (!selectedEventId) {
      alert("PLEASE SELECT THE ACTIVE STATION/EVENT BEFORE SCANNING.");
      return;
    }

    // Direct ID match or search by name (for manual fallback)
    const found = guests.find(g => g.id.toUpperCase() === normalizedId) ||
      guests.find(g => g.name.toUpperCase().includes(normalizedId) && normalizedId.length > 3);

    if (found) {
      setScannedGuest(found);
    } else {
      alert("Invalid ID or Check-in Code - No matching delegate found.");
    }
  };

  const handleError = (err: any) => {
    console.error(err);
  };

  const validateAccess = (guest: Guest): boolean => {
    if (!selectedEvent || !selectedEvent.permissionId) return true; // Public event
    const pkgPerms = packagePermissions[guest.package];
    if (!pkgPerms) return false;

    // 1. Direct Rule Match
    if (pkgPerms.permissions[selectedEvent.permissionId] === true) return true;

    // 2. Linked Itinerary Match via any granted rule in this package's category
    const cat = pkgPerms.category;
    const rules = categoryPermissions[cat] || [];
    const grantedRuleIds = Object.keys(pkgPerms.permissions).filter(id => pkgPerms.permissions[id] === true);

    return rules.some(rule => {
      if (!grantedRuleIds.includes(rule.id)) return false;
      const links = Array.isArray(rule.linkedItinerary) ? rule.linkedItinerary : (rule.linkedItinerary ? [rule.linkedItinerary] : []);
      return links.includes(selectedEvent.id);
    });
  };

  const processCheckIn = () => {
    if (!scannedGuest) return;
    const hasAccess = validateAccess(scannedGuest);

    if (!hasAccess) {
      setShowResult({
        status: 'denied',
        message: `ACCESS DENIED: Package "${scannedGuest.package}" does not grant entry for "${selectedEvent?.title}".`
      });
      return;
    }

    if (scannedGuest.checkedInEvents && scannedGuest.checkedInEvents[selectedEventId]) {
      const time = new Date(scannedGuest.checkedInEvents[selectedEventId]).toLocaleTimeString();
      alert(`GUEST ALREADY CHECKED IN to this event at ${time}`);
      return;
    }

    const updated = guests.map(g => {
      if (g.id === scannedGuest.id) {
        const newCheckedInEvents = { ...g.checkedInEvents, [selectedEventId]: new Date().toISOString() };
        return {
          ...g,
          checkInCount: g.checkInCount + 1,
          checkedInAt: new Date().toLocaleString(),
          lastCheckedInEvent: selectedEventId,
          checkedInEvents: newCheckedInEvents
        };
      }
      return g;
    });

    localStorage.setItem('lastScannedId', scannedGuest.id);
    onUpdateGuests(updated);
    setShowResult({ status: 'success', message: 'Verification Success - Access Granted.' });

    setTimeout(() => { setShowResult(null); setScannedGuest(null); }, 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Active Station Selection - Based on Itinerary */}
      <div className="bg-[#014227] rounded-[40px] p-8 text-white shadow-2xl border-b-[10px] border-[#FFD700] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#FFD700]/5 rounded-full -mr-24 -mt-24"></div>
        <div className="flex items-center space-x-4 mb-6 relative z-10">
          <div className="bg-[#FFD700] text-[#014227] p-4 rounded-3xl shadow-xl transform -rotate-3"><Calendar size={28} /></div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-[0.4em] text-[#FFD700]">Check-In Station</h2>
            <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mt-1">Current Event Segment Validation</p>
          </div>
        </div>
        <select
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          className="w-full bg-white/10 border border-white/20 rounded-3xl px-6 py-5 text-sm font-black outline-none focus:ring-8 focus:ring-[#FFD700]/20 appearance-none transition-all cursor-pointer hover:bg-white/20"
        >
          <option value="" className="text-gray-900">-- SELECT ACTIVE PROCESS FROM ITINERARY --</option>
          {sortedDates.map(date => (
            <optgroup key={date} label={date} className="text-gray-900 font-black">
              {groupedSchedules[date].map(s => (
                <option key={s.id} value={s.id} className="text-gray-900">
                  {s.time} {'>>'} {s.title}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      <div className="flex bg-white rounded-[24px] shadow-xl p-1.5 border border-gray-100">
        <button onClick={() => setActiveTab('Scan')} className={`flex-1 flex items-center justify-center space-x-3 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'Scan' ? 'bg-[#014227] text-[#FFD700] shadow-2xl' : 'text-gray-400'}`}>
          <QrCode size={20} /><span>Scanner Mode</span>
        </button>
        <button onClick={() => setActiveTab('History')} className={`flex-1 flex items-center justify-center space-x-3 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'History' ? 'bg-[#014227] text-[#FFD700] shadow-2xl' : 'text-gray-400'}`}>
          <History size={20} /><span>Recent Logs</span>
        </button>
        <button onClick={() => setActiveTab('Stats')} className={`flex-1 flex items-center justify-center space-x-3 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'Stats' ? 'bg-[#014227] text-[#FFD700] shadow-2xl' : 'text-gray-400'}`}>
          <CheckCircle size={20} /><span>Statistics</span>
        </button>
      </div>

      {activeTab === 'Stats' && (
        <div className="bg-white rounded-[40px] shadow-2xl border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-4">
          <div className="p-8 border-b border-gray-100 bg-gray-50">
            <h3 className="text-xl font-black text-[#014227] uppercase tracking-widest">Event Check-in Statistics</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#FFFBEB] text-[11px] font-black text-[#014227] uppercase tracking-widest">
                <tr>
                  <th className="px-8 py-5">Date</th>
                  <th className="px-8 py-5">Time</th>
                  <th className="px-8 py-5">Event</th>
                  <th className="px-8 py-5 text-right">Check-in Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sortedDates.map(date => (
                  <React.Fragment key={date}>
                    <tr className="bg-gray-50 border-y border-gray-100">
                      <td colSpan={4} className="px-8 py-3 text-xs font-black text-[#014227] uppercase tracking-widest bg-[#FFFBEB]/50">
                        {date}
                      </td>
                    </tr>
                    {groupedSchedules[date].map(s => {
                      const count = guests.filter(g => g.checkedInEvents && g.checkedInEvents[s.id]).length;
                      return (
                        <tr key={s.id} className="hover:bg-gray-50 transition">
                          <td className="px-8 py-5 text-[11px] font-bold text-gray-500">{s.date}</td>
                          <td className="px-8 py-5 text-[11px] font-bold text-gray-500">{s.time}</td>
                          <td className="px-8 py-5 text-sm font-black text-[#014227]">{s.title}</td>
                          <td className="px-8 py-5 text-right">
                            <span className={`px-4 py-1 rounded-full text-xs font-black ${count > 0 ? 'bg-[#014227] text-[#FFD700]' : 'bg-gray-100 text-gray-400'}`}>
                              {count}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'Scan' && (
        <div className="space-y-6">
          {!scannedGuest ? (
            <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 p-8 md:p-12 text-center group">
              <div className="w-full aspect-square max-w-sm mx-auto bg-black rounded-[50px] mb-8 md:mb-12 relative overflow-hidden flex flex-col items-center justify-center shadow-2xl border-4 border-gray-50">
                {activeTab === 'Scan' && (
                  <Scanner
                    onScan={(result) => {
                      if (result && result.length > 0) {
                        handleScan(result[0].rawValue);
                      }
                    }}
                    onError={(error) => console.log(error)}
                    components={{
                      finder: false
                    }}
                    styles={{
                      container: { width: '100%', height: '100%', borderRadius: '40px' },
                      video: { width: '100%', height: '100%', objectFit: 'cover', borderRadius: '40px' }
                    }}
                  />
                )}
                <div className="absolute inset-0 border-[6px] border-[#FFD700]/50 rounded-[50px] pointer-events-none"></div>
                <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-red-500/80 blur-[2px] shadow-[0_0_10px_red] pointer-events-none animate-scan-line"></div>
              </div>

              <h3 className="text-xl font-black text-[#014227] uppercase tracking-[0.2em] mb-6">Camera Active</h3>

              <div className="flex gap-3 max-w-md mx-auto relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Search className="text-gray-400" size={16} />
                </div>
                <input
                  type="text"
                  placeholder="Manual Entry (Guest ID)"
                  className="flex-1 bg-gray-50 border-2 border-gray-100 rounded-3xl pl-12 pr-6 py-5 font-black text-sm outline-none focus:border-[#FFD700] transition-colors uppercase"
                  onKeyDown={e => e.key === 'Enter' && handleScan((e.target as any).value)}
                />
                <button
                  onClick={(e) => {
                    const input = (e.currentTarget.previousElementSibling as HTMLInputElement).value;
                    if (input) handleScan(input);
                  }}
                  className="bg-[#014227] text-[#FFD700] px-8 py-5 rounded-3xl font-black text-[10px] uppercase shadow-xl hover:bg-black transition transform active:scale-95"
                >
                  Verify
                </button>
              </div>
              <p className="text-[10px] text-gray-400 font-bold mt-4 uppercase tracking-widest">Supports ID (e.g. G001) or Name Search</p>
            </div>
          ) : (
            <div className="animate-in zoom-in-95 duration-300">
              {showResult ? (
                <div className={`rounded-[50px] p-16 text-center shadow-2xl border-b-[12px] transform transition-all ${showResult.status === 'success' ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>
                  {showResult.status === 'success' ? <CheckCircle size={100} className="text-green-500 mx-auto mb-8 drop-shadow-lg" /> : <XCircle size={100} className="text-red-500 mx-auto mb-8 drop-shadow-lg" />}
                  <h3 className={`text-4xl font-black uppercase mb-3 tracking-tighter ${showResult.status === 'success' ? 'text-green-900' : 'text-red-900'}`}>{showResult.status === 'success' ? 'Access Granted' : 'Verification Failed'}</h3>
                  <p className="font-bold text-lg text-gray-600 max-w-md mx-auto">{showResult.message}</p>
                  <button onClick={() => { setScannedGuest(null); setShowResult(null); }} className="mt-12 px-12 py-5 bg-white border-2 border-gray-100 rounded-[30px] text-[11px] font-black uppercase tracking-widest shadow-xl hover:bg-gray-50 transition">Process Next Delegate</button>
                </div>
              ) : (
                <div className="bg-white rounded-[50px] shadow-[0_30px_60px_rgba(0,0,0,0.12)] overflow-hidden border border-gray-100">
                  <div className={`p-8 text-white font-black uppercase text-xs tracking-[0.3em] flex items-center justify-between ${validateAccess(scannedGuest) ? 'bg-[#014227]' : 'bg-red-600'}`}>
                    <div className="flex items-center gap-3">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                      <span>{validateAccess(scannedGuest) ? 'Clearance Verified' : 'Security Alert'}</span>
                    </div>
                    {(scannedGuest.allergies) && <div className="bg-white text-red-600 px-6 py-2 rounded-full text-[10px] font-black shadow-2xl animate-pulse">CRITICAL ALLERGY</div>}
                  </div>
                  <div className="p-12 space-y-10">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[11px] font-black text-[#FFD700] uppercase tracking-[0.2em] mb-2">{scannedGuest.package}</p>
                        <h2 className="text-5xl font-black text-[#014227] tracking-tighter leading-none">{scannedGuest.name}</h2>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-[0.1em] mt-3">{scannedGuest.nation} • {scannedGuest.localOrg}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Check-in Terminal</p>
                        <p className="text-xs font-black text-[#014227] bg-[#FFFBEB] px-6 py-3 rounded-[20px] border-2 border-amber-100 uppercase tracking-tighter">{selectedEvent?.title}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <ProfileField label="Merchandise / Kit" value={scannedGuest.tShirtSize} isHighlighted />
                      <ProfileField label="Seating Table" value={scannedGuest.dinnerTableNo || 'NOT ASSIGNED'} />
                    </div>
                    <div className="flex space-x-6 pt-10 border-t border-gray-50">
                      <button onClick={() => setScannedGuest(null)} className="flex-1 py-6 border-2 border-gray-100 text-gray-400 rounded-[30px] font-black text-[11px] uppercase tracking-widest hover:bg-gray-50 transition">Reject & Exit</button>
                      <button onClick={processCheckIn} className={`flex-[2] text-white py-6 rounded-[30px] font-black text-[11px] uppercase tracking-widest shadow-2xl transform active:scale-95 transition-all ${validateAccess(scannedGuest) ? 'bg-[#014227] hover:bg-black' : 'bg-red-600'}`}>
                        {validateAccess(scannedGuest) ? 'Confirm Admission' : 'Bypass Restriction'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {activeTab === 'History' && (
        <div className="bg-white rounded-[40px] shadow-2xl border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-4">
          <div className="p-8 border-b border-gray-100 bg-gray-50 flex items-center space-x-4">
            <Search className="text-gray-400" size={24} />
            <input type="text" placeholder="Search recent arrivals..." className="bg-transparent border-none outline-none flex-1 font-black text-sm text-[#014227]" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            <select
              value={logFilterEventId}
              onChange={(e) => setLogFilterEventId(e.target.value)}
              className="bg-white border border-gray-200 rounded-2xl px-4 py-2 text-xs font-bold outline-none focus:border-[#014227] transition-all cursor-pointer"
            >
              <option value="">All Events</option>
              {sortedDates.map(date => (
                <optgroup key={date} label={date}>
                  {groupedSchedules[date].map(s => (
                    <option key={s.id} value={s.id}>
                      {s.time} {'>>'} {s.title}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#FFFBEB] text-[11px] font-black text-[#014227] uppercase tracking-widest"><tr><th className="px-10 py-5">Delegate Identity</th><th className="px-10 py-5">Station Log</th><th className="px-10 py-5">Timestamp</th></tr></thead>
              <tbody className="divide-y divide-gray-50">
                {guests
                  .filter(g => g.checkedInAt)
                  .filter(g => !logFilterEventId || g.lastCheckedInEvent === logFilterEventId)
                  .sort((a, b) => (b.checkedInAt || '').localeCompare(a.checkedInAt || ''))
                  .map(g => (
                    <tr key={g.id} className="hover:bg-gray-50 transition group">
                      <td className="px-10 py-7">
                        <div className="text-base font-black text-[#014227]">{g.name}</div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase">{g.id} • {g.package}</div>
                      </td>
                      <td className="px-10 py-7 text-xs font-black text-gray-600 uppercase tracking-tighter">
                        {g.lastCheckedInEvent ? schedules.find(s => s.id === g.lastCheckedInEvent)?.title || 'Access Verified' : 'Access Verified'}
                      </td>
                      <td className="px-10 py-7 text-[11px] font-mono text-gray-400 font-bold">{g.checkedInAt}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <style>{`
        @keyframes scan-line { 0% { top: 10%; opacity: 0; } 20% { opacity: 1; } 80% { opacity: 1; } 100% { top: 90%; opacity: 0; } }
        .animate-scan-line { animation: scan-line 2.5s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

const ProfileField: React.FC<{ label: string, value: string, isHighlighted?: boolean }> = ({ label, value, isHighlighted }) => (
  <div className="bg-gray-50 p-6 rounded-[30px] border border-gray-100 shadow-sm">
    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">{label}</p>
    <p className={`text-2xl font-black leading-none ${isHighlighted ? 'text-[#014227]' : 'text-gray-900'}`}>{value}</p>
  </div>
);

export default StaffPortal;
