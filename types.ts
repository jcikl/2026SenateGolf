
export type PackageType = string;
export type PackageCategory = 'International' | 'APDC' | 'JCI Malaysia' | 'JCI Japan' | 'JCI Korea';

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
  id: string; // Guest ID
  nameOnTag: string;
  name: string;
  gender: string;
  position: string;

  nation: string;
  localOrg: string;
  senatorshipId?: string;
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
  additionalRoom28Mar: boolean;

  // Existing internal/tracking fields
  passportLast4: string;
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
  dinnerTableNo?: string;
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
  tier: 'Diamond' | 'Platinum' | 'Gold' | 'Silver';
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
