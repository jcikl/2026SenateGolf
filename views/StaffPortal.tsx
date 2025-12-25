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

    // Search by docId, Guest ID, or Passport ID
    const guest = guests.find(g =>
      (g.docId && g.docId.toLowerCase() === normalizedInput) ||
      g.id.toLowerCase() === normalizedInput ||
      (g.passportId && g.passportId.toLowerCase() === normalizedInput)
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
        <>
          {/* Removed Check-In Station Card */}
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
                    placeholder="Guest ID / Passport ID"
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
              <p className="text-[10px] text-gray-400 font-bold mt-4 uppercase tracking-widest">Supports ID or Passport Number</p>
            </div>
          ) : (
            <div className="animate-in zoom-in-95 duration-300">
              {/* Result Modal Overlay */}
              {showResult && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in">
                  <div className={`bg-white rounded-[40px] w-full max-w-sm p-8 text-center shadow-2xl transform transition-all scale-100 border-b-[8px] ${showResult.status === 'success' ? 'border-green-500' : 'border-red-500'}`}>
                    {showResult.status === 'success' ? (
                      <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle size={40} /></div>
                    ) : (
                      <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6"><XCircle size={40} /></div>
                    )}
                    <h3 className="text-2xl font-black uppercase text-gray-900 mb-2 tracking-tight">{showResult.status === 'success' ? 'Checked In' : 'Failed'}</h3>
                    <p className="text-sm font-bold text-gray-500 mb-8">{showResult.message}</p>
                    <button onClick={() => setShowResult(null)} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg hover:bg-black">Continue</button>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-[30px] md:rounded-[50px] shadow-[0_30px_60px_rgba(0,0,0,0.12)] overflow-hidden border border-gray-100">
                <div className="p-6 md:p-12 space-y-6 md:space-y-10">
                  <div className="text-center">
                    <p className="text-[10px] md:text-[11px] font-black text-[#FFD700] uppercase tracking-[0.2em] mb-2">{scannedGuest.package} Package</p>
                    <h2 className="text-3xl md:text-5xl font-black text-[#014227] tracking-tighter leading-none mb-2">{scannedGuest.name}</h2>
                    <p className="text-xs md:text-sm font-bold text-gray-400 uppercase tracking-[0.1em]">{scannedGuest.country} • {scannedGuest.localOrg}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <ProfileField label="Merchandise / Kit" value={scannedGuest.tShirtSize} isHighlighted />
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 flex flex-col justify-center text-center">
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Welcome Table</p>
                        <p className="text-sm font-black text-[#014227]">{scannedGuest.welcomeDinnerTable || '-'}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 flex flex-col justify-center text-center">
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Gala Table</p>
                        <p className="text-sm font-black text-[#014227]">{scannedGuest.galaDinnerTable || '-'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-2xl border border-green-100">
                      <p className="text-[9px] font-black text-green-600 uppercase tracking-widest mb-2">Golf Day 1</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-[7px] font-bold text-gray-400 uppercase mb-1">Flight</p>
                          <p className="text-xs font-black text-[#014227]">{scannedGuest.golfDay1?.flight || '-'}</p>
                        </div>
                        <div>
                          <p className="text-[7px] font-bold text-gray-400 uppercase mb-1">Buggy</p>
                          <p className="text-xs font-black text-[#014227]">{scannedGuest.golfDay1?.buggy || '-'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-sky-50 p-4 rounded-2xl border border-blue-100">
                      <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-2">Golf Day 2</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-[7px] font-bold text-gray-400 uppercase mb-1">Flight</p>
                          <p className="text-xs font-black text-[#014227]">{scannedGuest.golfDay2?.flight || '-'}</p>
                        </div>
                        <div>
                          <p className="text-[7px] font-bold text-gray-400 uppercase mb-1">Buggy</p>
                          <p className="text-xs font-black text-[#014227]">{scannedGuest.golfDay2?.buggy || '-'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#FFFBEB] rounded-[20px] p-6 border border-[#FFD700]/20 mt-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFD700]/10 rounded-full -mr-10 -mt-10 pointer-events-none"></div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-[#014227] mb-6 flex items-center gap-2 relative z-10">
                      <CheckCircle size={14} className="text-[#FFD700]" /> Check-In Events
                    </h4>
                    <div className="space-y-4 relative z-10">
                      {(() => {
                        const category = packagePermissions[scannedGuest.package]?.category;
                        const rules = categoryPermissions[category] || [];
                        // Group by Date
                        const groupedRules = rules.reduce((acc, rule) => {
                          if (!acc[rule.date]) acc[rule.date] = [];
                          acc[rule.date].push(rule);
                          return acc;
                        }, {} as Record<string, typeof rules>);

                        const sortedRuleDates = Object.keys(groupedRules).sort((a, b) => {
                          const p = (d: string) => {
                            const parts = d.split(' ');
                            return new Date(`${parts[1]} ${parts[0]} ${parts[2] || '2026'}`).getTime();
                          };
                          return p(a) - p(b);
                        });

                        const handleDirectCheckIn = async (eventId: string, eventTitle: string) => {
                          // Confirmation prompt
                          const confirmed = window.confirm(`Check in ${scannedGuest.name} for "${eventTitle}"?`);
                          if (!confirmed) return;

                          // Duplicate check
                          if (scannedGuest.checkedInEvents && scannedGuest.checkedInEvents[eventId]) {
                            setShowResult({ status: 'error', message: `Already checked in to ${eventTitle}` });
                            return;
                          }

                          const timestamp = new Date().toISOString();
                          const updatedGuest = {
                            ...scannedGuest,
                            checkedInAt: timestamp,
                            lastCheckedInEvent: eventId,
                            checkedInEvents: {
                              ...(scannedGuest.checkedInEvents || {}),
                              [eventId]: timestamp
                            }
                          };

                          const newGuests = guests.map(g => (g.docId && g.docId === updatedGuest.docId) || (g.id === updatedGuest.id) ? updatedGuest : g);
                          localStorage.setItem('lastScannedId', scannedGuest.docId || scannedGuest.id);
                          onUpdateGuests(newGuests);

                          try {
                            await addDoc(collection(db, 'checkins'), {
                              guestId: scannedGuest.id,
                              guestName: scannedGuest.name,
                              guestPackage: scannedGuest.package,
                              eventId: eventId,
                              eventTitle: eventTitle,
                              timestamp: timestamp,
                              createdAt: serverTimestamp()
                            });
                          } catch (e) { console.error("Log error", e); }

                          setScannedGuest(updatedGuest); // Update local view state instantly
                          setShowResult({ status: 'success', message: `Checked in to ${eventTitle}` });
                        };

                        if (sortedRuleDates.length === 0) return <div className="text-[10px] text-gray-400 italic">No specific rules found.</div>;

                        return sortedRuleDates.map(date => (
                          <div key={date}>
                            <h5 className="text-[9px] font-black text-gray-400/60 uppercase tracking-widest mb-3 border-b border-gray-200/50 pb-1">{date}</h5>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              {groupedRules[date].map((rule, idx) => {
                                // Get latest guest data from Firestore-synced array
                                const latestGuest = guests.find(g =>
                                  (g.docId && g.docId === scannedGuest.docId) ||
                                  (g.id === scannedGuest.id)
                                ) || scannedGuest;

                                // Check if checked in using latest data
                                const rawLinked = rule.linkedItinerary;
                                const linked = Array.isArray(rawLinked) ? rawLinked : (rawLinked ? [rawLinked] : []);
                                const isCheckedIn = linked.some(eid => latestGuest.checkedInEvents && latestGuest.checkedInEvents[eid]);
                                const targetEventId = linked.length > 0 ? linked[0] : null;
                                const targetEvent = schedules.find(s => s.id === targetEventId);

                                return (
                                  <button
                                    key={idx}
                                    onClick={() => targetEventId && handleDirectCheckIn(targetEventId, targetEvent?.title || rule.name)}
                                    disabled={!targetEventId || isCheckedIn}
                                    className={`flex flex-col p-4 rounded-xl border-2 text-left transition-all relative overflow-hidden group/card ${isCheckedIn
                                      ? 'bg-[#014227] border-[#014227] text-white opacity-100'
                                      : 'bg-white border-dashed border-[#014227]/20 text-[#014227] hover:border-[#014227] hover:bg-[#014227]/5 hover:scale-[1.02] active:scale-95'
                                      }`}
                                  >
                                    <span className="text-[10px] font-black uppercase truncate w-full relative z-10">{rule.name}</span>
                                    {targetEvent?.time && (
                                      <span className={`text-[8px] font-bold mb-1 relative z-10 ${isCheckedIn ? 'text-[#FFD700]/80' : 'text-gray-400'}`}>{targetEvent.time}</span>
                                    )}
                                    {isCheckedIn ?
                                      <div className="flex items-center gap-1 text-[8px] font-bold text-[#FFD700] uppercase tracking-wider relative z-10"><CheckCircle size={10} /> Checked In</div>
                                      :
                                      <div className="flex items-center gap-1 text-[8px] font-bold text-gray-400 uppercase tracking-wider group-hover/card:text-[#014227] relative z-10">Tap to Check In</div>
                                    }
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-50">
                    <button onClick={() => { setScannedGuest(null); setSelectedEventId(''); }} className="w-full py-5 bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-[20px] font-black text-xs uppercase tracking-widest transition-all">
                      Done / Scan Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
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
