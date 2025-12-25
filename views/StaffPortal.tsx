import React, { useState, useEffect } from 'react';
import { Guest, EventSchedule, PermissionMeta, PackageCategory } from '../types';
import { QrCode, Search, CheckCircle, XCircle, LogOut, Calendar, History, ArrowRight } from 'lucide-react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { db } from '../firebase';
import { doc, updateDoc, collection, addDoc, query, where, orderBy, limit, onSnapshot, serverTimestamp } from 'firebase/firestore';

interface StaffPortalProps {
  guests: Guest[];
  onUpdateGuests: (guests: Guest[]) => void;
  schedules: EventSchedule[];
  packagePermissions: any;
  categoryPermissions: Record<PackageCategory, PermissionMeta[]>;
}

interface CheckinLog {
  id: string; // firestore id
  guestId: string;
  guestName: string;
  guestPackage: string;
  eventId: string;
  eventTitle: string;
  timestamp: string; // ISO string for display
  createdAt: any; // ServerTimestamp for sorting
}

const StaffPortal: React.FC<StaffPortalProps> = ({ guests, onUpdateGuests, schedules, packagePermissions, categoryPermissions }) => {
  const [activeTab, setActiveTab] = useState<'Scan' | 'History' | 'Stats'>('Scan');
  const [scannedGuest, setScannedGuest] = useState<Guest | null>(null);
  const [showResult, setShowResult] = useState<{ status: 'success' | 'error', message: string } | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [logFilterEventId, setLogFilterEventId] = useState('');
  const [recentLogs, setRecentLogs] = useState<CheckinLog[]>([]);

  const selectedEvent = schedules.find(s => s.id === selectedEventId);

  // Group schedules by date and sort correctly
  const parseTime = (timeStr: string) => {
    const [time, period] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  const groupedSchedules = schedules.reduce((acc, curr) => {
    if (!acc[curr.date]) acc[curr.date] = [];
    acc[curr.date].push(curr);
    return acc;
  }, {} as Record<string, EventSchedule[]>);

  // Sort dates and times
  const sortedDates = Object.keys(groupedSchedules).sort((a, b) => {
    const parseDate = (d: string) => {
      const parts = d.split('.');
      if (parts.length === 3) return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0])).getTime();
      return 0;
    };
    return parseDate(a) - parseDate(b);
  });

  sortedDates.forEach(date => {
    groupedSchedules[date].sort((a, b) => parseTime(a.time) - parseTime(b.time));
  });

  // Subscribe to Checkin Logs
  useEffect(() => {
    if (activeTab !== 'History') return;

    let q;
    const logsRef = collection(db, 'checkins');

    if (logFilterEventId) {
      q = query(logsRef, where('eventId', '==', logFilterEventId), orderBy('createdAt', 'desc'), limit(500));
    } else {
      q = query(logsRef, orderBy('createdAt', 'desc'), limit(500));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CheckinLog[];
      setRecentLogs(logs);
    });

    return () => unsubscribe();
  }, [activeTab, logFilterEventId]);


  const validateAccess = (guest: Guest) => {
    if (!selectedEvent) return false;
    // Check direct permission (legacy)
    if (packagePermissions[guest.package]?.permissions?.[selectedEvent.permissionId] === true) return true;

    // Check Category Permissions (including linked itineraries)
    const cat = packagePermissions[guest.package]?.category;
    const categoryRules = categoryPermissions[cat] || [];

    // Find any rule that grants access to this itinerary item (either directly or via Linked Itinerary)
    const grantingRule = categoryRules.find(rule => {
      // Direct permission match
      if (rule.permissionId === selectedEvent.permissionId) return true;
      // Linked Itinerary match
      const links = Array.isArray(rule.linkedItinerary) ? rule.linkedItinerary : (rule.linkedItinerary ? [rule.linkedItinerary] : []);
      return links.includes(selectedEvent.id);
    });

    return !!grantingRule;
  };

  const handleScan = (data: string) => {
    if (!data) return;
    const normalizedInput = data.trim().toLowerCase();

    // Prioritize docId (as modern QR codes use it), then fallback to logical ID or name
    const guest = guests.find(g =>
      (g.docId && g.docId.toLowerCase() === normalizedInput) ||
      g.id.toLowerCase() === normalizedInput ||
      g.name.toLowerCase() === normalizedInput
    );

    if (guest) {
      setScannedGuest(guest);
      setShowResult(null);
    } else {
      alert('Guest not found');
    }
  };

  const processCheckIn = async () => {
    if (!scannedGuest || !selectedEvent) return;

    if (validateAccess(scannedGuest)) {
      // Check for duplicate check-in
      if (scannedGuest.checkedInEvents && scannedGuest.checkedInEvents[selectedEvent.id]) {
        setShowResult({ status: 'error', message: `GUEST ALREADY CHECKED IN AT ${scannedGuest.checkedInEvents[selectedEvent.id].split('T')[1].substring(0, 5)}` });
        return;
      }

      const timestamp = new Date().toISOString();
      const updatedGuest = {
        ...scannedGuest,
        checkedInAt: timestamp,
        lastCheckedInEvent: selectedEvent.id,
        checkedInEvents: {
          ...(scannedGuest.checkedInEvents || {}),
          [selectedEvent.id]: timestamp
        }
      };

      // Use docId if available for identifying the guest to update in the local list
      const newGuests = guests.map(g =>
        (g.docId && g.docId === updatedGuest.docId) || (g.id === updatedGuest.id) ? updatedGuest : g
      );

      // Persist local storage for persistence across reloads
      localStorage.setItem('lastScannedId', scannedGuest.docId || scannedGuest.id);

      onUpdateGuests(newGuests);

      // Create Checkin Log
      try {
        await addDoc(collection(db, 'checkins'), {
          guestId: scannedGuest.id,
          guestName: scannedGuest.name,
          guestPackage: scannedGuest.package,
          eventId: selectedEvent.id,
          eventTitle: selectedEvent.title,
          timestamp: timestamp,
          createdAt: serverTimestamp()
        });
      } catch (e) {
        console.error("Failed to write checkin log:", e);
      }

      setShowResult({ status: 'success', message: `${scannedGuest.name} checked in to ${selectedEvent.title}` });
    } else {
      setShowResult({ status: 'error', message: 'ACCESS DENIED: Package restriction' });
    }
  };

  return (
    <div>
      <div>
        <div className="hidden md:block">
          <h1 className="text-4xl md:text-6xl font-black text-[#014227] tracking-tighter mb-2">CREW HUB<span className="text-[#FFD700]">.</span></h1>
          <p className="text-xs md:text-sm font-bold text-gray-400 uppercase tracking-widest">Event Access Control System</p>
        </div>


      </div>

      <div className="flex bg-white rounded-[20px] md:rounded-[24px] shadow-xl p-1.5 border border-gray-100 mb-8 md:mb-12 overflow-x-auto">
        <button onClick={() => setActiveTab('Scan')} className={`flex-1 min-w-[100px] flex items-center justify-center space-x-2 md:space-x-3 py-3 md:py-4 rounded-xl md:rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'Scan' ? 'bg-[#014227] text-[#FFD700] shadow-md' : 'text-gray-400'}`}>
          <QrCode size={16} className="md:w-5 md:h-5" /><span>Scan</span>
        </button>
        <button onClick={() => setActiveTab('History')} className={`flex-1 min-w-[100px] flex items-center justify-center space-x-2 md:space-x-3 py-3 md:py-4 rounded-xl md:rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'History' ? 'bg-[#014227] text-[#FFD700] shadow-md' : 'text-gray-400'}`}>
          <History size={16} className="md:w-5 md:h-5" /><span>Logs</span>
        </button>
        <button onClick={() => setActiveTab('Stats')} className={`flex-1 min-w-[100px] flex items-center justify-center space-x-2 md:space-x-3 py-3 md:py-4 rounded-xl md:rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'Stats' ? 'bg-[#014227] text-[#FFD700] shadow-md' : 'text-gray-400'}`}>
          <CheckCircle size={16} className="md:w-5 md:h-5" /><span>Stats</span>
        </button>
      </div>

      {activeTab === 'Stats' && (
        <div className="bg-white rounded-[30px] md:rounded-[40px] shadow-2xl border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-4">
          <div className="p-6 md:p-8 border-b border-gray-100 bg-gray-50">
            <h3 className="text-lg md:text-xl font-black text-[#014227] uppercase tracking-widest">Event Statistics</h3>
          </div>
          {/* Mobile View */}
          <div className="md:hidden">
            {sortedDates.map(date => (
              <div key={date}>
                <div className="bg-[#FFFBEB] px-6 py-3 text-[10px] font-black text-[#014227] uppercase tracking-widest border-y border-gray-100">
                  {date}
                </div>
                <div className="divide-y divide-gray-50">
                  {groupedSchedules[date].map(s => {
                    const count = guests.filter(g => g.checkedInEvents && g.checkedInEvents[s.id]).length;
                    return (
                      <div key={s.id} className="p-6 flex justify-between items-center">
                        <div className="pr-4">
                          <p className="text-[10px] font-bold text-gray-400 mb-1">{s.time}</p>
                          <h4 className="text-xs font-black text-[#014227] leading-tight">{s.title}</h4>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black shrink-0 ${count > 0 ? 'bg-[#014227] text-[#FFD700]' : 'bg-gray-100 text-gray-400'}`}>
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left min-w-[600px]">
              <thead className="bg-[#FFFBEB] text-[10px] md:text-[11px] font-black text-[#014227] uppercase tracking-widest">
                <tr>
                  <th className="px-6 md:px-8 py-4 md:py-5">Date</th>
                  <th className="px-6 md:px-8 py-4 md:py-5">Time</th>
                  <th className="px-6 md:px-8 py-4 md:py-5">Event</th>
                  <th className="px-6 md:px-8 py-4 md:py-5 text-right">Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sortedDates.map(date => (
                  <React.Fragment key={date}>
                    <tr className="bg-gray-50 border-y border-gray-100">
                      <td colSpan={4} className="px-6 md:px-8 py-3 text-[10px] md:text-xs font-black text-[#014227] uppercase tracking-widest bg-[#FFFBEB]/50">
                        {date}
                      </td>
                    </tr>
                    {groupedSchedules[date].map(s => {
                      const count = guests.filter(g => g.checkedInEvents && g.checkedInEvents[s.id]).length;
                      return (
                        <tr key={s.id} className="hover:bg-gray-50 transition">
                          <td className="px-6 md:px-8 py-4 md:py-5 text-[10px] md:text-[11px] font-bold text-gray-500">{s.date}</td>
                          <td className="px-6 md:px-8 py-4 md:py-5 text-[10px] md:text-[11px] font-bold text-gray-500">{s.time}</td>
                          <td className="px-6 md:px-8 py-4 md:py-5 text-xs md:text-sm font-black text-[#014227] whitespace-normal">{s.title}</td>
                          <td className="px-6 md:px-8 py-4 md:py-5 text-right">
                            <span className={`px-3 md:px-4 py-1 rounded-full text-[10px] md:text-xs font-black ${count > 0 ? 'bg-[#014227] text-[#FFD700]' : 'bg-gray-100 text-gray-400'}`}>
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
          <div className="w-full bg-[#F58220] rounded-[30px] md:rounded-[40px] p-6 md:p-8 text-white shadow-2xl border-b-[6px] md:border-b-[10px] border-[#014227] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 md:w-48 md:h-48 bg-white/10 rounded-full -mr-16 -mt-16 md:-mr-24 md:-mt-24"></div>
            <div className="flex items-center space-x-4 mb-4 md:mb-6 relative z-10">
              <div className="bg-[#014227] text-[#FFD700] p-3 md:p-4 rounded-2xl md:rounded-3xl shadow-xl transform -rotate-3"><Calendar size={20} className="md:w-7 md:h-7" /></div>
              <div>
                <h2 className="text-xs md:text-sm font-black uppercase tracking-[0.2em] md:tracking-[0.4em] text-white">Check-In Station</h2>
                <p className="text-[10px] font-bold text-white/80 uppercase tracking-widest mt-1">Current Event Segment</p>
              </div>
            </div>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-2xl md:rounded-3xl px-4 md:px-6 py-4 md:py-5 text-xs md:text-sm font-black outline-none focus:ring-4 md:focus:ring-8 focus:ring-[#FFD700]/20 appearance-none transition-all cursor-pointer hover:bg-white/20"
            >
              <option value="" className="text-gray-900">-- SELECT ACTIVE EVENT --</option>
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
          {!scannedGuest ? (
            <div className="bg-white rounded-[30px] md:rounded-[40px] shadow-sm border border-gray-100 p-6 md:p-12 text-center group">
              <div className="w-full aspect-square max-w-[280px] md:max-w-sm mx-auto bg-black rounded-[30px] md:rounded-[50px] mb-8 md:mb-12 relative overflow-hidden flex flex-col items-center justify-center shadow-2xl border-4 border-gray-50">
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
                      container: { width: '100%', height: '100%', borderRadius: '30px' },
                      video: { width: '100%', height: '100%', objectFit: 'cover', borderRadius: '30px' }
                    }}
                  />
                )}
                <div className="absolute inset-0 border-[6px] border-[#FFD700]/50 rounded-[30px] md:rounded-[50px] pointer-events-none"></div>
                <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-red-500/80 blur-[2px] shadow-[0_0_10px_red] pointer-events-none animate-scan-line"></div>
              </div>

              <h3 className="text-lg md:text-xl font-black text-[#014227] uppercase tracking-[0.2em] mb-4 md:mb-6">Camera Active</h3>

              <div className="flex flex-col md:flex-row gap-3 max-w-md mx-auto relative">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <Search className="text-gray-400" size={16} />
                  </div>
                  <input
                    type="text"
                    placeholder="Guest ID / Name"
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl md:rounded-3xl pl-12 pr-6 py-4 md:py-5 font-black text-xs md:text-sm outline-none focus:border-[#FFD700] transition-colors uppercase"
                    onKeyDown={e => e.key === 'Enter' && handleScan((e.target as any).value)}
                  />
                </div>
                <button
                  onClick={(e) => {
                    const input = e.currentTarget.parentElement?.querySelector('input');
                    if (input?.value) handleScan(input.value);
                  }}
                  className="bg-[#014227] text-[#FFD700] px-8 py-4 md:py-5 rounded-2xl md:rounded-3xl font-black text-[10px] uppercase shadow-xl hover:bg-black transition transform active:scale-95"
                >
                  Verify
                </button>
              </div>
              <p className="text-[10px] text-gray-400 font-bold mt-4 uppercase tracking-widest">Supports ID (e.g. G001) or Name Search</p>
            </div>
          ) : (
            <div className="animate-in zoom-in-95 duration-300">
              {showResult ? (
                <div className={`rounded-[30px] md:rounded-[50px] p-8 md:p-16 text-center shadow-2xl border-b-[8px] md:border-b-[12px] transform transition-all ${showResult.status === 'success' ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>
                  {showResult.status === 'success' ? <CheckCircle size={80} className="text-green-500 mx-auto mb-6 md:mb-8 drop-shadow-lg md:w-[100px] md:h-[100px]" /> : <XCircle size={80} className="text-red-500 mx-auto mb-6 md:mb-8 drop-shadow-lg md:w-[100px] md:h-[100px]" />}
                  <h3 className={`text-2xl md:text-4xl font-black uppercase mb-3 tracking-tighter ${showResult.status === 'success' ? 'text-green-900' : 'text-red-900'}`}>{showResult.status === 'success' ? 'Access Granted' : 'Verification Failed'}</h3>
                  <p className="font-bold text-sm md:text-lg text-gray-600 max-w-md mx-auto mb-8">{showResult.message}</p>
                  <button onClick={() => { setScannedGuest(null); setShowResult(null); }} className="px-8 md:px-12 py-4 md:py-5 bg-white border-2 border-gray-100 rounded-[20px] md:rounded-[30px] text-[10px] md:text-[11px] font-black uppercase tracking-widest shadow-xl hover:bg-gray-50 transition w-full md:w-auto">Process Next Delegate</button>
                </div>
              ) : (
                <div className="bg-white rounded-[30px] md:rounded-[50px] shadow-[0_30px_60px_rgba(0,0,0,0.12)] overflow-hidden border border-gray-100">
                  <div className={`p-6 md:p-8 text-white font-black uppercase text-[10px] md:text-xs tracking-[0.3em] flex items-center justify-between ${validateAccess(scannedGuest) ? 'bg-[#014227]' : 'bg-red-600'}`}>
                    <div className="flex items-center gap-2 md:gap-3">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="md:w-6 md:h-6"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                      <span>{validateAccess(scannedGuest) ? 'Clearance Verified' : 'Security Alert'}</span>
                    </div>
                    {(scannedGuest.allergies) && <div className="bg-white text-red-600 px-4 md:px-6 py-1.5 md:py-2 rounded-full text-[9px] md:text-[10px] font-black shadow-2xl animate-pulse">CRITICAL ALLERGY</div>}
                  </div>
                  <div className="p-6 md:p-12 space-y-6 md:space-y-10">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                      <div>
                        <p className="text-[10px] md:text-[11px] font-black text-[#FFD700] uppercase tracking-[0.2em] mb-1 md:mb-2">{scannedGuest.package}</p>
                        <h2 className="text-3xl md:text-5xl font-black text-[#014227] tracking-tighter leading-none">{scannedGuest.name}</h2>
                        <p className="text-xs md:text-sm font-bold text-gray-400 uppercase tracking-[0.1em] mt-2 md:mt-3">{scannedGuest.country} • {scannedGuest.localOrg}</p>
                      </div>
                      <div className="text-left md:text-right w-full md:w-auto">
                        <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 md:mb-2">Check-in Terminal</p>
                        <p className="text-[10px] md:text-xs font-black text-[#014227] bg-[#FFFBEB] px-4 md:px-6 py-2 md:py-3 rounded-[15px] md:rounded-[20px] border-2 border-amber-100 uppercase tracking-tighter inline-block">{selectedEvent?.title}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                      <ProfileField label="Merchandise / Kit" value={scannedGuest.tShirtSize} isHighlighted />
                      <ProfileField label="Seating Table" value={scannedGuest.dinnerTableNo || 'NOT ASSIGNED'} />
                    </div>
                    <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-6 pt-6 md:pt-10 border-t border-gray-50">
                      <button onClick={() => setScannedGuest(null)} className="flex-1 py-4 md:py-6 border-2 border-gray-100 text-gray-400 rounded-[20px] md:rounded-[30px] font-black text-[10px] md:text-[11px] uppercase tracking-widest hover:bg-gray-50 transition">Reject & Exit</button>
                      <button onClick={processCheckIn} className={`flex-[2] text-white py-4 md:py-6 rounded-[20px] md:rounded-[30px] font-black text-[10px] md:text-[11px] uppercase tracking-widest shadow-2xl transform active:scale-95 transition-all ${validateAccess(scannedGuest) ? 'bg-[#014227] hover:bg-black' : 'bg-red-600'}`}>
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
        <div className="bg-white rounded-[30px] md:rounded-[40px] shadow-2xl border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-4">
          <div className="p-6 md:p-8 border-b border-gray-100 bg-gray-50 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
            <Search className="text-gray-400 hidden md:block" size={24} />
            <input type="text" placeholder="Search recent arrivals..." className="bg-transparent border-b border-gray-200 md:border-none outline-none w-full md:flex-1 font-black text-sm text-[#014227] pb-2 md:pb-0" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            <select
              value={logFilterEventId}
              onChange={(e) => setLogFilterEventId(e.target.value)}
              className="w-full md:w-auto bg-white border border-gray-200 rounded-2xl px-4 py-2 text-xs font-bold outline-none focus:border-[#014227] transition-all cursor-pointer"
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
          {/* Mobile View */}
          <div className="md:hidden divide-y divide-gray-50">
            {recentLogs
              .filter(log => !searchQuery || log.guestName.toLowerCase().includes(searchQuery.toLowerCase()) || log.guestId.toLowerCase().includes(searchQuery.toLowerCase()))
              .map(log => (
                <div key={log.id} className="p-6 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-base font-black text-[#014227] leading-none mb-1">{log.guestName}</h4>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{log.guestId} • {log.guestPackage}</p>
                    </div>
                    <span className="text-[9px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100 uppercase tracking-widest">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="bg-[#FFFBEB] p-3 rounded-xl border border-[#FFD700]/20 flex items-center space-x-3">
                    <div className="bg-[#FFD700] text-[#014227] p-1.5 rounded-lg"><CheckCircle size={12} /></div>
                    <div>
                      <p className="text-[9px] font-black text-[#014227] uppercase tracking-widest leading-none mb-0.5">Checked In</p>
                      <p className="text-[10px] font-bold text-[#014227]/80 leading-none">{log.eventTitle}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 text-[9px] font-bold text-gray-300">
                    <Calendar size={10} />
                    <span>{new Date(log.timestamp).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
          </div>

          {/* Desktop View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left min-w-[600px]">
              <thead className="bg-[#FFFBEB] text-[10px] md:text-[11px] font-black text-[#014227] uppercase tracking-widest"><tr><th className="px-6 md:px-10 py-4 md:py-5">Delegate Identity</th><th className="px-6 md:px-10 py-4 md:py-5">Station Log</th><th className="px-6 md:px-10 py-4 md:py-5">Timestamp</th></tr></thead>
              <tbody className="divide-y divide-gray-50">
                {recentLogs
                  .filter(log => !searchQuery || log.guestName.toLowerCase().includes(searchQuery.toLowerCase()) || log.guestId.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(log => (
                    <tr key={log.id} className="hover:bg-gray-50 transition group">
                      <td className="px-6 md:px-10 py-5 md:py-7">
                        <div className="text-sm md:text-base font-black text-[#014227]">{log.guestName}</div>
                        <div className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase">{log.guestId} • {log.guestPackage}</div>
                      </td>
                      <td className="px-6 md:px-10 py-5 md:py-7 text-[10px] md:text-xs font-black text-gray-600 uppercase tracking-tighter">
                        {log.eventTitle}
                      </td>
                      <td className="px-6 md:px-10 py-5 md:py-7 text-[10px] md:text-[11px] font-mono text-gray-400 font-bold">{new Date(log.timestamp).toLocaleString()}</td>
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
  <div className="bg-gray-50 p-4 md:p-6 rounded-[20px] md:rounded-[30px] border border-gray-100 shadow-sm">
    <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1 md:mb-2">{label}</p>
    <p className={`text-xl md:text-2xl font-black leading-none ${isHighlighted ? 'text-[#014227]' : 'text-gray-900'}`}>{value}</p>
  </div>
);

export default StaffPortal;
