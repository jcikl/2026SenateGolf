import React, { useState, useEffect } from 'react';
import { AppView, Guest, EventSchedule, PackagePermissions, PackageCategory, PermissionMeta, GolfGrouping } from './types';
import { MOCK_GUESTS, MOCK_SCHEDULE, DEFAULT_PACKAGE_PERMISSIONS, DEFAULT_CATEGORY_PERMISSIONS } from './constants';
import GuestPortal from './views/GuestPortal';
import StaffPortal from './views/StaffPortal';
import AdminPortal from './views/AdminPortal';
import GeneralInfo from './views/GeneralInfo';
import Login from './views/Login';
import { Layout } from './components/Layout';
import { ShieldAlert, RefreshCw, ExternalLink } from 'lucide-react';

// Firebase Imports
import { db } from './firebase';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  getDocs,
  writeBatch,
  FirestoreError
} from "firebase/firestore";

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('General');
  const [activeGuest, setActiveGuest] = useState<Guest | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [packagePermissions, setPackagePermissions] = useState<PackagePermissions>({});
  const [categoryPermissions, setCategoryPermissions] = useState<Record<PackageCategory, PermissionMeta[]>>({
    'APDC': [],
    'JCI Malaysia': [],
    'International': [],
    'JCI Japan': [],
    'JCI Korea': []
  });
  const [schedules, setSchedules] = useState<EventSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [permissionError, setPermissionError] = useState<boolean>(false);

  const [attractions, setAttractions] = useState<any[]>([]);
  const [diningGuide, setDiningGuide] = useState<any[]>([]);
  const [golfGroupings, setGolfGroupings] = useState<GolfGrouping[]>([]);

  // Handle Firebase errors globally
  const handleFirebaseError = (error: FirestoreError) => {
    console.error("Firestore Error:", error.code, error.message);
    if (error.code === 'permission-denied') {
      setPermissionError(true);
      setLoading(false);
    }
  };

  // 1. Initialize Database with Mock Data if empty (Seed)
  useEffect(() => {
    const seedDatabase = async () => {
      try {
        const guestCheck = await getDocs(collection(db, "guests"));
        if (guestCheck.empty) {
          console.log("Seeding database with initial data...");
          const batch = writeBatch(db);

          MOCK_GUESTS.forEach(g => batch.set(doc(db, "guests", g.id), g));
          MOCK_SCHEDULE.forEach(s => batch.set(doc(db, "schedules", s.id), s));
          batch.set(doc(db, "config", "packagePermissions"), { data: DEFAULT_PACKAGE_PERMISSIONS });

          // Seed attractions
          const defaultAttractions = [
            { id: 'A1', name: 'Petronas Twin Towers', dist: '3.5km', desc: 'The iconic landmark of KL.', img: 'https://images.unsplash.com/photo-1541093113199-a2e9d84e903f?auto=format&fit=crop&w=400&q=80' },
            { id: 'A2', name: 'Batu Caves', dist: '12km', desc: 'Limestone hill featuring a series of caves.', img: 'https://images.unsplash.com/photo-1596422846543-75c6fc18a593?auto=format&fit=crop&w=400&q=80' }
          ];
          defaultAttractions.forEach(a => batch.set(doc(db, "attractions", a.id), a));

          // Seed dining
          const defaultDining = [
            { id: 'F1', name: 'Jalan Alor Night Market', type: 'Street Food', desc: 'Heaven for seafood and local Malaysian delights.' }
          ];
          defaultDining.forEach(d => batch.set(doc(db, "dining", d.id), d));

          await batch.commit();
        }
      } catch (e: any) {
        handleFirebaseError(e);
      }
    };
    seedDatabase();
  }, []);

  // 2. Real-time Subscriptions with Error Handling
  useEffect(() => {
    // Listen to Guests
    const unsubGuests = onSnapshot(collection(db, "guests"),
      (snapshot) => {
        const data = snapshot.docs.map(doc => doc.data() as Guest);
        setGuests(data);
        const savedGuestId = localStorage.getItem('guestId');
        if (savedGuestId) {
          const current = data.find(g => g.id === savedGuestId);
          if (current) setActiveGuest(current);
        }
        setLoading(false);
      },
      handleFirebaseError
    );

    // Listen to Schedules
    const unsubSchedules = onSnapshot(collection(db, "schedules"),
      (snapshot) => {
        setSchedules(snapshot.docs.map(doc => doc.data() as EventSchedule));
      },
      handleFirebaseError
    );

    // Listen to Permissions Config
    const unsubPerms = onSnapshot(doc(db, "config", "packagePermissions"),
      (doc) => {
        if (doc.exists()) setPackagePermissions(doc.data().data);
      },
      handleFirebaseError
    );

    // Listen to Category Permissions
    const unsubCatPerms = onSnapshot(doc(db, "config", "categoryPermissions"),
      (doc) => {
        if (doc.exists()) setCategoryPermissions(doc.data().data);
      },
      handleFirebaseError
    );

    // Listen to Attractions
    const unsubAttractions = onSnapshot(collection(db, "attractions"),
      (snapshot) => {
        setAttractions(snapshot.docs.map(doc => doc.data()));
      },
      handleFirebaseError
    );

    // Listen to Dining
    const unsubDining = onSnapshot(collection(db, "dining"),
      (snapshot) => {
        setDiningGuide(snapshot.docs.map(doc => doc.data()));
      },
      handleFirebaseError
    );

    // Listen to Golf Groupings
    const unsubGolf = onSnapshot(collection(db, "golfGroupings"),
      (snapshot) => {
        setGolfGroupings(snapshot.docs.map(doc => doc.data() as GolfGrouping));
      },
      handleFirebaseError
    );

    return () => {
      unsubGuests();
      unsubSchedules();
      unsubPerms();
      unsubCatPerms();
      unsubAttractions();
      unsubDining();
      unsubGolf();
    };
  }, []);

  // 3. Update Handlers
  const handleUpdateGuests = async (updatedList: Guest[]) => {
    const oldGuests = [...guests];
    setGuests(updatedList);

    // Find new or modified guests
    const toSync = updatedList.filter(ug => {
      const existing = oldGuests.find(g => g.id === ug.id);
      return !existing || JSON.stringify(existing) !== JSON.stringify(ug);
    });

    // Find deleted guests
    const toDelete = oldGuests.filter(og => !updatedList.find(g => g.id === og.id));

    if (toSync.length === 0 && toDelete.length === 0) return;

    console.log(`App: Syncing ${toSync.length} guests, deleting ${toDelete.length} from Firestore...`);
    try {
      const batch = writeBatch(db);
      toSync.forEach(g => batch.set(doc(db, "guests", g.id), g));
      toDelete.forEach(g => batch.delete(doc(db, "guests", g.id)));
      await batch.commit();
      console.log('App: Guest sync completed.');
    } catch (e: any) {
      console.error('App: Failed to sync guests:', e);
      handleFirebaseError(e);
    }
  };

  const syncGuestToCloud = async (guest: Guest) => {
    try {
      await setDoc(doc(db, "guests", guest.id), guest);
    } catch (e: any) {
      handleFirebaseError(e);
    }
  };

  const handleUpdatePermissions = async (newPermissions: PackagePermissions) => {
    console.log('App: Updating package permissions:', newPermissions);
    try {
      setPackagePermissions(newPermissions);
      await setDoc(doc(db, "config", "packagePermissions"), { data: newPermissions });
      console.log('App: Package permissions updated in Firestore');
    } catch (e: any) {
      console.error('App: Failed to update package permissions:', e);
      handleFirebaseError(e);
    }
  };

  const handleUpdateCategoryPermissions = async (newCatPerms: Record<PackageCategory, PermissionMeta[]>) => {
    try {
      setCategoryPermissions(newCatPerms);
      await setDoc(doc(db, "config", "categoryPermissions"), { data: newCatPerms });
    } catch (e: any) {
      handleFirebaseError(e);
    }
  };

  const handleUpdateSchedules = async (newList: EventSchedule[]) => {
    const oldSchedules = [...schedules];
    setSchedules(newList);

    // Find deleted schedules
    const toDelete = oldSchedules.filter(os => !newList.find(s => s.id === os.id));
    // Find new or modified schedules
    const toSync = newList.filter(ns => {
      const existing = oldSchedules.find(s => s.id === ns.id);
      return !existing || JSON.stringify(existing) !== JSON.stringify(ns);
    });

    if (toSync.length === 0 && toDelete.length === 0) return;

    console.log(`App: Syncing ${toSync.length} schedules, deleting ${toDelete.length} from Firestore...`);
    try {
      const batch = writeBatch(db);
      toSync.forEach(s => batch.set(doc(db, "schedules", s.id), s));
      toDelete.forEach(s => batch.delete(doc(db, "schedules", s.id)));
      await batch.commit();
      console.log('App: Schedule sync completed.');
    } catch (e: any) {
      console.error('App: Failed to sync schedules:', e);
      handleFirebaseError(e);
    }
  };

  const handleUpdateAttractions = async (newList: any[]) => {
    const oldAttractions = [...attractions];
    setAttractions(newList);

    const toDelete = oldAttractions.filter(oa => !newList.find(a => a.id === oa.id));
    const toSync = newList.filter(na => {
      const existing = oldAttractions.find(a => a.id === na.id);
      return !existing || JSON.stringify(existing) !== JSON.stringify(na);
    });

    if (toSync.length === 0 && toDelete.length === 0) return;

    console.log(`App: Syncing ${toSync.length} attractions, deleting ${toDelete.length} from Firestore...`);
    try {
      const batch = writeBatch(db);
      toSync.forEach(a => batch.set(doc(db, "attractions", a.id), a));
      toDelete.forEach(a => batch.delete(doc(db, "attractions", a.id)));
      await batch.commit();
      console.log('App: Attractions sync completed.');
    } catch (e: any) {
      console.error('App: Failed to sync attractions:', e);
      handleFirebaseError(e);
    }
  };

  const handleUpdateDining = async (newList: any[]) => {
    const oldDining = [...diningGuide];
    setDiningGuide(newList);

    const toDelete = oldDining.filter(od => !newList.find(d => d.id === od.id));
    const toSync = newList.filter(nd => {
      const existing = oldDining.find(d => d.id === nd.id);
      return !existing || JSON.stringify(existing) !== JSON.stringify(nd);
    });

    if (toSync.length === 0 && toDelete.length === 0) return;

    console.log(`App: Syncing ${toSync.length} dining, deleting ${toDelete.length} from Firestore...`);
    try {
      const batch = writeBatch(db);
      toSync.forEach(d => batch.set(doc(db, "dining", d.id), d));
      toDelete.forEach(d => batch.delete(doc(db, "dining", d.id)));
      await batch.commit();
      console.log('App: Dining sync completed.');
    } catch (e: any) {
      console.error('App: Failed to sync dining:', e);
      handleFirebaseError(e);
    }
  };

  const handleUpdateGolfGroupings = async (newList: GolfGrouping[]) => {
    const oldGroupings = [...golfGroupings];
    setGolfGroupings(newList);

    const toDelete = oldGroupings.filter(og => !newList.find(g => g.id === og.id));
    const toSync = newList.filter(ng => {
      const existing = oldGroupings.find(g => g.id === ng.id);
      return !existing || JSON.stringify(existing) !== JSON.stringify(ng);
    });

    // We proceed even if groups didn't change efficiently, but strictly speaking checking golfers is better.
    // However, to ensure consistency between Groupings and Guests, we should re-eval changed groups.

    console.log(`App: Syncing ${toSync.length} golf groupings, deleting ${toDelete.length} from Firestore...`);

    try {
      const batch = writeBatch(db);

      // 1. Sync Groupings Collection
      toSync.forEach(g => batch.set(doc(db, "golfGroupings", g.id), g));
      toDelete.forEach(g => batch.delete(doc(db, "golfGroupings", g.id)));

      // 2. Sync Guest Data (Reverse index: Guest -> Flight)
      // We only need to update guests involved in the CHANGED (toSync) or DELETED (toDelete) groups,
      // PLUS any guests that MIGHT have been removed from these groups. 
      // Diffing is complex. Simplest robust approach:
      // Identify ALL guest IDs involved in oldGroupings AND newList.

      const involvedGuestIds = new Set<string>();
      [...oldGroupings, ...newList].forEach(g => g.players.forEach(pid => involvedGuestIds.add(pid)));

      // For each involved guest, calculate their correct state based on newList
      const affectedGuests: Guest[] = [];

      involvedGuestIds.forEach(gid => {
        const guest = guests.find(g => g.id === gid);
        if (!guest) return;

        // Find assignments in newList
        const day1Group = newList.find(g => g.day === 1 && g.players.includes(gid));
        const day2Group = newList.find(g => g.day === 2 && g.players.includes(gid));

        const newDay1 = day1Group ? { flight: day1Group.flightNumber, teeTime: day1Group.teeTime, buggy: day1Group.buggyNumber || '' } : null;
        const newDay2 = day2Group ? { flight: day2Group.flightNumber, teeTime: day2Group.teeTime, buggy: day2Group.buggyNumber || '' } : null;

        // Check if changed
        if (JSON.stringify(guest.golfDay1) !== JSON.stringify(newDay1) || JSON.stringify(guest.golfDay2) !== JSON.stringify(newDay2)) {
          // Queue update
          const updatedGuest: Guest = { ...guest };
          if (newDay1) updatedGuest.golfDay1 = newDay1; else delete updatedGuest.golfDay1;
          if (newDay2) updatedGuest.golfDay2 = newDay2; else delete updatedGuest.golfDay2;

          // Actually, Firestore set() needs explicit fields or deleteField(). 
          // But our local guest type has optional golfDay?.
          // If we send { ...guest, golfDay1: null }, it sets it to null in DB. That works.
          // Let's stick to null which is safer for "unset".

          const finalGuest = { ...guest, golfDay1: newDay1 || null, golfDay2: newDay2 || null };
          // Wait, if I use delete keyword in JS, JSON.stringify removes it.
          // Firestore update({ golfDay1: deleteField() }) is best for deleting.
          // But here I am using set(doc, full_object). 
          // If I omit the field in full_object, and use set() (replace), it is gone.
          // BUT guest object might have other fields. 
          // The safest is to set it to null if we want to "clear" it in a structured way that supports future "is this set?" checks.

          batch.set(doc(db, "guests", guest.id), { ...guest, golfDay1: newDay1, golfDay2: newDay2 });
          // We also update local state? No, onSnapshot will handle it if we write to DB. 
          // BUT we are using optimistic UI for guests? 
          // Use onUpdateGuests props? No, direct Firestore batch.
          batch.set(doc(db, "guests", guest.id), updatedGuest);
          affectedGuests.push(updatedGuest); // Just for logging or optimistic
        }
      });

      if (affectedGuests.length > 0) {
        console.log(`App: syncing golf details for ${affectedGuests.length} guests.`);
      }

      await batch.commit();
      console.log('App: Golf groupings & Guest details sync completed.');
    } catch (e: any) {
      console.error('App: Failed to sync golf groupings:', e);
      handleFirebaseError(e);
    }
  };

  const handleBulkSync = async () => {
    try {
      setLoading(true);
      const batch = writeBatch(db);

      // 1. Sync Itinerary
      const snapshots = await getDocs(collection(db, "schedules"));
      snapshots.forEach(d => batch.delete(doc(db, "schedules", d.id)));
      MOCK_SCHEDULE.forEach(s => batch.set(doc(db, "schedules", s.id), s));

      // 2. Sync Package Permissions Config
      batch.set(doc(db, "config", "packagePermissions"), { data: DEFAULT_PACKAGE_PERMISSIONS });

      // 3. Sync Category Rules Config
      batch.set(doc(db, "config", "categoryPermissions"), { data: DEFAULT_CATEGORY_PERMISSIONS });

      await batch.commit();
      alert("All databases (Itinerary, Packages, Rules) synced to Firestore successfully!");
    } catch (e: any) {
      handleFirebaseError(e);
      alert("Failed to sync database: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectGuest = (guest: Guest | null) => {
    setActiveGuest(guest);
    if (guest) localStorage.setItem('guestId', guest.id);
    else localStorage.removeItem('guestId');
  };

  // Permission Denied UI
  if (permissionError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#014227] px-6 py-12">
        <div className="max-w-md w-full bg-white rounded-[40px] shadow-2xl p-10 text-center animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-8">
            <ShieldAlert size={40} />
          </div>
          <h2 className="text-2xl font-black text-[#014227] uppercase tracking-tight mb-4">Database Rules Required</h2>
          <p className="text-gray-500 text-sm font-medium mb-8 leading-relaxed">
            Firebase has denied access. To fix this, please update your <b>Firestore Rules</b> in the Firebase Console:
          </p>
          <div className="bg-gray-900 rounded-2xl p-5 text-left mb-8 overflow-x-auto">
            <pre className="text-green-400 text-[10px] font-mono leading-relaxed">
              {`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`}
            </pre>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-[#014227] text-[#FFD700] py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-black transition shadow-xl"
          >
            <RefreshCw size={14} />
            <span>I've Updated Rules</span>
          </button>
          <a
            href="https://console.firebase.google.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-600 hover:text-amber-700 transition"
          >
            <span>Open Firebase Console</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#014227]">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-[#FFD700] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-[#FFD700] font-black uppercase tracking-widest text-xs">Syncing with Cloud...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Layout
        currentView={view}
        onViewChange={(v) => { setView(v); localStorage.setItem('userRole', v); }}
        onLogout={() => { setActiveGuest(null); setView('Guest'); localStorage.clear(); }}
      >
        {view === 'General' && <GeneralInfo schedules={schedules} attractions={attractions} diningGuide={diningGuide} golfGroupings={golfGroupings} guests={guests} />}

        {view === 'Guest' && (
          activeGuest ? (
            <GuestPortal guest={activeGuest} schedules={schedules} packagePermissions={packagePermissions} golfGroupings={golfGroupings} categoryPermissions={categoryPermissions} />
          ) : (
            <Login onLogin={(p, n) => {
              const found = guests.find(g => g.name.toLowerCase() === n.toLowerCase() && g.passportLast4 === p);
              if (found) handleSelectGuest(found); else alert('Guest not found or details mismatch.');
            }} />
          )
        )}

        {view === 'Staff' && (
          <StaffPortal
            guests={guests}
            onUpdateGuests={async (newList) => {
              setGuests(newList);
              const currentId = localStorage.getItem('lastScannedId');
              const changed = newList.find(g => g.id === currentId);
              if (changed) await syncGuestToCloud(changed);
            }}
            schedules={schedules}
            packagePermissions={packagePermissions}
            categoryPermissions={categoryPermissions}
          />
        )}

        {view === 'Admin' && (
          <AdminPortal
            guests={guests}
            onUpdateGuests={handleUpdateGuests}
            schedules={schedules}
            onUpdateSchedules={handleUpdateSchedules}
            onBulkSync={handleBulkSync}
            attractions={attractions}
            onUpdateAttractions={handleUpdateAttractions}
            diningGuide={diningGuide}
            onUpdateDining={handleUpdateDining}
            golfGroupings={golfGroupings}
            onUpdateGolfGroupings={handleUpdateGolfGroupings}
            packagePermissions={packagePermissions}
            onUpdatePackagePermissions={handleUpdatePermissions}
            categoryPermissions={categoryPermissions}
            onUpdateCategoryPermissions={handleUpdateCategoryPermissions}
          />
        )}
      </Layout>
    </div>
  );
};

export default App;