
export type PackageType = string;
export type PackageCategory = 'APDC' | 'JCIM' | 'Int' | 'JP' | 'KR' | 'VIP';

export type EventCategory = string;

export interface PermissionMeta {
  id: string;
  name: string;
  date: string; // e.g., "28 Mar 2026"
  linkedItinerary?: string[]; // Optional: linked EventSchedule.ids
  golfType?: 'Day1' | 'Day2'; // Optional: explicit golf day flag
}

export type PackagePermissions = Record<PackageType, {
  category: PackageCategory;
  permissions: Record<string, boolean>; // key is PermissionMeta.id
  linkedItinerary?: string[]; // Optional: linked EventSchedule.ids
}>;

export interface Guest {
  docId?: string; // Firestore document ID
  id: string; // Logical Guest ID (e.g. PKG-0001-JP)
  nameOnTag: string;
  name: string;
  gender: string;
  position: string;

  country: string;
  localOrg: string;
  senatorshipId?: string;
  isSenator?: boolean;
  package: PackageType;
  email: string; // MAIL
  whatsapp: string;
  lineID: string;
  phone: string;
  tShirtSize: string;
  foodPreference: string;
  allergies: string; // Food/ Medicine Allergy
  isGolfParticipant: boolean; // Golfer
  singleOccupancy: boolean;
  additionalRoom27Mar: boolean;
  additionalRoom27MarType?: 'Single' | 'Twin';
  additionalRoom28Mar: boolean;
  additionalRoom28MarType?: 'Single' | 'Twin';

  // Existing internal/tracking fields
  passportLast4: string;
  passportId?: string;
  golfDay1?: {
    flight: string;
    teeTime: string;
    buggy: string;
  };
  golfDay2?: {
    flight: string;
    teeTime: string;
    buggy: string;
  };
  golfTeeOff?: string;
  golfFlightNo?: string;
  golfBuggyNo?: string;
  welcomeDinnerTable?: string;
  galaDinnerTable?: string;
  hotelName?: string;
  hotelRoomType?: 'Single' | 'Twin' | 'Suite';
  hotelCheckIn?: string;
  hotelCheckOut?: string;
  checkedInAt?: string;
  lastCheckedInEvent?: string; // Track which event was last checked in
  checkedInEvents?: Record<string, string>; // EventID -> Timestamp ISO string
  checkInCount: number;
}

export interface EventSchedule {
  id: string;
  time: string;
  date: string;
  title: string;
  location: string;
  description: string;
  permissionId: string; // Links to PermissionMeta.id
  category: string; // Display category
}

// Added Sponsorship interface
export interface Sponsorship {
  id: string;
  name: string;
  tier: string;
  logo: string;
  website: string;
  description: string;
}

export interface GolfGrouping {
  id: string;
  day: 1 | 2; // Day 1 or Day 2
  flightNumber: string; // e.g., "Flight 1", "Flight 2"
  teeTime: string; // e.g., "08:00 AM"
  buggyNumber?: string; // Optional buggy assignment
  players: string[]; // Array of Guest IDs
}

export type AppView = 'Guest' | 'Staff' | 'Admin' | 'General';

export type UserRole = 'Guest' | 'Crew' | 'Admin' | 'none';
