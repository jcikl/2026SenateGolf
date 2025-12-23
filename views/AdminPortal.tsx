import React, { useState, useEffect } from 'react';
import { Guest, PackageType, PackageCategory, EventSchedule, PackagePermissions, PermissionMeta, GolfGrouping } from '../types';
import { Users, Filter, ClipboardPaste, X, CheckCircle2, Calendar, MapPin, Plus, Trash2, Edit3, Save, Check, Square, Edit, Tag, Clock, ChevronRight, RefreshCw, ChevronDown, AlertTriangle, Trophy } from 'lucide-react';

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
}

const PACKAGE_CATEGORIES: PackageCategory[] = ['International', 'APDC', 'JCI Malaysia', 'JCI Japan', 'JCI Korea'];

type AdminView = 'Attendees' | 'Itinerary' | 'Packages' | 'Travel' | 'Dining' | 'Golf';

const AdminPortal: React.FC<AdminPortalProps> = ({
  guests, onUpdateGuests, schedules, onUpdateSchedules, onBulkSync, attractions, onUpdateAttractions, diningGuide, onUpdateDining, packagePermissions, onUpdatePackagePermissions, categoryPermissions, onUpdateCategoryPermissions, golfGroupings, onUpdateGolfGroupings
}) => {
  const [activeAdminTab, setActiveAdminTab] = useState<AdminView>('Attendees');
  const [activeGolfDay, setActiveGolfDay] = useState<1 | 2>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; type: 'package' | 'rule' | 'attendee' | 'itinerary' | 'travel' | 'dining' | 'golf' } | null>(null);

  useEffect(() => {
    if (deleteConfirm) {
      const timer = setTimeout(() => setDeleteConfirm(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [deleteConfirm]);
  const [editingItem, setEditingItem] = useState<{ type: AdminView; data: any } | null>(null);
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [pastedData, setPastedData] = useState('');
  const [editingPackage, setEditingPackage] = useState<any>(null);
  const [packageEditData, setPackageEditData] = useState<{ oldName?: string; newName: string; category: PackageCategory }>({ newName: '', category: 'International' });
  const [isPermMetaModalOpen, setIsPermMetaModalOpen] = useState(false);
  const [permMetaEditData, setPermMetaEditData] = useState<{ category: PackageCategory; id?: string; name: string; date: string; linkedItinerary?: string }>({ category: 'International', name: '', date: '', linkedItinerary: '' });

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
    const { category, id, name, date, linkedItinerary } = permMetaEditData;
    if (!name.trim()) return;
    const newCatPerms = { ...categoryPermissions };
    const currentList = [...(newCatPerms[category] || [])];
    const newPackagePermissions = { ...packagePermissions };

    if (id) {
      const idx = currentList.findIndex(p => p.id === id);
      if (idx > -1) currentList[idx] = { id, name, date, linkedItinerary };
    } else {
      const newId = `${category.toLowerCase().replace(/\s/g, '')}_${Date.now()}`;
      currentList.push({ id: newId, name, date, linkedItinerary });
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
      const updatedGuests = isNew ? [...guests, finalData] : guests.map(g => g.id === finalId ? finalData : g);
      console.log('Admin: Committing guest registry update:', updatedGuests);
      onUpdateGuests(updatedGuests);
    } else if (type === 'Itinerary') {
      onUpdateSchedules(isNew ? [...schedules, finalData] : schedules.map(s => s.id === finalId ? finalData : s));
    } else if (type === 'Travel') {
      onUpdateAttractions(isNew ? [...attractions, finalData] : attractions.map(a => a.id === finalId ? finalData : a));
    } else if (type === 'Dining') {
      onUpdateDining(isNew ? [...diningGuide, finalData] : diningGuide.map(d => d.id === finalId ? finalData : d));
    } else if (type === 'Golf') {
      onUpdateGolfGroupings(isNew ? [...golfGroupings, finalData] : golfGroupings.map(g => g.id === finalId ? finalData : g));
    }
    setEditingItem(null);
  };

  const sortedDatesFromSchedule = Array.from(new Set(schedules.map(s => s.date))).sort();

  const groupedSchedules = schedules.reduce((groups, item) => {
    const date = item.date;
    if (!groups[date]) groups[date] = [];
    groups[date].push(item);
    return groups;
  }, {} as Record<string, EventSchedule[]>);

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
            <button onClick={() => { setPackageEditData({ newName: '', category: 'International' }); setIsPackageModalOpen(true); }} className="bg-[#014227] text-[#FFD700] px-6 py-2.5 rounded-2xl text-xs font-black uppercase flex items-center gap-2 shadow-lg hover:bg-black transition"><Plus size={14} /><span>Add Package</span></button>
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
          ) : (
            <button onClick={() => {
              const baseData = { id: `temp_${Date.now()}`, name: '', date: sortedDatesFromSchedule[0] || '' };
              if (activeAdminTab === 'Golf') {
                setEditingItem({ type: 'Golf', data: { ...baseData, day: activeGolfDay, flightNumber: '', teeTime: '', players: [] } });
              } else {
                setEditingItem({ type: activeAdminTab, data: baseData });
              }
            }} className="bg-[#014227] text-[#FFD700] px-6 py-2.5 rounded-2xl text-xs font-black uppercase flex items-center gap-2 shadow-lg hover:bg-black transition"><Plus size={14} /><span>Add {activeAdminTab === 'Golf' ? (activeGolfDay === 1 ? 'Day 1 Flight' : 'Day 2 Flight') : activeAdminTab.slice(0, -1)}</span></button>
          )}
        </div>
      </div>

      <div className="flex bg-white rounded-3xl p-1 shadow-xl border border-gray-100 overflow-x-auto">
        {(['Attendees', 'Itinerary', 'Packages', 'Travel', 'Dining', 'Golf'] as AdminView[]).map(tab => (
          <button key={tab} onClick={() => setActiveAdminTab(tab)} className={`flex-1 flex items-center justify-center space-x-2 py-3 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeAdminTab === tab ? 'bg-[#014227] text-[#FFD700] shadow-lg' : 'text-gray-400 hover:text-[#014227]'}`}>
            <span>{tab}</span>
          </button>
        ))}
      </div>

      {activeAdminTab === 'Attendees' && (
        <div className="space-y-6">
          <div className="bg-white rounded-[40px] shadow-xl border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-4">
            <div className="p-8 bg-[#014227] text-[#FFD700] flex justify-between items-center flex-wrap gap-4">
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
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#FFFBEB] text-[#014227] text-[10px] font-black uppercase tracking-widest border-b border-gray-100">
                  <tr>
                    <th className="px-8 py-4">Identity</th>
                    <th className="px-8 py-4">Package & Group</th>
                    <th className="px-8 py-4">Nation</th>
                    <th className="px-8 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {guests.filter(g =>
                    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    g.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    g.nation.toLowerCase().includes(searchQuery.toLowerCase())
                  ).map(guest => (
                    <tr key={guest.id} className="hover:bg-gray-50 transition group">
                      <td className="px-8 py-6">
                        <div className="font-black text-[#014227]">{guest.name}</div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase">{guest.id} • {guest.gender}</div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="bg-[#014227] text-[#FFD700] px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest mr-2">{guest.package}</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase">{guest.group}</span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="text-[10px] font-black uppercase text-[#014227]">{guest.nation}</div>
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
            const currentPerms = [...(categoryPermissions[category] || [])].sort((a, b) => a.date.localeCompare(b.date));

            return (
              <div key={category} className="bg-white rounded-[40px] shadow-xl border border-gray-100 overflow-hidden flex flex-col h-fit animate-in slide-in-from-bottom-4">
                <div className="p-8 bg-[#014227] text-[#FFD700] flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-widest">{category} Pass Matrix</h3>
                    <p className="text-[9px] font-bold opacity-70 uppercase tracking-widest">{pkgInCat.length} Active Packages</p>
                  </div>
                  <button onClick={() => { setPermMetaEditData({ category, name: '', date: '' }); setIsPermMetaModalOpen(true); }} className="bg-[#FFD700] text-[#014227] px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-white transition"><Plus size={12} /> Add Rule</button>
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
                              {p.linkedItinerary && (
                                <span className="text-[6px] text-blue-600 font-bold uppercase tracking-wider mt-0.5">📅 {schedules.find(s => s.id === p.linkedItinerary)?.title || 'Event'}</span>
                              )}
                              <div className="flex space-x-1 opacity-0 group-hover/header:opacity-100 transition absolute top-0 right-0 bg-white shadow-md p-1 rounded-bl-lg">
                                <button onClick={() => { setPermMetaEditData({ ...p, category }); setIsPermMetaModalOpen(true); }} className="p-0.5 text-blue-600"><Edit3 size={10} /></button>
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
            <div className="p-8 bg-[#014227] text-[#FFD700] flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black uppercase tracking-widest">Golf Drive Groupings</h3>
              </div>
              <div className="flex bg-[#00331f] p-1 rounded-xl">
                <button
                  onClick={() => setActiveGolfDay(1)}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeGolfDay === 1 ? 'bg-[#FFD700] text-[#014227] shadow-lg' : 'text-gray-400 hover:text-white'}`}
                >
                  Day 1
                </button>
                <button
                  onClick={() => setActiveGolfDay(2)}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeGolfDay === 2 ? 'bg-[#FFD700] text-[#014227] shadow-lg' : 'text-gray-400 hover:text-white'}`}
                >
                  Day 2
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#FFFBEB] text-[#014227] text-[10px] font-black uppercase tracking-widest border-b border-gray-100">
                  <tr>
                    <th className="px-8 py-4">Flight Details</th>
                    <th className="px-8 py-4">Players</th>
                    <th className="px-8 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {golfGroupings.filter(g => g.day === activeGolfDay).sort((a, b) => a.flightNumber.localeCompare(b.flightNumber)).map(group => (
                    <tr key={group.id} className="hover:bg-gray-50 transition group">
                      <td className="px-8 py-6">
                        <div className="font-black text-[#014227] flex items-center gap-2">
                          <Trophy size={14} className="text-[#FFD700]" />
                          {group.flightNumber}
                        </div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tight flex items-center gap-1.5 mt-1.5 ml-5">
                          <Clock size={10} /> {group.teeTime}
                          {group.buggyNumber && (
                            <> • <span className="bg-[#FFD700] text-[#014227] px-2 py-0.5 rounded text-[8px]">Buggy {group.buggyNumber}</span></>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex -space-x-2">
                          {group.players.map((pid, idx) => {
                            const p = guests.find(g => g.id === pid);
                            return (
                              <div key={idx} className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[9px] font-black text-gray-500 first:bg-[#014227] first:text-[#FFD700]" title={p ? p.name : pid}>
                                {idx + 1}
                              </div>
                            );
                          })}
                        </div>
                        <div className="text-[9px] font-bold text-gray-400 uppercase mt-2 pl-1">
                          {group.players.map(pid => guests.find(g => g.id === pid)?.name).filter(Boolean).join(', ')}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right opacity-0 group-hover:opacity-100 transition">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setEditingItem({ type: 'Golf', data: group })} className="p-2.5 text-blue-600 bg-white border border-gray-100 rounded-xl shadow-sm hover:bg-blue-50 transition"><Edit3 size={14} /></button>
                          <button
                            onClick={() => {
                              if (deleteConfirm?.id === group.id && deleteConfirm?.type === 'golf') {
                                onUpdateGolfGroupings(golfGroupings.filter(g => g.id !== group.id));
                                setDeleteConfirm(null);
                              } else {
                                setDeleteConfirm({ id: group.id, type: 'golf' });
                              }
                            }}
                            className={`p-2 rounded-lg shadow-sm transition-all duration-200 ${deleteConfirm?.id === group.id && deleteConfirm?.type === 'golf' ? 'bg-orange-500 text-white scale-110' : 'text-red-500 bg-white border border-gray-100 hover:bg-red-50'}`}
                          >
                            {deleteConfirm?.id === group.id && deleteConfirm?.type === 'golf' ? <AlertTriangle size={12} /> : <Trash2 size={12} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {golfGroupings.filter(g => g.day === activeGolfDay).length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-8 py-12 text-center text-gray-400 font-bold uppercase text-xs tracking-widest border-dashed">
                        No flights configured for Day {activeGolfDay}
                      </td>
                    </tr>
                  )}
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
              <div className="p-8 bg-[#014227] text-[#FFD700] flex justify-between items-center sticky top-0 z-20">
                <div>
                  <h3 className="text-lg font-black uppercase tracking-widest">{date} Schedule</h3>
                  <p className="text-[9px] font-bold opacity-70 uppercase tracking-widest">{groupedSchedules[date].length} Sessions Planned</p>
                </div>
                <div className="bg-[#FFD700] text-[#014227] px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 shadow-inner">
                  <Calendar size={12} /> Timeline
                </div>
              </div>

              <div className="overflow-x-auto">
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

      {activeAdminTab === 'Travel' && (
        <div className="bg-white rounded-[40px] shadow-xl border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-4">
          <div className="p-8 bg-[#014227] text-[#FFD700]">
            <h3 className="text-lg font-black uppercase tracking-widest">Travel Attractions</h3>
            <p className="text-[9px] font-bold opacity-70 uppercase tracking-widest">{attractions.length} Attractions</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#FFFBEB] text-[#014227] text-[10px] font-black uppercase tracking-widest border-b border-gray-100">
                <tr>
                  <th className="px-8 py-4">Attraction</th>
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
                        <button onClick={() => setEditingItem({ type: 'Travel', data: attraction })} className="p-2 text-blue-600 bg-white border border-gray-100 rounded-lg shadow-sm hover:bg-blue-50"><Edit3 size={12} /></button>
                        <button
                          onClick={() => {
                            if (deleteConfirm?.id === attraction.id && deleteConfirm?.type === 'travel') {
                              onUpdateAttractions(attractions.filter(a => a.id !== attraction.id));
                              setDeleteConfirm(null);
                            } else {
                              setDeleteConfirm({ id: attraction.id, type: 'travel' });
                            }
                          }}
                          className={`p-2 rounded-lg shadow-sm transition-all duration-200 ${deleteConfirm?.id === attraction.id && deleteConfirm?.type === 'travel' ? 'bg-orange-500 text-white scale-110' : 'text-red-500 bg-white border border-gray-100 hover:bg-red-50'}`}
                        >
                          {deleteConfirm?.id === attraction.id && deleteConfirm?.type === 'travel' ? <AlertTriangle size={12} /> : <Trash2 size={12} />}
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

      {activeAdminTab === 'Dining' && (
        <div className="bg-white rounded-[40px] shadow-xl border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-4">
          <div className="p-8 bg-[#014227] text-[#FFD700]">
            <h3 className="text-lg font-black uppercase tracking-widest">Dining Guide</h3>
            <p className="text-[9px] font-bold opacity-70 uppercase tracking-widest">{diningGuide.length} Recommendations</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#FFFBEB] text-[#014227] text-[10px] font-black uppercase tracking-widest border-b border-gray-100">
                <tr>
                  <th className="px-8 py-4">Restaurant</th>
                  <th className="px-8 py-4">Type</th>
                  <th className="px-8 py-4">Description</th>
                  <th className="px-8 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {diningGuide.map(dining => (
                  <tr key={dining.id} className="hover:bg-gray-50 transition group">
                    <td className="px-8 py-6">
                      <div className="font-black text-[#014227]">{dining.name}</div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase">{dining.id}</div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-[9px] font-black uppercase">{dining.type}</span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-sm text-gray-600 max-w-md">{dining.desc}</div>
                    </td>
                    <td className="px-8 py-6 text-right opacity-0 group-hover:opacity-100 transition">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setEditingItem({ type: 'Dining', data: dining })} className="p-2 text-blue-600 bg-white border border-gray-100 rounded-lg shadow-sm hover:bg-blue-50"><Edit3 size={12} /></button>
                        <button
                          onClick={() => {
                            if (deleteConfirm?.id === dining.id && deleteConfirm?.type === 'dining') {
                              onUpdateDining(diningGuide.filter(d => d.id !== dining.id));
                              setDeleteConfirm(null);
                            } else {
                              setDeleteConfirm({ id: dining.id, type: 'dining' });
                            }
                          }}
                          className={`p-2 rounded-lg shadow-sm transition-all duration-200 ${deleteConfirm?.id === dining.id && deleteConfirm?.type === 'dining' ? 'bg-orange-500 text-white scale-110' : 'text-red-500 bg-white border border-gray-100 hover:bg-red-50'}`}
                        >
                          {deleteConfirm?.id === dining.id && deleteConfirm?.type === 'dining' ? <AlertTriangle size={12} /> : <Trash2 size={12} />}
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

      {editingItem && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-[40px] w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] shadow-2xl border-4 border-[#014227]">
            <div className="bg-[#014227] p-8 text-[#FFD700] border-b border-[#FFD700]/30 flex justify-between items-center">
              <h3 className="text-xl font-black uppercase tracking-widest">{editingItem.data.id?.startsWith('temp_') ? 'Add' : 'Edit'} {editingItem.type.slice(0, -1)}</h3>
              <button onClick={() => setEditingItem(null)} className="hover:rotate-90 transition-transform"><X size={24} /></button>
            </div>
            <form onSubmit={handleSaveItem} className="p-8 space-y-6 overflow-y-auto bg-white">
              {editingItem.type === 'Attendees' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Guest ID" value={editingItem.data.id} onChange={v => setEditingItem({ ...editingItem, data: { ...editingItem.data, id: v } })} />
                    <FormField label="Name on Tag" value={editingItem.data.nameOnTag} onChange={v => setEditingItem({ ...editingItem, data: { ...editingItem.data, nameOnTag: v } })} />
                  </div>
                  <FormField label="Full Name" value={editingItem.data.name} onChange={v => setEditingItem({ ...editingItem, data: { ...editingItem.data, name: v } })} />
                  <div className="grid grid-cols-3 gap-4">
                    <FormField label="Gender" value={editingItem.data.gender} onChange={v => setEditingItem({ ...editingItem, data: { ...editingItem.data, gender: v } })} />
                    <FormField label="Position" value={editingItem.data.position} onChange={v => setEditingItem({ ...editingItem, data: { ...editingItem.data, position: v } })} />
                    <FormField label="Group" value={editingItem.data.group} onChange={v => setEditingItem({ ...editingItem, data: { ...editingItem.data, group: v } })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Nation" value={editingItem.data.nation} onChange={v => setEditingItem({ ...editingItem, data: { ...editingItem.data, nation: v } })} />
                    <FormField label="Local Organisation" value={editingItem.data.localOrg} onChange={v => setEditingItem({ ...editingItem, data: { ...editingItem.data, localOrg: v } })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Senatorship ID" value={editingItem.data.senatorshipId} onChange={v => setEditingItem({ ...editingItem, data: { ...editingItem.data, senatorshipId: v } })} />
                    <FormField label="MAIL" value={editingItem.data.email} onChange={v => setEditingItem({ ...editingItem, data: { ...editingItem.data, email: v } })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Whatsapp" value={editingItem.data.whatsapp} onChange={v => setEditingItem({ ...editingItem, data: { ...editingItem.data, whatsapp: v } })} />
                    <FormField label="Line" value={editingItem.data.lineID} onChange={v => setEditingItem({ ...editingItem, data: { ...editingItem.data, lineID: v } })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Food Preference" value={editingItem.data.foodPreference} onChange={v => setEditingItem({ ...editingItem, data: { ...editingItem.data, foodPreference: v } })} />
                    <FormField label="Food/Medicine Allergy" value={editingItem.data.allergies} onChange={v => setEditingItem({ ...editingItem, data: { ...editingItem.data, allergies: v } })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Package</label>
                      <select className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold outline-none" value={editingItem.data.package} onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, package: e.target.value } })}>
                        {activePackageTypes.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <FormField label="T-Shirt Size" value={editingItem.data.tShirtSize} onChange={v => setEditingItem({ ...editingItem, data: { ...editingItem.data, tShirtSize: v } })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <CheckboxField label="Golfer" checked={editingItem.data.isGolfParticipant} onChange={v => setEditingItem({ ...editingItem, data: { ...editingItem.data, isGolfParticipant: v } })} />
                    <CheckboxField label="Single Occupancy" checked={editingItem.data.singleOccupancy} onChange={v => setEditingItem({ ...editingItem, data: { ...editingItem.data, singleOccupancy: v } })} />
                    <CheckboxField label="Additional Rm (27 Mar)" checked={editingItem.data.additionalRoom27Mar} onChange={v => setEditingItem({ ...editingItem, data: { ...editingItem.data, additionalRoom27Mar: v } })} />
                    <CheckboxField label="Additional Rm (28 Mar)" checked={editingItem.data.additionalRoom28Mar} onChange={v => setEditingItem({ ...editingItem, data: { ...editingItem.data, additionalRoom28Mar: v } })} />
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
              {editingItem.type === 'Travel' && (
                <>
                  <FormField label="Attraction Name" value={editingItem.data.name} onChange={v => setEditingItem({ ...editingItem, data: { ...editingItem.data, name: v } })} />
                  <FormField label="Distance" value={editingItem.data.dist} onChange={v => setEditingItem({ ...editingItem, data: { ...editingItem.data, dist: v } })} placeholder="e.g. 3.5km" />
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Description</label>
                    <textarea
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold outline-none shadow-sm focus:ring-4 focus:ring-[#FFD700]/10 focus:border-[#FFD700] transition-all resize-none"
                      rows={3}
                      value={editingItem.data.desc || ''}
                      onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, desc: e.target.value } })}
                    />
                  </div>
                  <FormField label="Image URL" value={editingItem.data.img} onChange={v => setEditingItem({ ...editingItem, data: { ...editingItem.data, img: v } })} placeholder="https://..." />
                </>
              )}
              {editingItem.type === 'Dining' && (
                <>
                  <FormField label="Restaurant Name" value={editingItem.data.name} onChange={v => setEditingItem({ ...editingItem, data: { ...editingItem.data, name: v } })} />
                  <FormField label="Type" value={editingItem.data.type} onChange={v => setEditingItem({ ...editingItem, data: { ...editingItem.data, type: v } })} placeholder="e.g. Street Food, Fine Dining" />
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Description</label>
                    <textarea
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold outline-none shadow-sm focus:ring-4 focus:ring-[#FFD700]/10 focus:border-[#FFD700] transition-all resize-none"
                      rows={3}
                      value={editingItem.data.desc || ''}
                      onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, desc: e.target.value } })}
                    />
                  </div>
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
                    <input
                      type="text"
                      placeholder="Search golfers..."
                      className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-[#FFD700]"
                      onChange={(e) => {
                        // We use a temp custom field on the editing item to store search query if needed, or just rely on global search. 
                        // Actually, let's just show all relevant golfers for now, or filter by the main search query if that's available? 
                        // No, let's just list them all scrollable. 
                        // To keep it simple, I won't add a local search state here unless necessary. 
                        // Let's rely on a filtered list.
                      }}
                      // Wait, I can't easily add local state here without Ref or creating a new component.
                      // Let's just list all golfers sorted by name.
                      disabled
                      value="Search functionality coming soon (List below shows all golfers)"
                    />
                    <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                      {guests.filter(g => g.isGolfParticipant).sort((a, b) => a.name.localeCompare(b.name)).map(g => (
                        <label key={g.id} className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer hover:bg-gray-50 transition-all ${editingItem.data.players?.includes(g.id) ? 'bg-[#fffbeb] border-[#FFD700] ring-1 ring-[#FFD700]' : 'bg-white border-gray-100'}`}>
                          <div onClick={(e) => {
                            e.preventDefault();
                            const currentPlayers = editingItem.data.players || [];
                            const newPlayers = currentPlayers.includes(g.id)
                              ? currentPlayers.filter(id => id !== g.id)
                              : [...currentPlayers, g.id];
                            setEditingItem({ ...editingItem, data: { ...editingItem.data, players: newPlayers } });
                          }} className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${editingItem.data.players?.includes(g.id) ? 'bg-[#014227] text-[#FFD700]' : 'border border-gray-300'}`}>
                            {editingItem.data.players?.includes(g.id) && <Check size={12} />}
                          </div>
                          <div className="flex-1">
                            <div className="text-xs font-black text-[#014227]">{g.name}</div>
                            <div className="text-[9px] font-bold text-gray-400 uppercase">{g.nation} • {g.handicap || 'HCP: -'}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Hidden field for day (default to active day if new) */}
                  {!editingItem.data.id?.startsWith('temp_') ? null : (
                    // If it's a new item, ensure day is set. We handle this by setting default data in the Add button, 
                    // but here we can explicitly show it or just let it be.
                    // I'll assume 'activeGolfDay' is passed or available? No, activeGolfDay is state in AdminPortal.
                    // I can't access activeGolfDay easily inside the map unless I pass it or verify the data init.
                    // The 'Add' button sets data including day, so we are good.
                    null
                  )}
                </div>
              )}
              <div className="pt-6 border-t border-gray-100">
                <button type="submit" className="w-full bg-[#014227] text-[#FFD700] py-5 rounded-3xl font-black uppercase tracking-widest shadow-xl transform active:scale-95 transition-all">
                  Commit Registry Updates
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isPermMetaModalOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-white rounded-[40px] w-full max-w-md p-10 shadow-2xl">
            <h3 className="text-xl font-black text-[#014227] mb-8 uppercase tracking-widest">{permMetaEditData.id ? 'Modify' : 'New'} {permMetaEditData.category} Rule</h3>
            <form onSubmit={handleAddOrUpdatePermMeta} className="space-y-6">
              <FormField label="Rule Label (e.g. Banquet)" value={permMetaEditData.name} onChange={v => setPermMetaEditData({ ...permMetaEditData, name: v })} />
              <FormField label="Designated Day (e.g. 29 Mar)" value={permMetaEditData.date} onChange={v => setPermMetaEditData({ ...permMetaEditData, date: v })} />
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Linked Itinerary (Optional)</label>
                <select
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold outline-none"
                  value={permMetaEditData.linkedItinerary || ''}
                  onChange={e => setPermMetaEditData({ ...permMetaEditData, linkedItinerary: e.target.value })}
                >
                  <option value="">No Linked Event</option>
                  {schedules.map(s => (
                    <option key={s.id} value={s.id}>{s.date} - {s.title}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-4 pt-6">
                <button type="button" onClick={() => setIsPermMetaModalOpen(false)} className="px-6 py-3 font-black text-[10px] uppercase text-gray-400">Back</button>
                <button type="submit" className="bg-[#014227] text-[#FFD700] px-10 py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl transform active:scale-95">Save Rule</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isPackageModalOpen && (
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
      )}

      {isPasteModalOpen && (
        <div className="fixed inset-0 bg-[#014227]/90 backdrop-blur-xl z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 bg-[#014227] text-[#FFD700] flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight">Bulk Import Attendees</h3>
                <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest mt-1">Paste TSV or CSV data with headers below</p>
              </div>
              <button onClick={() => setIsPasteModalOpen(false)} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition">
                <X size={20} />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Pasted Content</label>
                <textarea
                  className="w-full h-64 p-6 bg-gray-50 border border-gray-100 rounded-3xl font-mono text-xs outline-none focus:ring-4 focus:ring-[#FFD700]/10 focus:border-[#FFD700] transition-all resize-none"
                  placeholder="Guest ID&#9;Name on tag&#9;Name&#9;Nation...&#10;G001&#9;John&#9;John Doe&#9;USA..."
                  value={pastedData}
                  onChange={(e) => setPastedData(e.target.value)}
                />
              </div>
              <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
                <p className="text-[10px] font-bold text-amber-800 leading-relaxed uppercase tracking-wider text-[8px]">
                  Tip: Ensure your columns include 'Guest ID' and 'Name'. Tabs or commas are both accepted.
                </p>
              </div>
              <div className="flex justify-end space-x-4 pt-4">
                <button
                  onClick={() => { setIsPasteModalOpen(false); setPastedData(''); }}
                  className="px-6 py-3 font-black text-[10px] uppercase text-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!pastedData.trim()) return;
                    try {
                      const lines = pastedData.trim().split(/\r?\n/).filter(l => l.trim());
                      if (lines.length < 2) throw new Error('No data rows found.');

                      const firstLine = lines[0];
                      const delimiter = firstLine.includes('\t') ? '\t' : ',';
                      const headers = firstLine.split(delimiter).map(h => h.trim().toLowerCase());

                      const newGuests = lines.slice(1).map((line, rowIdx) => {
                        const values = line.split(delimiter).map(v => v.trim());
                        const g: any = { checkInCount: 0, passportLast4: '' };

                        headers.forEach((h, i) => {
                          const val = values[i] || '';
                          if (h.includes('guest id') || h === 'id') g.id = val;
                          else if (h.includes('tag')) g.nameOnTag = val;
                          else if (h.includes('name')) g.name = val;
                          else if (h.includes('gender')) g.gender = val;
                          else if (h.includes('position')) g.position = val;
                          else if (h.includes('group')) g.group = val;
                          else if (h.includes('nation')) g.nation = val;
                          else if (h.includes('local org')) g.localOrg = val;
                          else if (h.includes('senator')) g.senatorshipId = val;
                          else if (h.includes('golfer')) g.isGolfParticipant = val.toLowerCase() === 'yes' || val === 'true';
                          else if (h.includes('whatsapp')) g.whatsapp = val;
                          else if (h.includes('line')) g.lineID = val;
                          else if (h.includes('mail') || h.includes('email')) g.email = val;
                          else if (h.includes('food preference')) g.foodPreference = val;
                          else if (h.includes('allergy')) g.allergies = val;
                          else if (h.includes('package')) g.package = val;
                          else if (h.includes('t-shirt')) g.tShirtSize = val;
                          else if (h.includes('single')) g.singleOccupancy = val.toLowerCase() === 'yes' || val === 'true';
                          else if (h.includes('27 march')) g.additionalRoom27Mar = val.toLowerCase() === 'yes' || val === 'true';
                          else if (h.includes('28 march')) g.additionalRoom28Mar = val.toLowerCase() === 'yes' || val === 'true';
                        });

                        if (!g.id || !g.name) return null;
                        return g as Guest;
                      }).filter(g => g !== null) as Guest[];

                      if (newGuests.length === 0) throw new Error('Failed to parse any valid guest records.');

                      onUpdateGuests([...guests, ...newGuests]);
                      setIsPasteModalOpen(false);
                      setPastedData('');
                      window.alert(`Successfully imported ${newGuests.length} guests!`);
                    } catch (err: any) {
                      window.alert(`Import Failed: ${err.message}`);
                    }
                  }}
                  className="bg-[#014227] text-[#FFD700] px-10 py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl transition transform active:scale-95"
                >
                  Import Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const FormField: React.FC<{ label: string; value: string; onChange: (v: string) => void; placeholder?: string }> = ({ label, value, onChange, placeholder }) => (
  <div className="space-y-1">
    <label className="text-[10px] font-black uppercase text-gray-400 ml-2">{label}</label>
    <input type="text" placeholder={placeholder} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold outline-none shadow-sm focus:ring-4 focus:ring-[#FFD700]/10 focus:border-[#FFD700] transition-all" value={value || ''} onChange={e => onChange(e.target.value)} />
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
