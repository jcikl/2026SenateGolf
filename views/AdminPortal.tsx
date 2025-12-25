import React, { useState, useEffect } from 'react';
import { Guest, PackageType, PackageCategory, EventSchedule, PackagePermissions, PermissionMeta, GolfGrouping, Sponsorship } from '../types';
import { Users, Filter, ClipboardPaste, X, CheckCircle2, Calendar, MapPin, Plus, Trash2, Edit3, Save, Check, Square, Edit, Tag, Clock, ChevronRight, RefreshCw, ChevronDown, AlertTriangle, Trophy, Megaphone } from 'lucide-react';

interface AdminPortalProps {
  guests: Guest[];
  onUpdateGuests: (updatedList: Guest[]) => void;
  schedules: EventSchedule[];
  onUpdateSchedules: (newList: EventSchedule[]) => void;
  onBulkSync: () => Promise<void>;
  attractions: any[];
  onUpdateAttractions: (newList: any[]) => void;
  diningGuide: any[];
  onUpdateDining: (newList: any[]) => void;
  packagePermissions: PackagePermissions;
  onUpdatePackagePermissions: (newPerms: PackagePermissions) => void;
  categoryPermissions: Record<PackageCategory, PermissionMeta[]>;
  onUpdateCategoryPermissions: (newCatPerms: Record<PackageCategory, PermissionMeta[]>) => void;
  golfGroupings: GolfGrouping[];
  onUpdateGolfGroupings: (newList: GolfGrouping[]) => void;
  sponsorships: Sponsorship[];
  onUpdateSponsorships: (newList: Sponsorship[]) => void;
}

const PACKAGE_CATEGORIES: PackageCategory[] = ['APDC', 'JCIM', 'Int', 'JP', 'KR', 'VIP'];
const NATIONS = ["Malaysia", "Japan", "Korea", "Singapore", "Thailand", "Philippines", "Taiwan", "Hong Kong", "Macau", "Indonesia", "Vietnam", "Cambodia", "India", "Mongolia", "Nepal", "Bangladesh", "Sri Lanka", "Pakistan", "Maldives", "Australia", "New Zealand", "USA", "UK"];
const TSHIRT_SIZES = ["2XS", "XS", "S", "M", "L", "2XL", "3XL", "5XL", "7XL"];

// Helper for standard Select
const SelectField: React.FC<{ label: string; value: string; onChange: (v: string) => void; options: string[] }> = ({ label, value, onChange, options }) => (
  <div className="space-y-1">
    <label className="text-[10px] font-black uppercase text-gray-400 ml-2">{label}</label>
    <select className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold outline-none shadow-sm focus:ring-4 focus:ring-[#FFD700]/10 focus:border-[#FFD700] transition-all appearance-none cursor-pointer" value={value || ''} onChange={e => onChange(e.target.value)}>
      <option value="">-- SELECT --</option>
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
);

type AdminView = 'Attendees' | 'Itinerary' | 'Packages' | 'Nearby' | 'Golf' | 'Sponsors';

const AdminPortal: React.FC<AdminPortalProps> = ({
  guests, onUpdateGuests, schedules, onUpdateSchedules, onBulkSync, attractions, onUpdateAttractions, diningGuide, onUpdateDining, packagePermissions, onUpdatePackagePermissions, categoryPermissions, onUpdateCategoryPermissions, golfGroupings, onUpdateGolfGroupings, sponsorships, onUpdateSponsorships
}) => {
  const [activeAdminTab, setActiveAdminTab] = useState<AdminView>('Attendees');
  const [activeGolfDay, setActiveGolfDay] = useState<1 | 2>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [pasteMode, setPasteMode] = useState<'guests' | 'nearby' | 'sponsors'>('guests');
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; type: 'package' | 'rule' | 'attendee' | 'itinerary' | 'nearby' | 'golf' | 'sponsor' } | null>(null);
  const [importPreview, setImportPreview] = useState<string[][] | null>(null);

  useEffect(() => {
    if (deleteConfirm) {
      const timer = setTimeout(() => setDeleteConfirm(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [deleteConfirm]);
  const [editingItem, setEditingItem] = useState<{ type: AdminView; data: any } | null>(null);
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [pastedData, setPastedData] = useState('');
  const [importResult, setImportResult] = useState<{ total: number; imported: number; failed: { row: number; reason: string; data: string }[] } | null>(null);
  const [editingPackage, setEditingPackage] = useState<any>(null);
  const [packageEditData, setPackageEditData] = useState<{ oldName?: string; newName: string; category: PackageCategory }>({ newName: '', category: 'Int' });
  const [isPermMetaModalOpen, setIsPermMetaModalOpen] = useState(false);
  const [permMetaEditData, setPermMetaEditData] = useState<{ category: PackageCategory; id?: string; name: string; date: string; linkedItinerary?: string[]; golfType?: 'Day1' | 'Day2' }>({ category: 'Int', name: '', date: '', linkedItinerary: [] });
  const [selectedGolfers, setSelectedGolfers] = useState<string[]>([]);

  const activePackageTypes = Object.keys(packagePermissions) as PackageType[];

  const togglePermission = (pkg: PackageType, permId: string) => {
    const newPerms = { ...packagePermissions };
    const currentPkg = newPerms[pkg];
    if (currentPkg) {
      newPerms[pkg] = { ...currentPkg, permissions: { ...currentPkg.permissions, [permId]: !currentPkg.permissions[permId] } };
      onUpdatePackagePermissions(newPerms);
    }
  };

  const handleAddOrUpdatePackage = (e: React.FormEvent) => {
    e.preventDefault();
    const { oldName, newName, category } = packageEditData;
    if (!newName.trim()) return;
    const newPerms = { ...packagePermissions };
    if (oldName) {
      if (oldName !== newName) {
        newPerms[newName] = { ...newPerms[oldName], category };
        delete newPerms[oldName];
        onUpdateGuests(guests.map(g => g.package === oldName ? { ...g, package: newName } : g));
      } else { newPerms[newName].category = category; }
    } else {
      const initialPermissions: Record<string, boolean> = {};
      (categoryPermissions[category] || []).forEach(p => initialPermissions[p.id] = false);
      newPerms[newName] = { category, permissions: initialPermissions };
    }
    onUpdatePackagePermissions(newPerms);
    setIsPackageModalOpen(false);
  };

  const handleAddOrUpdatePermMeta = (e: React.FormEvent) => {
    e.preventDefault();
    const { category, id, name, date, linkedItinerary, golfType } = permMetaEditData;
    if (!name.trim()) return;
    const newCatPerms = { ...categoryPermissions };
    const currentList = [...(newCatPerms[category] || [])];
    const newPackagePermissions = { ...packagePermissions };

    if (id) {
      const idx = currentList.findIndex(p => p.id === id);
      if (idx > -1) {
        const updatedRule: PermissionMeta = { id, name, date, linkedItinerary: linkedItinerary || [] };
        if (golfType) updatedRule.golfType = golfType;
        currentList[idx] = updatedRule;
      }
    } else {
      const newId = `${category.toLowerCase().replace(/\s/g, '')}_${Date.now()}`;
      currentList.push({ id: newId, name, date, linkedItinerary: linkedItinerary || [], golfType });
      Object.keys(newPackagePermissions).forEach(pkg => {
        if (newPackagePermissions[pkg].category === category) {
          if (!newPackagePermissions[pkg].permissions) newPackagePermissions[pkg].permissions = {};
          newPackagePermissions[pkg].permissions[newId] = false;
        }
      });
    }
    newCatPerms[category] = currentList;
    onUpdateCategoryPermissions(newCatPerms);
    onUpdatePackagePermissions(newPackagePermissions);
    setIsPermMetaModalOpen(false);
  };

  const deletePermMeta = (category: PackageCategory, id: string) => {
    console.log('Admin: deletePermMeta called', { category, id });
    const newCatPerms = { ...categoryPermissions };
    newCatPerms[category] = (newCatPerms[category] || []).filter(p => p.id !== id);
    const newPackagePermissions = { ...packagePermissions };
    Object.keys(newPackagePermissions).forEach(pkg => {
      if (newPackagePermissions[pkg].category === category) delete newPackagePermissions[pkg].permissions[id];
    });
    onUpdateCategoryPermissions(newCatPerms);
    onUpdatePackagePermissions(newPackagePermissions);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    const { type, data } = editingItem;
    const isNew = !data.id || data.id.startsWith('temp_');
    const finalId = isNew ? `${type[0]}${Date.now()}` : data.id;
    const finalData = { ...data, id: finalId };

    if (type === 'Attendees') {
      const updatedGuests = isNew
        ? [...guests, finalData]
        : guests.map(g => (g.docId && g.docId === data.docId) || (g.id === data.id) ? finalData : g);
      console.log('Admin: Committing guest registry update:', updatedGuests);
      onUpdateGuests(updatedGuests);
    } else if (type === 'Itinerary') {
      onUpdateSchedules(isNew ? [...schedules, finalData] : schedules.map(s => s.id === finalId ? finalData : s));
    } else if (type === 'Nearby') {
      onUpdateAttractions(isNew ? [...attractions, finalData] : attractions.map(a => a.id === finalId ? finalData : a));
    } else if (type === 'Golf') {
      onUpdateGolfGroupings(isNew ? [...golfGroupings, finalData] : golfGroupings.map(g => g.id === finalId ? finalData : g));
    } else if (type === 'Sponsors') {
      onUpdateSponsorships(isNew ? [...sponsorships, finalData] : sponsorships.map(s => s.id === finalId ? finalData : s));
    }
    setEditingItem(null);
  };

  const handleGolfAssignment = (guestIds: string[], day: 1 | 2, flight: string, tee: string, buggy: string) => {
    if (guestIds.length === 0) return;

    // Create deep copy of groupings
    let newGroupings = [...golfGroupings];

    // 1. Remove guests from any existing flight on this day
    newGroupings = newGroupings.map(g => {
      if (g.day !== day) return g;
      return { ...g, players: g.players.filter(pid => !guestIds.includes(pid)) };
    }).filter(g => g.players.length > 0 || g.flightNumber // Keep empty flights if we want? Or filter them out. Let's filter empty ones that don't match target to be clean.
    );

    // 2. Add guests to target flight
    if (flight) {
      // Find existing target flight
      const targetIndex = newGroupings.findIndex(g => g.day === day && g.flightNumber.toLowerCase() === flight.toLowerCase());

      if (targetIndex > -1) {
        // Update existing
        const g = newGroupings[targetIndex];
        // Merge players, unique
        const combined = Array.from(new Set([...g.players, ...guestIds]));
        newGroupings[targetIndex] = { ...g, players: combined, teeTime: tee || g.teeTime, buggyNumber: buggy || g.buggyNumber };
        // Note: For batch, if tee/buggy provided, we update the whole flight? 
        // "Batch set flight details". Yes, usually implies setting properties for that flight.
      } else {
        // Create new
        newGroupings.push({
          id: `flight_${day}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          day,
          flightNumber: flight,
          teeTime: tee,
          buggyNumber: buggy,
          players: guestIds
        });
      }
    }

    // Clean up: Remove groupings with no players? 
    // Maybe not, an empty flight might be desired. 
    // But above I filtered generic ones. 

    onUpdateGolfGroupings(newGroupings);
    setSelectedGolfers([]); // Clear selection after action
  };

  const sortedDatesFromSchedule = Array.from(new Set(schedules.map(s => s.date))).sort();

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

  const groupedSchedules = schedules.reduce((groups, item) => {
    const date = item.date;
    if (!groups[date]) groups[date] = [];
    groups[date].push(item);
    return groups;
  }, {} as Record<string, EventSchedule[]>);

  // Sort each group by time
  Object.keys(groupedSchedules).forEach(date => {
    groupedSchedules[date].sort((a, b) => parseTime(a.time) - parseTime(b.time));
  });

  const sortedItineraryDates = Object.keys(groupedSchedules).sort((a, b) => {
    const parseDate = (d: string) => {
      const parts = d.split('.');
      if (parts.length === 3) return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0])).getTime();
      return 0;
    };
    return parseDate(a) - parseDate(b);
  });

  return (
    <div className="space-y-8 pb-20 md:pb-0 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#014227]">Admin Console</h1>
          <p className="text-gray-500 font-medium">Manage delegates, itinerary and complex permissions.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {activeAdminTab === 'Packages' ? (
            <button onClick={() => { setPackageEditData({ newName: '', category: 'Int' }); setIsPackageModalOpen(true); }} className="bg-[#014227] text-[#FFD700] px-6 py-2.5 rounded-2xl text-xs font-black uppercase flex items-center gap-2 shadow-lg hover:bg-black transition"><Plus size={14} /><span>Add Package</span></button>
          ) : activeAdminTab === 'Itinerary' ? (
            <div className="flex gap-2">
              <button
                onClick={() => { if (window.confirm('This will replace ALL live databases (Itinerary, Packages, Rules) with the pre-defined MOCK data. Proceed?')) onBulkSync(); }}
                className="bg-amber-600 text-white px-6 py-2.5 rounded-2xl text-xs font-black uppercase flex items-center gap-2 shadow-lg hover:bg-black transition"
              >
                <RefreshCw size={14} /><span>Bulk Sync All Databases</span>
              </button>
              <button onClick={() => setEditingItem({ type: activeAdminTab, data: { id: `temp_${Date.now()}`, name: '', date: sortedDatesFromSchedule[0] || '' } })} className="bg-[#014227] text-[#FFD700] px-6 py-2.5 rounded-2xl text-xs font-black uppercase flex items-center gap-2 shadow-lg hover:bg-black transition"><Plus size={14} /><span>Add {activeAdminTab.slice(0, -1)}</span></button>
            </div>
          ) : activeAdminTab === 'Golf' ? (
            null
          ) : (
            <button onClick={() => {
              const baseData = { id: `temp_${Date.now()}`, name: '', date: sortedDatesFromSchedule[0] || '' };
              setEditingItem({ type: activeAdminTab, data: baseData });
            }} className="bg-[#014227] text-[#FFD700] px-6 py-2.5 rounded-2xl text-xs font-black uppercase flex items-center gap-2 shadow-lg hover:bg-black transition"><Plus size={14} /><span>Add {activeAdminTab.slice(0, -1)}</span></button>
          )}
        </div>
      </div>

      <div className="flex bg-white rounded-3xl p-1 shadow-xl border border-gray-100 overflow-x-auto">
        {(['Attendees', 'Itinerary', 'Packages', 'Nearby', 'Golf', 'Sponsors'] as AdminView[]).map(tab => (
          <button key={tab} onClick={() => setActiveAdminTab(tab)} className={`flex-1 flex items-center justify-center space-x-2 py-3 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeAdminTab === tab ? 'bg-[#014227] text-[#FFD700] shadow-lg' : 'text-gray-400 hover:text-[#014227]'}`}>
            <span>{tab}</span>
          </button>
        ))}
      </div>

      {activeAdminTab === 'Attendees' && (
        <div className="space-y-6">
          <div className="bg-white rounded-[40px] shadow-xl border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-4">
            <div className="p-6 md:p-8 bg-[#014227] text-[#FFD700] flex justify-between items-center flex-wrap gap-4">
              <div>
                <h3 className="text-lg font-black uppercase tracking-widest">Attendee Registry</h3>
                <p className="text-[9px] font-bold opacity-70 uppercase tracking-widest">{guests.length} Registered Delegates</p>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                  <input
                    type="text"
                    placeholder="Search delegates..."
                    className="pl-10 pr-4 py-2 bg-white/10 border border-[#FFD700]/20 rounded-xl text-xs font-bold text-[#FFD700] outline-none placeholder:text-[#FFD700]/40 w-64"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
                <button
                  onClick={() => setIsPasteModalOpen(true)}
                  className="bg-[#FFD700] text-[#014227] px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-white transition shadow-lg"
                >
                  <ClipboardPaste size={14} /> Paste Data
                </button>
              </div>
            </div>
            <div className="md:hidden p-4 space-y-4 bg-gray-50/50">
              {guests.filter(g =>
                g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                g.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                g.country.toLowerCase().includes(searchQuery.toLowerCase())
              ).map(guest => (
                <div key={guest.id} className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100 relative group">
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button onClick={() => setEditingItem({ type: 'Attendees', data: guest })} className="p-2 text-blue-600 bg-gray-50 rounded-xl hover:bg-blue-50"><Edit3 size={14} /></button>
                    <button
                      onClick={() => {
                        if (deleteConfirm?.id === guest.id && deleteConfirm?.type === 'attendee') {
                          onUpdateGuests(guests.filter(g => g.id !== guest.id));
                          setDeleteConfirm(null);
                        } else {
                          setDeleteConfirm({ id: guest.id, type: 'attendee' });
                        }
                      }}
                      className={`p-2 rounded-xl transition-all ${deleteConfirm?.id === guest.id && deleteConfirm?.type === 'attendee' ? 'bg-orange-500 text-white' : 'text-red-500 bg-gray-50'}`}
                    >
                      {deleteConfirm?.id === guest.id && deleteConfirm?.type === 'attendee' ? <AlertTriangle size={14} /> : <Trash2 size={14} />}
                    </button>
                  </div>

                  <span className="bg-[#014227] text-[#FFD700] px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest mb-3 inline-block">{guest.package}</span>

                  <div className="pr-16">
                    <h4 className="font-black text-[#014227] text-lg leading-tight">{guest.name}</h4>
                    <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">{guest.id} • {guest.gender}</p>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Country</p>
                      <p className="text-xs font-bold text-[#014227]">{guest.country}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Organization</p>
                      <p className="text-xs font-bold text-[#014227]">{guest.localOrg}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#FFFBEB] text-[#014227] text-[10px] font-black uppercase tracking-widest border-b border-gray-100">
                  <tr>
                    <th className="px-8 py-4">Identity</th>
                    <th className="px-8 py-4">Package</th>
                    <th className="px-8 py-4">Country</th>
                    <th className="px-8 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {guests.filter(g =>
                    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    g.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    g.country.toLowerCase().includes(searchQuery.toLowerCase())
                  ).map(guest => (
                    <tr key={guest.id} className="hover:bg-gray-50 transition group">
                      <td className="px-8 py-6">
                        <div className="font-black text-[#014227]">{guest.name}</div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase">{guest.id} • {guest.gender}</div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="bg-[#014227] text-[#FFD700] px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">{guest.package}</span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="text-[10px] font-black uppercase text-[#014227]">{guest.country}</div>
                        <div className="text-[9px] font-bold text-gray-400 uppercase">{guest.localOrg}</div>
                      </td>
                      <td className="px-8 py-6 text-right opacity-0 group-hover:opacity-100 transition">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setEditingItem({ type: 'Attendees', data: guest })} className="p-2 text-blue-600 bg-white border border-gray-100 rounded-lg shadow-sm hover:bg-blue-50"><Edit3 size={12} /></button>
                          <button
                            onClick={() => {
                              if (deleteConfirm?.id === guest.id && deleteConfirm?.type === 'attendee') {
                                onUpdateGuests(guests.filter(g => g.id !== guest.id));
                                setDeleteConfirm(null);
                              } else {
                                setDeleteConfirm({ id: guest.id, type: 'attendee' });
                              }
                            }}
                            className={`p-2 rounded-lg shadow-sm transition-all duration-200 ${deleteConfirm?.id === guest.id && deleteConfirm?.type === 'attendee' ? 'bg-orange-500 text-white scale-110' : 'text-red-500 bg-white border border-gray-100 hover:bg-red-50'}`}
                          >
                            {deleteConfirm?.id === guest.id && deleteConfirm?.type === 'attendee' ? <AlertTriangle size={12} /> : <Trash2 size={12} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeAdminTab === 'Packages' && (
        <div className="flex flex-col gap-8">
          {PACKAGE_CATEGORIES.map(category => {
            const pkgInCat = activePackageTypes
              .filter(p => packagePermissions[p]?.category === category)
              .sort((a, b) => a.localeCompare(b));
            const currentPerms = [...(categoryPermissions[category] || [])].sort((a, b) => {
              const parse = (d: string) => {
                if (!d) return 0;
                if (d.includes('.')) {
                  const p = d.split('.');
                  return new Date(Number(p[2]), Number(p[1]) - 1, Number(p[0])).getTime();
                }
                const ts = Date.parse(d);
                return isNaN(ts) ? 0 : ts;
              };
              const diff = parse(a.date) - parse(b.date);
              if (diff !== 0) return diff;
              return a.name.localeCompare(b.name);
            });

            return (
              <div key={category} className="bg-white rounded-[40px] shadow-xl border border-gray-100 overflow-hidden flex flex-col h-fit animate-in slide-in-from-bottom-4">
                <div className="p-8 bg-[#014227] text-[#FFD700] flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-widest">{category} Pass Matrix</h3>
                    <p className="text-[9px] font-bold opacity-70 uppercase tracking-widest">{pkgInCat.length} Active Packages</p>
                  </div>
                  <button onClick={() => { setPermMetaEditData({ category, name: '', date: '', linkedItinerary: [] }); setIsPermMetaModalOpen(true); }} className="bg-[#FFD700] text-[#014227] px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-white transition"><Plus size={12} /> Add Rule</button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-[#FFFBEB] text-[#014227] uppercase sticky top-0 z-10">
                      <tr className="border-b border-gray-200">
                        <th rowSpan={2} className="px-6 py-4 border-r border-gray-200 text-[10px] font-black tracking-widest bg-[#FFFBEB] w-64 min-w-[156px]">PACKAGES</th>
                        {currentPerms.reduce((acc, p, idx) => {
                          if (idx === 0 || p.date !== currentPerms[idx - 1].date) {
                            const colSpan = currentPerms.filter(x => x.date === p.date).length;
                            acc.push(
                              <th key={p.date + idx} colSpan={colSpan} className="px-3 py-3 border-r border-gray-200 text-center text-[8px] font-black tracking-[0.2em] bg-amber-50/50">
                                {p.date}
                              </th>
                            );
                          }
                          return acc;
                        }, [] as React.ReactNode[])}
                        <th rowSpan={2} className="px-6 py-4 text-right text-[10px] font-black tracking-widest bg-[#FFFBEB] w-32">ACTIONS</th>
                      </tr>
                      <tr>
                        {currentPerms.map(p => (
                          <th key={p.id} className="px-3 py-4 border-r border-gray-200 text-center group/header relative bg-white">
                            <div className="flex flex-col items-center min-w-[60px]">
                              <span className="text-[7px] font-black tracking-tighter mb-1 uppercase">{p.name}</span>
                              {(() => {
                                const links = Array.isArray(p.linkedItinerary) ? p.linkedItinerary : (p.linkedItinerary ? [p.linkedItinerary as string] : []);
                                return links.map(id => (
                                  <span key={id} className="text-[6px] text-blue-600 font-bold uppercase tracking-wider mt-0.5 block">📅 {schedules.find(s => s.id === id)?.title || 'Event'}</span>
                                ));
                              })()}
                              <div className="flex space-x-1 opacity-0 group-hover/header:opacity-100 transition absolute top-0 right-0 bg-white shadow-md p-1 rounded-bl-lg">
                                <button onClick={() => {
                                  const normalized = { ...p, linkedItinerary: Array.isArray(p.linkedItinerary) ? p.linkedItinerary : (p.linkedItinerary ? [p.linkedItinerary as string] : []) };
                                  setPermMetaEditData({ ...normalized, category });
                                  setIsPermMetaModalOpen(true);
                                }} className="p-0.5 text-blue-600"><Edit3 size={10} /></button>
                                <button
                                  onClick={() => {
                                    console.log('Admin: Rule Delete Clicked', { id: p.id, deleteConfirm });
                                    if (deleteConfirm?.id === p.id && deleteConfirm?.type === 'rule') {
                                      deletePermMeta(category, p.id);
                                      setDeleteConfirm(null);
                                    } else {
                                      setDeleteConfirm({ id: p.id, type: 'rule' });
                                    }
                                  }}
                                  className={`p-0.5 rounded transition-all ${deleteConfirm?.id === p.id && deleteConfirm?.type === 'rule' ? 'bg-orange-500 text-white' : 'text-red-600 hover:bg-red-50'}`}
                                >
                                  {deleteConfirm?.id === p.id && deleteConfirm?.type === 'rule' ? <AlertTriangle size={10} /> : <Trash2 size={10} />}
                                </button>
                              </div>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {pkgInCat.map(pkg => (
                        <tr key={pkg} className="hover:bg-gray-50 transition group">
                          <td className="px-6 py-5 border-r border-gray-100 w-64">
                            <div className="font-black text-[#014227] text-xs">{pkg}</div>
                            <div className="text-[8px] font-bold text-gray-400 uppercase">{guests.filter(g => g.package === pkg).length} DELEGATES</div>
                          </td>
                          {currentPerms.map(p => (
                            <td key={p.id} className="px-3 py-5 text-center border-r border-gray-100">
                              <button onClick={() => togglePermission(pkg, p.id)} className={`p-2 rounded-xl transition transform active:scale-95 ${packagePermissions[pkg]?.permissions?.[p.id] ? 'bg-[#014227] text-[#FFD700]' : 'bg-gray-100 text-gray-300'}`}>
                                {packagePermissions[pkg]?.permissions?.[p.id] ? <Check size={14} /> : <Square size={14} />}
                              </button>
                            </td>
                          ))}
                          <td className="px-6 py-5 text-right w-32">
                            <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition">
                              <button onClick={() => { setPackageEditData({ oldName: pkg, newName: pkg, category }); setIsPackageModalOpen(true); }} className="p-2 text-blue-600 bg-white border border-gray-100 rounded-lg shadow-sm hover:bg-blue-50"><Edit3 size={12} /></button>
                              <button
                                onClick={() => {
                                  console.log('Admin: Package Delete Click', { id: pkg, currentConfirm: deleteConfirm });
                                  if (deleteConfirm?.id === pkg && deleteConfirm?.type === 'package') {
                                    const n = { ...packagePermissions };
                                    delete n[pkg];
                                    console.log('Admin: New permissions object after delete:', n);
                                    onUpdatePackagePermissions(n);
                                    setDeleteConfirm(null);
                                  } else {
                                    console.log('Admin: Initiating deletion for package:', pkg);
                                    setDeleteConfirm({ id: pkg, type: 'package' });
                                  }
                                }}
                                className={`p-2 rounded-lg shadow-sm transition-all duration-200 ${deleteConfirm?.id === pkg && deleteConfirm?.type === 'package' ? 'bg-orange-500 text-white scale-110' : 'text-red-500 bg-white border border-gray-100 hover:bg-red-50'}`}
                              >
                                {deleteConfirm?.id === pkg && deleteConfirm?.type === 'package' ? <AlertTriangle size={12} /> : <Trash2 size={12} />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeAdminTab === 'Golf' && (
        <div className="space-y-6">
          <div className="bg-white rounded-[40px] shadow-xl border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-4">
            <div className="p-8 bg-[#014227] text-[#FFD700] flex flex-col md:flex-row justify-between items-center gap-6">
              <div>
                <h3 className="text-lg font-black uppercase tracking-widest">Golf Registry - Day {activeGolfDay}</h3>
                <p className="text-[9px] font-bold opacity-70 uppercase tracking-widest">Manage Flights & Buggies</p>
              </div>

              <div className="flex bg-[#00331f] p-1 rounded-xl">
                <button onClick={() => setActiveGolfDay(1)} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeGolfDay === 1 ? 'bg-[#FFD700] text-[#014227] shadow-lg' : 'text-gray-400 hover:text-white'}`}>Day 1</button>
                <button onClick={() => setActiveGolfDay(2)} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeGolfDay === 2 ? 'bg-[#FFD700] text-[#014227] shadow-lg' : 'text-gray-400 hover:text-white'}`}>Day 2</button>
              </div>
            </div>

            {/* Statistics Dashboard */}
            {(() => {
              const targetType = activeGolfDay === 1 ? 'Day1' : 'Day2';
              // Calculate eligible golfers first
              const validRuleIds = new Set<string>();
              PACKAGE_CATEGORIES.forEach(cat => (categoryPermissions[cat] || []).forEach(p => { if (p.golfType === targetType) validRuleIds.add(p.id); }));

              const eligible = guests.filter(g => {
                if (!g.isGolfParticipant) return false;
                const perms = packagePermissions[g.package]?.permissions || {};
                return Object.keys(perms).some(pid => validRuleIds.has(pid));
              });

              const totalGolfers = eligible.length;
              const maleCount = eligible.filter(g => g.gender === 'Male').length;
              const femaleCount = eligible.filter(g => g.gender === 'Female').length;

              // Flights
              const dayFlights = golfGroupings.filter(g => g.day === activeGolfDay && g.flightNumber);
              const totalFlights = new Set(dayFlights.map(g => g.flightNumber.toLowerCase())).size;

              // By Country
              const byNation: Record<string, number> = {};
              eligible.forEach(g => {
                byNation[g.country] = (byNation[g.country] || 0) + 1;
              });
              const sortedNations = Object.entries(byNation).sort((a, b) => b[1] - a[1]);

              return (
                <div className="grid grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4 px-4 md:px-8 py-6 bg-gray-50 border-b border-gray-100">
                  <div className="bg-white p-3 md:p-4 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 truncate">Total Flights</div>
                    <div className="text-xl md:text-2xl font-black text-[#014227]">{totalFlights}</div>
                  </div>
                  <div className="bg-white p-3 md:p-4 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 truncate">Total Golfers</div>
                    <div className="text-xl md:text-2xl font-black text-[#014227]">{totalGolfers} <span className="hidden sm:inline text-sm text-gray-400 font-bold ml-1">Pax</span></div>
                  </div>
                  <div className="bg-white p-3 md:p-4 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 truncate">Gender Split</div>
                    <div className="flex items-center gap-2 md:gap-3">
                      <div><span className="text-2xl md:text-2xl font-black text-[#014227]">{maleCount}</span> <span className="text-[7px] md:text-[9px] font-bold text-gray-400 uppercase">Male</span></div>
                      <div className="w-px h-4 md:h-6 bg-gray-200"></div>
                      <div><span className="text-2xl md:text-2xl font-black text-[#014227]">{femaleCount}</span> <span className="text-[7px] md:text-[9px] font-bold text-gray-400 uppercase">Female</span></div>
                    </div>
                  </div>
                  <div className="col-span-3 lg:col-span-1 bg-white p-3 md:p-4 rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Top Nations</div>
                    <div className="flex flex-wrap gap-1.5 h-auto lg:h-12 overflow-y-auto custom-scrollbar content-start">
                      {sortedNations.map(([country, count]) => (
                        <span key={country} className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-[8px] md:text-[9px] font-bold uppercase">{country} {count}</span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Batch Action Bar */}
            <div className="bg-[#FFFBEB] p-4 border-b border-gray-100">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex items-center gap-2 shrink-0">
                  <div className="bg-[#014227] text-[#FFD700] w-6 h-6 rounded flex items-center justify-center text-[10px] font-black">{selectedGolfers.length}</div>
                  <span className="text-[10px] font-black text-[#014227] uppercase tracking-widest whitespace-nowrap">Selected</span>
                </div>

                <div className="hidden md:block h-8 w-px bg-gray-300 mx-2"></div>

                <div className="grid grid-cols-3 gap-2 flex-grow">
                  <input id="batchFlight" type="text" placeholder="Flight" className="w-full p-2.5 rounded-lg border border-gray-200 text-xs font-bold uppercase outline-none focus:border-[#014227] bg-white text-center" />
                  <input id="batchTee" type="text" placeholder="Tee" className="w-full p-2.5 rounded-lg border border-gray-200 text-xs font-bold uppercase outline-none focus:border-[#014227] bg-white text-center" />
                  <input id="batchBuggy" type="text" placeholder="Buggy" className="w-full p-2.5 rounded-lg border border-gray-200 text-xs font-bold uppercase outline-none focus:border-[#014227] bg-white text-center" />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const f = (document.getElementById('batchFlight') as HTMLInputElement).value;
                      const t = (document.getElementById('batchTee') as HTMLInputElement).value;
                      const b = (document.getElementById('batchBuggy') as HTMLInputElement).value;
                      handleGolfAssignment(selectedGolfers, activeGolfDay, f, t, b);
                      // Clear inputs
                      (document.getElementById('batchFlight') as HTMLInputElement).value = '';
                      (document.getElementById('batchTee') as HTMLInputElement).value = '';
                      (document.getElementById('batchBuggy') as HTMLInputElement).value = '';
                    }}
                    disabled={selectedGolfers.length === 0}
                    className="flex-grow bg-[#014227] text-[#FFD700] px-4 py-3 rounded-xl text-[10px] font-black uppercase shadow-lg hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Assign / Update
                  </button>
                  <button
                    onClick={() => handleGolfAssignment(selectedGolfers, activeGolfDay, '', '', '')}
                    disabled={selectedGolfers.length === 0}
                    className="text-red-500 hover:bg-red-50 px-4 py-3 rounded-xl text-[10px] font-black uppercase transition border border-red-100 md:border-transparent"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden p-4 space-y-3 bg-gray-50/50">
              {(() => {
                const targetType = activeGolfDay === 1 ? 'Day1' : 'Day2';
                const validRuleIds = new Set<string>();
                PACKAGE_CATEGORIES.forEach(cat => (categoryPermissions[cat] || []).forEach(p => { if (p.golfType === targetType) validRuleIds.add(p.id); }));

                const eligibleGuests = guests.filter(g => {
                  if (!g.isGolfParticipant) return false;
                  const perms = packagePermissions[g.package]?.permissions || {};
                  return Object.keys(perms).some(pid => validRuleIds.has(pid));
                }).sort((a, b) => a.name.localeCompare(b.name));

                if (eligibleGuests.length === 0) return <div className="p-10 text-center text-gray-400 text-xs font-bold uppercase">No eligible golfers found</div>;

                return eligibleGuests.map(g => {
                  const group = golfGroupings.find(grp => grp.day === activeGolfDay && grp.players.includes(g.id));
                  const isSelected = selectedGolfers.includes(g.id);

                  return (
                    <div key={g.id} className={`bg-white rounded-[24px] p-5 shadow-sm border ${isSelected ? 'border-[#FFD700] ring-1 ring-[#FFD700]' : 'border-gray-100'} transition-all`}>
                      <div className="flex items-start gap-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            if (isSelected) setSelectedGolfers(selectedGolfers.filter(id => id !== g.id));
                            else setSelectedGolfers([...selectedGolfers, g.id]);
                          }}
                          className="mt-1 rounded border-gray-300 text-[#014227] focus:ring-[#014227]"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <div className="font-black text-[#014227] text-sm truncate pr-2">{g.name}</div>
                            {group ? (
                              <span className="bg-[#014227] text-[#FFD700] px-2 py-0.5 rounded text-[8px] font-black uppercase whitespace-nowrap">Assigned</span>
                            ) : (
                              <span className="bg-gray-100 text-gray-400 px-2 py-0.5 rounded text-[8px] font-black uppercase whitespace-nowrap">Pending</span>
                            )}
                          </div>
                          <div className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">{g.package} • {g.country}</div>

                          <div className="mt-4 grid grid-cols-3 gap-3">
                            <div className="space-y-1">
                              <label className="text-[8px] font-black uppercase text-gray-400">Flight</label>
                              <input
                                type="text"
                                defaultValue={group?.flightNumber || ''}
                                onBlur={(e) => {
                                  if (e.target.value !== (group?.flightNumber || '')) {
                                    handleGolfAssignment([g.id], activeGolfDay, e.target.value, group?.teeTime || '', group?.buggyNumber || '');
                                  }
                                }}
                                placeholder="-"
                                className="w-full bg-gray-50 border-b border-gray-200 py-2 text-[10px] font-black text-[#014227] uppercase text-center focus:border-[#014227] outline-none rounded-lg"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[8px] font-black uppercase text-gray-400">Tee Time</label>
                              <input
                                type="text"
                                defaultValue={group?.teeTime || ''}
                                onBlur={(e) => {
                                  if (e.target.value !== (group?.teeTime || '')) {
                                    handleGolfAssignment([g.id], activeGolfDay, group?.flightNumber || 'Unassigned', e.target.value, group?.buggyNumber || '');
                                  }
                                }}
                                placeholder="-"
                                className="w-full bg-gray-50 border-b border-gray-200 py-2 text-[10px] font-black text-[#014227] uppercase text-center focus:border-[#014227] outline-none rounded-lg"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[8px] font-black uppercase text-gray-400">Buggy</label>
                              <input
                                type="text"
                                defaultValue={group?.buggyNumber || ''}
                                onBlur={(e) => {
                                  if (e.target.value !== (group?.buggyNumber || '')) {
                                    handleGolfAssignment([g.id], activeGolfDay, group?.flightNumber || 'Unassigned', group?.teeTime || '', e.target.value);
                                  }
                                }}
                                placeholder="-"
                                className="w-full bg-gray-50 border-b border-gray-200 py-2 text-[10px] font-black text-[#014227] uppercase text-center focus:border-[#014227] outline-none rounded-lg"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              })()}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#FFFBEB] text-[#014227] text-[10px] font-black uppercase tracking-widest border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 w-12 text-center">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-[#014227] focus:ring-[#014227]"
                        onChange={(e) => {
                          if (e.target.checked) {
                            const targetType = activeGolfDay === 1 ? 'Day1' : 'Day2';
                            const validRuleIds = new Set<string>();
                            PACKAGE_CATEGORIES.forEach(cat => (categoryPermissions[cat] || []).forEach(p => { if (p.golfType === targetType) validRuleIds.add(p.id); }));

                            const allIds = guests.filter(g => {
                              if (!g.isGolfParticipant) return false;
                              const perms = packagePermissions[g.package]?.permissions || {};
                              return Object.keys(perms).some(pid => validRuleIds.has(pid));
                            }).map(g => g.id);
                            setSelectedGolfers(allIds);
                          } else {
                            setSelectedGolfers([]);
                          }
                        }}
                      />
                    </th>
                    <th className="px-6 py-4">Golfer</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Assigned Flight</th>
                    <th className="px-6 py-4">Tee Time</th>
                    <th className="px-6 py-4">Buggy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(() => {
                    const targetType = activeGolfDay === 1 ? 'Day1' : 'Day2';
                    // Recalculate rules
                    const validRuleIds = new Set<string>();
                    PACKAGE_CATEGORIES.forEach(cat => (categoryPermissions[cat] || []).forEach(p => { if (p.golfType === targetType) validRuleIds.add(p.id); }));

                    const eligibleGuests = guests.filter(g => {
                      if (!g.isGolfParticipant) return false;
                      const perms = packagePermissions[g.package]?.permissions || {};
                      return Object.keys(perms).some(pid => validRuleIds.has(pid));
                    }).sort((a, b) => a.name.localeCompare(b.name));

                    if (eligibleGuests.length === 0) return <tr><td colSpan={6} className="p-10 text-center text-gray-400 text-xs font-bold uppercase">No eligible golfers found for Day {activeGolfDay}</td></tr>;

                    return eligibleGuests.map(g => {
                      const group = golfGroupings.find(grp => grp.day === activeGolfDay && grp.players.includes(g.id));
                      const isSelected = selectedGolfers.includes(g.id);

                      return (
                        <tr key={g.id} className={`hover:bg-gray-50 transition ${isSelected ? 'bg-amber-50/50' : ''}`}>
                          <td className="px-6 py-4 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                if (isSelected) setSelectedGolfers(selectedGolfers.filter(id => id !== g.id));
                                else setSelectedGolfers([...selectedGolfers, g.id]);
                              }}
                              className="rounded border-gray-300 text-[#014227] focus:ring-[#014227]"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-black text-[#014227]">{g.name}</div>
                            <div className="text-[9px] font-bold text-gray-400 uppercase">{g.package} • {g.country}</div>
                          </td>
                          <td className="px-6 py-4">
                            {group ? (
                              <span className="bg-[#014227] text-[#FFD700] px-2 py-1 rounded text-[9px] font-black uppercase">Assigned</span>
                            ) : (
                              <span className="bg-gray-100 text-gray-400 px-2 py-1 rounded text-[9px] font-black uppercase">Pending</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {/* Inline Edit Flight */}
                            <input
                              type="text"
                              defaultValue={group?.flightNumber || ''}
                              onBlur={(e) => {
                                if (e.target.value !== (group?.flightNumber || '')) {
                                  handleGolfAssignment([g.id], activeGolfDay, e.target.value, group?.teeTime || '', group?.buggyNumber || '');
                                }
                              }}
                              placeholder="-"
                              className="w-20 bg-transparent border-b border-gray-200 py-1 text-xs font-bold uppercase focus:border-[#014227] outline-none transition"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              defaultValue={group?.teeTime || ''}
                              onBlur={(e) => {
                                if (e.target.value !== (group?.teeTime || '')) {
                                  handleGolfAssignment([g.id], activeGolfDay, group?.flightNumber || 'Unassigned', e.target.value, group?.buggyNumber || '');
                                }
                              }}
                              placeholder="-"
                              className="w-20 bg-transparent border-b border-gray-200 py-1 text-xs font-bold uppercase focus:border-[#014227] outline-none transition"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              defaultValue={group?.buggyNumber || ''}
                              onBlur={(e) => {
                                if (e.target.value !== (group?.buggyNumber || '')) {
                                  handleGolfAssignment([g.id], activeGolfDay, group?.flightNumber || 'Unassigned', group?.teeTime || '', e.target.value);
                                }
                              }}
                              placeholder="-"
                              className="w-16 bg-transparent border-b border-gray-200 py-1 text-xs font-bold uppercase focus:border-[#014227] outline-none transition"
                            />
                          </td>
                        </tr>
                      );

                    })
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeAdminTab === 'Itinerary' && (
        <div className="space-y-10">
          {sortedItineraryDates.map(date => (
            <div key={date} className="bg-white rounded-[40px] shadow-xl border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-4">
              <div className="p-6 md:p-8 bg-[#014227] text-[#FFD700] flex justify-between items-center sticky top-0 z-20">
                <div>
                  <h3 className="text-lg font-black uppercase tracking-widest">{date} Schedule</h3>
                  <p className="text-[9px] font-bold opacity-70 uppercase tracking-widest">{groupedSchedules[date].length} Sessions Planned</p>
                </div>
                <div className="bg-[#FFD700] text-[#014227] px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 shadow-inner">
                  <Calendar size={12} /> Timeline
                </div>
              </div>

              <div className="md:hidden p-4 space-y-3 bg-gray-50/50">
                {groupedSchedules[date].map(item => (
                  <div key={item.id} className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100 relative group">
                    <div className="absolute top-4 right-4 flex gap-2">
                      <button onClick={() => setEditingItem({ type: 'Itinerary', data: item })} className="p-2 text-blue-600 bg-gray-50 rounded-xl hover:bg-blue-50"><Edit3 size={14} /></button>
                      <button
                        onClick={() => {
                          if (deleteConfirm?.id === item.id && deleteConfirm?.type === 'itinerary') {
                            onUpdateSchedules(schedules.filter(s => s.id !== item.id));
                            setDeleteConfirm(null);
                          } else {
                            setDeleteConfirm({ id: item.id, type: 'itinerary' });
                          }
                        }}
                        className={`p-2 rounded-xl transition-all ${deleteConfirm?.id === item.id && deleteConfirm?.type === 'itinerary' ? 'bg-orange-500 text-white' : 'text-red-500 bg-gray-50'}`}
                      >
                        {deleteConfirm?.id === item.id && deleteConfirm?.type === 'itinerary' ? <AlertTriangle size={14} /> : <Trash2 size={14} />}
                      </button>
                    </div>

                    <div className="pr-16 mb-2">
                      <h4 className="font-black text-[#014227] text-lg leading-tight">{item.title}</h4>
                    </div>

                    <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                      <span className="flex items-center gap-1.5"><Clock size={12} className="text-[#FFD700]" /> {item.time}</span>
                      <span className="flex items-center gap-1.5"><MapPin size={12} className="text-[#FFD700]" /> {item.location}</span>
                    </div>

                  </div>
                ))}
              </div>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50/50 text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                    <tr>
                      <th className="px-8 py-4">Event Description</th>
                      <th className="px-8 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {groupedSchedules[date].map(item => (
                      <tr key={item.id} className="hover:bg-gray-50 transition group">
                        <td className="px-8 py-6">
                          <div className="font-black text-[#014227] flex items-center gap-2">
                            <ChevronRight size={14} className="text-[#FFD700]" />
                            {item.title}
                          </div>
                          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tight flex items-center gap-1.5 mt-1.5 ml-5">
                            <Clock size={10} /> {item.time} • <MapPin size={10} /> {item.location}
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right opacity-0 group-hover:opacity-100 transition">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => setEditingItem({ type: 'Itinerary', data: item })} className="p-2.5 text-blue-600 bg-white border border-gray-100 rounded-xl shadow-sm hover:bg-blue-50 transition"><Edit3 size={14} /></button>
                            <button
                              onClick={() => {
                                if (deleteConfirm?.id === item.id && deleteConfirm?.type === 'itinerary') {
                                  onUpdateSchedules(schedules.filter(s => s.id !== item.id));
                                  setDeleteConfirm(null);
                                } else {
                                  setDeleteConfirm({ id: item.id, type: 'itinerary' });
                                }
                              }}
                              className={`p-2.5 rounded-xl shadow-sm transition-all duration-200 ${deleteConfirm?.id === item.id && deleteConfirm?.type === 'itinerary' ? 'bg-orange-500 text-white scale-110' : 'text-red-500 bg-white border border-gray-100 hover:bg-red-50'}`}
                            >
                              {deleteConfirm?.id === item.id && deleteConfirm?.type === 'itinerary' ? <AlertTriangle size={14} /> : <Trash2 size={14} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
          {sortedItineraryDates.length === 0 && (
            <div className="bg-white rounded-[40px] p-20 text-center border border-dashed border-gray-200">
              <Calendar size={48} className="mx-auto text-gray-200 mb-4" />
              <p className="text-sm font-black text-gray-300 uppercase tracking-widest">Itinerary Empty</p>
            </div>
          )}
        </div>
      )}

      {activeAdminTab === 'Nearby' && (
        <div className="bg-white rounded-[40px] shadow-xl border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-4">
          <div className="p-8 bg-[#014227] text-[#FFD700] flex justify-between items-center">
            <div>
              <h3 className="text-lg font-black uppercase tracking-widest">Nearby Places</h3>
              <p className="text-[9px] font-bold opacity-70 uppercase tracking-widest">{attractions.length} Locations Listing</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setEditingItem({ type: 'Nearby', data: { id: 'temp_' + Date.now(), name: '', dist: '', desc: '', type: 'Landmark' } })}
                className="bg-[#014227] border border-[#FFD700] text-[#FFD700] px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#FFD700] hover:text-[#014227] transition flex items-center gap-2"
              >
                <Plus size={14} /> Add
              </button>
              <button
                onClick={() => { setPasteMode('nearby'); setIsPasteModalOpen(true); }}
                className="bg-[#FFD700] text-[#014227] px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-white hover:text-[#014227] transition flex items-center gap-2"
              >
                <ClipboardPaste size={14} /> Paste
              </button>
            </div>
          </div>
          <div className="md:hidden p-4 space-y-4 bg-gray-50/50">
            {attractions.map(attraction => (
              <div key={attraction.id} className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 relative group">
                <div className="absolute top-4 right-4 flex gap-2">
                  <button onClick={() => setEditingItem({ type: 'Nearby', data: attraction })} className="p-2 text-blue-600 bg-gray-50 rounded-xl hover:bg-blue-50">
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={() => {
                      if (deleteConfirm?.id === attraction.id && deleteConfirm?.type === 'nearby') {
                        onUpdateAttractions(attractions.filter(a => a.id !== attraction.id));
                        setDeleteConfirm(null);
                      } else {
                        setDeleteConfirm({ id: attraction.id, type: 'nearby' });
                      }
                    }}
                    className={`p-2 rounded-xl transition-all ${deleteConfirm?.id === attraction.id && deleteConfirm?.type === 'nearby' ? 'bg-orange-500 text-white' : 'text-red-500 bg-gray-50'}`}
                  >
                    {deleteConfirm?.id === attraction.id && deleteConfirm?.type === 'nearby' ? <AlertTriangle size={14} /> : <Trash2 size={14} />}
                  </button>
                </div>

                <div className="pr-16 mb-2">
                  <h4 className="font-black text-[#014227] text-lg leading-tight">{attraction.name}</h4>
                  <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{attraction.id}</div>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-[9px] font-black uppercase">{attraction.dist}</span>
                </div>

                <div className="mt-4 text-xs text-gray-600 leading-relaxed line-clamp-3">
                  {attraction.desc}
                </div>
              </div>
            ))}
            {attractions.length === 0 && (
              <div className="text-center p-10 text-gray-400 text-xs font-bold uppercase">No attractions found</div>
            )}
          </div>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#FFFBEB] text-[#014227] text-[10px] font-black uppercase tracking-widest border-b border-gray-100">
                <tr>
                  <th className="px-8 py-4">Location</th>
                  <th className="px-8 py-4">Distance</th>
                  <th className="px-8 py-4">Description</th>
                  <th className="px-8 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {attractions.map(attraction => (
                  <tr key={attraction.id} className="hover:bg-gray-50 transition group">
                    <td className="px-8 py-6">
                      <div className="font-black text-[#014227]">{attraction.name}</div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase">{attraction.id}</div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-[9px] font-black uppercase">{attraction.dist}</span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-sm text-gray-600 max-w-md">{attraction.desc}</div>
                    </td>
                    <td className="px-8 py-6 text-right opacity-0 group-hover:opacity-100 transition">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setEditingItem({ type: 'Nearby', data: attraction })} className="p-2 text-blue-600 bg-white border border-gray-100 rounded-lg shadow-sm hover:bg-blue-50"><Edit3 size={12} /></button>
                        <button
                          onClick={() => {
                            if (deleteConfirm?.id === attraction.id && deleteConfirm?.type === 'nearby') {
                              onUpdateAttractions(attractions.filter(a => a.id !== attraction.id));
                              setDeleteConfirm(null);
                            } else {
                              setDeleteConfirm({ id: attraction.id, type: 'nearby' });
                            }
                          }}
                          className={`p-2 rounded-lg shadow-sm transition-all duration-200 ${deleteConfirm?.id === attraction.id && deleteConfirm?.type === 'nearby' ? 'bg-orange-500 text-white scale-110' : 'text-red-500 bg-white border border-gray-100 hover:bg-red-50'}`}
                        >
                          {deleteConfirm?.id === attraction.id && deleteConfirm?.type === 'nearby' ? <AlertTriangle size={12} /> : <Trash2 size={12} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeAdminTab === 'Sponsors' && (
        <div className="bg-white rounded-[40px] shadow-xl border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-4">
          <div className="p-8 bg-[#014227] text-[#FFD700] flex justify-between items-center">
            <div>
              <h3 className="text-lg font-black uppercase tracking-widest">Sponsorships</h3>
              <p className="text-[9px] font-bold opacity-70 uppercase tracking-widest">{sponsorships.length} Sponsors Listed</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setEditingItem({ type: 'Sponsors', data: { id: 'temp_' + Date.now(), name: '', tier: 'Gold', logo: '', website: '', description: '' } })}
                className="bg-[#014227] border border-[#FFD700] text-[#FFD700] px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#FFD700] hover:text-[#014227] transition flex items-center gap-2"
              >
                <Plus size={14} /> Add
              </button>
              <button
                onClick={() => { setPasteMode('sponsors'); setIsPasteModalOpen(true); }}
                className="bg-[#FFD700] text-[#014227] px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-white hover:text-[#014227] transition flex items-center gap-2"
              >
                <ClipboardPaste size={14} /> Paste
              </button>
            </div>
          </div>
          <div className="md:hidden p-4 space-y-4 bg-gray-50/50">
            {(() => {
              const grouped = sponsorships.reduce((acc, s) => {
                const tier = s.tier || 'Other';
                if (!acc[tier]) acc[tier] = [];
                acc[tier].push(s);
                return acc;
              }, {} as Record<string, Sponsorship[]>);

              const sortedTiers = Object.keys(grouped).sort();

              return sortedTiers.map(tier => (
                <div key={tier} className="space-y-4">
                  <div className="text-[10px] font-black text-[#014227] uppercase tracking-[0.2em] px-2 py-1 bg-amber-50 rounded-lg inline-block">
                    {tier} Tier
                  </div>
                  {grouped[tier].map(sponsor => (
                    <div key={sponsor.id} className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 relative group">
                      <div className="absolute top-4 right-4 flex gap-2">
                        <button onClick={() => setEditingItem({ type: 'Sponsors', data: sponsor })} className="p-2 text-blue-600 bg-gray-50 rounded-xl hover:bg-blue-50">
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => {
                            if (deleteConfirm?.id === sponsor.id && deleteConfirm?.type === 'sponsor') {
                              onUpdateSponsorships(sponsorships.filter(s => s.id !== sponsor.id));
                              setDeleteConfirm(null);
                            } else {
                              setDeleteConfirm({ id: sponsor.id, type: 'sponsor' });
                            }
                          }}
                          className={`p-2 rounded-xl transition-all ${deleteConfirm?.id === sponsor.id && deleteConfirm?.type === 'sponsor' ? 'bg-orange-500 text-white' : 'text-red-500 bg-gray-50'}`}
                        >
                          {deleteConfirm?.id === sponsor.id && deleteConfirm?.type === 'sponsor' ? <AlertTriangle size={14} /> : <Trash2 size={14} />}
                        </button>
                      </div>

                      <div className="pr-16 mb-2">
                        <h4 className="font-black text-[#014227] text-lg leading-tight">{sponsor.name}</h4>
                        <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{sponsor.tier}</div>
                      </div>

                      {sponsor.logo && (
                        <div className="mt-4">
                          <img src={sponsor.logo} alt={`${sponsor.name} logo`} className="max-h-12 object-contain" />
                        </div>
                      )}

                      {sponsor.website && (
                        <div className="mt-4">
                          <a href={sponsor.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-xs font-bold hover:underline">{sponsor.website}</a>
                        </div>
                      )}

                      {sponsor.description && (
                        <div className="mt-4 text-xs text-gray-600 leading-relaxed line-clamp-3">
                          {sponsor.description}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ));
            })()}
            {sponsorships.length === 0 && (
              <div className="text-center p-10 text-gray-400 text-xs font-bold uppercase">No sponsors found</div>
            )}
          </div>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#FFFBEB] text-[#014227] text-[10px] font-black uppercase tracking-widest border-b border-gray-100">
                <tr>
                  <th className="px-8 py-4">Sponsor</th>
                  <th className="px-8 py-4">Tier</th>
                  <th className="px-8 py-4">Website</th>
                  <th className="px-8 py-4">Description</th>
                  <th className="px-8 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(() => {
                  const grouped = sponsorships.reduce((acc, s) => {
                    const tier = s.tier || 'Other';
                    if (!acc[tier]) acc[tier] = [];
                    acc[tier].push(s);
                    return acc;
                  }, {} as Record<string, Sponsorship[]>);

                  const sortedTiers = Object.keys(grouped).sort();

                  return sortedTiers.map(tier => (
                    <React.Fragment key={tier}>
                      <tr className="bg-gray-50/50">
                        <td colSpan={5} className="px-8 py-2 text-[9px] font-black text-[#014227] uppercase tracking-widest border-y border-gray-100 italic">
                          {tier} Tier ({grouped[tier].length})
                        </td>
                      </tr>
                      {grouped[tier].map(sponsor => (
                        <tr key={sponsor.id} className="hover:bg-gray-50 transition group">
                          <td className="px-8 py-6">
                            <div className="font-black text-[#014227]">{sponsor.name}</div>
                            {sponsor.logo && <img src={sponsor.logo} alt={`${sponsor.name} logo`} className="max-h-8 object-contain mt-2" />}
                          </td>
                          <td className="px-8 py-6">
                            <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-[9px] font-black uppercase">{sponsor.tier}</span>
                          </td>
                          <td className="px-8 py-6">
                            {sponsor.website && <a href={sponsor.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm hover:underline">{sponsor.website}</a>}
                          </td>
                          <td className="px-8 py-6">
                            <div className="text-sm text-gray-600 max-w-md line-clamp-2">{sponsor.description}</div>
                          </td>
                          <td className="px-8 py-6 text-right opacity-0 group-hover:opacity-100 transition">
                            <div className="flex justify-end gap-2">
                              <button onClick={() => setEditingItem({ type: 'Sponsors', data: sponsor })} className="p-2 text-blue-600 bg-white border border-gray-100 rounded-lg shadow-sm hover:bg-blue-50"><Edit3 size={12} /></button>
                              <button
                                onClick={() => {
                                  if (deleteConfirm?.id === sponsor.id && deleteConfirm?.type === 'sponsor') {
                                    onUpdateSponsorships(sponsorships.filter(s => s.id !== sponsor.id));
                                    setDeleteConfirm(null);
                                  } else {
                                    setDeleteConfirm({ id: sponsor.id, type: 'sponsor' });
                                  }
                                }}
                                className={`p-2 rounded-lg shadow-sm transition-all duration-200 ${deleteConfirm?.id === sponsor.id && deleteConfirm?.type === 'sponsor' ? 'bg-orange-500 text-white scale-110' : 'text-red-500 bg-white border border-gray-100 hover:bg-red-50'}`}
                              >
                                {deleteConfirm?.id === sponsor.id && deleteConfirm?.type === 'sponsor' ? <AlertTriangle size={12} /> : <Trash2 size={12} />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editingItem && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-[40px] w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] shadow-2xl border-4 border-[#014227]">
            <div className="bg-[#014227] p-8 text-[#FFD700] border-b border-[#FFD700]/30 flex justify-between items-center">
              <h3 className="text-xl font-black uppercase tracking-widest">
                {editingItem.data.id?.startsWith('temp_') ? 'Add' : 'Edit'} {editingItem.type === 'Nearby' ? 'Nearby Spot' : editingItem.type.slice(0, -1)}
              </h3>
              <button onClick={() => setEditingItem(null)} className="hover:rotate-90 transition-transform"><X size={24} /></button>
            </div>
            <form onSubmit={handleSaveItem} className="p-8 space-y-6 overflow-y-auto bg-white">
              {editingItem.type === 'Attendees' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="flex justify-between items-center ml-2">
                        <label className="text-[10px] font-black uppercase text-gray-400">Guest ID</label>
                        <button
                          type="button"
                          onClick={() => {
                            const pkg = editingItem.data.package;
                            if (!pkg) { alert('Please select a package first'); return; }
                            const cat = packagePermissions[pkg]?.category || 'Other';
                            const samePkgCount = guests.filter(g => g.package === pkg).length + 1;
                            const newId = `${pkg}-${String(samePkgCount).padStart(4, '0')}-${cat}`;
                            setEditingItem({ ...editingItem, data: { ...editingItem.data, id: newId } });
                          }}
                          className="text-[8px] font-black text-blue-600 uppercase hover:underline"
                        >
                          Auto-Generate
                        </button>
                      </div>
                      <input
                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold outline-none shadow-sm focus:ring-4 focus:ring-[#FFD700]/10 focus:border-[#FFD700] transition-all"
                        value={editingItem.data.id}
                        onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, id: e.target.value } })}
                      />
                    </div>
                    <FormField label="Name on Tag" value={editingItem.data.nameOnTag} onChange={v => setEditingItem({ ...editingItem, data: { ...editingItem.data, nameOnTag: v } })} />
                  </div>
                  <FormField label="Full Name" value={editingItem.data.name} onChange={v => setEditingItem({ ...editingItem, data: { ...editingItem.data, name: v } })} />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Gender</label>
                      <div className="flex bg-gray-50 border border-gray-100 rounded-2xl p-1">
                        <button
                          type="button"
                          onClick={() => setEditingItem({ ...editingItem, data: { ...editingItem.data, gender: 'Male' } })}
                          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${editingItem.data.gender === 'Male' ? 'bg-[#014227] text-[#FFD700] shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                          Male
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingItem({ ...editingItem, data: { ...editingItem.data, gender: 'Female' } })}
                          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${editingItem.data.gender === 'Female' ? 'bg-[#014227] text-[#FFD700] shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                          Female
                        </button>
                      </div>
                    </div>
                    <FormField label="Position" value={editingItem.data.position} onChange={v => setEditingItem({ ...editingItem, data: { ...editingItem.data, position: v } })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <SelectField label="Country" value={editingItem.data.country} onChange={v => setEditingItem({ ...editingItem, data: { ...editingItem.data, country: v } })} options={NATIONS} />
                    <FormField label="Local Organisation" value={editingItem.data.localOrg} onChange={v => setEditingItem({ ...editingItem, data: { ...editingItem.data, localOrg: v } })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <FormField label="Senatorship ID" value={editingItem.data.senatorshipId} onChange={v => setEditingItem({ ...editingItem, data: { ...editingItem.data, senatorshipId: v } })} />
                      </div>
                      <div className="pb-3">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!editingItem.data.isSenator}
                            onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, isSenator: e.target.checked } })}
                            className="rounded border-gray-300 text-[#014227] focus:ring-[#014227] w-5 h-5"
                          />
                          <span className="text-[10px] font-black uppercase text-gray-400">Senator</span>
                        </label>
                      </div>
                    </div>
                    <FormField label="Passport / ID No." value={editingItem.data.passportId || ''} onChange={v => setEditingItem({ ...editingItem, data: { ...editingItem.data, passportId: v } })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Email Address" value={editingItem.data.email} onChange={v => setEditingItem({ ...editingItem, data: { ...editingItem.data, email: v } })} />
                    <FormField label="Whatsapp" value={editingItem.data.whatsapp} onChange={v => setEditingItem({ ...editingItem, data: { ...editingItem.data, whatsapp: v } })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Line ID" value={editingItem.data.lineID} onChange={v => setEditingItem({ ...editingItem, data: { ...editingItem.data, lineID: v } })} />
                    <FormField label="Phone" value={editingItem.data.phone} onChange={v => setEditingItem({ ...editingItem, data: { ...editingItem.data, phone: v } })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Food Preference</label>
                      <div className="flex bg-gray-50 border border-gray-100 rounded-2xl p-1">
                        <button
                          type="button"
                          onClick={() => setEditingItem({ ...editingItem, data: { ...editingItem.data, foodPreference: 'Non-Vegetarian' } })}
                          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${editingItem.data.foodPreference !== 'Vegetarian' ? 'bg-[#014227] text-[#FFD700] shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                          Non-Veg
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingItem({ ...editingItem, data: { ...editingItem.data, foodPreference: 'Vegetarian' } })}
                          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${editingItem.data.foodPreference === 'Vegetarian' ? 'bg-[#014227] text-[#FFD700] shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                          Vegetarian
                        </button>
                      </div>
                    </div>
                    <FormField label="Food/Medicine Allergy" value={editingItem.data.allergies} onChange={v => setEditingItem({ ...editingItem, data: { ...editingItem.data, allergies: v } })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Package</label>
                      <select className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold outline-none" value={editingItem.data.package} onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, package: e.target.value } })}>
                        <option value="">-- SELECT PACKAGE --</option>
                        {PACKAGE_CATEGORIES.map(category => {
                          const pkgs = activePackageTypes.filter(p => packagePermissions[p]?.category === category).sort();
                          if (pkgs.length === 0) return null;
                          return (
                            <optgroup key={category} label={category}>
                              {pkgs.map(p => <option key={p} value={p}>{p}</option>)}
                            </optgroup>
                          );
                        })}
                      </select>
                    </div>
                    <SelectField label="T-Shirt Size" value={editingItem.data.tShirtSize} onChange={v => setEditingItem({ ...editingItem, data: { ...editingItem.data, tShirtSize: v } })} options={TSHIRT_SIZES} />
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <CheckboxField label="Golfer" checked={editingItem.data.isGolfParticipant} onChange={v => setEditingItem({ ...editingItem, data: { ...editingItem.data, isGolfParticipant: v } })} />
                    <CheckboxField label="Single Occupancy" checked={editingItem.data.singleOccupancy} onChange={v => setEditingItem({ ...editingItem, data: { ...editingItem.data, singleOccupancy: v } })} />

                    <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className={`space-y-2 p-4 rounded-2xl border transition-all ${editingItem.data.additionalRoom27Mar ? 'bg-[#fffbeb] border-[#FFD700]' : 'bg-gray-50 border-gray-100'}`}>
                        <CheckboxField label="Additional Rm (27 Mar)" checked={editingItem.data.additionalRoom27Mar} onChange={v => setEditingItem({ ...editingItem, data: { ...editingItem.data, additionalRoom27Mar: v } })} />
                        {editingItem.data.additionalRoom27Mar && (
                          <div className="animate-in slide-in-from-top-2">
                            <SelectField label="Room Type" value={editingItem.data.additionalRoom27MarType} onChange={v => setEditingItem({ ...editingItem, data: { ...editingItem.data, additionalRoom27MarType: v } })} options={['Single', 'Twin']} />
                          </div>
                        )}
                      </div>
                      <div className={`space-y-2 p-4 rounded-2xl border transition-all ${editingItem.data.additionalRoom28Mar ? 'bg-[#fffbeb] border-[#FFD700]' : 'bg-gray-50 border-gray-100'}`}>
                        <CheckboxField label="Additional Rm (28 Mar)" checked={editingItem.data.additionalRoom28Mar} onChange={v => setEditingItem({ ...editingItem, data: { ...editingItem.data, additionalRoom28Mar: v } })} />
                        {editingItem.data.additionalRoom28Mar && (
                          <div className="animate-in slide-in-from-top-2">
                            <SelectField label="Room Type" value={editingItem.data.additionalRoom28MarType} onChange={v => setEditingItem({ ...editingItem, data: { ...editingItem.data, additionalRoom28MarType: v } })} options={['Single', 'Twin']} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {editingItem.type === 'Itinerary' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Date (DD.MM.YYYY)" value={editingItem.data.date} onChange={v => setEditingItem({ ...editingItem, data: { ...editingItem.data, date: v } })} />
                    <FormField label="Time Window" value={editingItem.data.time} onChange={v => setEditingItem({ ...editingItem, data: { ...editingItem.data, time: v } })} />
                  </div>
                  <FormField label="Event Heading" value={editingItem.data.title} onChange={v => setEditingItem({ ...editingItem, data: { ...editingItem.data, title: v } })} />
                </>
              )}
              {editingItem.type === 'Nearby' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Attraction Name" value={editingItem.data.name} onChange={v => setEditingItem({ ...editingItem, data: { ...editingItem.data, name: v } })} />
                    <FormField label="Type" value={editingItem.data.type} onChange={v => setEditingItem({ ...editingItem, data: { ...editingItem.data, type: v } })} placeholder="e.g. Landmark, Park" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Distance" value={editingItem.data.dist} onChange={v => setEditingItem({ ...editingItem, data: { ...editingItem.data, dist: v } })} placeholder="e.g. 3.5km" />
                    <FormField label="Phone" value={editingItem.data.phone} onChange={v => setEditingItem({ ...editingItem, data: { ...editingItem.data, phone: v } })} placeholder="+60..." />
                  </div>
                  <FormField label="Address" value={editingItem.data.address} onChange={v => setEditingItem({ ...editingItem, data: { ...editingItem.data, address: v } })} />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Opening Hours" value={editingItem.data.hours} onChange={v => setEditingItem({ ...editingItem, data: { ...editingItem.data, hours: v } })} placeholder="9:00 AM - 6:00 PM" />
                    <FormField label="Website" value={editingItem.data.website} onChange={v => setEditingItem({ ...editingItem, data: { ...editingItem.data, website: v } })} placeholder="https://..." />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Description</label>
                    <textarea
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold outline-none shadow-sm focus:ring-4 focus:ring-[#FFD700]/10 focus:border-[#FFD700] transition-all resize-none"
                      rows={2}
                      value={editingItem.data.desc || ''}
                      onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, desc: e.target.value } })}
                    />
                  </div>
                  <FormField label="Navigation URL (Google Maps)" value={editingItem.data.img} onChange={v => setEditingItem({ ...editingItem, data: { ...editingItem.data, img: v } })} placeholder="https://maps.google.com/..." />
                </>
              )}
              {editingItem.type === 'Golf' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Flight Number" value={editingItem.data.flightNumber} onChange={v => setEditingItem({ ...editingItem, data: { ...editingItem.data, flightNumber: v } })} placeholder="Flight 1" />
                    <FormField label="Tee Time" value={editingItem.data.teeTime} onChange={v => setEditingItem({ ...editingItem, data: { ...editingItem.data, teeTime: v } })} placeholder="07:00 AM" />
                  </div>
                  <FormField label="Buggy Number (Optional)" value={editingItem.data.buggyNumber} onChange={v => setEditingItem({ ...editingItem, data: { ...editingItem.data, buggyNumber: v } })} placeholder="B01" />

                  <div className="space-y-4 pt-4 border-t border-gray-100">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Assign Players</label>
                      <span className="text-[9px] font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">{(editingItem.data.players || []).length} Selected</span>
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                      {(() => {
                        const currentDay = editingItem.data.day || activeGolfDay;
                        const targetType = currentDay === 1 ? 'Day1' : 'Day2';

                        // 1. Calculate Valid Rule IDs
                        const validRuleIds = new Set<string>();
                        PACKAGE_CATEGORIES.forEach(cat => {
                          const rules = categoryPermissions[cat] || [];
                          rules.forEach(p => {
                            if (p.golfType === targetType) validRuleIds.add(p.id);
                          });
                        });

                        // 2. Filter Guests
                        const eligibleGuests = guests.filter(g => {
                          if (!g.isGolfParticipant) return false;

                          // Check permissions
                          const perms = packagePermissions[g.package]?.permissions || {};
                          const hasPerm = Object.keys(perms).some(pid => validRuleIds.has(pid));
                          if (!hasPerm) return false;

                          // Check if assigned to another flight on same day
                          const assigned = golfGroupings.some(group =>
                            group.day === currentDay &&
                            group.id !== editingItem.data.id &&
                            group.players.includes(g.id)
                          );
                          if (assigned) return false;

                          return true;
                        }).sort((a, b) => a.name.localeCompare(b.name));

                        // 3. Render
                        if (eligibleGuests.length === 0) {
                          return (
                            <div className="text-center p-4 text-gray-400 text-[10px] font-bold uppercase">
                              No eligible unassigned golfers found for Day {currentDay}
                            </div>
                          );
                        }

                        return eligibleGuests.map(g => {
                          const isSelected = editingItem.data.players?.includes(g.id);
                          return (
                            <label key={g.id} className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer hover:bg-gray-50 transition-all ${isSelected ? 'bg-[#fffbeb] border-[#FFD700] ring-1 ring-[#FFD700]' : 'bg-white border-gray-100'}`}>
                              <div
                                onClick={(e) => {
                                  e.preventDefault();
                                  const currentPlayers = editingItem.data.players || [];
                                  const newPlayers = isSelected
                                    ? currentPlayers.filter((id: string) => id !== g.id)
                                    : [...currentPlayers, g.id];
                                  setEditingItem({ ...editingItem, data: { ...editingItem.data, players: newPlayers } });
                                }}
                                className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${isSelected ? 'bg-[#014227] text-[#FFD700]' : 'border border-gray-300'}`}
                              >
                                {isSelected && <Check size={12} />}
                              </div>
                              <div className="flex-1">
                                <div className="text-xs font-black text-[#014227]">{g.name}</div>
                                <div className="text-[9px] font-bold text-gray-400 uppercase">{g.country} • {g.package}</div>
                              </div>
                            </label>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </div>
              )}
              {editingItem.type === 'Sponsors' && (
                <>
                  <FormField label="Sponsor Name" value={editingItem.data.name} onChange={v => setEditingItem({ ...editingItem, data: { ...editingItem.data, name: v } })} placeholder="Company Name" />
                  <FormField label="Tier" value={editingItem.data.tier} onChange={v => setEditingItem({ ...editingItem, data: { ...editingItem.data, tier: v } })} placeholder="e.g. Diamond, Platinum" />
                  <FormField label="Logo URL" value={editingItem.data.logo} onChange={v => setEditingItem({ ...editingItem, data: { ...editingItem.data, logo: v } })} placeholder="https://..." />
                  <FormField label="Website" value={editingItem.data.website} onChange={v => setEditingItem({ ...editingItem, data: { ...editingItem.data, website: v } })} placeholder="https://..." />
                  <FormField label="Description" value={editingItem.data.description} onChange={v => setEditingItem({ ...editingItem, data: { ...editingItem.data, description: v } })} placeholder="Ad copy..." type="textarea" />
                </>
              )}

              <div className="pt-6 border-t border-gray-100">
                <button type="submit" className="w-full bg-[#014227] text-[#FFD700] py-5 rounded-3xl font-black uppercase tracking-widest shadow-xl transform active:scale-95 transition-all">
                  Commit Registry Updates
                </button>
              </div>
            </form>
          </div>
        </div >
      )}

      {
        isPermMetaModalOpen && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="bg-white rounded-[40px] w-full max-w-md p-10 shadow-2xl">
              <h3 className="text-xl font-black text-[#014227] mb-8 uppercase tracking-widest">{permMetaEditData.id ? 'Modify' : 'New'} {permMetaEditData.category} Rule</h3>
              <form onSubmit={handleAddOrUpdatePermMeta} className="space-y-6">
                <FormField label="Rule Label (e.g. Banquet)" value={permMetaEditData.name} onChange={v => setPermMetaEditData({ ...permMetaEditData, name: v })} />
                <FormField label="Designated Day (e.g. 29 Mar)" value={permMetaEditData.date} onChange={v => setPermMetaEditData({ ...permMetaEditData, date: v })} />
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Linked Itineraries (Optional)</label>
                  <div className="max-h-48 overflow-y-auto space-y-4 p-4 bg-gray-50 border border-gray-100 rounded-2xl custom-scrollbar">
                    {sortedItineraryDates.map(date => (
                      <div key={date} className="space-y-2">
                        <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-200 pb-1 flex justify-between items-center">
                          <span>{date}</span>
                          <span className="text-[7px] text-gray-300">{(groupedSchedules[date] || []).length} ITEMS</span>
                        </div>
                        <div className="space-y-1">
                          {(groupedSchedules[date] || []).map(s => {
                            const isSelected = permMetaEditData.linkedItinerary?.includes(s.id);
                            return (
                              <label key={s.id} className={`flex items-center gap-3 p-2 rounded-xl border transition-all cursor-pointer hover:bg-white ${isSelected ? 'bg-white border-[#FFD700] ring-1 ring-[#FFD700]' : 'bg-transparent border-transparent'}`}>
                                <div
                                  onClick={(e) => {
                                    e.preventDefault();
                                    const current = Array.isArray(permMetaEditData.linkedItinerary) ? permMetaEditData.linkedItinerary : (permMetaEditData.linkedItinerary ? [permMetaEditData.linkedItinerary as string] : []);
                                    const next = isSelected
                                      ? current.filter(id => id !== s.id)
                                      : [...current, s.id];
                                    setPermMetaEditData({ ...permMetaEditData, linkedItinerary: next });
                                  }}
                                  className={`w-4 h-4 rounded-md flex items-center justify-center transition-all ${isSelected ? 'bg-[#014227] text-[#FFD700]' : 'border border-gray-300 bg-white'}`}
                                >
                                  {isSelected && <Check size={10} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-[10px] font-bold text-[#014227] truncate">{s.title}</div>
                                  <div className="text-[8px] font-bold text-gray-400 uppercase">{s.time}</div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Golf Flag (For Auto-Loading)</label>
                  <div className="flex bg-gray-50 border border-gray-100 rounded-2xl p-1">
                    <button
                      type="button"
                      onClick={() => setPermMetaEditData({ ...permMetaEditData, golfType: undefined })}
                      className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${!permMetaEditData.golfType ? 'bg-gray-200 text-gray-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      None
                    </button>
                    <button
                      type="button"
                      onClick={() => setPermMetaEditData({ ...permMetaEditData, golfType: 'Day1' })}
                      className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${permMetaEditData.golfType === 'Day1' ? 'bg-[#014227] text-[#FFD700] shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      Day 1 Golf
                    </button>
                    <button
                      type="button"
                      onClick={() => setPermMetaEditData({ ...permMetaEditData, golfType: 'Day2' })}
                      className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${permMetaEditData.golfType === 'Day2' ? 'bg-[#014227] text-[#FFD700] shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      Day 2 Golf
                    </button>
                  </div>
                </div>
                <div className="flex justify-end space-x-4 pt-6">
                  <button type="button" onClick={() => setIsPermMetaModalOpen(false)} className="px-6 py-3 font-black text-[10px] uppercase text-gray-400">Back</button>
                  <button type="submit" className="bg-[#014227] text-[#FFD700] px-10 py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl transform active:scale-95">Save Rule</button>
                </div>
              </form>
            </div>
          </div >
        )
      }

      {
        isPackageModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="bg-white rounded-[40px] w-full max-w-md p-10 shadow-2xl">
              <h3 className="text-xl font-black text-[#014227] mb-8 uppercase tracking-widest">{packageEditData.oldName ? 'Edit' : 'Create'} Package</h3>
              <form onSubmit={handleAddOrUpdatePackage} className="space-y-6">
                <FormField label="Unique Code" value={packageEditData.newName} onChange={v => setPackageEditData({ ...packageEditData, newName: v })} placeholder="VVIP-FULL" />
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Market Category</label>
                  <select className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold outline-none" value={packageEditData.category} onChange={e => setPackageEditData({ ...packageEditData, category: e.target.value as PackageCategory })}>
                    {PACKAGE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="flex justify-end space-x-4 pt-6">
                  <button type="button" onClick={() => setIsPackageModalOpen(false)} className="px-6 py-3 font-black text-[10px] uppercase text-gray-400">Cancel</button>
                  <button type="submit" className="bg-[#014227] text-[#FFD700] px-10 py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl transition transform active:scale-95">Verify & Commit</button>
                </div>
              </form>
            </div>
          </div>
        )
      }

      {
        isPasteModalOpen && (
          <div className="fixed inset-0 bg-[#014227]/90 backdrop-blur-xl z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[85vh]">
              <div className="p-8 bg-[#014227] text-[#FFD700] flex justify-between items-center shrink-0">
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight">Bulk Import {pasteMode === 'nearby' ? 'Nearby Places' : 'Attendees'}</h3>
                  <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest mt-1">Paste TSV or CSV data with headers below</p>
                </div>
                <button onClick={() => { setIsPasteModalOpen(false); setPastedData(''); setImportResult(null); setImportPreview(null); }} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition">
                  <X size={20} />
                </button>
              </div>

              {!importResult ? (
                <div className="flex-1 flex flex-col overflow-hidden">
                  {!importPreview ? (
                    <div
                      className="flex-1 m-8 border-4 border-dashed border-gray-200 rounded-[32px] flex flex-col items-center justify-center bg-gray-50/50 hover:bg-green-50/50 hover:border-[#014227]/30 transition-all cursor-text group"
                      onPaste={(e) => {
                        e.preventDefault();
                        const text = e.clipboardData.getData('text');
                        if (!text.trim()) return;
                        const rows = text.trim().split(/\r?\n/).map(row => {
                          const delimiter = row.includes('\t') ? '\t' : ',';
                          return row.split(delimiter).map(cell => cell.trim());
                        });
                        if (rows.length > 0) setImportPreview(rows);
                      }}
                      onClick={() => {
                        // Optional: Focus a hidden textarea if needed for mobile, but typically desktop paste is fine
                      }}
                    >
                      <div className="p-6 bg-white rounded-full shadow-lg mb-4 group-hover:scale-110 transition-transform">
                        <ClipboardPaste size={32} className="text-[#014227]" />
                      </div>
                      <h4 className="text-xl font-black text-[#014227] uppercase tracking-tight mb-2">Click Here & Press Ctrl+V</h4>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Paste your Excel or CSV data</p>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col overflow-hidden">
                      <div className="px-8 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 text-xs font-bold text-gray-400 uppercase tracking-widest">
                        <div className="flex items-center gap-3">
                          <span className="bg-[#014227] text-[#FFD700] px-3 py-1 rounded-lg text-[9px] font-black">{importPreview.length - 1} Records</span>
                          <span>Preview Mode</span>
                        </div>
                        <button onClick={() => setImportPreview(null)} className="text-red-500 hover:text-red-700 hover:underline">Clear & Retry</button>
                      </div>
                      <div className="flex-1 overflow-auto p-4 md:p-8 bg-gray-50/50">
                        <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm bg-white inline-block min-w-full">
                          <table className="min-w-full text-left border-collapse">
                            <thead>
                              <tr>
                                {importPreview[0].map((header, i) => (
                                  <th key={i} className="px-5 py-4 bg-[#FFFBEB] text-[#014227] text-[10px] font-black uppercase tracking-widest border-b border-r border-gray-100 last:border-r-0 whitespace-nowrap sticky top-0 z-10">
                                    {header}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {importPreview.slice(1).map((row, i) => (
                                <tr key={i} className="hover:bg-amber-50/50 transition-colors">
                                  {row.map((cell, j) => (
                                    <td key={j} className="px-5 py-3 border-r border-gray-100 last:border-r-0 text-[11px] text-gray-600 font-medium whitespace-nowrap">
                                      {cell}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      <div className="p-6 border-t border-gray-100 bg-white shrink-0 flex justify-end gap-3">
                        <button
                          onClick={() => { setIsPasteModalOpen(false); setPastedData(''); setImportPreview(null); }}
                          className="px-6 py-3 font-black text-[10px] uppercase text-gray-400 hover:bg-gray-50 rounded-2xl transition"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            if (!importPreview) return;
                            const result = { total: 0, imported: 0, failed: [] as any[] };
                            const validGuests: Guest[] = [];


                            if (pasteMode === 'nearby') {
                              try {
                                const headers = importPreview[0].map(h => h.toLowerCase());
                                const rows = importPreview.slice(1);
                                result.total = rows.length;

                                const validPlaces: any[] = [];

                                rows.forEach((values, rowIdx) => {
                                  try {
                                    const p: any = {};
                                    let hasName = false;

                                    headers.forEach((h, i) => {
                                      const val = values[i] || ''; // Default to empty string
                                      if (h.includes('name')) { p.name = val; hasName = !!val; }
                                      else if (h.includes('dist')) p.dist = val;
                                      else if (h.includes('desc')) p.desc = val;
                                      else if (h.includes('type')) p.type = val;
                                      else if (h.includes('addr')) p.address = val;
                                      else if (h.includes('phone')) p.phone = val;
                                      else if (h.includes('hour') || h.includes('open')) p.hours = val;
                                      else if (h.includes('web') || h.includes('url')) p.website = val;
                                      else if (h.includes('map') || h.includes('location')) p.img = val;
                                    });

                                    if (!hasName) throw new Error('Missing Name');
                                    if (!p.id) p.id = p.name.replace(/\s+/g, '_').toLowerCase(); // Generate simple ID

                                    validPlaces.push(p);
                                    result.imported++;
                                  } catch (e: any) {
                                    result.failed.push({ row: rowIdx + 2, reason: e.message, data: values.join(', ') });
                                  }
                                });

                                if (validPlaces.length > 0) {
                                  const existingIds = new Set(attractions.map(a => a.id));
                                  const merged = [...attractions];
                                  validPlaces.forEach(p => {
                                    if (existingIds.has(p.id)) {
                                      const idx = merged.findIndex(x => x.id === p.id);
                                      if (idx !== -1) merged[idx] = { ...merged[idx], ...p };
                                    } else {
                                      merged.push(p);
                                    }
                                  });
                                  onUpdateAttractions(merged);
                                }
                                setImportResult(result);
                              } catch (e: any) {
                                window.alert('Import Failed: ' + e.message);
                              }
                            } else {
                              // Guest Import Logic
                              try {
                                const headers = importPreview[0].map(h => h.toLowerCase());
                                const rows = importPreview.slice(1);
                                result.total = rows.length;

                                rows.forEach((values, rowIdx) => {
                                  try {
                                    const g: any = { checkInCount: 0, passportLast4: '' };
                                    let hasId = false;

                                    headers.forEach((h, i) => {
                                      const val = values[i];
                                      if (h.includes('id') && !h.includes('line') && !h.includes('senator')) { g.id = val; hasId = true; }
                                      else if (h.includes('tag')) g.nameOnTag = val;
                                      else if (h.includes('name')) g.name = val;
                                      else if (h.includes('country')) g.country = val;
                                      else if (h.includes('org')) g.localOrg = val;
                                      else if (h.includes('senator')) g.senatorshipId = val;
                                      else if (h.includes('pack')) g.package = val;
                                      else if (h.includes('mail')) g.email = val;
                                      else if (h.includes('app')) g.whatsapp = val;
                                      else if (h.includes('line')) g.lineID = val;
                                      else if (h.includes('phone')) g.phone = val;
                                      else if (h.includes('shirt')) g.tShirtSize = val;
                                      else if (h.includes('pref')) g.foodPreference = val;
                                      else if (h.includes('allergy') || h.includes('medic')) g.allergies = val;
                                      else if (h.includes('golf')) g.isGolfParticipant = val?.toLowerCase() === 'yes' || val?.toLowerCase() === 'true';
                                      else if (h.includes('single')) g.singleOccupancy = val?.toLowerCase() === 'yes' || val?.toLowerCase() === 'true';
                                    });

                                    if (!hasId || !g.name) throw new Error('Missing ID or Name');
                                    validGuests.push(g as Guest);
                                    result.imported++;
                                  } catch (e: any) {
                                    result.failed.push({ row: rowIdx + 2, reason: e.message, data: values.join(', ') });
                                  }
                                });

                                if (validGuests.length > 0) {
                                  const existingIds = new Set(guests.map(g => g.id));
                                  const merged = [...guests];
                                  validGuests.forEach(g => {
                                    if (existingIds.has(g.id)) {
                                      const idx = merged.findIndex(x => x.id === g.id);
                                      if (idx !== -1) merged[idx] = { ...merged[idx], ...g };
                                    } else {
                                      merged.push(g);
                                    }
                                  });
                                  onUpdateGuests(merged);
                                }
                                setImportResult(result);
                              } catch (e: any) {
                                window.alert('Import Failed: ' + e.message);
                              }
                            }
                          }}
                          className="bg-[#014227] text-[#FFD700] px-8 py-3 rounded-2xl font-black uppercase tracking-widest shadow-lg hover:gb-black transition transform active:scale-95"
                        >
                          Import {importPreview.length - 1} Records
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-col flex h-full overflow-hidden">
                  <div className="p-8 pb-4 space-y-4 shrink-0 border-b border-gray-100">
                    <div className="flex items-center gap-4">
                      <div className={`p-4 rounded-2xl ${importResult.failed.length === 0 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                        {importResult.failed.length === 0 ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
                      </div>
                      <div>
                        <h4 className="text-xl font-black text-[#014227]">Import Complete</h4>
                        <p className="text-sm font-bold text-gray-400">Successfully processed <span className="text-[#014227]">{importResult.imported}</span> / {importResult.total} records.</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-8 pt-4">
                    {importResult.failed.length > 0 ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h5 className="text-[10px] font-black uppercase text-red-500 tracking-widest">Failures ({importResult.failed.length})</h5>
                        </div>
                        <div className="border border-red-100 rounded-3xl overflow-hidden">
                          <table className="w-full text-left">
                            <thead className="bg-red-50 text-[9px] font-black text-red-800 uppercase tracking-widest">
                              <tr>
                                <th className="px-6 py-3 w-16">Row</th>
                                <th className="px-6 py-3 w-48">Reason</th>
                                <th className="px-6 py-3">Raw Data</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-red-50">
                              {importResult.failed.map((fail, i) => (
                                <tr key={i} className="hover:bg-red-50/50">
                                  <td className="px-6 py-3 text-[10px] font-bold text-red-900">{fail.row}</td>
                                  <td className="px-6 py-3 text-[10px] font-bold text-red-600">{fail.reason}</td>
                                  <td className="px-6 py-3 text-[9px] font-mono text-gray-500 truncate max-w-xs" title={fail.data}>{fail.data}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                        <CheckCircle2 size={48} className="text-green-500 mb-4" />
                        <p className="font-black text-gray-400 uppercase tracking-widest">All records imported successfully</p>
                      </div>
                    )}
                  </div>

                  <div className="p-6 border-t border-gray-100 bg-gray-50 shrink-0 flex justify-end">
                    <button
                      onClick={() => { setIsPasteModalOpen(false); setPastedData(''); setImportResult(null); setImportPreview(null); }}
                      className="bg-[#014227] text-[#FFD700] px-8 py-3 rounded-2xl font-black uppercase tracking-widest shadow-lg hover:gb-black transition"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      }
    </div >
  );
};

const FormField: React.FC<{ label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; children?: React.ReactNode }> = ({ label, value, onChange, placeholder, type = 'text', children }) => (
  <div className="space-y-1">
    <label className="text-[10px] font-black uppercase text-gray-400 ml-2">{label}</label>
    {type === 'textarea' ? (
      <textarea
        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold outline-none shadow-sm focus:ring-4 focus:ring-[#FFD700]/10 focus:border-[#FFD700] transition-all resize-none"
        rows={3}
        placeholder={placeholder}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
      />
    ) : (
      <input
        type={type}
        placeholder={placeholder}
        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold outline-none shadow-sm focus:ring-4 focus:ring-[#FFD700]/10 focus:border-[#FFD700] transition-all"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
      />
    )}
    {children}
  </div>
);

const CheckboxField: React.FC<{ label: string; checked: boolean; onChange: (v: boolean) => void }> = ({ label, checked, onChange }) => (
  <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100 cursor-pointer hover:bg-white transition-all group">
    <div onClick={() => onChange(!checked)} className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${checked ? 'bg-[#014227] text-[#FFD700]' : 'bg-white border border-gray-200'}`}>
      {checked && <Check size={14} />}
    </div>
    <span className="text-[10px] font-black uppercase text-gray-400 group-hover:text-[#014227] transition-colors">{label}</span>
  </label>
);
export default AdminPortal;
